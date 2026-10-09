-- Full migration-chain and private in-app notification tests.
\set ON_ERROR_STOP on
insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','buyer@example.test'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','other@example.test');
insert into public.campuses(id,name) values
 ('11111111-1111-4111-8111-111111111111','Approved location');
insert into private.enabled_campuses(campus_id,enabled) values
 ('11111111-1111-4111-8111-111111111111',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','verified',now());
insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values ('11111111-aaaa-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',
 'books-study','A practical textbook',
 'Useful and readable book with original pages intact.',450,'good');
insert into storage.objects(bucket_id,name,owner_id) values(
 'listing-media',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values
 ('11111111-aaaa-4111-8111-111111111111',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',1);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.transition_sale_listing('11111111-aaaa-4111-8111-111111111111','active');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare thread_id uuid;message_id uuid;retry_id uuid;
begin
 thread_id:=public.open_sale_conversation('11111111-aaaa-4111-8111-111111111111');
 message_id:=public.send_sale_message(thread_id,'Is the item available?',
  '66666666-6666-4666-8666-666666666666');
 retry_id:=public.send_sale_message(thread_id,'Is the item available?',
  '66666666-6666-4666-8666-666666666666');
 if message_id<>retry_id then raise exception 'Message retry not idempotent'; end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
begin
 if (select count(*) from public.notifications where category='message')<>1 then
  raise exception 'Message generated missing/duplicate notifications';
 end if;
 update public.notifications set read_at=now() where category='message';
 if (select count(*) from public.notifications where read_at is null)<>0 then
  raise exception 'Own read state was not stored';
 end if;
 if has_column_privilege('authenticated','public.notifications','user_id','UPDATE') then
   raise exception 'Recipient can reassign notifications';
 end if;
end $$;
commit;

-- Third user cannot read or fabricate notifications.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists(select 1 from public.notifications) then
   raise exception 'Notification leaked to uninvolved user';
 end if;
 if has_table_privilege('authenticated','public.notifications','INSERT') then
   raise exception 'Client can forge event notifications';
 end if;
end $$;
rollback;

-- The same migration chain also contains rental events with private recipients.
insert into public.rental_listings(
 id,owner_id,campus_id,category_slug,title,description,
 daily_rate_inr,refundable_deposit_inr,min_days,max_days,item_condition
) values (
 '33333333-aaaa-4333-8333-333333333333',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'cameras-creative','A working camera kit',
 'Camera, bag and charger with known good condition.',250,0,1,10,'good');
insert into storage.objects(bucket_id,name,owner_id) values(
 'rental-media',
 '33333333-aaaa-4333-8333-333333333333/44444444-aaaa-4444-8444-444444444444.jpg',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.rental_photos(rental_id,storage_path,position) values (
 '33333333-aaaa-4333-8333-333333333333',
 '33333333-aaaa-4333-8333-333333333333/44444444-aaaa-4444-8444-444444444444.jpg',1);

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.change_rental_listing('33333333-aaaa-4333-8333-333333333333','active');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select public.request_rental_booking(
 '33333333-aaaa-4333-8333-333333333333',
 current_date+5,current_date+7,'55555555-5555-4555-8555-555555555555');
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare booking uuid;
begin
 if (select count(*) from public.notifications where category='rental')<>1 then
  raise exception 'Rental request notification missing';
 end if;
 select id into booking from public.rental_bookings limit 1;
 perform public.decide_rental_booking(booking,'approve');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 if (select count(*) from public.notifications where category='rental')<>1 then
   raise exception 'Buyer did not receive approval notification';
 end if;
end $$;
rollback;

select 'private notifications and full migration chain: passed' as result;
