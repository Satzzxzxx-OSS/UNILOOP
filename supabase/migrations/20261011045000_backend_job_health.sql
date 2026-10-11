-- Worker/operator metrics contain counts and ages, never recipient or message data.
begin;
create index outbox_unfinished_status_idx on private.outbox_events(status,created_at)
 where status<>'acknowledged';
create function public.get_backend_job_health()
returns jsonb language sql stable security definer set search_path=''
as $$
 select jsonb_build_object(
  'pending',count(*) filter(where status='pending'),
  'leased',count(*) filter(where status='leased'),
  'expired_leases',count(*) filter(where status='leased' and leased_until<=now()),
  'dead',count(*) filter(where status='dead'),
  'oldest_pending_age_seconds',coalesce(greatest(0,extract(epoch from now()-min(created_at)
    filter(where status='pending')))::bigint,0)
 ) from private.outbox_events where status<>'acknowledged';
$$;
revoke all on function public.get_backend_job_health() from public,anon,authenticated,service_role;
grant execute on function public.get_backend_job_health() to service_role;
commit;
