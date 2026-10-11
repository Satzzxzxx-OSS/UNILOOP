-- Disposable fixture catalog check; actual hosted websocket tests remain required.
\set ON_ERROR_STOP on
begin;
do $$
begin
 if (select count(*) from pg_publication_tables where pubname='supabase_realtime'
  and schemaname='public' and tablename in ('sale_messages','sale_offers'))<>2 then
  raise exception 'Conversation tables missing from publication';
 end if;
 if exists(select 1 from pg_publication where pubname='supabase_realtime' and puballtables) then
  raise exception 'Unexpected all-table publication';
 end if;
 if exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
  and (schemaname<>'public' or tablename not in ('sale_messages','sale_offers'))) then
  raise exception 'Unexpected realtime table in fresh fixture';
 end if;
 if exists(select 1 from pg_class where oid in ('public.sale_messages'::regclass,'public.sale_offers'::regclass)
  and not relrowsecurity) then raise exception 'Realtime tables must have RLS';end if;
 if has_table_privilege('anon','public.sale_messages','SELECT')
  or has_table_privilege('anon','public.sale_offers','SELECT') then
  raise exception 'Anonymous realtime source access';end if;
end;
$$;
rollback;
