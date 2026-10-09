-- Step 04: persisted sale conversations and price negotiation.
-- Applies after 20261009210000_listing_media.sql.
-- User writes use narrow RPCs; client direct writes are denied.
begin;

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint block_not_self check (blocker_id <> blocked_id)
);

create table public.sale_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  constraint seller_not_buyer check (seller_id <> buyer_id)
);
create index sale_conversations_seller_recent_idx on
  public.sale_conversations(seller_id, created_at desc);
create index sale_conversations_buyer_recent_idx on
  public.sale_conversations(buyer_id, created_at desc);

create table public.sale_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sale_conversations(id),
  sender_id uuid not null references public.profiles(id),
  message_body text not null check (
    char_length(btrim(message_body)) between 1 and 2000
    and message_body = btrim(message_body)
  ),
  client_nonce uuid not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, sender_id, client_nonce)
);
create index sale_messages_history_idx on
  public.sale_messages(conversation_id, created_at desc, id desc);
create index sale_messages_sender_recent_idx on
  public.sale_messages(conversation_id, sender_id, created_at desc);

create table public.sale_offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sale_conversations(id),
  listing_id uuid not null references public.listings(id),
  proposer_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  parent_offer_id uuid references public.sale_offers(id),
  amount_inr integer not null check (amount_inr between 1 and 10000000),
  status text not null default 'pending' check (
    status in ('pending','accepted','rejected','countered','withdrawn')
  ),
  client_nonce uuid not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint no_self_offer check (proposer_id <> recipient_id),
  constraint decision_timestamp_matches_status check (
    (status = 'pending' and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  ),
  unique (conversation_id, proposer_id, client_nonce)
);
create unique index sale_offers_one_pending_per_conversation on
  public.sale_offers(conversation_id) where status = 'pending';
create unique index sale_offers_one_accepted_per_listing on
  public.sale_offers(listing_id) where status = 'accepted';
create index sale_offers_conversation_recent_idx on
  public.sale_offers(conversation_id, created_at desc);

-- Only live eligible participants can see their conversation history.
create function private.can_read_sale_conversation(requested_conversation uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sale_conversations c
    join public.listings l on l.id = c.listing_id
    where c.id = requested_conversation
      and (select auth.uid()) in (c.buyer_id, c.seller_id)
      and private.can_access_campus(l.campus_id)
  );
$$;

create function private.sale_participants_blocked(first_user uuid, second_user uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = first_user and b.blocked_id = second_user)
       or (b.blocker_id = second_user and b.blocked_id = first_user)
  );
$$;

-- Disallow initiating/contacting users whose account or membership was revoked.
create function private.sale_counterparty_eligible(other_user uuid, requested_campus uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    join public.campus_memberships cm on cm.user_id = p.id
    where p.id = other_user and p.account_status = 'active'
      and cm.campus_id = requested_campus and cm.status = 'verified'
  );
$$;

revoke all on function private.can_read_sale_conversation(uuid)
  from public, anon, authenticated;
revoke all on function private.sale_participants_blocked(uuid,uuid)
  from public, anon, authenticated;
revoke all on function private.sale_counterparty_eligible(uuid,uuid)
  from public, anon, authenticated;
grant execute on function private.can_read_sale_conversation(uuid) to authenticated;
grant execute on function private.sale_participants_blocked(uuid,uuid) to authenticated;
grant execute on function private.sale_counterparty_eligible(uuid,uuid) to authenticated;

alter table public.user_blocks enable row level security;
alter table public.sale_conversations enable row level security;
alter table public.sale_messages enable row level security;
alter table public.sale_offers enable row level security;

revoke all on public.user_blocks from public, anon, authenticated;
revoke all on public.sale_conversations from public, anon, authenticated;
revoke all on public.sale_messages from public, anon, authenticated;
revoke all on public.sale_offers from public, anon, authenticated;

-- User can block/unblock only for themselves; cannot enumerate other blocks.
grant select on public.user_blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.user_blocks to authenticated;
grant delete on public.user_blocks to authenticated;
create policy sale_blocks_select_own on public.user_blocks for select to authenticated
  using (blocker_id = (select auth.uid()));
create policy sale_blocks_insert_self on public.user_blocks for insert to authenticated
  with check (
    blocker_id = (select auth.uid()) and blocker_id <> blocked_id
  );
create policy sale_blocks_delete_self on public.user_blocks for delete to authenticated
  using (blocker_id = (select auth.uid()));

grant select on public.sale_conversations to authenticated;
grant select on public.sale_messages to authenticated;
grant select on public.sale_offers to authenticated;

create policy sale_conversations_participants_read on public.sale_conversations
for select to authenticated
using (private.can_read_sale_conversation(id));

