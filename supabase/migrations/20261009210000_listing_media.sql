-- Step 03 media extension. Requires the Supabase Storage service schema.
-- Run on genuine Supabase staging before production. Never alter storage metadata
-- directly outside bucket setup and RLS policy declarations.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
 'listing-media', 'listing-media', false, 5242880,
 array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do nothing;

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  storage_path text not null unique,
  position smallint not null check (position between 1 and 5),
  created_at timestamptz not null default now(),
  unique (listing_id, position),
  constraint listing_photo_path check (
    storage_path ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and split_part(storage_path, '/', 1) = listing_id::text
  )
);

create index listing_photos_listing_position_idx
  on public.listing_photos(listing_id, position);

-- Reject invalid path before UUID casts, even on other tenants' objects.
create function private.photo_listing_id(photo_path text)
returns uuid
language plpgsql immutable
set search_path = ''
as $$
begin
  if photo_path is null or photo_path !~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
  then
    return null;
  end if;
  return split_part(photo_path,'/',1)::uuid;
end;
$$;

create function private.can_view_listing_photo(photo_path text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings l
    where l.id = private.photo_listing_id(photo_path)
      and private.can_access_campus(l.campus_id)
      and (l.status = 'active' or l.owner_id = (select auth.uid()))
  );
$$;

create function private.can_upload_listing_photo(photo_path text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings l
    where l.id = private.photo_listing_id(photo_path)
      and l.owner_id = (select auth.uid())
      and private.can_access_campus(l.campus_id)
      and l.status in ('draft','paused')
      and (
        select count(*) from storage.objects o
        where o.bucket_id = 'listing-media'
          and o.name like l.id::text || '/%'
      ) < 5
  );
$$;

create function private.can_register_listing_photo(photo_path text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings l
    where l.id = private.photo_listing_id(photo_path)
      and l.owner_id = (select auth.uid())
      and private.can_access_campus(l.campus_id)
      and l.status in ('draft','paused')
  );
$$;

create function private.photo_object_owned_by_caller(photo_path text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from storage.objects o
    where o.bucket_id = 'listing-media'
      and o.name = photo_path
      and o.owner_id = (select auth.uid())::text
  );
$$;

create function private.is_orphan_photo_of_caller(photo_path text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from storage.objects o
    where o.bucket_id = 'listing-media' and o.name = photo_path
      and o.owner_id = (select auth.uid())::text
      and not exists (
        select 1 from public.listing_photos p where p.storage_path = o.name
      )
  );
$$;

revoke all on function private.photo_listing_id(text) from public,anon,authenticated;
revoke all on function private.can_view_listing_photo(text) from public,anon,authenticated;
revoke all on function private.can_upload_listing_photo(text) from public,anon,authenticated;
revoke all on function private.can_register_listing_photo(text) from public,anon,authenticated;
revoke all on function private.photo_object_owned_by_caller(text) from public,anon,authenticated;
revoke all on function private.is_orphan_photo_of_caller(text) from public,anon,authenticated;
grant execute on function private.can_view_listing_photo(text) to authenticated;
grant execute on function private.can_upload_listing_photo(text) to authenticated;
grant execute on function private.can_register_listing_photo(text) to authenticated;
grant execute on function private.photo_object_owned_by_caller(text) to authenticated;
grant execute on function private.is_orphan_photo_of_caller(text) to authenticated;
grant execute on function private.photo_listing_id(text) to authenticated;

alter table public.listing_photos enable row level security;
revoke all on public.listing_photos from public,anon,authenticated;
grant select on public.listing_photos to authenticated;
grant insert (listing_id,storage_path,position) on public.listing_photos to authenticated;

create policy listing_photo_read_for_viewers
on public.listing_photos for select to authenticated
using (private.can_view_listing_photo(storage_path));

create policy listing_photo_register_after_upload
on public.listing_photos for insert to authenticated
with check (
  private.can_register_listing_photo(storage_path)
  and private.photo_object_owned_by_caller(storage_path)
);

-- Do not modify storage.objects schema, owner fields or file metadata via SQL.
-- Storage API enforces the private bucket MIME and size restrictions.
create policy listing_media_read_authorized
on storage.objects for select to authenticated
using (
  bucket_id = 'listing-media'
  and private.can_view_listing_photo(name)
);

create policy listing_media_upload_owned_draft
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-media'
  and owner_id = (select auth.uid())::text
  and private.can_upload_listing_photo(name)
);

-- Allow deleting only orphan uploads after failed metadata registration.
-- Registered photos have no user delete grants; use audited operator cleanup
-- workflows when removal/moderation becomes available.
create policy listing_media_delete_orphan
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-media'
  and private.is_orphan_photo_of_caller(name)
);

-- Publishing always requires at least one registered, uploaded photo.
create function private.listing_requires_photo()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' and
    not exists (
      select 1 from public.listing_photos p
      where p.listing_id = new.id
    )
  then
    raise exception 'A listing photo is required to publish'
      using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger uniloop_listing_requires_photo
before update of status on public.listings
for each row execute function private.listing_requires_photo();

commit;
