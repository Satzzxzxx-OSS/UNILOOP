-- Trust & saved-items regression tests on isolated PostgreSQL 16.
\set ON_ERROR_STOP on
insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','buyer@example.test'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','outsider@example.test'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','moderator@example.test');

insert into public.campuses(id,name) values
 ('11111111-1111-4111-8111-111111111111','Approved location'),
 ('22222222-2222-4222-8222-222222222222','Other location');
insert into private.enabled_campuses(campus_id,enabled) values
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',false);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','verified',now()),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111','verified',now());
insert into private.staff_roles(user_id,role) values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','moderator');

insert into public.listings
 (id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition,status,published_at)
values
 ('11111111-aaaa-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'books-study','A real learning textbook',
 'A real textbook with long description provided here.',600,'good','active',now());

-- Buyer can save and report valid listing, cannot edit privileged fields.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
insert into public.favorites(user_id,listing_id) values (
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-aaaa-4111-8111-111111111111');
insert into public.notification_preferences(user_id,email_messages,email_offers)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,false);
insert into public.listing_reports(reporter_id,listing_id,reason,details)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
'11111111-aaaa-4111-8111-111111111111','misleading','The listing description does not match the item.');
do $$
begin
 if (select count(*) from public.favorites) <> 1 then
   raise exception 'Saved item did not persist';
 end if;
 if (select email_offers from public.notification_preferences) then
   raise exception 'Own preferences not readable';
 end if;
 if (select count(*) from public.listing_reports) <> 1 then
   raise exception 'Own report not readable';
 end if;
 if has_table_privilege('authenticated','public.listing_reports','UPDATE') then
   raise exception 'Client can resolve report without staff RPC';
 end if;
 if has_table_privilege('authenticated','private.staff_roles','SELECT') then
   raise exception 'Client can read private staff roles';
 end if;
 begin
   perform count(*) from public.get_open_listing_reports();
   raise exception 'Buyer obtained private moderation queue';
 exception when insufficient_privilege then null;
 end;
end $$;
commit;

-- Seller cannot save/report own item, even if passing another user ID.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
begin
 begin
  insert into public.favorites(user_id,listing_id) values
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-aaaa-4111-8111-111111111111');
  raise exception 'Owner saved own listing';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.listing_reports(reporter_id,listing_id,reason,details) values
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-aaaa-4111-8111-111111111111',
    'fraud','A long complaint with no legitimate subject.');
  raise exception 'Owner reported own listing';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;

-- Cross-campus account must not enumerate another user's activity.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists(select 1 from public.favorites)
    or exists(select 1 from public.notification_preferences)
    or exists(select 1 from public.listing_reports) then
    raise exception 'Private owner data leaked cross-campus';
 end if;
 begin
  insert into public.favorites(user_id,listing_id) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-aaaa-4111-8111-111111111111');
  raise exception 'Cross-campus favorite permitted';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;

-- Staff has narrow controlled read/resolve access with immutable audit log.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
do $$
declare
  target uuid;
begin
 if (select count(*) from public.get_open_listing_reports()) <> 1 then
   raise exception 'Moderator queue incorrect';
 end if;
 select report_id into target from public.get_open_listing_reports() limit 1;
 if public.review_listing_report(target,'remove_listing') <> 'remove_listing' then
   raise exception 'Moderator did not resolve case';
 end if;
 begin
   perform public.review_listing_report(target,'remove_listing');
   raise exception 'Closed report re-review accepted';
 exception when invalid_parameter_value then null;
 end;
end $$;
commit;

do $$
begin
 if (select count(*) from private.moderation_audit) <> 1 then
  raise exception 'Moderation audit log missing';
 end if;
 if (select status from public.listings where id =
  '11111111-aaaa-4111-8111-111111111111') <> 'removed' then
  raise exception 'Reported item not removed';
 end if;
end $$;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 if exists(select 1 from public.favorites) then
   raise exception 'Removed listing still appears in saved feed';
 end if;
 if (select status from public.listing_reports limit 1) <> 'resolved' then
   raise exception 'Reporter cannot see own report result';
 end if;
end $$;
rollback;

select 'saved and trust RLS: passed' as result;
