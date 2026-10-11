-- Rental trust and idempotency contracts; preserve existing row locks,
-- exclusion constraints, pricing snapshots and return/cancellation workflows.
begin;

create or replace function public.request_rental_booking(
  requested_rental uuid,start_date date,return_date date,p_nonce uuid
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  r public.rental_listings%rowtype;
  caller uuid := (select auth.uid());
  duration integer;
  dates daterange;
  previous public.rental_bookings%rowtype;
  new_booking uuid;
begin
  if caller is null or requested_rental is null or p_nonce is null
    or start_date is null or return_date is null then
    raise exception 'Invalid request' using errcode='22023';
  end if;
  select * into r from public.rental_listings where id=requested_rental for update;
  if not found or r.status<>'active' or r.owner_id=caller
    or not private.can_access_campus(r.campus_id)
    or not private.sale_counterparty_eligible(r.owner_id,r.campus_id)
    or private.sale_participants_blocked(caller,r.owner_id)
    or not exists(select 1 from public.categories c
      where c.slug=r.category_slug and c.enabled)
  then raise exception 'Rental unavailable' using errcode='42501'; end if;

  select * into previous from public.rental_bookings
    where renter_id=caller and request_nonce=p_nonce;
  if found then
    if previous.rental_id<>r.id or lower(previous.booking_period)<>start_date
      or upper(previous.booking_period)<>return_date then
      raise exception 'Request nonce belongs to another rental payload' using errcode='22023';
    end if;
    return previous.id;
  end if;

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

create or replace function public.block_rental_period(
  requested_rental uuid,start_date date,return_date date,p_nonce uuid
)
returns uuid language plpgsql volatile security definer set search_path=''
as $$
declare
  r public.rental_listings%rowtype;
  dates daterange;
  previous public.rental_blocks%rowtype;
  result_id uuid;
begin
  select * into r from public.rental_listings where id=requested_rental for update;
  if not found or r.owner_id<>(select auth.uid())
    or not private.can_access_campus(r.campus_id)
    or r.status='removed' or p_nonce is null
    or start_date is null or return_date is null
  then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into previous from public.rental_blocks
   where owner_id=(select auth.uid()) and request_nonce=p_nonce;
  if found then
    if previous.rental_id<>r.id or lower(previous.unavailable_period)<>start_date
      or upper(previous.unavailable_period)<>return_date then
      raise exception 'Request nonce belongs to another blocked-date payload' using errcode='22023';
    end if;
    return previous.id;
  end if;
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

create or replace function public.decide_rental_booking(requested_booking uuid,decision text)
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

  -- New commitments/pickup require both participants to remain eligible.
  -- Keep decline/cancellation/return available to an eligible caller so that
  -- revocation or a contact block cannot strand existing exchange records.
  if decision in ('approve','confirm_handover') and (
    not private.sale_counterparty_eligible(
      case when caller=b.owner_id then b.renter_id else b.owner_id end,r.campus_id)
    or private.sale_participants_blocked(b.owner_id,b.renter_id)
  ) then raise exception 'Counterparty unavailable' using errcode='42501'; end if;

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

commit;
