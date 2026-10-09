-- Step 10/11: Rental listing, date blocks, serialized bookings, dual-sided handover.
-- No payment/escrow: amounts are informational offline estimates only.
-- Existing sale listing inventory is intentionally separate.
begin;

create extension if not exists btree_gist;

create table public.rental_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  campus_id uuid not null references public.campuses(id),
  category_slug text not null references public.categories(slug),
  title text not null check (char_length(btrim(title)) between 8 and 120),
  description text not null check (char_length(btrim(description)) between 20 and 5000),
  daily_rate_inr integer not null check (daily_rate_inr between 1 and 1000000),
  refundable_deposit_inr integer not null default 0 check (
    refundable_deposit_inr between 0 and 10000000
  ),
  min_days smallint not null default 1 check (min_days between 1 and 90),
  max_days smallint not null default 30 check (max_days between 1 and 90),
  item_condition text not null check (
    item_condition in ('new','like_new','good','fair')
  ),
  status text not null default 'draft' check (
    status in ('draft','active','paused','removed')
  ),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  check (min_days <= max_days),
  check ((status='draft' and published_at is null)
    or (status<>'draft' and published_at is not null))
);
create index rental_listings_live_idx on
  public.rental_listings(campus_id,published_at desc,id)
  where status='active';
create index rental_listings_owner_idx on
  public.rental_listings(owner_id,created_at desc);

create table public.rental_blocks (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rental_listings(id),
  owner_id uuid not null references public.profiles(id),
  unavailable_period daterange not null,
  request_nonce uuid not null,
  created_at timestamptz not null default now(),
  constraint rental_block_nonempty check (not isempty(unavailable_period)),
  unique (owner_id,request_nonce),
  exclude using gist(rental_id with =, unavailable_period with &&)
);
create index rental_blocks_owner_idx on public.rental_blocks(owner_id,rental_id);

create table public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rental_listings(id),
  owner_id uuid not null references public.profiles(id),
  renter_id uuid not null references public.profiles(id),
  booking_period daterange not null,
  days_count smallint not null check (days_count between 1 and 90),
  daily_rate_snapshot_inr integer not null check(daily_rate_snapshot_inr between 1 and 1000000),
  rental_total_inr bigint not null check(rental_total_inr between 1 and 90000000),
  deposit_snapshot_inr integer not null check(deposit_snapshot_inr between 0 and 10000000),
  status text not null default 'requested' check (
    status in ('requested','approved','active','returned','declined','cancelled')
  ),
  request_nonce uuid not null,
  owner_handover_at timestamptz,
  renter_handover_at timestamptz,
  owner_return_at timestamptz,
  renter_return_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (renter_id,request_nonce),
  check (owner_id <> renter_id),
  check (not isempty(booking_period)),
  check (days_count = upper(booking_period) - lower(booking_period)),
  check (rental_total_inr = days_count::bigint * daily_rate_snapshot_inr),
  constraint booked_periods_cannot_overlap
    exclude using gist (rental_id with =, booking_period with &&)
    where (status in ('approved','active'))
);
create index rental_booking_renter_idx on
  public.rental_bookings(renter_id,created_at desc);
create index rental_booking_owner_idx on
  public.rental_bookings(owner_id,created_at desc);
create index rental_booking_rental_idx on
  public.rental_bookings(rental_id,status,created_at desc);

create table public.rental_condition_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.rental_bookings(id),
  author_id uuid not null references public.profiles(id),
  stage text not null check (stage in ('pickup','return','incident')),
  note text not null check (char_length(btrim(note)) between 10 and 1200),
  created_at timestamptz not null default now()
);
create index rental_condition_notes_by_booking_idx on
  public.rental_condition_notes(booking_id,created_at);

create function private.can_view_rental_booking(requested_booking uuid)
returns boolean language sql stable security definer
set search_path=''
as $$
  select exists (
    select 1 from public.rental_bookings b
    join public.rental_listings r on r.id=b.rental_id
    where b.id=requested_booking
      and (select auth.uid()) in (b.owner_id,b.renter_id)
      and private.can_access_campus(r.campus_id)
  );
