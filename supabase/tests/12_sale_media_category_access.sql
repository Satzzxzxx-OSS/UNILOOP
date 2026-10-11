-- Disposable full-chain regression: media access follows category visibility.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','media-owner@example.test'),
 ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','media-viewer@example.test');
insert into public.campuses(id,name) values
 ('cccccccc-1111-4111-8111-cccccccccccc','Media regression campus');
insert into private.enabled_campuses(campus_id,enabled) values
 ('cccccccc-1111-4111-8111-cccccccccccc',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at)
select id,'cccccccc-1111-4111-8111-cccccccccccc','verified',now()
from public.profiles where id in (
 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb');
insert into public.categories(slug,label) values('media-regression','Media regression');
insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values('dddddddd-1111-4111-8111-dddddddddddd','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
 'cccccccc-1111-4111-8111-cccccccccccc','media-regression','A media regression item',
 'A description long enough for the media authorization regression.',100,'good');
insert into storage.objects(bucket_id,name,owner_id) values('listing-media',
 'dddddddd-1111-4111-8111-dddddddddddd/eeeeeeee-1111-4111-8111-eeeeeeeeeeee.jpg',
 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values(
 'dddddddd-1111-4111-8111-dddddddddddd',
 'dddddddd-1111-4111-8111-dddddddddddd/eeeeeeee-1111-4111-8111-eeeeeeeeeeee.jpg',1);
update public.listings set status='active',published_at=now()
where id='dddddddd-1111-4111-8111-dddddddddddd';

set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb',true);
do $$
begin
 if not exists(select 1 from public.listing_photos
   where listing_id='dddddddd-1111-4111-8111-dddddddddddd') then
   raise exception 'Enabled category photo incorrectly denied';
 end if;
end $$;

reset role;
update public.categories set enabled=false where slug='media-regression';
set local role authenticated;
do $$
begin
 if exists(select 1 from public.listings where id='dddddddd-1111-4111-8111-dddddddddddd')
  or exists(select 1 from public.listing_photos where listing_id='dddddddd-1111-4111-8111-dddddddddddd')
  or exists(select 1 from storage.objects where name=
   'dddddddd-1111-4111-8111-dddddddddddd/eeeeeeee-1111-4111-8111-eeeeeeeeeeee.jpg') then
   raise exception 'Disabled-category sale media leaked to another member';
 end if;
end $$;

select set_config('request.jwt.claim.sub','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',true);
do $$
begin
 if not exists(select 1 from public.listing_photos
    where listing_id='dddddddd-1111-4111-8111-dddddddddddd')
   or not exists(select 1 from storage.objects where name=
    'dddddddd-1111-4111-8111-dddddddddddd/eeeeeeee-1111-4111-8111-eeeeeeeeeeee.jpg') then
   raise exception 'Eligible owner lost access to their own disabled-category media';
 end if;
end $$;
rollback;
select 'sale media category authorization: passed' as result;
