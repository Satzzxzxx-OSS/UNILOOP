-- Sale handover double confirmation, private reviews and trusted state tests.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb','buyer@example.test'),
 ('cccccccc-7777-4777-8777-cccccccccccc','another@example.test');
insert into public.campuses(id,name) values
 ('dddddddd-7777-4777-8777-dddddddddddd','Approved market');
insert into private.enabled_campuses(campus_id,enabled) values
 ('dddddddd-7777-4777-8777-dddddddddddd',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa','dddddddd-7777-4777-8777-dddddddddddd','verified',now()),
 ('bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb','dddddddd-7777-4777-8777-dddddddddddd','verified',now()),
 ('cccccccc-7777-4777-8777-cccccccccccc','dddddddd-7777-4777-8777-dddddddddddd','verified',now());

insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values ('eeeeeeee-7777-4777-8777-eeeeeeeeeeee',
 'aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa',
 'dddddddd-7777-4777-8777-dddddddddddd','books-study','Chemistry hardcover book',
 'Gently used hardcover chemistry book with handwritten notes.',550,'good');
insert into storage.objects(bucket_id,name,owner_id) values
 ('listing-media',
 'eeeeeeee-7777-4777-8777-eeeeeeeeeeee/ffffffff-7777-4777-8777-ffffffffffff.jpg',
 'aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values
 ('eeeeeeee-7777-4777-8777-eeeeeeeeeeee',
 'eeeeeeee-7777-4777-8777-eeeeeeeeeeee/ffffffff-7777-4777-8777-ffffffffffff.jpg',1);

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa',true);
select public.transition_sale_listing('eeeeeeee-7777-4777-8777-eeeeeeeeeeee','active');
select set_config('request.jwt.claim.sub','bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb',true);
do $$
declare thread uuid;message uuid;offer uuid;deal uuid;before_tx public.sale_transactions%rowtype;
begin
 thread:=public.open_sale_conversation('eeeeeeee-7777-4777-8777-eeeeeeeeeeee');
 message:=public.send_sale_message(thread,'Is the item available?',
  'aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa');
 if message<>public.send_sale_message(thread,'Is the item available?',
  'aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa') then
  raise exception 'Identical message retry duplicated'; end if;
 begin
  perform public.send_sale_message(thread,'A different message payload',
   'aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa');
  raise exception 'Different message reused a nonce';
 exception when invalid_parameter_value then null; end;
 offer:=public.submit_sale_offer(thread,500,null,'bbbbbbbb-8888-4888-8888-bbbbbbbbbbbb');
 if offer<>public.submit_sale_offer(thread,500,null,'bbbbbbbb-8888-4888-8888-bbbbbbbbbbbb') then
  raise exception 'Identical offer retry duplicated'; end if;
 begin
  perform public.submit_sale_offer(thread,600,null,'bbbbbbbb-8888-4888-8888-bbbbbbbbbbbb');
  raise exception 'Different offer amount reused a nonce';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.submit_sale_offer(thread,500,'cccccccc-8888-4888-8888-cccccccccccc',
   'bbbbbbbb-8888-4888-8888-bbbbbbbbbbbb');
  raise exception 'Different offer parent reused a nonce';
 exception when invalid_parameter_value then null; end;
 perform set_config('request.jwt.claim.sub','aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa',true);
 begin
  perform public.resolve_sale_offer(offer,null);
  raise exception 'NULL decision mutated a pending offer';
 exception when invalid_parameter_value then null; end;
 if (select status from public.sale_offers where id=offer)<>'pending' then
  raise exception 'Invalid decision changed offer state'; end if;
 perform public.resolve_sale_offer(offer,'accept');
 deal:=public.start_sale_transaction(offer);
 if public.confirm_sale_exchange(deal)<>'pending_handover' then
  raise exception 'Single confirmation completed exchange'; end if;
 perform set_config('request.jwt.claim.sub','bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb',true);
 if public.confirm_sale_exchange(deal)<>'completed' then
  raise exception 'Dual confirmation did not complete'; end if;
 select * into before_tx from public.sale_transactions where id=deal;
 if public.confirm_sale_exchange(deal)<>'completed' then
  raise exception 'Buyer completed-state retry failed'; end if;
 if (select completed_at from public.sale_transactions where id=deal)
    is distinct from before_tx.completed_at then
  raise exception 'Retry changed completion timestamp'; end if;
 if (select count(*) from public.notifications where category='sale'
   and user_id='bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb')<>1 then
  raise exception 'Retry duplicated completion notification'; end if;
 perform set_config('request.jwt.claim.sub','aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa',true);
 if public.confirm_sale_exchange(deal)<>'completed' then
  raise exception 'Seller completed-state retry failed'; end if;
 if (select count(*) from public.notifications where category='sale'
   and user_id='aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa')<>1 then
  raise exception 'Seller retry duplicated completion notification'; end if;
 perform set_config('request.jwt.claim.sub','cccccccc-7777-4777-8777-cccccccccccc',true);
 begin
  perform public.confirm_sale_exchange(deal);
  raise exception 'Unrelated member could acknowledge a completed sale';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'sale retry contracts: passed' as result;
