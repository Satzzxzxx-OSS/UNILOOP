-- DISPOSABLE full-chain fixture only. No hosted Auth/Storage/email is exercised.
\set ON_ERROR_STOP on
begin;
delete from private.outbox_events;
insert into auth.users(id,email) values
 ('aaaaaaaa-abcd-4abc-8abc-aaaaaaaaaaaa','outbox-fixture@example.test');
insert into public.notifications(user_id,category,title,link_path) values
 ('aaaaaaaa-abcd-4abc-8abc-aaaaaaaaaaaa','message','New private message','/inbox/bbbbbbbb-abcd-4abc-8abc-bbbbbbbbbbbb'),
 ('aaaaaaaa-abcd-4abc-8abc-aaaaaaaaaaaa','offer','New private offer','/inbox/bbbbbbbb-abcd-4abc-8abc-bbbbbbbbbbbb');
do $$
begin
 if (select count(*) from private.outbox_events)<>2 then
  raise exception 'Notification and outbox event were not persisted together'; end if;
 if has_table_privilege('authenticated','private.outbox_events','SELECT')
  or has_table_privilege('service_role','private.outbox_events','UPDATE')
  or has_function_privilege('authenticated','public.claim_notification_events(uuid,integer)','EXECUTE')
  or has_function_privilege('anon','public.acknowledge_notification_event(uuid,uuid)','EXECUTE') then
  raise exception 'Worker queue grants leaked to client roles'; end if;
end $$;
savepoint aborted_notification;
insert into public.notifications(user_id,category,title,link_path) values
 ('aaaaaaaa-abcd-4abc-8abc-aaaaaaaaaaaa','message','Rolled back message','/inbox/bbbbbbbb-abcd-4abc-8abc-bbbbbbbbbbbb');
rollback to aborted_notification;
do $$
begin
 if (select count(*) from private.outbox_events)<>2 then
  raise exception 'Rolled-back notification left a durable event'; end if;
end $$;

set local role service_role;
do $$
declare first_job record;second_job record;
begin
 select * into first_job from public.claim_notification_events('cccccccc-abcd-4abc-8abc-cccccccccccc',1);
 select * into second_job from public.claim_notification_events('dddddddd-abcd-4abc-8abc-dddddddddddd',1);
 if first_job.event_id is null or second_job.event_id is null or first_job.event_id=second_job.event_id then
  raise exception 'Workers claimed missing or duplicate leased work'; end if;
 if exists(select 1 from public.claim_notification_events('cccccccc-abcd-4abc-8abc-cccccccccccc',1)) then
  raise exception 'Active leases were reclaimed'; end if;
 if public.acknowledge_notification_event(first_job.event_id,'eeeeeeee-abcd-4abc-8abc-eeeeeeeeeeee') then
  raise exception 'Wrong lease acknowledged a job'; end if;
 if not public.acknowledge_notification_event(first_job.event_id,first_job.lease_token)
  or not public.acknowledge_notification_event(first_job.event_id,first_job.lease_token) then
  raise exception 'Acknowledgement/retry failed'; end if;
 if not public.fail_notification_event(second_job.event_id,second_job.lease_token,'internal') then
  raise exception 'Failure did not release a valid lease'; end if;
 if exists(select 1 from public.claim_notification_events('cccccccc-abcd-4abc-8abc-cccccccccccc',1)) then
  raise exception 'Backoff was ignored'; end if;
 perform set_config('test.outbox_event',second_job.event_id::text,true);
 perform set_config('test.old_lease',second_job.lease_token::text,true);
 begin
  perform public.claim_notification_events('cccccccc-abcd-4abc-8abc-cccccccccccc',0);
  raise exception 'Unbounded/invalid batch accepted';
 exception when invalid_parameter_value then null; end;
end $$;
reset role;
update private.outbox_events set available_at=clock_timestamp()-interval '1 second'
where id=current_setting('test.outbox_event')::uuid;
set local role service_role;
do $$
declare job record;
begin
 select * into job from public.claim_notification_events('cccccccc-abcd-4abc-8abc-cccccccccccc',1);
 if job.attempts<>2 or job.lease_token=current_setting('test.old_lease')::uuid then
  raise exception 'Retry did not increment attempt/rotate lease'; end if;
 if public.acknowledge_notification_event(job.event_id,current_setting('test.old_lease')::uuid) then
  raise exception 'Stale worker acknowledged a newer lease'; end if;
 perform set_config('test.old_lease',job.lease_token::text,true);
end $$;
reset role;
update private.outbox_events set leased_until=clock_timestamp()-interval '1 second'
where id=current_setting('test.outbox_event')::uuid;
set local role service_role;
do $$
declare job record;
begin
 select * into job from public.claim_notification_events('dddddddd-abcd-4abc-8abc-dddddddddddd',1);
 if job.attempts<>3 then raise exception 'Abandoned lease did not recover'; end if;
 if public.acknowledge_notification_event(job.event_id,current_setting('test.old_lease')::uuid) then
  raise exception 'Abandoned worker retained acknowledgement authority'; end if;
end $$;
reset role;
update private.outbox_events set attempts=5,leased_until=clock_timestamp()-interval '1 second'
where id=current_setting('test.outbox_event')::uuid;
set local role service_role;
do $$
begin
 if exists(select 1 from public.claim_notification_events('cccccccc-abcd-4abc-8abc-cccccccccccc',5)) then
  raise exception 'Exhausted job was retried indefinitely'; end if;
end $$;
reset role;
do $$
begin
 if (select status from private.outbox_events where id=current_setting('test.outbox_event')::uuid)<>'dead' then
  raise exception 'Exhausted abandoned job was not recorded as dead'; end if;
end $$;
rollback;
select 'transactional outbox: passed' as result;
