-- Step 04 sale interactions, permission isolation, idempotency and negotiation.
-- Runs in fresh disposable PostgreSQL AFTER identity, sale, media and interactions.
\set ON_ERROR_STOP on

insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','buyer-one@example.test'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','buyer-two@example.test'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','not-member@example.test'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','other-campus@example.test');

insert into public.campuses(id,name) values
 ('11111111-1111-4111-8111-111111111111','Enabled market'),
 ('22222222-2222-4222-8222-222222222222','Disabled market');
insert into private.enabled_campuses(campus_id,enabled) values
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',false);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','verified',now()),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111','pending',null),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','22222222-2222-4222-8222-222222222222','verified',now());

-- Test fixtures trusted operator creates an uploaded photo and a published listing.
insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values('11111111-aaaa-4111-8111-111111111111',
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'11111111-1111-4111-8111-111111111111',
'books-study','Original calculus textbook','Original textbook with light annotations in good condition.',550,'good');
insert into storage.objects(bucket_id,name,owner_id) values(
 'listing-media',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);
insert into public.listing_photos(listing_id,storage_path,position) values(
 '11111111-aaaa-4111-8111-111111111111',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',1);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.transition_sale_listing('11111111-aaaa-4111-8111-111111111111','active');
commit;

-- Buyer 1 creates idempotent conversation, seller cannot open one with themselves.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
begin
 begin
  perform public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
  raise exception 'Seller opened conversation with self';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
select public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
do $$
begin
 if (select count(*) from public.sale_conversations) <> 1 then
   raise exception 'Reopening creates duplicate conversation';
 end if;
end $$;
commit;

-- Buyer 2 opens a separate conversation.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
select public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
do $$
begin
 if (select count(*) from public.sale_conversations) <> 1 then
   raise exception 'Buyer must not see another buyer conversation';
 end if;
end $$;
commit;

-- Unapproved and disabled-scope accounts cannot read or start conversations.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
do $$
begin
 if exists (select 1 from public.sale_conversations)
    or exists (select 1 from public.sale_messages)
    or exists (select 1 from public.sale_offers) then
  raise exception 'Pending user read private conversations';
 end if;
 begin
  perform public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
  raise exception 'Pending user opened conversation';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',true);
do $$
begin
 if exists (select 1 from public.sale_conversations) then
   raise exception 'Disabled campus can access conversation';
 end if;
end $$;
rollback;

-- Buyer 1 sends a message, retrying same nonce must return same id.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare
  thread_id uuid;
  first_id uuid;
  retry_id uuid;
begin
 select id into thread_id from public.sale_conversations
   where buyer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 first_id := public.send_sale_message(thread_id,'Is the book available?',
   '66666666-6666-4666-8666-666666666666');
 retry_id := public.send_sale_message(thread_id,'Is the book available?',
   '66666666-6666-4666-8666-666666666666');
 if first_id <> retry_id or
   (select count(*) from public.sale_messages where conversation_id = thread_id) <> 1 then
    raise exception 'Message idempotency broken';
 end if;
 begin
  perform public.send_sale_message(thread_id,'Too soon',
    '77777777-7777-4777-8777-777777777777');
  raise exception 'Message cooldown bypassed';
 exception when invalid_parameter_value then null;
 end;
end $$;
commit;

-- Seller sees the buyer message; other buyer cannot see it.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
begin
 if (select count(*) from public.sale_messages) <> 1 then
  raise exception 'Seller cannot read buyer message';
 end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists (select 1 from public.sale_messages) then
  raise exception 'Other buyer can read private messages';
 end if;
 if has_table_privilege('authenticated','public.sale_messages','INSERT') then
  raise exception 'Direct message insert privilege exposed';
 end if;
end $$;
rollback;

-- Buyer 1 sends offer, cannot accept own offer.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare
  thread_id uuid;
  first_offer uuid;
  retried_offer uuid;
begin
  select id into thread_id from public.sale_conversations
    where buyer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  first_offer := public.submit_sale_offer(thread_id,480,null,
    '11111111-2222-4333-8444-555555555555');
  retried_offer := public.submit_sale_offer(thread_id,480,null,
    '11111111-2222-4333-8444-555555555555');
  if first_offer <> retried_offer then raise exception 'Offer retry duplicated'; end if;
  begin
    perform public.resolve_sale_offer(first_offer,'accept');
    raise exception 'Buyer accepted own offer';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.submit_sale_offer(thread_id,490,null,
      '11111111-2222-4333-8444-666666666666');
    raise exception 'Second simultaneous pending offer created';
  exception when invalid_parameter_value then null;
  end;
end $$;
commit;

-- Seller makes counter, buyer accepts (acceptance is NOT a sale).
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare
  previous_id uuid;
  thread_uuid uuid;
  counter_id uuid;
begin
  select o.id, o.conversation_id into previous_id,thread_uuid
    from public.sale_offers o where o.amount_inr = 480;
  counter_id := public.submit_sale_offer(thread_uuid,520,previous_id,
    'aaaaaaaa-2222-4333-8444-aaaaaaaaaaaa');
  if (select status from public.sale_offers where id = previous_id) <> 'countered' then
    raise exception 'Original offer not countered';
  end if;
  if (select proposer_id from public.sale_offers where id = counter_id) <>
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then
    raise exception 'Counter owner incorrect';
  end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare
  counter_id uuid;
begin
  select id into counter_id from public.sale_offers where amount_inr = 520;
  if public.resolve_sale_offer(counter_id,'accept') <> 'accepted' then
    raise exception 'Valid counter acceptance failed';
  end if;
end $$;
commit;

-- A second buyer cannot get an accepted offer after the first acceptance.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
declare
  thread_id uuid;
begin
  select id into thread_id from public.sale_conversations
    where buyer_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  begin
    perform public.submit_sale_offer(thread_id,530,null,
      'bbbbbbbb-2222-4333-8444-bbbbbbbbbbbb');
    raise exception 'Offer submitted after an accepted offer';
  exception when invalid_parameter_value then null;
  end;
end $$;
rollback;

-- Acceptance alone does not record a paid trade / sold listing.
do $$
begin
 if (select status from public.listings
   where id = '11111111-aaaa-4111-8111-111111111111') <> 'active' then
   raise exception 'Accepted offer improperly marked listing sold';
 end if;
end $$;

-- Seller may block buyer. Block must prevent further messages.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.user_blocks(blocker_id,blocked_id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare thread_id uuid;
begin
 select id into thread_id from public.sale_conversations
  where buyer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 begin
  perform public.send_sale_message(thread_id,'Can we continue?',
     'dddddddd-2222-4333-8444-dddddddddddd');
  raise exception 'Blocked user sent message';
 exception when insufficient_privilege then null;
 end;
 if exists(select 1 from public.user_blocks) then
   raise exception 'Blocked user can see other user block list';
 end if;
end $$;
rollback;

-- Privileged writes are not exposed through direct PostgREST mutations.
do $$
begin
 if has_table_privilege('authenticated','public.sale_offers','UPDATE') or
    has_table_privilege('authenticated','public.sale_offers','INSERT') or
    has_table_privilege('authenticated','public.sale_conversations','INSERT') or
    has_table_privilege('authenticated','public.sale_messages','INSERT') then
   raise exception 'Direct privileged write grants exposed';
 end if;
 if has_function_privilege('anon','public.submit_sale_offer(uuid,integer,uuid,uuid)','EXECUTE') then
   raise exception 'Anonymous role may submit offers';
 end if;
end $$;


-- Disposable test fixture: provide a known conversation UUID to a third-party
-- account so that we test RPC authorization, not only SELECT RLS.
create temporary table ci_guessed_thread_ids (id uuid primary key);
insert into ci_guessed_thread_ids(id)
select id from public.sale_conversations
  where buyer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
grant select on ci_guessed_thread_ids to authenticated;

-- A member from another conversation must not send in a guessed thread.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
declare
  guessed_thread uuid;
begin
  select id into guessed_thread from ci_guessed_thread_ids;
  begin
    perform public.send_sale_message(guessed_thread,'I should not be here.',
      'eeeeeeee-2222-4333-8444-eeeeeeeeeeee');
    raise exception 'Other buyer sent into private thread';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- Suspending the seller must stop NEW contact to that seller immediately.
update public.profiles set account_status = 'suspended'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
declare thread_id uuid;
begin
  select id into thread_id from public.sale_conversations
    where buyer_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  begin
    perform public.send_sale_message(thread_id, 'Seller is not eligible.',
      'ffffffff-2222-4333-8444-ffffffffffff');
    raise exception 'Suspended counterparty could still receive new messages';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- Blocks must never be assignable on behalf of another user.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
  begin
    insert into public.user_blocks(blocker_id, blocked_id)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    raise exception 'User impersonated another blocker';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

select 'Step 04 secure sale interactions: passed' as result;
