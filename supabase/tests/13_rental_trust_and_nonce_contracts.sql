-- Disposable full-chain test: counterparty trust and exact retry payloads.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','rental-owner@example.test'),
 ('bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb','rental-renter@example.test');
insert into public.campuses(id,name) values
 ('cccccccc-3333-4333-8333-cccccccccccc','Rental trust regression campus');
insert into private.enabled_campuses(campus_id,enabled) values
 ('cccccccc-3333-4333-8333-cccccccccccc',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at)
select id,'cccccccc-3333-4333-8333-cccccccccccc','verified',now()
from public.profiles where id in (
 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb');
insert into public.categories(slug,label) values('rental-regression','Rental regression');
insert into public.rental_listings(id,owner_id,campus_id,category_slug,title,description,
 daily_rate_inr,item_condition) values
 ('dddddddd-3333-4333-8333-dddddddddddd','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',
 'cccccccc-3333-4333-8333-cccccccccccc','rental-regression','Camera for trust regression',
 'A real description long enough for rental authorization testing.',100,'good'),
 ('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',
 'cccccccc-3333-4333-8333-cccccccccccc','rental-regression','Second regression camera',
 'A real description long enough for rental authorization testing.',100,'good');
insert into storage.objects(bucket_id,name,owner_id)
select 'rental-media',id::text||'/ffffffff-3333-4333-8333-ffffffffffff.jpg',owner_id::text
from public.rental_listings where category_slug='rental-regression';
insert into public.rental_photos(rental_id,storage_path,position)
select id,id::text||'/ffffffff-3333-4333-8333-ffffffffffff.jpg',1
from public.rental_listings where category_slug='rental-regression';
update public.rental_listings set status='active',published_at=now()
where category_slug='rental-regression';

set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb',true);
do $$
declare first_id uuid;retry_id uuid;
begin
 first_id:=public.request_rental_booking('dddddddd-3333-4333-8333-dddddddddddd',
  current_date+10,current_date+12,'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa');
 retry_id:=public.request_rental_booking('dddddddd-3333-4333-8333-dddddddddddd',
  current_date+10,current_date+12,'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa');
 if first_id<>retry_id then raise exception 'Same request was duplicated'; end if;
 begin
  perform public.request_rental_booking('dddddddd-3333-4333-8333-dddddddddddd',
   current_date+11,current_date+13,'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa');
  raise exception 'Changed dates reused an existing request nonce';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.request_rental_booking('eeeeeeee-3333-4333-8333-eeeeeeeeeeee',
   current_date+10,current_date+12,'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa');
  raise exception 'Different rental reused an existing request nonce';
 exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claim.sub','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',true);
do $$
declare first_id uuid;
begin
 first_id:=public.block_rental_period('dddddddd-3333-4333-8333-dddddddddddd',
  current_date+20,current_date+22,'bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb');
 if first_id<>public.block_rental_period('dddddddd-3333-4333-8333-dddddddddddd',
  current_date+20,current_date+22,'bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb') then
  raise exception 'Same blocked period was duplicated'; end if;
 begin
  perform public.block_rental_period('dddddddd-3333-4333-8333-dddddddddddd',
   current_date+21,current_date+23,'bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb');
  raise exception 'Changed block payload reused a nonce';
 exception when invalid_parameter_value then null; end;
end $$;

reset role;
update public.profiles set account_status='suspended'
where id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb',true);
do $$
begin
 begin
  perform public.request_rental_booking('dddddddd-3333-4333-8333-dddddddddddd',
   current_date+30,current_date+32,'cccccccc-4444-4444-8444-cccccccccccc');
  raise exception 'Suspended owner received a new rental request';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set account_status='active'
where id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
update public.campus_memberships set status='revoked',verified_at=null
where user_id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
set local role authenticated;
do $$
begin
 begin
  perform public.request_rental_booking('dddddddd-3333-4333-8333-dddddddddddd',
   current_date+30,current_date+32,'cccccccc-4444-4444-8444-cccccccccccc');
  raise exception 'Revoked owner received a new rental request';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.campus_memberships set status='verified',verified_at=now()
where user_id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
insert into public.user_blocks(blocker_id,blocked_id) values
 ('aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb');
set local role authenticated;
do $$
begin
 begin
  perform public.request_rental_booking('dddddddd-3333-4333-8333-dddddddddddd',
   current_date+30,current_date+32,'cccccccc-4444-4444-8444-cccccccccccc');
  raise exception 'Blocked counterparty received a new rental request';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',true);
do $$
declare booking uuid;
begin
 select id into booking from public.rental_bookings
 where request_nonce='aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
 begin
  perform public.decide_rental_booking(booking,'approve');
  raise exception 'Blocked counterparties approved a booking';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.user_blocks where blocker_id='aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa';
update public.profiles set account_status='suspended'
where id='bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb';
set local role authenticated;
do $$
declare booking uuid;
begin
 select id into booking from public.rental_bookings
 where request_nonce='aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
 begin
  perform public.decide_rental_booking(booking,'approve');
  raise exception 'Owner approved a suspended renter';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set account_status='active'
where id='bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb';
set local role authenticated;
do $$
declare booking uuid;
begin
 select id into booking from public.rental_bookings
 where request_nonce='aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
 if public.decide_rental_booking(booking,'approve')<>'approved' then
  raise exception 'Eligible booking approval failed'; end if;
 if public.decide_rental_booking(booking,'confirm_handover')<>'approved' then
  raise exception 'One-sided handover became active'; end if;
 perform set_config('request.jwt.claim.sub','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb',true);
 if public.decide_rental_booking(booking,'confirm_handover')<>'active' then
  raise exception 'Eligible dual handover failed'; end if;
end $$;
reset role;
insert into public.user_blocks(blocker_id,blocked_id) values
 ('aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb');
set local role authenticated;
do $$
declare booking uuid;
begin
 select id into booking from public.rental_bookings
 where request_nonce='aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
 if public.decide_rental_booking(booking,'confirm_return')<>'active' then
  raise exception 'One-sided return closed the booking'; end if;
 perform set_config('request.jwt.claim.sub','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',true);
 if public.decide_rental_booking(booking,'confirm_return')<>'returned' then
  raise exception 'Contact block stranded an existing return'; end if;
end $$;
rollback;
select 'rental trust and nonce contracts: passed' as result;
