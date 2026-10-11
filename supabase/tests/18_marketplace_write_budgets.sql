-- Direct database write budgets and canonical retry behavior.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb','buyer@example.test'),
 ('cccccccc-9999-4999-8999-cccccccccccc','another@example.test');
insert into public.campuses(id,name) values
 ('dddddddd-9999-4999-8999-dddddddddddd','Approved market');
insert into private.enabled_campuses(campus_id,enabled) values
 ('dddddddd-9999-4999-8999-dddddddddddd',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','dddddddd-9999-4999-8999-dddddddddddd','verified',now()),
 ('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb','dddddddd-9999-4999-8999-dddddddddddd','verified',now()),
 ('cccccccc-9999-4999-8999-cccccccccccc','dddddddd-9999-4999-8999-dddddddddddd','verified',now());

insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values ('eeeeeeee-9999-4999-8999-eeeeeeeeeeee',
 'aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa',
 'dddddddd-9999-4999-8999-dddddddddddd','books-study','Chemistry hardcover book',
 'Gently used hardcover chemistry book with handwritten notes.',550,'good');
insert into storage.objects(bucket_id,name,owner_id) values
 ('listing-media',
 'eeeeeeee-9999-4999-8999-eeeeeeeeeeee/ffffffff-9999-4999-8999-ffffffffffff.jpg',
 'aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values
 ('eeeeeeee-9999-4999-8999-eeeeeeeeeeee',
 'eeeeeeee-9999-4999-8999-eeeeeeeeeeee/ffffffff-9999-4999-8999-ffffffffffff.jpg',1);

update public.listings set status='active',published_at=now()
 where id='eeeeeeee-9999-4999-8999-eeeeeeeeeeee';
update private.marketplace_write_limits set max_writes=1
 where operation in ('sale_draft','message');
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb',true);
do $$
declare thread uuid;message uuid;
begin
 thread:=public.open_sale_conversation('eeeeeeee-9999-4999-8999-eeeeeeeeeeee');
 if thread<>public.open_sale_conversation('eeeeeeee-9999-4999-8999-eeeeeeeeeeee') then
  raise exception 'Conversation retry changed identity'; end if;
 message:=public.send_sale_message(thread,'First permitted message',gen_random_uuid());
end $$;
reset role;
do $$
begin
 if (select sum(used) from private.marketplace_write_usage
  where user_id='bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb' and operation='conversation')<>1 then
  raise exception 'Conversation retry consumed budget'; end if;
 if (select sum(used) from private.marketplace_write_usage
  where user_id='bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb' and operation='message')<>1 then
  raise exception 'Message did not consume budget'; end if;
 if has_table_privilege('authenticated','private.marketplace_write_usage','UPDATE')
  or has_function_privilege('authenticated','private.enforce_marketplace_write_budget()','EXECUTE')
  or has_function_privilege('authenticated','public.prune_marketplace_write_usage(integer)','EXECUTE') then
  raise exception 'Client can manipulate write budgets'; end if;
end $$;
-- Simulate a second valid conversation to prove the global message budget, not
-- merely the existing per-conversation cooldown. Trusted fixture inserts only.
select set_config('request.jwt.claim.sub','',true);
insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
 values('abababab-9999-4999-8999-abababababab','cccccccc-9999-4999-8999-cccccccccccc',
 'dddddddd-9999-4999-8999-dddddddddddd','books-study','Second available book',
 'Another description suitable for testing a conversation.',100,'good');
insert into public.sale_conversations(id,listing_id,buyer_id,seller_id) values
 ('ffffffff-9999-4999-8999-ffffffffffff','abababab-9999-4999-8999-abababababab',
 'bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb','cccccccc-9999-4999-8999-cccccccccccc');
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb',true);
do $$
begin
 begin
  perform public.send_sale_message('ffffffff-9999-4999-8999-ffffffffffff',
   'Second conversation cannot bypass budget',gen_random_uuid());
  raise exception 'Global message budget bypassed';
 exception when sqlstate 'PT429' then null; end;
 if exists(select 1 from public.sale_messages where
  conversation_id='ffffffff-9999-4999-8999-ffffffffffff') then
  raise exception 'Over-budget message survived rollback'; end if;
end $$;
-- Direct table inserts cannot evade the draft budget. A rolled-back allowed
-- draft does not permanently charge the account.
select set_config('request.jwt.claim.sub','aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa',true);
savepoint discarded_draft;
insert into public.listings(owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
 values('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','dddddddd-9999-4999-8999-dddddddddddd',
 'books-study','Discarded valid draft','Description sufficient for a discarded draft.',100,'good');
rollback to discarded_draft;
insert into public.listings(owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
 values('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','dddddddd-9999-4999-8999-dddddddddddd',
 'books-study','Allowed direct draft','Description sufficient for an allowed draft.',100,'good');
do $$
begin
 begin
  insert into public.listings(owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
   values('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','dddddddd-9999-4999-8999-dddddddddddd',
   'books-study','Rejected direct draft','Description sufficient for a rejected draft.',100,'good');
  raise exception 'Direct insert bypassed budget';
 exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
-- The failed send must not leave notification/outbox records.
do $$
begin
 if (select count(*) from public.notifications where
  user_id in ('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','cccccccc-9999-4999-8999-cccccccccccc'))<>1 then
  raise exception 'Rejected message created notifications'; end if;
end $$;
insert into private.marketplace_write_usage(user_id,operation,window_start,used)
 values('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','sale_draft',now()-interval '3 days',1);
set local role service_role;
do $$
begin
 if public.prune_marketplace_write_usage(1)<>1 then
  raise exception 'Expired usage cleanup failed'; end if;
 begin perform public.prune_marketplace_write_usage(null);
  raise exception 'Unbounded cleanup accepted';
 exception when invalid_parameter_value then null; end;
end $$;
rollback;
select 'marketplace write budgets: passed' as result;
