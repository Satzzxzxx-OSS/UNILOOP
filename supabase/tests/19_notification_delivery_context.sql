-- Direct database write budgets and canonical retry behavior.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email) values
 ('aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa','seller@example.test'),
 ('bbbbbbbb-1212-4212-8212-bbbbbbbbbbbb','buyer@example.test'),
 ('cccccccc-1212-4212-8212-cccccccccccc','another@example.test');
insert into public.campuses(id,name) values
 ('dddddddd-1212-4212-8212-dddddddddddd','Approved market');
insert into private.enabled_campuses(campus_id,enabled) values
 ('dddddddd-1212-4212-8212-dddddddddddd',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa','dddddddd-1212-4212-8212-dddddddddddd','verified',now()),
 ('bbbbbbbb-1212-4212-8212-bbbbbbbbbbbb','dddddddd-1212-4212-8212-dddddddddddd','verified',now()),
 ('cccccccc-1212-4212-8212-cccccccccccc','dddddddd-1212-4212-8212-dddddddddddd','verified',now());

insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
values ('eeeeeeee-1212-4212-8212-eeeeeeeeeeee',
 'aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa',
 'dddddddd-1212-4212-8212-dddddddddddd','books-study','Chemistry hardcover book',
 'Gently used hardcover chemistry book with handwritten notes.',550,'good');
insert into storage.objects(bucket_id,name,owner_id) values
 ('listing-media',
 'eeeeeeee-1212-4212-8212-eeeeeeeeeeee/ffffffff-1212-4212-8212-ffffffffffff.jpg',
 'aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa');
insert into public.listing_photos(listing_id,storage_path,position) values
 ('eeeeeeee-1212-4212-8212-eeeeeeeeeeee',
 'eeeeeeee-1212-4212-8212-eeeeeeeeeeee/ffffffff-1212-4212-8212-ffffffffffff.jpg',1);

update public.listings set status='active',published_at=now()
 where id='eeeeeeee-1212-4212-8212-eeeeeeeeeeee';
select set_config('request.jwt.claim.sub','',true);
delete from private.outbox_events;
insert into public.sale_conversations(id,listing_id,buyer_id,seller_id) values
 ('ffffffff-1212-4212-8212-ffffffffffff','eeeeeeee-1212-4212-8212-eeeeeeeeeeee',
 'bbbbbbbb-1212-4212-8212-bbbbbbbbbbbb','aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa');
insert into public.notifications(id,user_id,category,title,link_path) values
 ('abababab-1212-4212-8212-abababababab','aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa',
 'message','New private message','/inbox/ffffffff-1212-4212-8212-ffffffffffff');
insert into public.notification_preferences(user_id,email_messages,email_offers) values
 ('aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa',true,true);
create temporary table delivery_claim as select * from public.claim_notification_events(gen_random_uuid(),1);
grant select on delivery_claim to service_role;
set local role service_role;
do $$
declare context record; claim record;
begin
 select * into claim from delivery_claim;
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if not context.eligible or context.recipient_email<>'seller@example.test' then
  raise exception 'Eligible recipient lookup failed'; end if;
 begin perform public.get_notification_delivery_context(claim.event_id,gen_random_uuid());
  raise exception 'Wrong lease retrieved recipient email';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Every trusted-state mutation must affect the next lookup, without relying on JWT metadata.
do $$
declare context record; claim record;
begin
 select * into claim from delivery_claim;
 update public.notification_preferences set email_messages=false;
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible or context.recipient_email is not null or context.suppression_code<>'preference_disabled' then
  raise exception 'Opt-out did not suppress email'; end if;
 update public.notification_preferences set email_messages=true;
 update private.enabled_campuses set enabled=false where campus_id='dddddddd-1212-4212-8212-dddddddddddd';
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible or context.suppression_code<>'access_revoked' then raise exception 'Disabled campus email leaked'; end if;
 update private.enabled_campuses set enabled=true where campus_id='dddddddd-1212-4212-8212-dddddddddddd';
 update public.categories set enabled=false where slug='books-study';
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible then raise exception 'Disabled category email leaked'; end if;
 update public.categories set enabled=true where slug='books-study';
 update auth.users set email_confirmed_at=null where id='aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa';
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible then raise exception 'Unconfirmed recipient received email'; end if;
 update auth.users set email_confirmed_at=now() where id='aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa';
 update public.profiles set account_status='suspended' where id='bbbbbbbb-1212-4212-8212-bbbbbbbbbbbb';
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible then raise exception 'Suspended counterparty email leaked'; end if;
 update public.profiles set account_status='active' where id='bbbbbbbb-1212-4212-8212-bbbbbbbbbbbb';
 insert into public.user_blocks(blocker_id,blocked_id) values
 ('aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa','bbbbbbbb-1212-4212-8212-bbbbbbbbbbbb');
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible then raise exception 'Blocked pair received email'; end if;
 delete from public.user_blocks where blocker_id='aaaaaaaa-1212-4212-8212-aaaaaaaaaaaa';
 update public.notifications set read_at=now() where id='abababab-1212-4212-8212-abababababab';
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible or context.suppression_code<>'already_read' then raise exception 'Read notification emailed'; end if;
 update public.notifications set read_at=null where id='abababab-1212-4212-8212-abababababab';
 update private.outbox_events set created_at=now()-interval '21 hours' where id=claim.event_id;
 select * into context from public.get_notification_delivery_context(claim.event_id,claim.lease_token);
 if context.eligible or context.suppression_code<>'expired' then raise exception 'Expired delivery emailed'; end if;
 if has_function_privilege('authenticated','public.get_notification_delivery_context(uuid,uuid)','EXECUTE')
  or has_function_privilege('anon','public.get_notification_delivery_context(uuid,uuid)','EXECUTE') then
  raise exception 'Client can retrieve delivery recipients'; end if;
end $$;
rollback;
select 'notification delivery eligibility: passed' as result;
