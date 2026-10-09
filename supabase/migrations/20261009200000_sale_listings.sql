-- Step 03 / 2026-10-09: sale marketplace inventory kernel.
-- Applies AFTER the identity foundation migration. No campus/user seed data.
-- Data API: only public tables/functions; private scope remains unexposed.
begin;

create table public.categories (
  slug text primary key
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 56),
  label text not null check (char_length(btrim(label)) between 3 and 90),
  enabled boolean not null default true,
  sort_order integer not null default 0
);
insert into public.categories (slug, label, sort_order) values
  ('books-study', 'Books & study', 10),
  ('laptops-computing', 'Laptops & tech', 20),
  ('mobiles-gadgets', 'Mobiles & gadgets', 30),
  ('hostel-living', 'Hostel & living', 40),
  ('cycles-mobility', 'Cycles & mobility', 50),
  ('fashion-accessories', 'Fashion & bags', 60),
  ('sports-fitness', 'Sports & fitness', 70),
  ('cameras-creative', 'Creative gear', 80);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  campus_id uuid not null references public.campuses(id),
  category_slug text not null references public.categories(slug),
  mode text not null default 'sell' check (mode = 'sell'),
  title text not null check (
    char_length(btrim(title)) between 8 and 120 and
    title = btrim(title)
  ),
  description text not null default '' check (
    char_length(description) between 20 and 5000
  ),
  price_inr integer not null check (price_inr between 1 and 10000000),
  item_condition text not null check (
    item_condition in ('new', 'like_new', 'good', 'fair')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'active', 'paused', 'sold', 'removed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint publish_time_matches_state check (
    (status = 'draft' and published_at is null) or
    (status <> 'draft' and published_at is not null)
  )
);

create index listings_campus_discovery_idx
  on public.listings(campus_id, published_at desc, id)
  where status = 'active';
create index listings_owner_updated_idx
  on public.listings(owner_id, updated_at desc);
create index listings_campus_category_active_idx
  on public.listings(campus_id, category_slug, published_at desc)
  where status = 'active';

-- Trusted update clock. Prevent client tampering with server-owned timestamps,
-- membership and ownership. Server-owned columns have no UPDATE grants.
create function private.listing_touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger uniloop_listing_touch
  before update on public.listings
  for each row execute function private.listing_touch_updated_at();

alter table public.categories enable row level security;
alter table public.listings enable row level security;
revoke all on public.categories from public, anon, authenticated;
revoke all on public.listings from public, anon, authenticated;

-- Public taxonomy is non-sensitive, no private campus information is embedded.
grant select (slug, label, enabled, sort_order) on public.categories to anon, authenticated;
create policy category_read_enabled on public.categories
  for select to anon, authenticated using (enabled);

-- Listings are *never* anonymously enumerable during this controlled rollout.
-- All visible item data must pass live eligibility and campus checks.
grant select on public.listings to authenticated;
grant insert (id, owner_id, campus_id, category_slug, mode, title, description,
  price_inr, item_condition) on public.listings to authenticated;
grant update (title, description, category_slug, price_inr, item_condition)
  on public.listings to authenticated;

create policy listing_read_allowed on public.listings
for select to authenticated
using (
  (select auth.uid()) is not null
  and private.can_access_campus(campus_id)
  and (
    owner_id = (select auth.uid())
    or (
      status = 'active'
      and exists (
        select 1 from public.categories c
        where c.slug = category_slug and c.enabled
      )
    )
  )
);

create policy listing_insert_draft on public.listings
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and private.can_access_campus(campus_id)
  and status = 'draft'
  and published_at is null
  and exists (
    select 1 from public.categories c
    where c.slug = category_slug and c.enabled
  )
);

-- Prevent public editing of already completed or removed listings.
create policy listing_edit_owner on public.listings
for update to authenticated
using (
  owner_id = (select auth.uid()) and
  private.can_access_campus(campus_id) and status in ('draft', 'active', 'paused')
)
with check (
  owner_id = (select auth.uid()) and
  private.can_access_campus(campus_id) and status in ('draft', 'active', 'paused')
  and exists (
    select 1 from public.categories c
    where c.slug = category_slug and c.enabled
  )
);

-- Explicitly controlled lifecycle transitions.
-- This is the ONLY client-accessible method of modifying status/published_at;
-- direct UPDATE grants for those columns remain absent.
create function public.transition_sale_listing(
  listing_id uuid,
  next_status text
)
returns text
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  current_listing public.listings%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into current_listing from public.listings
  where id = listing_id
  for update;

  if not found or current_listing.owner_id <> (select auth.uid())
    or not private.can_access_campus(current_listing.campus_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not (
    (current_listing.status = 'draft' and next_status in ('active', 'removed')) or
    (current_listing.status = 'active' and next_status in ('paused', 'sold', 'removed')) or
    (current_listing.status = 'paused' and next_status in ('active', 'removed'))
  ) then
    raise exception 'Invalid listing status transition' using errcode = '22023';
  end if;

  if next_status = 'active' and not exists (
    select 1 from public.categories c
    where c.slug = current_listing.category_slug and c.enabled
  ) then
    raise exception 'Category unavailable' using errcode = '22023';
  end if;

  update public.listings
  set status = next_status,
    published_at = coalesce(current_listing.published_at, now())
  where id = listing_id;

  return next_status;
end;
$$;
revoke all on function public.transition_sale_listing(uuid,text)
  from public, anon, authenticated;
grant execute on function public.transition_sale_listing(uuid,text)
  to authenticated;

commit;