$$;
revoke all on function private.can_view_rental_booking(uuid) from public,anon,authenticated;
grant execute on function private.can_view_rental_booking(uuid) to authenticated;

alter table public.rental_listings enable row level security;
alter table public.rental_blocks enable row level security;
alter table public.rental_bookings enable row level security;
alter table public.rental_condition_notes enable row level security;

revoke all on public.rental_listings from public,anon,authenticated;
revoke all on public.rental_blocks from public,anon,authenticated;
revoke all on public.rental_bookings from public,anon,authenticated;
revoke all on public.rental_condition_notes from public,anon,authenticated;

grant select on public.rental_listings to authenticated;
grant insert (id,owner_id,campus_id,category_slug,title,description,
  daily_rate_inr,refundable_deposit_inr,min_days,max_days,item_condition)
  on public.rental_listings to authenticated;
grant update(title,description,category_slug,daily_rate_inr,refundable_deposit_inr,
  min_days,max_days,item_condition) on public.rental_listings to authenticated;

create policy rental_listing_verified_read on public.rental_listings
for select to authenticated
using (
  private.can_access_campus(campus_id)
  and (owner_id=(select auth.uid()) or
    (status='active' and exists (select 1 from public.categories c
      where c.slug=category_slug and c.enabled)))
);
create policy rental_listing_approved_owner_create on public.rental_listings
for insert to authenticated
with check (
  owner_id=(select auth.uid()) and private.can_access_campus(campus_id)
  and status='draft' and published_at is null
  and exists(select 1 from public.categories c where c.slug=category_slug and c.enabled)
);
create policy rental_listing_owner_edit on public.rental_listings
for update to authenticated
using (
  owner_id=(select auth.uid()) and private.can_access_campus(campus_id)
  and status in ('draft','active','paused')
)
with check (
  owner_id=(select auth.uid()) and private.can_access_campus(campus_id)
  and status in ('draft','active','paused')
);

grant select on public.rental_blocks to authenticated;
create policy rental_blocks_scope_read on public.rental_blocks
for select to authenticated using (
  exists(select 1 from public.rental_listings r
    where r.id=rental_id and private.can_access_campus(r.campus_id)
    and (r.status='active' or r.owner_id=(select auth.uid())))
);

grant select on public.rental_bookings to authenticated;
create policy rental_bookings_participant_read on public.rental_bookings
for select to authenticated
using (private.can_view_rental_booking(id));

grant select on public.rental_condition_notes to authenticated;
create policy rental_notes_participant_read on public.rental_condition_notes
for select to authenticated
using (private.can_view_rental_booking(booking_id));

-- State transition and date-approval functions are the only client write path.
create function public.change_rental_listing(requested_rental uuid, target_status text)
returns text language plpgsql volatile security definer set search_path=''
as $$
declare
  r public.rental_listings%rowtype;
begin
  select * into r from public.rental_listings where id=requested_rental for update;
  if not found or r.owner_id<>(select auth.uid())
    or not private.can_access_campus(r.campus_id)
  then raise exception 'Not authorized' using errcode='42501'; end if;
  if not (
    (r.status='draft' and target_status in ('active','removed'))
    or (r.status='active' and target_status in ('paused','removed'))
    or (r.status='paused' and target_status in ('active','removed'))
  ) then raise exception 'Invalid transition' using errcode='22023'; end if;
  if target_status='active' and not exists(
    select 1 from public.categories c where c.slug=r.category_slug and c.enabled
  ) then raise exception 'Category unavailable' using errcode='22023'; end if;
  update public.rental_listings set status=target_status,
    published_at=coalesce(published_at,now()) where id=r.id;
  return target_status;
end;
$$;

