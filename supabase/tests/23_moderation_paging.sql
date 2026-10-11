\set ON_ERROR_STOP on
begin;
do $$
begin
 if has_function_privilege('anon','public.get_open_listing_reports_page(integer)','execute') then
  raise exception 'Anonymous moderation RPC';end if;
 if not has_function_privilege('authenticated','public.get_open_listing_reports_page(integer)','execute') then
  raise exception 'Authenticated execution missing';end if;
end;
$$;
set local role authenticated;
do $$
begin
 begin
  perform * from public.get_open_listing_reports_page(1);
  raise exception 'Non-staff moderation allowed';
 exception when insufficient_privilege then null;end;
end;
$$;
reset role;
rollback;
