-- Atomic successful-write budgets, independent of application feature flags.
-- Not an HTTP/IP limiter: failed/rolled-back attempts do not consume a budget.
begin;
create table private.marketplace_write_limits (
 operation text primary key,
 window_seconds integer not null check(window_seconds in (60,3600)),
 max_writes integer not null check(max_writes between 1 and 1000)
);
insert into private.marketplace_write_limits values
 ('sale_draft',3600,10),('rental_draft',3600,10),
 ('conversation',3600,30),('message',60,60),('offer',3600,30),
 ('rental_request',3600,20),('report',3600,10);
create table private.marketplace_write_usage (
 user_id uuid not null references public.profiles(id) on delete cascade,
 operation text not null references private.marketplace_write_limits(operation),
 window_start timestamptz not null,
 used integer not null check(used>0),
 primary key(user_id,operation,window_start)
);
create index marketplace_write_usage_retention_idx
 on private.marketplace_write_usage(window_start);
revoke all on private.marketplace_write_limits,private.marketplace_write_usage
 from public,anon,authenticated,service_role;

create function private.enforce_marketplace_write_budget()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
 caller uuid:=auth.uid(); actor uuid; operation_name text; actor_column text;
 seconds integer; maximum integer; bucket timestamptz; consumed integer;
begin
 -- Trusted maintenance without a user JWT is outside user budgets. Anonymous
 -- and unauthenticated API writes remain denied by existing grants/RLS/RPCs.
 if caller is null then return new; end if;
 if tg_table_schema<>'public' or tg_op<>'INSERT' then
  raise exception 'Invalid budget attachment' using errcode='22023'; end if;
 case tg_table_name
  when 'listings' then operation_name:='sale_draft';actor_column:='owner_id';
  when 'rental_listings' then operation_name:='rental_draft';actor_column:='owner_id';
  when 'sale_conversations' then operation_name:='conversation';actor_column:='buyer_id';
  when 'sale_messages' then operation_name:='message';actor_column:='sender_id';
  when 'sale_offers' then operation_name:='offer';actor_column:='proposer_id';
  when 'rental_bookings' then operation_name:='rental_request';actor_column:='renter_id';
  when 'listing_reports' then operation_name:='report';actor_column:='reporter_id';
  else raise exception 'Invalid budget attachment' using errcode='22023';
 end case;
 actor:=(to_jsonb(new)->>actor_column)::uuid;
 if actor is distinct from caller then
  raise exception 'Not authorized' using errcode='42501'; end if;
 select window_seconds,max_writes into seconds,maximum
 from private.marketplace_write_limits where operation=operation_name;
 if not found then raise exception 'Write budget unavailable' using errcode='55000'; end if;
 bucket:=to_timestamp(floor(extract(epoch from clock_timestamp())/seconds)*seconds);
 -- ON CONFLICT serializes concurrent writes to the same account/bucket. Only
 -- actual INSERTs fire this AFTER trigger; canonical retries consume nothing.
 insert into private.marketplace_write_usage as usage(user_id,operation,window_start,used)
 values(caller,operation_name,bucket,1)
 on conflict(user_id,operation,window_start) do update set used=usage.used+1
 where usage.used<maximum
 returning used into consumed;
 if not found then
  raise exception 'Write limit reached. Try again later.' using errcode='PT429';
 end if;
 return new;
end;
$$;
revoke all on function private.enforce_marketplace_write_budget()
 from public,anon,authenticated,service_role;
create trigger budget_sale_draft after insert on public.listings
 for each row execute function private.enforce_marketplace_write_budget();
create trigger budget_rental_draft after insert on public.rental_listings
 for each row execute function private.enforce_marketplace_write_budget();
create trigger budget_conversation after insert on public.sale_conversations
 for each row execute function private.enforce_marketplace_write_budget();
create trigger budget_message after insert on public.sale_messages
 for each row execute function private.enforce_marketplace_write_budget();
create trigger budget_offer after insert on public.sale_offers
 for each row execute function private.enforce_marketplace_write_budget();
create trigger budget_rental_request after insert on public.rental_bookings
 for each row execute function private.enforce_marketplace_write_budget();
create trigger budget_report after insert on public.listing_reports
 for each row execute function private.enforce_marketplace_write_budget();

create function public.prune_marketplace_write_usage(batch_size integer default 1000)
returns integer language plpgsql security definer set search_path=''
as $$
declare removed integer;
begin
 if batch_size is null or batch_size not between 1 and 10000 then
  raise exception 'Invalid cleanup batch' using errcode='22023'; end if;
 with expired as (
  select user_id,operation,window_start from private.marketplace_write_usage
  where window_start<clock_timestamp()-interval '2 days'
  order by window_start limit batch_size for update skip locked
 ) delete from private.marketplace_write_usage u using expired e
 where u.user_id=e.user_id and u.operation=e.operation and u.window_start=e.window_start;
 get diagnostics removed=row_count;
 return removed;
end;
$$;
revoke all on function public.prune_marketplace_write_usage(integer)
 from public,anon,authenticated,service_role;
grant execute on function public.prune_marketplace_write_usage(integer) to service_role;
commit;