create policy sale_messages_participants_read on public.sale_messages
for select to authenticated
using (private.can_read_sale_conversation(conversation_id));

create policy sale_offers_participants_read on public.sale_offers
for select to authenticated
using (private.can_read_sale_conversation(conversation_id));

-- Create or reuse exactly one buyer/seller conversation for an active item.
-- Explicit ownership/eligibility checks are required in this exposed RPC.
create function public.open_sale_conversation(requested_listing uuid)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  sale public.listings%rowtype;
  result_id uuid;
  caller uuid := (select auth.uid());
begin
  if caller is null or requested_listing is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into sale from public.listings l
  where l.id = requested_listing for share;

  if not found or sale.status <> 'active'
    or sale.owner_id = caller
    or not private.can_access_campus(sale.campus_id)
    or not exists (
      select 1 from public.categories k
      where k.slug = sale.category_slug and k.enabled
    )
    or private.sale_participants_blocked(caller, sale.owner_id)
    or not private.sale_counterparty_eligible(sale.owner_id, sale.campus_id)
  then
    raise exception 'Conversation unavailable' using errcode = '42501';
  end if;

  insert into public.sale_conversations(listing_id, buyer_id, seller_id)
  values (sale.id, caller, sale.owner_id)
  on conflict (listing_id, buyer_id) do nothing;

  select id into result_id from public.sale_conversations
    where listing_id = sale.id and buyer_id = caller;

  return result_id;
end;
$$;

create function public.send_sale_message(
  requested_conversation uuid,
  content text,
  request_nonce uuid
)
returns uuid language plpgsql volatile security definer
set search_path = ''
as $$
declare
  thread public.sale_conversations%rowtype;
  sale public.listings%rowtype;
  caller uuid := (select auth.uid());
  previous_id uuid;
  last_sent timestamptz;
  message_id uuid;
  body text := btrim(content);
begin
  if caller is null or request_nonce is null or requested_conversation is null
    or body is null or char_length(body) not between 1 and 2000 then
    raise exception 'Invalid message' using errcode = '22023';
  end if;

  select * into thread from public.sale_conversations
    where id = requested_conversation for update;

  if not found or caller not in (thread.buyer_id, thread.seller_id) then
    raise exception 'Conversation unavailable' using errcode = '42501';
  end if;
  select * into sale from public.listings where id = thread.listing_id;
  if not private.can_access_campus(sale.campus_id)
    or sale.status = 'removed'
    or private.sale_participants_blocked(thread.buyer_id, thread.seller_id)
    or not private.sale_counterparty_eligible(
      case when caller = thread.buyer_id then thread.seller_id else thread.buyer_id end,
      sale.campus_id
    ) then
    raise exception 'Messaging unavailable' using errcode = '42501';
  end if;

  select id into previous_id from public.sale_messages
    where conversation_id = thread.id and sender_id = caller
      and client_nonce = request_nonce;
  if found then return previous_id; end if;

  select max(created_at) into last_sent from public.sale_messages
    where conversation_id = thread.id and sender_id = caller;
  if last_sent is not null and last_sent > clock_timestamp() - interval '2 seconds' then
    raise exception 'Too many messages' using errcode = '22023';
  end if;

  insert into public.sale_messages(conversation_id, sender_id, message_body, client_nonce)
    values (thread.id, caller, body, request_nonce)
    returning id into message_id;

  return message_id;
end;
$$;

create function public.submit_sale_offer(
  requested_conversation uuid,
  requested_amount integer,
  parent_offer uuid,
  request_nonce uuid
)
returns uuid language plpgsql volatile security definer
set search_path = ''
as $$
declare
  thread public.sale_conversations%rowtype;
  sale public.listings%rowtype;
  previous public.sale_offers%rowtype;
  caller uuid := (select auth.uid());
  recipient uuid;
  existing_id uuid;
  result_id uuid;
