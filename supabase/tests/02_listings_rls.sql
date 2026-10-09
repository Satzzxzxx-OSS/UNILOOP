-- Step 03 SQL verification on disposable PostgreSQL, never on hosted Supabase.
\set ON_ERROR_STOP on

insert into auth.users(id,email) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner@example.test'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','other@example.test'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','pending@example.test');

insert into public.campuses(id,name) values
('11111111-1111-4111-8111-111111111111','Allowed region'),
('22222222-2222-4222-8222-222222222222','Disabled region');
insert into private.enabled_campuses(campus_id,enabled) values
('11111111-1111-4111-8111-111111111111',true),
('22222222-2222-4222-8222-222222222222',false);
insert into public.campus_memberships(user_id,campus_id,status,verified_at) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified',now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','verified',now()),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','pending',null);

-- Owner may create an initial draft, but cannot choose another owner/status.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.listings (
 id,owner_id,campus_id,category_slug,mode,title,description,price_inr,item_condition
) values (
 '11111111-aaaa-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'books-study','sell','Chemistry textbook',
 'Hardcover used chemistry textbook in good shape.',500,'good'
);
do $$
begin
 if (select count(*) from public.listings) <> 1 then
   raise exception 'Owner must see own draft';
 end if;
 if (select status from public.listings limit 1) <> 'draft' then
   raise exception 'Unauthorized initial status';
 end if;
 if has_column_privilege('authenticated','public.listings','status','UPDATE') then
   raise exception 'Client can directly set status';
 end if;
 if has_column_privilege('authenticated','public.listings','campus_id','UPDATE') then
   raise exception 'Client can move listing cross-campus';
 end if;
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 if exists(select 1 from public.listings) then
  raise exception 'Other member must not see a draft';
 end if;
 begin
  perform public.transition_sale_listing(
    '11111111-aaaa-4111-8111-111111111111','active');
  raise exception 'Other member published owner draft';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
 if exists(select 1 from public.listings) then
  raise exception 'Unverified member can read listings';
 end if;
 begin
  insert into public.listings(owner_id,campus_id,category_slug,title,
    description,price_inr,item_condition)
  values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-4111-8111-111111111111',
    'books-study','Unverified listing',
    'A description exceeding twenty characters.',100,'good');
  raise exception 'Unverified member created a draft';
 exception when insufficient_privilege or check_violation then null;
 end;
end $$;
rollback;

-- Owner publish, another approved member sees active listing.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.transition_sale_listing(
 '11111111-aaaa-4111-8111-111111111111','active'
);
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 if (select count(*) from public.listings where status = 'active') <> 1 then
   raise exception 'Active listing should be discoverable to eligible member';
 end if;
 update public.listings set title = 'An unauthorized title change';
 if found then
  raise exception 'Cannot edit other member listing';
 end if;
end $$;
rollback;

-- Owner pause -> other users cannot see; cannot re-sell after Sold.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.transition_sale_listing(
 '11111111-aaaa-4111-8111-111111111111','paused'
);
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
 if exists(select 1 from public.listings) then
   raise exception 'Paused listing visible to other user';
 end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.transition_sale_listing(
 '11111111-aaaa-4111-8111-111111111111','active'
);
select public.transition_sale_listing(
 '11111111-aaaa-4111-8111-111111111111','sold'
);
do $$
begin
 begin
  perform public.transition_sale_listing(
    '11111111-aaaa-4111-8111-111111111111','active');
  raise exception 'Sold listing can be reactivated';
 exception when invalid_parameter_value then null;
 end;
end $$;
commit;

-- No public anonymous listing reads, and no direct deletes by any client.
do $$
begin
 if has_table_privilege('anon','public.listings','SELECT') then
   raise exception 'Anonymous can enumerate marketplace';
 end if;
 if has_table_privilege('authenticated','public.listings','DELETE') then
   raise exception 'Client can delete listing';
 end if;
 if has_column_privilege('authenticated','public.listings','published_at','UPDATE') then
   raise exception 'Client can forge publication time';
 end if;
end $$;

select 'listing RLS and transitions: passed' as result;
