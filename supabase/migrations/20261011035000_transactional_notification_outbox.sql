-- Durable event boundary for future server-only delivery adapters.
-- No email provider is enabled, no historical notifications are replayed.
begin;
create table private.outbox_events (
 id uuid primary key default gen_random_uuid(),
 notification_id uuid not null unique references public.notifications(id) on delete cascade,
 event_type text not null default 'notification.created' check(event_type='notification.created'),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 status text not null default 'pending' check(status in ('pending','leased','acknowledged','dead')),
 attempts integer not null default 0 check(attempts between 0 and 5),
 available_at timestamptz not null default now(),
 lease_token uuid,
 worker_id uuid,
 leased_until timestamptz,
 completed_lease_token uuid,
 completed_at timestamptz,
 failure_code text check(failure_code in ('handler_unavailable','transport','timeout','internal')),
 created_at timestamptz not null default now(),
 check((status='leased' and lease_token is not null and worker_id is not null and leased_until is not null)
   or (status<>'leased' and lease_token is null and worker_id is null and leased_until is null)),
 check((status='acknowledged' and completed_at is not null and completed_lease_token is not null)
   or (status<>'acknowledged' and completed_at is null and completed_lease_token is null))
);
create index outbox_pending_idx on private.outbox_events(available_at,created_at,id)
where status='pending';
create index outbox_expired_lease_idx on private.outbox_events(leased_until,id)
where status='leased';
revoke all on private.outbox_events from public,anon,authenticated,service_role;

create function private.enqueue_notification_event()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 insert into private.outbox_events(notification_id,payload)
 values(new.id,jsonb_build_object('notification_id',new.id,'user_id',new.user_id,'category',new.category));
 return new;
end;
$$;
revoke all on function private.enqueue_notification_event() from public,anon,authenticated,service_role;
create trigger enqueue_notification_outbox after insert on public.notifications
for each row execute function private.enqueue_notification_event();

create function public.claim_notification_events(requested_worker uuid,batch_size integer default 5)
returns table(event_id uuid,event_type text,payload jsonb,lease_token uuid,attempts integer)
language plpgsql volatile security definer set search_path=''
as $$
begin
 if requested_worker is null or batch_size is null or batch_size not between 1 and 20 then
  raise exception 'Invalid worker batch' using errcode='22023'; end if;
 -- A final abandoned lease must become inspectable dead work, not stay leased forever.
 update private.outbox_events e set status='dead',lease_token=null,worker_id=null,leased_until=null,
   failure_code='timeout'
 where e.status='leased' and e.leased_until<=clock_timestamp() and e.attempts>=5;
 return query
 with candidates as (
  select e.id from private.outbox_events e
  where e.attempts<5 and ((e.status='pending' and e.available_at<=clock_timestamp())
    or (e.status='leased' and e.leased_until<=clock_timestamp()))
  order by e.created_at,e.id limit batch_size for update skip locked
 ), claimed as (
  update private.outbox_events e set status='leased',attempts=e.attempts+1,
    lease_token=gen_random_uuid(),worker_id=requested_worker,
    leased_until=clock_timestamp()+interval '2 minutes'
  from candidates c where e.id=c.id
  returning e.id,e.event_type,e.payload,e.lease_token,e.attempts
 ) select c.id,c.event_type,c.payload,c.lease_token,c.attempts from claimed c;
end;
$$;

create function public.acknowledge_notification_event(requested_event uuid,requested_lease uuid)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare job private.outbox_events%rowtype;
begin
 if requested_event is null or requested_lease is null then return false; end if;
 select * into job from private.outbox_events where id=requested_event for update;
 if not found then return false; end if;
 if job.status='acknowledged' then
  return job.completed_lease_token=requested_lease;
 end if;
 if job.status<>'leased' or job.lease_token is distinct from requested_lease
   or job.leased_until<=clock_timestamp() then return false; end if;
 update private.outbox_events set status='acknowledged',completed_at=clock_timestamp(),
  completed_lease_token=lease_token,lease_token=null,worker_id=null,leased_until=null,
  failure_code=null where id=job.id;
 return true;
end;
$$;

create function public.fail_notification_event(requested_event uuid,requested_lease uuid,error_code text)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare job private.outbox_events%rowtype;
begin
 if requested_event is null or requested_lease is null or error_code is null
  or error_code not in ('handler_unavailable','transport','timeout','internal') then
  raise exception 'Invalid failure record' using errcode='22023'; end if;
 select * into job from private.outbox_events where id=requested_event for update;
 if not found or job.status<>'leased' or job.lease_token is distinct from requested_lease
  or job.leased_until<=clock_timestamp() then return false; end if;
 update private.outbox_events set status=case when attempts>=5 then 'dead' else 'pending' end,
  available_at=clock_timestamp()+make_interval(secs=>least(3600,60*(2^(attempts-1))::integer)),
  lease_token=null,worker_id=null,leased_until=null,failure_code=error_code where id=job.id;
 return true;
end;
$$;
revoke all on function public.claim_notification_events(uuid,integer) from public,anon,authenticated,service_role;
revoke all on function public.acknowledge_notification_event(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.fail_notification_event(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.claim_notification_events(uuid,integer) to service_role;
grant execute on function public.acknowledge_notification_event(uuid,uuid) to service_role;
grant execute on function public.fail_notification_event(uuid,uuid,text) to service_role;
commit;
