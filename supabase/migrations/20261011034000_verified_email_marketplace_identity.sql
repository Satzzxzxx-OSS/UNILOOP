-- Match the existing email-verified application contract at the DB boundary.
-- Direct Data API/RPC calls must not bypass email confirmation just because
-- an operator has provisioned a campus membership. This app uses email Auth.
begin;
create or replace function private.can_access_campus(requested_campus uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select requested_campus is not null and exists (
   select 1 from public.profiles p
   join auth.users u on u.id=p.id
   join public.campus_memberships cm on cm.user_id=p.id
   join private.enabled_campuses ec on ec.campus_id=cm.campus_id
   where p.id=(select auth.uid()) and p.account_status='active'
     and u.email_confirmed_at is not null
     and cm.campus_id=requested_campus and cm.status='verified' and ec.enabled
 );
$$;
create or replace function private.sale_counterparty_eligible(other_user uuid,requested_campus uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
   select 1 from public.profiles p
   join auth.users u on u.id=p.id
   join public.campus_memberships cm on cm.user_id=p.id
   where p.id=other_user and p.account_status='active'
     and u.email_confirmed_at is not null
     and cm.campus_id=requested_campus and cm.status='verified'
 );
$$;
revoke all on function private.can_access_campus(uuid) from public,anon,authenticated;
revoke all on function private.sale_counterparty_eligible(uuid,uuid) from public,anon,authenticated;
grant execute on function private.can_access_campus(uuid) to authenticated;
grant execute on function private.sale_counterparty_eligible(uuid,uuid) to authenticated;
commit;
