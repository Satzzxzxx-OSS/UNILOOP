-- Publish only the two existing RLS-protected conversation tables.
-- No message payload is broadcast through an unprotected channel.
begin;
do $$
begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
  create publication supabase_realtime;
 end if;
 if exists(select 1 from pg_publication where pubname='supabase_realtime' and puballtables) then
  raise exception 'Realtime all-table publication requires operator review';
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sale_messages') then
  alter publication supabase_realtime add table public.sale_messages;
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sale_offers') then
  alter publication supabase_realtime add table public.sale_offers;
 end if;
end;
$$;
commit;
