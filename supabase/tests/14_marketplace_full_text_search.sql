-- Disposable full-chain test: generated FTS remains inside marketplace RLS.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa','search-owner@example.test'),
 ('bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb','search-member@example.test'),
 ('cccccccc-5555-4555-8555-cccccccccccc','search-other-campus@example.test');
insert into public.campuses(id,name) values
 ('dddddddd-5555-4555-8555-dddddddddddd','Search campus one'),
 ('eeeeeeee-5555-4555-8555-eeeeeeeeeeee','Search campus two');
insert into private.enabled_campuses(campus_id,enabled) values
 ('dddddddd-5555-4555-8555-dddddddddddd',true),
 ('eeeeeeee-5555-4555-8555-eeeeeeeeeeee',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa','dddddddd-5555-4555-8555-dddddddddddd','verified',now()),
 ('bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb','dddddddd-5555-4555-8555-dddddddddddd','verified',now()),
 ('cccccccc-5555-4555-8555-cccccccccccc','eeeeeeee-5555-4555-8555-eeeeeeeeeeee','verified',now());
insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values('aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa','aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa',
 'dddddddd-5555-4555-8555-dddddddddddd','books-study','Astronomy study textbook',
 'Original study notes explaining the nebula with useful illustrations.',100,'good');
insert into public.rental_listings(id,owner_id,campus_id,category_slug,title,description,daily_rate_inr,item_condition)
values('bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb','aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa',
 'dddddddd-5555-4555-8555-dddddddddddd','books-study','Telescope observing guide',
 'Original observing notes explaining the nebula with useful illustrations.',100,'good');
insert into storage.objects(bucket_id,name,owner_id) values
 ('listing-media','aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa/cccccccc-6666-4666-8666-cccccccccccc.jpg','aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa'),
 ('rental-media','bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb/cccccccc-6666-4666-8666-cccccccccccc.jpg','aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values
 ('aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa','aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa/cccccccc-6666-4666-8666-cccccccccccc.jpg',1);
insert into public.rental_photos(rental_id,storage_path,position) values
 ('bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb','bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb/cccccccc-6666-4666-8666-cccccccccccc.jpg',1);
update public.listings set status='active',published_at=now()
where id='aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa';
update public.rental_listings set status='active',published_at=now()
where id='bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb';

set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb',true);
do $$
begin
 if (select count(*) from public.listings
   where search_document @@ plainto_tsquery('simple','NEBULA'))<>1
  or (select count(*) from public.rental_listings
   where search_document @@ plainto_tsquery('simple','nebula'))<>1 then
  raise exception 'Description search failed for an eligible member'; end if;
 if exists(select 1 from public.listings
   where search_document @@ plainto_tsquery('simple','nebula | secret')) then
  raise exception 'Plain query unexpectedly accepted OR operators'; end if;
end $$;

select set_config('request.jwt.claim.sub','cccccccc-5555-4555-8555-cccccccccccc',true);
do $$
begin
 if exists(select 1 from public.listings
    where search_document @@ plainto_tsquery('simple','nebula'))
   or exists(select 1 from public.rental_listings
    where search_document @@ plainto_tsquery('simple','nebula')) then
  raise exception 'FTS bypassed campus isolation'; end if;
end $$;
reset role;
update public.listings set description='Updated notes about aurora observing and useful illustrations.'
where id='aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa';
update public.rental_listings set description='Updated notes about aurora observing and useful illustrations.'
where id='bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb';
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb',true);
do $$
begin
 if exists(select 1 from public.listings where search_document @@ plainto_tsquery('simple','nebula'))
  or exists(select 1 from public.rental_listings where search_document @@ plainto_tsquery('simple','nebula'))
  or not exists(select 1 from public.listings where search_document @@ plainto_tsquery('simple','aurora'))
  or not exists(select 1 from public.rental_listings where search_document @@ plainto_tsquery('simple','aurora')) then
  raise exception 'Generated search documents did not track content updates'; end if;
end $$;
reset role;
do $$
begin
 if (select count(*) from pg_indexes where schemaname='public'
   and indexname in ('listings_search_document_idx','rental_listings_search_document_idx')
   and indexdef like '%USING gin (search_document)%')<>2 then
  raise exception 'FTS GIN indexes are missing'; end if;
end $$;
rollback;
select 'marketplace full-text search: passed' as result;
