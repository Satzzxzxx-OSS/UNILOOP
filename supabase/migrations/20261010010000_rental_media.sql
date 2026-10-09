-- Step 11: private rental listing photography and publish gating.
-- Run on Supabase with Storage installed; CI uses a disposable Storage façade.
begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('rental-media','rental-media',false,5242880,
  array['image/jpeg','image/png','image/webp']::text[])
on conflict (id) do nothing;

create table public.rental_photos (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rental_listings(id),
  storage_path text not null unique,
  position smallint not null check(position between 1 and 5),
  created_at timestamptz not null default now(),
  unique(rental_id,position),
  check(
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and split_part(storage_path,'/',1)=rental_id::text
  )
);
create index rental_photos_order_idx on public.rental_photos(rental_id,position);

create function private.rental_photo_parent_id(path text)
returns uuid language plpgsql immutable set search_path=''
as $$
begin
  if path is null or path !~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
  then return null; end if;
  return split_part(path,'/',1)::uuid;
end;
$$;

create function private.can_view_rental_photo(path text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.rental_listings r
   where r.id=private.rental_photo_parent_id(path)
     and private.can_access_campus(r.campus_id)
     and (r.owner_id=(select auth.uid()) or
       (r.status='active' and exists (
          select 1 from public.categories c
          where c.slug=r.category_slug and c.enabled
       )))
  );
$$;

create function private.can_upload_rental_photo(path text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.rental_listings r
   where r.id=private.rental_photo_parent_id(path)
     and r.owner_id=(select auth.uid())
     and private.can_access_campus(r.campus_id)
     and r.status in ('draft','paused')
     and (select count(*) from storage.objects o
       where o.bucket_id='rental-media' and o.name like r.id::text||'/%')<5
  );
$$;

create function private.can_register_rental_photo(path text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.rental_listings r
   where r.id=private.rental_photo_parent_id(path)
     and r.owner_id=(select auth.uid())
     and private.can_access_campus(r.campus_id)
     and r.status in ('draft','paused')
  );
$$;

create function private.rental_photo_owned_by_caller(path text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from storage.objects o
   where o.bucket_id='rental-media' and o.name=path
     and o.owner_id=(select auth.uid())::text
  );
$$;

create function private.rental_photo_orphan_owned_by_caller(path text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from storage.objects o
   where o.bucket_id='rental-media' and o.name=path
     and o.owner_id=(select auth.uid())::text
     and not exists(select 1 from public.rental_photos p where p.storage_path=o.name)
  );
$$;

revoke all on function private.rental_photo_parent_id(text) from public,anon,authenticated;
revoke all on function private.can_view_rental_photo(text) from public,anon,authenticated;
revoke all on function private.can_upload_rental_photo(text) from public,anon,authenticated;
revoke all on function private.can_register_rental_photo(text) from public,anon,authenticated;
revoke all on function private.rental_photo_owned_by_caller(text) from public,anon,authenticated;
revoke all on function private.rental_photo_orphan_owned_by_caller(text) from public,anon,authenticated;
grant execute on function private.rental_photo_parent_id(text) to authenticated;
grant execute on function private.can_view_rental_photo(text) to authenticated;
grant execute on function private.can_upload_rental_photo(text) to authenticated;
grant execute on function private.can_register_rental_photo(text) to authenticated;
grant execute on function private.rental_photo_owned_by_caller(text) to authenticated;
grant execute on function private.rental_photo_orphan_owned_by_caller(text) to authenticated;

alter table public.rental_photos enable row level security;
revoke all on public.rental_photos from public,anon,authenticated;
grant select on public.rental_photos to authenticated;
grant insert(rental_id,storage_path,position) on public.rental_photos to authenticated;

create policy rental_photos_read on public.rental_photos
for select to authenticated using (private.can_view_rental_photo(storage_path));
create policy rental_photos_register on public.rental_photos
for insert to authenticated with check (
  private.can_register_rental_photo(storage_path)
  and private.rental_photo_owned_by_caller(storage_path)
);

create policy rental_media_private_read on storage.objects
for select to authenticated
using (bucket_id='rental-media' and private.can_view_rental_photo(name));

create policy rental_media_owner_upload on storage.objects
for insert to authenticated
with check (bucket_id='rental-media'
  and owner_id=(select auth.uid())::text
  and private.can_upload_rental_photo(name));

create policy rental_media_delete_orphan on storage.objects
for delete to authenticated
using (bucket_id='rental-media'
  and private.rental_photo_orphan_owned_by_caller(name));

create function private.rental_active_requires_photo()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.status='active' and old.status is distinct from 'active'
    and not exists(select 1 from public.rental_photos p where p.rental_id=new.id)
 then raise exception 'Photo required for an active rental' using errcode='23514'; end if;
 return new;
end;
$$;

create trigger rental_active_photo_gate
before update of status on public.rental_listings
for each row execute function private.rental_active_requires_photo();

commit;
