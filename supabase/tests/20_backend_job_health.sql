\set ON_ERROR_STOP on
begin;
select set_config('request.jwt.claim.sub','',true);
delete from private.outbox_events;
insert into auth.users(id,email) values
 ('aaaaaaaa-5656-4656-8656-aaaaaaaaaaaa','health-fixture@example.test');
insert into public.notifications(id,user_id,category,title,link_path)
select id,'aaaaaaaa-5656-4656-8656-aaaaaaaaaaaa','message','Health fixture notification',
 '/inbox/bbbbbbbb-5656-4656-8656-bbbbbbbbbbbb'
from unnest(array['cccccccc-5656-4656-8656-cccccccccccc'::uuid,
 'dddddddd-5656-4656-8656-dddddddddddd'::uuid,'eeeeeeee-5656-4656-8656-eeeeeeeeeeee'::uuid]) id;
update private.outbox_events set created_at=now()-interval '2 hours'
 where notification_id='cccccccc-5656-4656-8656-cccccccccccc';
update private.outbox_events set status='leased',attempts=1,lease_token=gen_random_uuid(),
 worker_id=gen_random_uuid(),leased_until=now()-interval '1 minute'
 where notification_id='dddddddd-5656-4656-8656-dddddddddddd';
update private.outbox_events set status='dead',attempts=5,failure_code='internal'
 where notification_id='eeeeeeee-5656-4656-8656-eeeeeeeeeeee';
set local role service_role;
do $$
declare health jsonb;
begin
 health:=public.get_backend_job_health();
 if (health->>'pending')::integer<>1 or (health->>'leased')::integer<>1
  or (health->>'expired_leases')::integer<>1 or (health->>'dead')::integer<>1
  or (health->>'oldest_pending_age_seconds')::integer<7200 then
  raise exception 'Job health counts/age inaccurate'; end if;
 if (select count(*) from jsonb_object_keys(health))<>5 then
  raise exception 'Health exposed unexpected detail'; end if;
 if has_function_privilege('authenticated','public.get_backend_job_health()','EXECUTE')
  or has_function_privilege('anon','public.get_backend_job_health()','EXECUTE') then
  raise exception 'Public client can inspect worker metrics'; end if;
end $$;
rollback;
select 'private backend job health: passed' as result;
