-- Run as postgres against a disposable database after migration.
\set ON_ERROR_STOP on

insert into public.campuses (id, name) values
('11111111-1111-4111-8111-111111111111','First approved location'),
('22222222-2222-4222-8222-222222222222','Not enabled location');

-- Creating auth users must create exactly one profile each.
insert into auth.users (id,email) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','user-a@example.test'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','user-b@example.test'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','user-c@example.test');

do $$
begin
  if (select count(*) from public.profiles) <> 3 then
    raise exception 'Auth trigger did not create 3 profiles';
  end if;
end $$;

insert into private.enabled_campuses (campus_id, enabled) values
('11111111-1111-4111-8111-111111111111', true),
('22222222-2222-4222-8222-222222222222', false);

insert into public.campus_memberships (user_id,campus_id,status,verified_at) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','verified', now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','pending', null),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','verified', now());

-- Verify access as authenticated user A. SET LOCAL inside transaction
-- prevents leaked JWT claims between test cases.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);

do $$
begin
  if not private.can_access_campus('11111111-1111-4111-8111-111111111111') then
    raise exception 'Verified approved member incorrectly denied';
  end if;
  if (select count(*) from public.campuses) <> 1 then
    raise exception 'Campus RLS leaks another campus';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Profile RLS leaks another account';
  end if;
  if (select count(*) from public.campus_memberships) <> 1 then
    raise exception 'Membership RLS leaks another account';
  end if;
end $$;

-- User may edit their own display name but not their account status.
update public.profiles set display_name = 'Alex' where id =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$
begin
  if (select display_name from public.profiles) <> 'Alex' then
    raise exception 'Allowed profile display_name edit failed';
  end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
begin
  if private.can_access_campus('11111111-1111-4111-8111-111111111111') then
    raise exception 'Pending member was granted campus access';
  end if;
  if exists (select 1 from public.campuses) then
    raise exception 'Pending member can see restricted campuses';
  end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
begin
  if private.can_access_campus('22222222-2222-4222-8222-222222222222') then
    raise exception 'Disabled campus granted access';
  end if;
end $$;
rollback;

begin;
set local role anon;
do $$
begin
  if has_table_privilege('anon','public.profiles','SELECT') then
    raise exception 'Anonymous role has profile select';
  end if;
  if has_table_privilege('anon','public.campus_memberships','SELECT') then
    raise exception 'Anonymous role has membership select';
  end if;
end $$;
rollback;

do $$
begin
  if has_table_privilege('authenticated','public.campus_memberships','UPDATE') then
    raise exception 'Client can edit membership status';
  end if;
  if has_table_privilege('authenticated','public.profiles','UPDATE') then
    raise exception 'Client has table-wide profile update';
  end if;
  if has_column_privilege('authenticated','public.profiles','account_status','UPDATE') then
    raise exception 'Client can elevate/unsuspend account_status';
  end if;
  if has_table_privilege('authenticated','private.enabled_campuses','SELECT') then
    raise exception 'Client can inspect private allowed scopes';
  end if;
  if has_schema_privilege('authenticated','private','CREATE') then
    raise exception 'Client can create objects in private schema';
  end if;
end $$;

-- Operationally revoked membership must take effect without JWT refresh.
update public.campus_memberships set status = 'revoked', verified_at = null
 where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
begin
  if private.can_access_campus('11111111-1111-4111-8111-111111111111') then
    raise exception 'Revoked member still allowed access';
  end if;
end $$;
rollback;

select 'identity RLS tests: passed' as result;
