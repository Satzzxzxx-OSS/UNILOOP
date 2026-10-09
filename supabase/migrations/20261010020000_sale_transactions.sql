-- Step 08: seller/buyer-confirmed sale handovers and private reviews.
-- This is an offline exchange record, NOT verified payment or escrow.
begin;

create table public.sale_transactions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.sale_offers(id),
  listing_id uuid not null unique references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  agreed_price_inr integer not null check (agreed_price_inr between 1 and 10000000),
  status text not null default 'pending_handover'
    check(status in ('pending_handover','completed','cancelled','disputed')),
  buyer_received_at timestamptz,
  seller_handed_over_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (buyer_id<>seller_id),
  check (
    (status='completed' and completed_at is not null
      and seller_handed_over_at is not null and buyer_received_at is not null)
    or (status<>'completed' and completed_at is null)
  )
);
create index sale_transactions_buyer_idx on
  public.sale_transactions(buyer_id,created_at desc);
create index sale_transactions_seller_idx on
  public.sale_transactions(seller_id,created_at desc);

create table public.sale_reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.sale_transactions(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewed_user_id uuid not null references public.profiles(id),
  rating smallint not null check(rating between 1 and 5),
  review_body text not null check(char_length(btrim(review_body)) between 15 and 1000),
  created_at timestamptz not null default now(),
  unique(transaction_id,reviewer_id),
  check(reviewer_id<>reviewed_user_id)
);
create index sale_reviews_reviewed_user_idx on
  public.sale_reviews(reviewed_user_id,created_at desc);

create function private.can_view_sale_transaction(transaction_uuid uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(
   select 1 from public.sale_transactions t
   join public.listings l on l.id=t.listing_id
   where t.id=transaction_uuid
    and (select auth.uid()) in (t.seller_id,t.buyer_id)
    and private.can_access_campus(l.campus_id)
 );
$$;
revoke all on function private.can_view_sale_transaction(uuid) from public,anon,authenticated;
grant execute on function private.can_view_sale_transaction(uuid) to authenticated;

alter table public.sale_transactions enable row level security;
alter table public.sale_reviews enable row level security;
revoke all on public.sale_transactions from public,anon,authenticated;
revoke all on public.sale_reviews from public,anon,authenticated;
grant select on public.sale_transactions to authenticated;
grant select on public.sale_reviews to authenticated;
create policy sale_transaction_participant_select on public.sale_transactions
for select to authenticated using(private.can_view_sale_transaction(id));
create policy sale_review_participant_select on public.sale_reviews
for select to authenticated using(private.can_view_sale_transaction(transaction_id));

create function public.start_sale_transaction(requested_offer uuid)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  original public.sale_offers%rowtype;
  offer public.sale_offers%rowtype;
  listing public.listings%rowtype;
  thread public.sale_conversations%rowtype;
  caller uuid := (select auth.uid());
  existing uuid;
  result_id uuid;
begin
  select * into original from public.sale_offers where id=requested_offer;
  if not found or caller is null then
    raise exception 'Offer unavailable' using errcode='42501'; end if;
  select * into listing from public.listings where id=original.listing_id for update;
  select * into offer from public.sale_offers where id=requested_offer for update;
  select * into thread from public.sale_conversations where id=offer.conversation_id;
  if offer.status<>'accepted' or listing.status not in ('active','paused')
    or caller not in (thread.buyer_id,thread.seller_id)
    or not private.can_access_campus(listing.campus_id)
    or not private.sale_counterparty_eligible(
      case when caller=thread.buyer_id then thread.seller_id else thread.buyer_id end,
      listing.campus_id
    )
    or private.sale_participants_blocked(thread.buyer_id,thread.seller_id)
  then raise exception 'Transaction unavailable' using errcode='42501'; end if;

  select id into existing from public.sale_transactions where offer_id=offer.id;
  if found then return existing; end if;
  if exists(select 1 from public.sale_transactions t where t.listing_id=listing.id) then
    raise exception 'Transaction already exists' using errcode='22023'; end if;
  insert into public.sale_transactions(offer_id,listing_id,buyer_id,seller_id,agreed_price_inr)
    values(offer.id,listing.id,thread.buyer_id,thread.seller_id,offer.amount_inr)
    returning id into result_id;
  return result_id;
end;
$$;

create function public.confirm_sale_exchange(requested_transaction uuid)
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
    or txn.status<>'pending_handover' or sale.status not in ('active','paused')
  then raise exception 'Confirmation unavailable' using errcode='42501'; end if;

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

create function public.review_completed_sale(
  requested_transaction uuid,stars smallint,details text
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  txn public.sale_transactions%rowtype;
  listing public.listings%rowtype;
  caller uuid := (select auth.uid());
  target_user uuid;
  result_id uuid;
begin
  select * into txn from public.sale_transactions where id=requested_transaction;
  if not found or stars not between 1 and 5 or details is null
    or char_length(btrim(details)) not between 15 and 1000 then
    raise exception 'Invalid review' using errcode='22023'; end if;
  select * into listing from public.listings where id=txn.listing_id;
  if caller not in (txn.seller_id,txn.buyer_id)
    or txn.status<>'completed'
    or not private.can_access_campus(listing.campus_id)
  then raise exception 'Review not permitted' using errcode='42501'; end if;
  target_user:=case when caller=txn.buyer_id then txn.seller_id else txn.buyer_id end;

  insert into public.sale_reviews(transaction_id,reviewer_id,reviewed_user_id,rating,review_body)
    values(txn.id,caller,target_user,stars,btrim(details))
    returning id into result_id;
  return result_id;
end;
$$;

revoke all on function public.start_sale_transaction(uuid) from public,anon,authenticated;
revoke all on function public.confirm_sale_exchange(uuid) from public,anon,authenticated;
revoke all on function public.review_completed_sale(uuid,smallint,text) from public,anon,authenticated;
grant execute on function public.start_sale_transaction(uuid) to authenticated;
grant execute on function public.confirm_sale_exchange(uuid) to authenticated;
grant execute on function public.review_completed_sale(uuid,smallint,text) to authenticated;

commit;
