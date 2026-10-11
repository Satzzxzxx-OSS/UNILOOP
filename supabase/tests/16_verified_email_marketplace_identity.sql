-- Disposable test: live DB identity fields, never untrusted JWT metadata.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','unconfirmed@example.test',null);
insert into public.campuses(id,name) values
 ('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb','Verified email regression campus');
insert into private.enabled_campuses(campus_id,enabled) values
 ('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb',true);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
 ('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb','verified',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims','{"email_verified":true,"user_metadata":{"verified":true}}',true);
do $$
begin
 if private.can_access_campus('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb')
   or private.sale_counterparty_eligible('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa',
    'bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb')
   or exists(select 1 from public.campuses) then
  raise exception 'Unconfirmed identity acquired campus eligibility'; end if;
 begin
  insert into public.listings(owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
  values('aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa','bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb',
   'books-study','An unconfirmed listing','Description long enough for identity tests.',100,'good');
  raise exception 'Unconfirmed identity created a draft through the Data API';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update auth.users set email_confirmed_at=now()
where id='aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa';
set local role authenticated;
do $$
begin
 if not private.can_access_campus('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb') then
  raise exception 'Confirmed approved identity incorrectly denied'; end if;
end $$;
reset role;
update auth.users set email_confirmed_at=null
where id='aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa';
set local role authenticated;
do $$
begin
 if private.can_access_campus('bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb') then
  raise exception 'Email trust changed but old claims retained access'; end if;
end $$;
rollback;
select 'verified email marketplace identity: passed' as result;
