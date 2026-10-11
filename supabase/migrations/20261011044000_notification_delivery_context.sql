-- Worker-only recipient lookup; re-evaluate identity/preferences at delivery.
-- Only existing message/offer email preferences authorize outbound email.
begin;
create function public.get_notification_delivery_context(requested_event uuid,requested_lease uuid)
returns table(eligible boolean,recipient_email text,title text,link_path text,suppression_code text)
language plpgsql volatile security definer set search_path=''
as $$
declare
 notice public.notifications%rowtype; event_created timestamptz;
 prefs public.notification_preferences%rowtype; thread public.sale_conversations%rowtype;
 sale public.listings%rowtype; other_user uuid; email_address text; reason text;
begin
 select n.*,e.created_at into notice.id,notice.user_id,notice.category,notice.title,
  notice.link_path,notice.created_at,notice.read_at,event_created
 from private.outbox_events e join public.notifications n on n.id=e.notification_id
 where e.id=requested_event and e.status='leased' and e.lease_token=requested_lease
  and e.leased_until>clock_timestamp() for share of e;
 if not found then raise exception 'Delivery lease unavailable' using errcode='42501'; end if;
 if event_created<clock_timestamp()-interval '20 hours' then reason:='expired';
 elsif notice.category not in ('message','offer') then reason:='channel_disabled';
 elsif notice.read_at is not null then reason:='already_read';
 else
  select * into prefs from public.notification_preferences where user_id=notice.user_id;
  if not found or (notice.category='message' and not prefs.email_messages)
   or (notice.category='offer' and not prefs.email_offers) then reason:='preference_disabled';
  else
   select * into thread from public.sale_conversations
    where id=split_part(notice.link_path,'/',3)::uuid;
   if not found or notice.user_id not in (thread.buyer_id,thread.seller_id) then
    reason:='source_unavailable';
   else
    other_user:=case when notice.user_id=thread.buyer_id then thread.seller_id else thread.buyer_id end;
    select * into sale from public.listings where id=thread.listing_id;
    if not found or sale.status='removed'
      or not exists(select 1 from public.categories where slug=sale.category_slug and enabled)
      or not exists(select 1 from private.enabled_campuses where campus_id=sale.campus_id and enabled)
      or not private.sale_counterparty_eligible(notice.user_id,sale.campus_id)
      or not private.sale_counterparty_eligible(other_user,sale.campus_id)
      or private.sale_participants_blocked(notice.user_id,other_user) then reason:='access_revoked';
    else
     select u.email into email_address from auth.users u where u.id=notice.user_id;
     if email_address is null or btrim(email_address)='' then reason:='recipient_unavailable'; end if;
    end if;
   end if;
  end if;
 end if;
 if reason is not null then
  return query select false,null::text,null::text,null::text,reason;
 else
  return query select true,email_address,notice.title,notice.link_path,null::text;
 end if;
end;
$$;
revoke all on function public.get_notification_delivery_context(uuid,uuid)
 from public,anon,authenticated,service_role;
grant execute on function public.get_notification_delivery_context(uuid,uuid) to service_role;
commit;
