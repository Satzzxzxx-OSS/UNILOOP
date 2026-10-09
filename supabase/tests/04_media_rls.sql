-- Disposable PG integration tests for private photo upload and publish gate.
\set ON_ERROR_STOP on

insert into auth.users(id,email) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','seller@example.test'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','buyer@example.test'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','unauthorized@example.test');
insert into public.campuses(id,name) values
('11111111-1111-4111-8111-111111111111','Enabled area'),
('22222222-2222-4222-8222-222222222222','Disabled area');
insert into private.enabled_campuses(campus_id, enabled) values
('11111111-1111-4111-8111-111111111111',true),
('22222222-2222-4222-8222-222222222222',false);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','verified',now());

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.listings (
 id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition
) values (
 '11111111-aaaa-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'books-study','Rare original textbook',
 'A real, used original textbook in readable condition.',650,'good'
);

do $$
begin
 begin
  perform public.transition_sale_listing(
    '11111111-aaaa-4111-8111-111111111111','active');
  raise exception 'Published listing without a registered photo';
 exception when check_violation then null;
 end;
end $$;

insert into storage.objects (bucket_id,name,owner_id) values
 ('listing-media',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.listing_photos(listing_id,storage_path,position) values (
 '11111111-aaaa-4111-8111-111111111111',
 '11111111-aaaa-4111-8111-111111111111/22222222-aaaa-4222-8222-222222222222.jpg',
 1
);

do $$
begin
 if (select count(*) from public.listing_photos) <> 1 then
  raise exception 'Owner failed to register photo';
 end if;
end $$;

select public.transition_sale_listing(
 '11111111-aaaa-4111-8111-111111111111','active'
);
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 if (select count(*) from public.listing_photos) <> 1 then
   raise exception 'Verified member cannot view published photo';
 end if;
 if (select count(*) from storage.objects) <> 1 then
   raise exception 'Verified member cannot view published object';
 end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists (select 1 from public.listing_photos) then
   raise exception 'Other campus member can see photo metadata';
 end if;
 if exists (select 1 from storage.objects) then
   raise exception 'Other campus member can read object';
 end if;
end $$;
rollback;

-- Invalid file path cannot bypass helper's UUID cast check.
do $$
begin
 if private.photo_listing_id('../path-escape.png') is not null then
  raise exception 'Invalid path accepted';
 end if;
end $$;

do $$
begin
 if has_table_privilege('anon','public.listing_photos','SELECT') then
   raise exception 'Anonymous can see listing photos';
 end if;
 if has_table_privilege('authenticated','public.listing_photos','DELETE') then
   raise exception 'Client can delete registered photo metadata';
 end if;
end $$;

select 'listing media RLS and publish gate: passed' as result;