begin
  if caller is null or requested_conversation is null
    or request_nonce is null or requested_amount not between 1 and 10000000
  then
    raise exception 'Invalid offer' using errcode = '22023';
  end if;

  select * into thread from public.sale_conversations
    where id = requested_conversation;
  if not found or caller not in (thread.buyer_id, thread.seller_id) then
    raise exception 'Conversation unavailable' using errcode = '42501';
  end if;

  -- A listing row is the cross-conversation serialization lock for offers.
  select * into sale from public.listings where id = thread.listing_id for update;
  if not found or sale.status <> 'active'
    or not private.can_access_campus(sale.campus_id)
    or private.sale_participants_blocked(thread.buyer_id, thread.seller_id)
    or not private.sale_counterparty_eligible(
      case when caller = thread.buyer_id then thread.seller_id else thread.buyer_id end,
      sale.campus_id
    )
    or not exists (
      select 1 from public.categories k
      where k.slug = sale.category_slug and k.enabled
    )
  then
    raise exception 'Offer unavailable' using errcode = '42501';
  end if;

  select id into existing_id from public.sale_offers where
    conversation_id = thread.id and proposer_id = caller and client_nonce = request_nonce;
  if found then return existing_id; end if;

  if exists (select 1 from public.sale_offers
    where listing_id = sale.id and status = 'accepted') then
    raise exception 'Another offer has been accepted' using errcode = '22023';
  end if;

  recipient := case when caller = thread.buyer_id
    then thread.seller_id else thread.buyer_id end;

  if parent_offer is null then
    if caller <> thread.buyer_id then
      raise exception 'Only buyer may start negotiation' using errcode = '42501';
    end if;
  else
    select * into previous from public.sale_offers
      where id = parent_offer and conversation_id = thread.id for update;
    if not found or previous.status <> 'pending'
      or previous.proposer_id = caller or previous.recipient_id <> caller then
      raise exception 'Invalid counter-offer' using errcode = '22023';
    end if;
    update public.sale_offers set status = 'countered', decided_at = now()
      where id = previous.id;
  end if;

  if exists (select 1 from public.sale_offers
    where conversation_id = thread.id and status = 'pending') then
    raise exception 'Resolve the current offer first' using errcode = '22023';
  end if;

  insert into public.sale_offers(
    conversation_id,listing_id,proposer_id,recipient_id,
    parent_offer_id,amount_inr,client_nonce
  ) values (
    thread.id,sale.id,caller,recipient,parent_offer,requested_amount,request_nonce
  ) returning id into result_id;
  return result_id;
end;
$$;

create function public.resolve_sale_offer(requested_offer uuid, decision text)
returns text language plpgsql volatile security definer
set search_path = ''
as $$
declare
  original public.sale_offers%rowtype;
  locked public.sale_offers%rowtype;
  sale public.listings%rowtype;
  thread public.sale_conversations%rowtype;
  caller uuid := (select auth.uid());
  new_status text;
begin
  if caller is null or requested_offer is null
    or decision not in ('accept', 'reject', 'withdraw') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  select * into original from public.sale_offers where id = requested_offer;
  if not found then raise exception 'Offer unavailable' using errcode = '42501'; end if;

  -- Always lock listing BEFORE offer; this matches submit_sale_offer.
  select * into sale from public.listings where id = original.listing_id for update;
  select * into locked from public.sale_offers where id = requested_offer for update;
  select * into thread from public.sale_conversations where id = locked.conversation_id;

  if not found or locked.status <> 'pending'
    or caller not in (thread.buyer_id,thread.seller_id)
    or not private.can_access_campus(sale.campus_id) then
    raise exception 'Offer unavailable' using errcode = '42501';
  end if;

  if decision = 'withdraw' then
    if locked.proposer_id <> caller then
      raise exception 'Only proposer may withdraw' using errcode = '42501';
    end if;
    new_status := 'withdrawn';
  else
    if locked.recipient_id <> caller then
      raise exception 'Only recipient may decide' using errcode = '42501';
    end if;
    if decision = 'accept' and (
      sale.status <> 'active'
      or private.sale_participants_blocked(thread.buyer_id,thread.seller_id)
      or not private.sale_counterparty_eligible(locked.proposer_id, sale.campus_id)
      or exists (select 1 from public.sale_offers
        where listing_id = sale.id and status = 'accepted')
    ) then
      raise exception 'Acceptance unavailable' using errcode = '22023';
    end if;
    new_status := case when decision = 'accept' then 'accepted' else 'rejected' end;
  end if;

  update public.sale_offers set status = new_status, decided_at = now()
    where id = locked.id;
  if new_status = 'accepted' then
    -- Other outstanding buyer offers are no longer actionable.
    update public.sale_offers
      set status = 'rejected', decided_at = now()
      where listing_id = sale.id and id <> locked.id and status = 'pending';
  end if;

  return new_status;
end;
$$;

revoke all on function public.open_sale_conversation(uuid)
  from public,anon,authenticated;
revoke all on function public.send_sale_message(uuid,text,uuid)
  from public,anon,authenticated;
revoke all on function public.submit_sale_offer(uuid,integer,uuid,uuid)
  from public,anon,authenticated;
revoke all on function public.resolve_sale_offer(uuid,text)
  from public,anon,authenticated;
grant execute on function public.open_sale_conversation(uuid) to authenticated;
grant execute on function public.send_sale_message(uuid,text,uuid) to authenticated;
grant execute on function public.submit_sale_offer(uuid,integer,uuid,uuid) to authenticated;
grant execute on function public.resolve_sale_offer(uuid,text) to authenticated;

commit;
