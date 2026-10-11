-- A disabled category already hides active sale listings from non-owners.
-- Enforce the same rule for photo metadata and Storage object authorization.
begin;
create or replace function private.can_view_listing_photo(photo_path text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings l
    where l.id = private.photo_listing_id(photo_path)
      and private.can_access_campus(l.campus_id)
      and (
        l.owner_id = (select auth.uid())
        or (l.status = 'active' and exists (
          select 1 from public.categories c
          where c.slug = l.category_slug and c.enabled
        ))
      )
  );
$$;
revoke all on function private.can_view_listing_photo(text) from public,anon,authenticated;
grant execute on function private.can_view_listing_photo(text) to authenticated;
commit;
