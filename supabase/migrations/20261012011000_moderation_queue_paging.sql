begin;
create function public.get_open_listing_reports_page(page_number integer default 1)
returns table(report_id uuid,listing_id uuid,reason text,details text,created_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not private.is_market_moderator() then
  raise exception 'Not authorized' using errcode='42501';end if;
 if page_number is null or page_number<1 or page_number>1000 then
  raise exception 'Invalid page' using errcode='22023';end if;
 return query select r.id,r.listing_id,r.reason,r.details,r.created_at
 from public.listing_reports r where r.status='open'
 order by r.created_at asc,r.id asc limit 25 offset (page_number-1)*24;
end;
$$;
revoke all on function public.get_open_listing_reports_page(integer) from public,anon,authenticated,service_role;
grant execute on function public.get_open_listing_reports_page(integer) to authenticated;
commit;
