-- Sale handover double confirmation, private reviews and trusted state tests.
\set ON_ERROR_STOP on
insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','buyer@example.test'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','another@example.test');
insert into public.campuses(id,name) values
 ('11111111-1111-4111-8111-111111111111','Approved market');
insert into private.enabled_campuses(campus_id,enabled) values
 ('11111111-1111-4111-8111-111111111111',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','verified',now());

insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values ('11111111-aaaa-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111','books-study','Chemistry hardcover book',
 'Gently used hardcover chemistry book with handwritten notes.',550,'good');
insert into storage.objects(bucket_id,name,owner_id) values
 ('listing-media',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values
 ('11111111-aaaa-4111-8111-111111111111',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',1);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.transition_sale_listing('11111111-aaaa-4111-8111-111111111111','active');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
do $$
declare thread_id uuid;offer_id uuid;
begin
  select id into thread_id from public.sale_conversations
    where buyer_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  offer_id:=public.submit_sale_offer(thread_id,500,null,
    '77777777-7777-4777-8777-777777777777');
  begin
    perform public.start_sale_transaction(offer_id);
    raise exception 'Unaccepted offer became transaction';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare offer_id uuid;
begin
  select id into offer_id from public.sale_offers;
  perform public.resolve_sale_offer(offer_id,'accept');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare offer_id uuid;first_tx uuid;second_tx uuid;
begin
  select id into offer_id from public.sale_offers;
  first_tx:=public.start_sale_transaction(offer_id);
  second_tx:=public.start_sale_transaction(offer_id);
  if first_tx<>second_tx then raise exception 'Transaction retry duplicated'; end if;
  if public.confirm_sale_exchange(first_tx)<>'pending_handover' then
    raise exception 'One-sided handover marked completed';
  end if;
  begin
    perform public.review_completed_sale(first_tx,5::smallint,'Good and quick trade, thank you.');
    raise exception 'Review allowed before mutual handover';
  exception when insufficient_privilege then null;
  end;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
declare deal_id uuid;
begin
 if exists(select 1 from public.sale_transactions) then
   raise exception 'Third party read private transaction';
 end if;
 select id into deal_id from public.sale_transactions;
 if deal_id is not null then raise exception 'Unexpected visible transaction'; end if;
 if has_table_privilege('authenticated','public.sale_transactions','INSERT') then
   raise exception 'Direct transaction injection possible';
 end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare deal_id uuid;
begin
  select id into deal_id from public.sale_transactions;
  if public.confirm_sale_exchange(deal_id)<>'completed' then
    raise exception 'Mutual handover not completed';
  end if;
  if (select status from public.listings where
     id='11111111-aaaa-4111-8111-111111111111')<>'sold' then
    raise exception 'Completed exchange did not mark item sold';
  end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare deal_id uuid;
begin
  select id into deal_id from public.sale_transactions;
  perform public.review_completed_sale(deal_id,5::smallint,'Item matched the stated description perfectly.');
  begin
    perform public.review_completed_sale(deal_id,1::smallint,'Another unauthorized duplicate review text.');
    raise exception 'User posted duplicate sale review';
  exception when unique_violation then null;
  end;
  if (select count(*) from public.sale_reviews)<>1 then
    raise exception 'Buyer cannot see own private review';
  end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists(select 1 from public.sale_reviews) then
  raise exception 'Private review leaked to unrelated user';
 end if;
 if has_table_privilege('authenticated','public.sale_reviews','INSERT') then
  raise exception 'Unverified review insertion allowed';
 end if;
end $$;
rollback;

select 'sale transaction & private review tests: passed' as result;
