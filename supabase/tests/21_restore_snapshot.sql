-- CI-only snapshot: hashes/counts, not row contents. Never use as a hosted dump tool.
\set ON_ERROR_STOP on
create function pg_temp.fixture_snapshot()
returns jsonb language plpgsql as $$
declare item record; fingerprint jsonb; result jsonb:='[]'::jsonb;
begin
 for item in select n.nspname,c.relname from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','auth','storage') and c.relkind='r'
  order by n.nspname,c.relname loop
  execute format('select jsonb_build_object(''count'',count(*),''hash'',
   md5(coalesce(string_agg(md5(row_to_json(t)::text),'''' order by md5(row_to_json(t)::text)),'''')))
   from %I.%I t',item.nspname,item.relname) into fingerprint;
  result:=result||jsonb_build_array(jsonb_build_object(
   'table',item.nspname||'.'||item.relname,'data',fingerprint));
 end loop;
 return result;
end;
$$;
select pg_temp.fixture_snapshot();
