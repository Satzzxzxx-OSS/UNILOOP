-- Step 06/07/09: favorites, preferences, reports, staff review.
-- IMPORTANT: staff roles are trusted operational records only.
begin;

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index favorites_by_listing on public.favorites(listing_id);
alter table public.favorites enable row level security;
revoke all on public.favorites from public, anon, authenticated;
grant select on public.favorites to authenticated;
grant insert (user_id,listing_id) on public.favorites to authenticated;
grant delete on public.favorites to authenticated;

create policy favorites_owner_select on public.favorites
for select to authenticated using (
  user_id = (select auth.uid())
  and exists (select 1 from public.listings l where l.id = listing_id
    and l.status = 'active' and private.can_access_campus(l.campus_id))
);
create policy favorites_owner_insert on public.favorites
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.listings l where l.id = listing_id
    and l.status = 'active' and private.can_access_campus(l.campus_id)
    and l.owner_id <> (select auth.uid()))
);
create policy favorites_owner_delete on public.favorites
for delete to authenticated using (user_id = (select auth.uid()));

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_messages boolean not null default true,
  email_offers boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from public,anon,authenticated;
grant select on public.notification_preferences to authenticated;
grant insert (user_id,email_messages,email_offers) on public.notification_preferences to authenticated;
grant update (email_messages,email_offers) on public.notification_preferences to authenticated;
create policy notification_pref_owner_read on public.notification_preferences
for select to authenticated using (user_id=(select auth.uid()));
create policy notification_pref_owner_create on public.notification_preferences
for insert to authenticated with check (user_id=(select auth.uid()));
create policy notification_pref_owner_update on public.notification_preferences
for update to authenticated using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  listing_id uuid not null references public.listings(id),
  reason text not null check (reason in (
    'prohibited','fraud','misleading','harassment','other'
  )),
  details text not null check (char_length(btrim(details)) between 15 and 1500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  unique (reporter_id,listing_id,reason),
  constraint listing_report_resolution_time check (
    (status = 'open' and resolved_at is null and resolved_by is null)
    or (status <> 'open' and resolved_at is not null and resolved_by is not null)
  )
);
create index listing_reports_queue_idx on public.listing_reports(status, created_at);
alter table public.listing_reports enable row level security;
revoke all on public.listing_reports from public,anon,authenticated;
grant select on public.listing_reports to authenticated;
grant insert (reporter_id,listing_id,reason,details) on public.listing_reports to authenticated;
create policy reports_owner_select on public.listing_reports
for select to authenticated using (reporter_id=(select auth.uid()));
create policy reports_owner_create on public.listing_reports
for insert to authenticated with check (
  reporter_id=(select auth.uid())
  and exists (select 1 from public.listings l
    where l.id = listing_id and l.owner_id <> (select auth.uid())
      and private.can_access_campus(l.campus_id))
);

create table private.staff_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('moderator','admin')),
  created_at timestamptz not null default now()
);
revoke all on private.staff_roles from public,anon,authenticated;

create table private.moderation_audit (
  id bigint generated always as identity primary key,
  staff_id uuid not null references public.profiles(id),
  report_id uuid not null references public.listing_reports(id),
  action text not null check (action in ('dismiss','remove_listing')),
  created_at timestamptz not null default now()
);
revoke all on private.moderation_audit from public,anon,authenticated;

create function private.is_market_moderator()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.staff_roles s
    join public.profiles p on p.id = s.user_id
    where s.user_id = (select auth.uid()) and p.account_status = 'active'
  );
$$;
revoke all on function private.is_market_moderator() from public,anon,authenticated;
grant execute on function private.is_market_moderator() to authenticated;

-- Return a minimal, non-personally-identifying moderation queue.
create function public.get_open_listing_reports()
returns table(
  report_id uuid,
  listing_id uuid,
  reason text,
  details text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_market_moderator() then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  return query
  select r.id,r.listing_id,r.reason,r.details,r.created_at
  from public.listing_reports r
  where r.status = 'open'
  order by r.created_at asc limit 100;
end;
$$;

create function public.review_listing_report(report_id uuid, resolution text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  report public.listing_reports%rowtype;
begin
  if not private.is_market_moderator()
    or report_id is null or resolution not in ('dismiss','remove_listing') then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  select * into report from public.listing_reports
    where id = report_id for update;
  if not found or report.status <> 'open' then
    raise exception 'Report unavailable' using errcode='22023';
  end if;

  if resolution = 'remove_listing' then
    -- A sold or already removed listing is not reactivated.
    update public.listings
      set status='removed',published_at=coalesce(published_at,now())
      where id=report.listing_id and status in ('draft','active','paused');
  end if;

  update public.listing_reports
    set status=case when resolution='dismiss' then 'dismissed' else 'resolved' end,
      resolved_by=(select auth.uid()),resolved_at=now()
    where id=report.id;
  insert into private.moderation_audit(staff_id,report_id,action)
    values ((select auth.uid()),report.id,resolution);

  return resolution;
end;
$$;
revoke all on function public.get_open_listing_reports() from public,anon,authenticated;
revoke all on function public.review_listing_report(uuid,text) from public,anon,authenticated;
grant execute on function public.get_open_listing_reports() to authenticated;
grant execute on function public.review_listing_report(uuid,text) to authenticated;

commit;
