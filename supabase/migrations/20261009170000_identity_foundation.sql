-- UNILOOP identity foundation / Supabase PostgreSQL.
-- IMPORTANT: Never execute the historical root-level T-SQL file.
-- Enrollment and allowed launch scopes are provisioned by trusted operations,
-- NEVER by an end-user INSERT/UPDATE or untrusted JWT metadata.
-- This migration does not seed campuses or memberships.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 2 and 60),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now()
);

create table public.campus_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  campus_id uuid not null references public.campuses(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'revoked')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, campus_id),
  constraint verified_requires_timestamp
    check ((status = 'verified' and verified_at is not null) or
           (status <> 'verified' and verified_at is null))
);

-- Never expose private in Supabase's Data API "Exposed schemas".
create table private.enabled_campuses (
  campus_id uuid primary key references public.campuses(id) on delete cascade,
  enabled boolean not null default false
);

create index campus_memberships_campus_status_idx
  on public.campus_memberships (campus_id, status, user_id);

-- Identity lookup checks authoritative database rows, not user-editable JWT metadata.
-- Pinned empty search_path is essential for SECURITY DEFINER.
create function private.can_access_campus(requested_campus uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select requested_campus is not null
    and exists (
      select 1
      from public.profiles p
      join public.campus_memberships cm on cm.user_id = p.id
      join private.enabled_campuses ec on ec.campus_id = cm.campus_id
      where p.id = (select auth.uid())
        and p.account_status = 'active'
        and cm.campus_id = requested_campus
        and cm.status = 'verified'
        and ec.enabled
    );
$$;

revoke all on function private.can_access_campus(uuid) from public, anon, authenticated;
grant execute on function private.can_access_campus(uuid) to authenticated;

-- Supabase manages credentials. This trigger does NOT copy raw_user_meta_data,
-- which users may be allowed to edit.
create function private.create_profile_for_auth_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id) values (new.id)
    on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.create_profile_for_auth_user() from public, anon, authenticated;
create trigger on_uniloop_auth_user_created
  after insert on auth.users
  for each row execute function private.create_profile_for_auth_user();

alter table public.campuses enable row level security;
alter table public.profiles enable row level security;
alter table public.campus_memberships enable row level security;

-- Explicit grants + policies. Client roles never receive write access
-- to verification rows or the trusted launch scope table.
revoke all on public.campuses from public, anon, authenticated;
revoke all on public.profiles from public, anon, authenticated;
revoke all on public.campus_memberships from public, anon, authenticated;
revoke all on private.enabled_campuses from public, anon, authenticated;

grant select on public.campuses to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.campus_memberships to authenticated;

create policy campuses_verified_member_select
on public.campuses for select to authenticated
using ((select private.can_access_campus(id)));

create policy profiles_owner_select
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy profiles_active_owner_update
on public.profiles for update to authenticated
using (id = (select auth.uid()) and account_status = 'active')
with check (id = (select auth.uid()) and account_status = 'active');

create policy memberships_owner_select
on public.campus_memberships for select to authenticated
using (user_id = (select auth.uid()));

-- No policies for INSERT/UPDATE/DELETE on campus memberships, campuses
-- or enabled_campuses, and no client-side profile insert/delete.
commit;
