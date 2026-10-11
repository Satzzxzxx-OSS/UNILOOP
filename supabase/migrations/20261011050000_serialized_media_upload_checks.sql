-- Keep existing Storage policies/path contracts, serialize each parent's limit.
-- No Storage schema/table/metadata mutation or trigger is introduced.
begin;
-- Earlier migrations intentionally do not overwrite pre-existing bucket settings.
-- Refuse an incompatible existing bucket instead of silently leaving it public
-- or changing its configuration without a staging review.
do $$
begin
 if (select count(*) from storage.buckets where id in ('listing-media','rental-media')
  and public=false and file_size_limit=5242880
  and allowed_mime_types @> array['image/jpeg','image/png','image/webp']::text[]
  and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']::text[])<>2 then
  raise exception 'Marketplace Storage bucket settings require operator review' using errcode='55000';
 end if;
end;
$$;
create or replace function private.can_upload_listing_photo(photo_path text)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare item public.listings%rowtype;
begin
 -- A fresh post-lock count is required; fail closed under a fixed transaction
 -- snapshot rather than allow concurrent uploads to exceed the object cap.
 if current_setting('transaction_isolation')<>'read committed' then return false; end if;
 select * into item from public.listings l
 where l.id=private.photo_listing_id(photo_path)
  and l.owner_id=auth.uid() and private.can_access_campus(l.campus_id)
  and l.status in ('draft','paused') for update;
 if not found then return false; end if;
 return (select count(*) from storage.objects o where o.bucket_id='listing-media'
  and o.name like item.id::text||'/%')<5;
end;
$$;
create or replace function private.can_upload_rental_photo(path text)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare item public.rental_listings%rowtype;
begin
 if current_setting('transaction_isolation')<>'read committed' then return false; end if;
 select * into item from public.rental_listings r
 where r.id=private.rental_photo_parent_id(path)
  and r.owner_id=auth.uid() and private.can_access_campus(r.campus_id)
  and r.status in ('draft','paused') for update;
 if not found then return false; end if;
 return (select count(*) from storage.objects o where o.bucket_id='rental-media'
  and o.name like item.id::text||'/%')<5;
end;
$$;
revoke all on function private.can_upload_listing_photo(text) from public,anon,authenticated;
revoke all on function private.can_upload_rental_photo(text) from public,anon,authenticated;
grant execute on function private.can_upload_listing_photo(text) to authenticated;
grant execute on function private.can_upload_rental_photo(text) to authenticated;
commit;
