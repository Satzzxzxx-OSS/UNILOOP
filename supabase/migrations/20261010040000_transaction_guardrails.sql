-- Cross-domain transactional consistency rules.
-- Added after sale_transactions and notification modules.
-- 1. Accepted sale offer cannot be self-marked as completed/sold;
--    the verified two-sided exchange path alone can close it.
-- 2. Do not accept a new rental request when approved/active inventory
--    already occupies the requested dates.
begin;

create function private.prevent_premature_sold_status()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.status='sold' and old.status is distinct from 'sold'
    and exists (
      select 1 from public.sale_offers o
      where o.listing_id=new.id and o.status='accepted'
    )
    and not exists (
      select 1 from public.sale_transactions t
      where t.listing_id=new.id and t.status='completed'
    )
  then
    raise exception 'Accepted offer requires confirmed handover before sold'
      using errcode='23514';
  end if;
  return new;
end;
$$;

create trigger prevent_accepted_offer_early_sold
before update of status on public.listings
for each row execute function private.prevent_premature_sold_status();

create function private.prevent_unavailable_rental_request()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.status='requested' and (
    exists(
      select 1 from public.rental_blocks b
      where b.rental_id=new.rental_id and
        b.unavailable_period && new.booking_period
    )
    or exists(
      select 1 from public.rental_bookings occupied
      where occupied.rental_id=new.rental_id
        and occupied.status in ('approved','active')
        and occupied.booking_period && new.booking_period
    )
  ) then
    raise exception 'Rental dates are already unavailable' using errcode='23514';
  end if;
  return new;
end;
$$;

create trigger prevent_rental_request_on_booked_days
before insert on public.rental_bookings
for each row execute function private.prevent_unavailable_rental_request();

-- The actual confirmed inventory double-booking safety invariant remains
-- the DB EXCLUDE constraint in the rental migration. This trigger is a
-- friendlier early request rejection, not a substitute for exclusion.
commit;