create function public.request_rental_booking(
  requested_rental uuid,start_date date,return_date date,p_nonce uuid
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  r public.rental_listings%rowtype;
  caller uuid := (select auth.uid());
  duration integer;
  dates daterange;
  previous uuid;
  new_booking uuid;
begin
  if caller is null or requested_rental is null or p_nonce is null
    or start_date is null or return_date is null then
    raise exception 'Invalid request' using errcode='22023';
  end if;
  select * into r from public.rental_listings where id=requested_rental for update;
  if not found or r.status<>'active' or r.owner_id=caller
    or not private.can_access_campus(r.campus_id)
    or not exists(select 1 from public.categories c
      where c.slug=r.category_slug and c.enabled)
  then raise exception 'Rental unavailable' using errcode='42501'; end if;

  select id into previous from public.rental_bookings
    where renter_id=caller and request_nonce=p_nonce;
  if found then return previous; end if;

  duration:=return_date-start_date;
  if start_date<current_date or return_date>current_date+90
    or duration<r.min_days or duration>r.max_days then
    raise exception 'Invalid rental period' using errcode='22023';
  end if;
  dates:=daterange(start_date,return_date,'[)');
  if exists (select 1 from public.rental_blocks b
    where b.rental_id=r.id and b.unavailable_period && dates)
  then raise exception 'Dates unavailable' using errcode='22023'; end if;

  insert into public.rental_bookings(
    rental_id,owner_id,renter_id,booking_period,days_count,
    daily_rate_snapshot_inr,rental_total_inr,deposit_snapshot_inr,request_nonce
  ) values (
    r.id,r.owner_id,caller,dates,duration,r.daily_rate_inr,
    duration::bigint*r.daily_rate_inr,r.refundable_deposit_inr,p_nonce
  ) returning id into new_booking;
  return new_booking;
end;
$$;

create function public.block_rental_period(
  requested_rental uuid,start_date date,return_date date,p_nonce uuid
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  r public.rental_listings%rowtype;
  dates daterange;
  previous uuid;
  result_id uuid;
begin
  select * into r from public.rental_listings where id=requested_rental for update;
  if not found or r.owner_id<>(select auth.uid())
    or not private.can_access_campus(r.campus_id)
    or r.status='removed' or p_nonce is null
    or start_date is null or return_date is null
  then raise exception 'Not authorized' using errcode='42501'; end if;
  select id into previous from public.rental_blocks
   where owner_id=(select auth.uid()) and request_nonce=p_nonce;
  if found then return previous; end if;
  if start_date<current_date or return_date>current_date+180
    or return_date<=start_date then
    raise exception 'Invalid blocked period' using errcode='22023'; end if;
  dates:=daterange(start_date,return_date,'[)');
  if exists (select 1 from public.rental_bookings b
    where b.rental_id=r.id and b.status in ('approved','active')
      and b.booking_period && dates)
  then raise exception 'Confirmed booking overlaps' using errcode='22023'; end if;

  insert into public.rental_blocks(rental_id,owner_id,unavailable_period,request_nonce)
  values(r.id,(select auth.uid()),dates,p_nonce) returning id into result_id;
  return result_id;
end;
$$;

create function public.decide_rental_booking(requested_booking uuid,decision text)
returns text language plpgsql volatile security definer set search_path=''
as $$
declare
  original public.rental_bookings%rowtype;
  b public.rental_bookings%rowtype;
  r public.rental_listings%rowtype;
  caller uuid := (select auth.uid());
  new_status text;
begin
  select * into original from public.rental_bookings where id=requested_booking;
  if not found or caller is null then
    raise exception 'Booking unavailable' using errcode='42501'; end if;
  -- Consistent lock ordering: rental listing then booking (same as requests).
  select * into r from public.rental_listings where id=original.rental_id for update;
  select * into b from public.rental_bookings where id=requested_booking for update;
  if caller not in (b.owner_id,b.renter_id)
    or not private.can_access_campus(r.campus_id) then
    raise exception 'Not authorized' using errcode='42501'; end if;

  if decision='approve' then
    if caller<>b.owner_id or b.status<>'requested' or r.status<>'active'
      or exists(select 1 from public.rental_blocks x where x.rental_id=r.id
        and x.unavailable_period && b.booking_period)
      or exists(select 1 from public.rental_bookings x
        where x.rental_id=r.id and x.id<>b.id and x.status in ('approved','active')
        and x.booking_period && b.booking_period)
    then raise exception 'Approval unavailable' using errcode='22023'; end if;
    new_status:='approved';
    update public.rental_bookings set status=new_status,decided_at=now(),updated_at=now()
      where id=b.id;
  elsif decision='decline' then
    if caller<>b.owner_id or b.status<>'requested' then
      raise exception 'Decline unavailable' using errcode='22023'; end if;
    new_status:='declined';
    update public.rental_bookings set status=new_status,decided_at=now(),updated_at=now()
      where id=b.id;
  elsif decision='cancel' then
    if caller<>b.renter_id or b.status not in ('requested','approved') then
      raise exception 'Cancellation unavailable' using errcode='22023'; end if;
    new_status:='cancelled';
    update public.rental_bookings set status=new_status,updated_at=now()
      where id=b.id;
  elsif decision='confirm_handover' then
    if b.status<>'approved' then
      raise exception 'Handover unavailable' using errcode='22023'; end if;
    update public.rental_bookings
      set owner_handover_at=case when caller=b.owner_id then
          coalesce(owner_handover_at,now()) else owner_handover_at end,
        renter_handover_at=case when caller=b.renter_id then
          coalesce(renter_handover_at,now()) else renter_handover_at end,
        status=case when
          (owner_handover_at is not null or caller=b.owner_id) and
          (renter_handover_at is not null or caller=b.renter_id)
          then 'active' else 'approved' end,
        updated_at=now() where id=b.id returning status into new_status;
  elsif decision='confirm_return' then
    if b.status<>'active' then
      raise exception 'Return confirmation unavailable' using errcode='22023'; end if;
    update public.rental_bookings
      set owner_return_at=case when caller=b.owner_id then
          coalesce(owner_return_at,now()) else owner_return_at end,
        renter_return_at=case when caller=b.renter_id then
          coalesce(renter_return_at,now()) else renter_return_at end,
        status=case when
          (owner_return_at is not null or caller=b.owner_id) and
          (renter_return_at is not null or caller=b.renter_id)
          then 'returned' else 'active' end,
        updated_at=now() where id=b.id returning status into new_status;
  else
    raise exception 'Unknown rental decision' using errcode='22023';
  end if;
  return new_status;
end;
$$;

create function public.add_rental_condition_note(
  requested_booking uuid,stage text,content text
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  b public.rental_bookings%rowtype;
  r public.rental_listings%rowtype;
  result_id uuid;
begin
  select * into b from public.rental_bookings where id=requested_booking;
  if not found or stage not in ('pickup','return','incident')
    or content is null or char_length(btrim(content)) not between 10 and 1200 then
    raise exception 'Invalid note' using errcode='22023'; end if;
  select * into r from public.rental_listings where id=b.rental_id;
  if (select auth.uid()) not in (b.owner_id,b.renter_id)
    or not private.can_access_campus(r.campus_id)
    or b.status not in ('approved','active','returned') then
    raise exception 'Not authorized' using errcode='42501'; end if;
  insert into public.rental_condition_notes(booking_id,author_id,stage,note)
  values(b.id,(select auth.uid()),stage,btrim(content)) returning id into result_id;
  return result_id;
end;
$$;

-- These functions are in the exposed schema; execute permission is narrowed
-- and every call verifies the current auth identity/ownership within SQL.
revoke all on function public.change_rental_listing(uuid,text)
  from public,anon,authenticated;
revoke all on function public.request_rental_booking(uuid,date,date,uuid)
  from public,anon,authenticated;
revoke all on function public.block_rental_period(uuid,date,date,uuid)
  from public,anon,authenticated;
revoke all on function public.decide_rental_booking(uuid,text)
  from public,anon,authenticated;
revoke all on function public.add_rental_condition_note(uuid,text,text)
  from public,anon,authenticated;
grant execute on function public.change_rental_listing(uuid,text) to authenticated;
grant execute on function public.request_rental_booking(uuid,date,date,uuid) to authenticated;
grant execute on function public.block_rental_period(uuid,date,date,uuid) to authenticated;
grant execute on function public.decide_rental_booking(uuid,text) to authenticated;
grant execute on function public.add_rental_condition_note(uuid,text,text) to authenticated;

commit;
