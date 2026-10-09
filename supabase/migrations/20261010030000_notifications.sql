-- Step 12: persisted private in-app notification inbox (NOT email delivery).
-- Event triggers write transactionally. No fake unread counters.
begin;

create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 category text not null check(category in ('message','offer','rental','sale')),
 title text not null check(char_length(title) between 3 and 120),
 link_path text not null check (
  link_path ~ '^/(inbox|rentals|transactions)/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 ),
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index notifications_user_unread_idx on
 public.notifications(user_id,created_at desc)
 where read_at is null;
create index notifications_user_history_idx on
 public.notifications(user_id,created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from public,anon,authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy notification_recipient_read on public.notifications
for select to authenticated using(user_id=(select auth.uid()));
create policy notification_recipient_mark_read on public.notifications
for update to authenticated
using(user_id=(select auth.uid()))
with check(user_id=(select auth.uid()));

create function private.notify_on_sale_message()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  thread public.sale_conversations%rowtype;
  recipient uuid;
begin
  select * into thread from public.sale_conversations where id=new.conversation_id;
  recipient:=case when new.sender_id=thread.buyer_id then thread.seller_id
    else thread.buyer_id end;
  insert into public.notifications(user_id,category,title,link_path)
    values(recipient,'message','New private message','/inbox/'||new.conversation_id::text);
  return new;
end;
$$;
create trigger notify_after_private_message
after insert on public.sale_messages for each row
execute function private.notify_on_sale_message();

create function private.notify_on_sale_offer()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='INSERT' then
    insert into public.notifications(user_id,category,title,link_path)
    values(new.recipient_id,'offer','New price offer','/inbox/'||new.conversation_id::text);
  elsif new.status is distinct from old.status then
    insert into public.notifications(user_id,category,title,link_path)
    values(new.proposer_id,'offer','Your offer status changed',
      '/inbox/'||new.conversation_id::text);
  end if;
  return new;
end;
$$;
create trigger notify_sale_offer_insert
after insert on public.sale_offers for each row
execute function private.notify_on_sale_offer();
create trigger notify_sale_offer_status
after update of status on public.sale_offers for each row
execute function private.notify_on_sale_offer();

create function private.notify_on_rental_booking()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  recipient uuid;
begin
  if tg_op='INSERT' then
    recipient:=new.owner_id;
    insert into public.notifications(user_id,category,title,link_path)
      values(recipient,'rental','New rental request','/rentals/'||new.id::text);
  elsif new.status is distinct from old.status then
    recipient:=case when new.status='cancelled' then new.owner_id
      else new.renter_id end;
    insert into public.notifications(user_id,category,title,link_path)
      values(recipient,'rental','Rental booking status changed','/rentals/'||new.id::text);
  end if;
  return new;
end;
$$;
create trigger notify_rental_request
after insert on public.rental_bookings for each row
execute function private.notify_on_rental_booking();
create trigger notify_rental_status
after update of status on public.rental_bookings for each row
execute function private.notify_on_rental_booking();

create function private.notify_on_sale_completion()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.status='completed' and old.status is distinct from new.status then
    insert into public.notifications(user_id,category,title,link_path)
    values(new.buyer_id,'sale','Sale handover complete','/transactions/'||new.id::text),
          (new.seller_id,'sale','Sale handover complete','/transactions/'||new.id::text);
  end if;
  return new;
end;
$$;
create trigger notify_completed_sale_exchange
after update of status on public.sale_transactions for each row
execute function private.notify_on_sale_completion();

-- The notification inbox is private; outbound email requires a real worker,
-- user consent, retry/idempotency, transport and monitoring, all separate.
commit;
