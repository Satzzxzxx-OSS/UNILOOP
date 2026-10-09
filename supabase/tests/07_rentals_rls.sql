-- Booking overlap, permission, lifecycle, dates and two-sided handover.
-- Fresh/disposable PG database only.
\set ON_ERROR_STOP on
insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','rental-owner@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','renter-a@example.test'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','renter-b@example.test'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','unverified@example.test');
insert into public.campuses(id,name) values
 ('11111111-1111-4111-8111-111111111111','Approved place');
insert into private.enabled_campuses(campus_id,enabled) values
 ('11111111-1111-4111-8111-111111111111',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','verified',now()),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111','pending',null);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.rental_listings(
 id,owner_id,campus_id,category_slug,title,description,daily_rate_inr,
 refundable_deposit_inr,min_days,max_days,item_condition
) values(
 '11111111-aaaa-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'cameras-creative','Mirrorless camera kit','Working camera with two lenses, charger and carrying case.',
 250,500,1,10,'good'
);
do $$
begin
 if has_column_privilege('authenticated','public.rental_listings','status','UPDATE') then
  raise exception 'Client controls rental status';
 end if;
 if has_table_privilege('authenticated','public.rental_bookings','INSERT') then
  raise exception 'Client can insert unverified bookings';
 end if;
end $$;
select public.change_rental_listing(
 '11111111-aaaa-4111-8111-111111111111','active');
commit;

-- No public/unapproved access.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
do $$
begin
 if exists(select 1 from public.rental_listings) then
   raise exception 'Unverified member read active rental';
 end if;
 begin
   perform public.request_rental_booking(
     '11111111-aaaa-4111-8111-111111111111',
     current_date+5,current_date+8,
     '99999999-9999-4999-8999-999999999999');
   raise exception 'Unverified member created request';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;

-- Owner blocks a future date, and no one can book it.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.block_rental_period(
 '11111111-aaaa-4111-8111-111111111111',
 current_date+30,current_date+35,
 '88888888-8888-4888-8888-888888888888');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 begin
   perform public.request_rental_booking(
     '11111111-aaaa-4111-8111-111111111111',
     current_date+31,current_date+34,
     '77777777-7777-4777-8777-777777777777');
   raise exception 'Blocked date was booked';
 exception when invalid_parameter_value then null;
 end;
end $$;
rollback;

-- Both renters can request same dates, only ONE booking may be approved.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare first_id uuid; again_id uuid;
begin
 first_id:=public.request_rental_booking('11111111-aaaa-4111-8111-111111111111',
   current_date+5,current_date+8,'66666666-6666-4666-8666-666666666666');
 again_id:=public.request_rental_booking('11111111-aaaa-4111-8111-111111111111',
   current_date+5,current_date+8,'66666666-6666-4666-8666-666666666666');
 if first_id<>again_id then raise exception 'Retry produced duplicate booking'; end if;
 if (select rental_total_inr from public.rental_bookings where id=first_id)<>750 then
  raise exception 'Booking estimate must be three days x daily rate';
 end if;
 if (select deposit_snapshot_inr from public.rental_bookings where id=first_id)<>500 then
  raise exception 'Snapshot deposit incorrect';
 end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
select public.request_rental_booking(
 '11111111-aaaa-4111-8111-111111111111',
 current_date+6,current_date+9,'55555555-5555-4555-8555-555555555555');
do $$
begin
 if (select count(*) from public.rental_bookings)<>1 then
   raise exception 'Other renter sees private booking';
 end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare target uuid; conflicting uuid;
begin
 select id into target from public.rental_bookings
  where renter_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 select id into conflicting from public.rental_bookings
  where renter_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 if public.decide_rental_booking(target,'approve')<>'approved' then
   raise exception 'First approval failed';
 end if;
 begin
   perform public.decide_rental_booking(conflicting,'approve');
   raise exception 'Conflicting booking was approved';
 exception when invalid_parameter_value then null;
 end;
 begin
   perform public.block_rental_period(
     '11111111-aaaa-4111-8111-111111111111',
     current_date+6,current_date+7,
     '44444444-4444-4444-8444-444444444444');
   raise exception 'Owner blocked an approved reservation';
 exception when invalid_parameter_value then null;
 end;
end $$;
commit;

-- Neither renter can self-approve or impersonate the owner.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
declare target uuid;
begin
 select id into target from public.rental_bookings
  where renter_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 begin
   perform public.decide_rental_booking(target,'approve');
   raise exception 'Renter self-approved';
 exception when invalid_parameter_value then null;
 end;
end $$;
rollback;

-- Both sides confirm pickup, then both sides confirm return.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare target uuid;
begin
 select id into target from public.rental_bookings
  where renter_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 if public.decide_rental_booking(target,'confirm_handover')<>'approved' then
  raise exception 'Single-sided handover was marked active';
 end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare target uuid;
begin
 select id into target from public.rental_bookings
  where renter_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 if public.decide_rental_booking(target,'confirm_handover')<>'active' then
  raise exception 'Two-sided pickup was not activated';
 end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare target uuid;
begin
 select id into target from public.rental_bookings
  where renter_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 perform public.add_rental_condition_note(target,'return',
  'Camera is working, and there are no new visible scratches.');
 if public.decide_rental_booking(target,'confirm_return')<>'active' then
  raise exception 'One-sided return prematurely closed booking';
 end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare target uuid;
begin
 select id into target from public.rental_bookings
  where renter_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 if public.decide_rental_booking(target,'confirm_return')<>'returned' then
  raise exception 'Two-sided return not closed';
 end if;
end $$;
commit;

-- A third party cannot inspect someone else's condition records.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists(select 1 from public.rental_condition_notes) then
   raise exception 'Rental inspection leaked to another renter';
 end if;
end $$;
rollback;

-- Unreviewed direct client modifications remain forbidden.
do $$
begin
 if has_table_privilege('anon','public.rental_bookings','SELECT') then
   raise exception 'Anonymous can read bookings';
 end if;
 if has_table_privilege('authenticated','public.rental_bookings','UPDATE') then
   raise exception 'Client can self-confirm or rewrite booking';
 end if;
 if has_table_privilege('authenticated','public.rental_blocks','INSERT') then
   raise exception 'Client can skip conflict check by creating blocks';
 end if;
end $$;
select 'rental lifecycle & date exclusion: passed' as result;
