-- Exact retry payloads and completed-handover retries. No new state/feature.
begin;

create or replace function public.send_sale_message(
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
  previous public.sale_messages%rowtype;
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

  select * into previous from public.sale_messages
    where conversation_id = thread.id and sender_id = caller
      and client_nonce = request_nonce;
  if found then
    if previous.message_body is distinct from body then
      raise exception 'Message nonce belongs to another payload' using errcode='22023';
    end if;
    return previous.id;
  end if;

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

create or replace function public.submit_sale_offer(
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
  existing public.sale_offers%rowtype;
  result_id uuid;
begin
  if caller is null or requested_conversation is null
    or request_nonce is null or requested_amount is null or requested_amount not between 1 and 10000000
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

  select * into existing from public.sale_offers where
    conversation_id = thread.id and proposer_id = caller and client_nonce = request_nonce;
  if found then
    if existing.amount_inr is distinct from requested_amount
      or existing.parent_offer_id is distinct from parent_offer then
      raise exception 'Offer nonce belongs to another payload' using errcode='22023';
    end if;
    return existing.id;
  end if;

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

create or replace function public.resolve_sale_offer(requested_offer uuid, decision text)
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
    or decision is null or decision not in ('accept', 'reject', 'withdraw') then
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

create or replace function public.confirm_sale_exchange(requested_transaction uuid)
returns text language plpgsql volatile security definer set search_path=''
as $$
declare
  original public.sale_transactions%rowtype;
  txn public.sale_transactions%rowtype;
  sale public.listings%rowtype;
  caller uuid := (select auth.uid());
  new_status text;
begin
  select * into original from public.sale_transactions where id=requested_transaction;
  if not found or caller is null then
    raise exception 'Transaction unavailable' using errcode='42501'; end if;
  -- The listing is locked first across all sale lifecycle operations.
  select * into sale from public.listings where id=original.listing_id for update;
  select * into txn from public.sale_transactions where id=requested_transaction for update;
  if caller not in (txn.buyer_id,txn.seller_id)
    or not private.can_access_campus(sale.campus_id)
  then raise exception 'Confirmation unavailable' using errcode='42501'; end if;
  -- A retry after mutual completion returns current state without touching
  -- confirmation timestamps or generating another notification.
  if txn.status='completed' then return txn.status; end if;
  if txn.status<>'pending_handover' or sale.status not in ('active','paused') then
    raise exception 'Confirmation unavailable' using errcode='42501';
  end if;

  update public.sale_transactions
    set seller_handed_over_at=case when caller=txn.seller_id
      then coalesce(seller_handed_over_at,now()) else seller_handed_over_at end,
      buyer_received_at=case when caller=txn.buyer_id
      then coalesce(buyer_received_at,now()) else buyer_received_at end,
      status=case when
        (seller_handed_over_at is not null or caller=txn.seller_id)
        and (buyer_received_at is not null or caller=txn.buyer_id)
        then 'completed' else 'pending_handover' end,
      completed_at=case when
        (seller_handed_over_at is not null or caller=txn.seller_id)
        and (buyer_received_at is not null or caller=txn.buyer_id)
        then now() else null end
    where id=txn.id returning status into new_status;

  if new_status='completed' then
    update public.listings set status='sold' where id=sale.id;
  end if;
  return new_status;
end;
$$;

commit;
