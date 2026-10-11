-- Run after the entire migration chain, in a DISPOSABLE fixture database only.
\set ON_ERROR_STOP on
begin;

do $$
declare
  relation record;
  fn record;
  role_name text;
begin
  -- Actual catalog state, including inherited/PUBLIC grants, rather than SQL grep.
  for relation in
    select c.oid,n.nspname,c.relname,c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','private') and c.relkind in ('r','p')
      and not exists(select 1 from pg_depend d where d.objid=c.oid
        and d.classid='pg_class'::regclass and d.deptype='e')
  loop
    if relation.nspname='public' and not relation.relrowsecurity then
      raise exception 'Public table without RLS: %',relation.relname;
    end if;
    if relation.nspname='private' then
      foreach role_name in array array['anon','authenticated'] loop
        if has_table_privilege(role_name,relation.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
          or has_any_column_privilege(role_name,relation.oid,'SELECT,INSERT,UPDATE,REFERENCES') then
          raise exception 'Client table/column grant on private table: %',relation.relname;
        end if;
      end loop;
    elsif relation.relname<>'categories' and (
      has_table_privilege('anon',relation.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege('anon',relation.oid,'SELECT,INSERT,UPDATE,REFERENCES')) then
      raise exception 'Anonymous grant on marketplace table: %',relation.relname;
    end if;
  end loop;

  for fn in
    select p.oid,p.proname,p.prosecdef,p.prorettype,p.proconfig,n.nspname
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private')
      and not exists(select 1 from pg_depend d where d.objid=p.oid
        and d.classid='pg_proc'::regclass and d.deptype='e')
  loop
    if has_function_privilege('anon',fn.oid,'EXECUTE') then
      raise exception 'Anonymous function execution: %.%',fn.nspname,fn.proname;
    end if;
    if fn.prosecdef and not exists(
      select 1 from unnest(fn.proconfig) as config(value)
      where value in ('search_path=""','search_path=')
    ) then
      raise exception 'Definer function without pinned empty search_path: %',fn.proname;
    end if;
    if fn.prorettype='trigger'::regtype
      and has_function_privilege('authenticated',fn.oid,'EXECUTE') then
      raise exception 'Client execution on internal trigger: %',fn.proname;
    end if;
  end loop;

  if has_column_privilege('authenticated','public.profiles','account_status','UPDATE')
    or has_table_privilege('authenticated','public.campus_memberships','INSERT,UPDATE,DELETE')
    or has_column_privilege('authenticated','public.listings','status','UPDATE')
    or has_column_privilege('authenticated','public.rental_listings','status','UPDATE')
    or has_table_privilege('authenticated','public.sale_transactions','INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated','public.rental_bookings','INSERT,UPDATE,DELETE') then
    raise exception 'Client can write trusted enrollment/state columns';
  end if;
end;
$$;

-- Full-chain CI seeds this Auth identity BEFORE the identity migration. Backfill
-- must restore its profile without granting enrollment or moderator privileges.
do $$
begin
  if not exists(select 1 from public.profiles
    where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' and account_status='active') then
    raise exception 'Pre-existing Auth user was not backfilled';
  end if;
  if exists(select 1 from public.campus_memberships
      where user_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
    or exists(select 1 from private.staff_roles
      where user_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') then
    raise exception 'Backfill fabricated marketplace/staff eligibility';
  end if;
  if not exists(select 1 from public.profiles
    where id='aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa'
      and display_name='Preserved name' and account_status='suspended'
      and created_at='2020-01-01T00:00:00Z') then
    raise exception 'Backfill overwrote an existing reviewed profile';
  end if;
end;
$$;

-- New Auth signup still creates exactly one profile after the grant tightening.
insert into auth.users(id,email)
values('ffffffff-ffff-4fff-8fff-ffffffffffff','new-after-backfill@example.test');
do $$
begin
  if (select count(*) from public.profiles
    where id='ffffffff-ffff-4fff-8fff-ffffffffffff')<>1 then
    raise exception 'Profile trigger stopped working after revoke';
  end if;
end;
$$;
rollback;
select 'backend security contract: passed' as result;
