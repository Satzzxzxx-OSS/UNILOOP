-- Safety invariants on the previous full-chain test fixtures.
-- Run in the same disposable DB as 09_notifications_rls.sql.
\set ON_ERROR_STOP on

-- Buyer starts negotiation on the fixture's published sale listing.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare thread_id uuid;
begin
  select id into thread_id from public.sale_conversations
    where buyer_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    and listing_id='11111111-aaaa-4111-8111-111111111111';
  perform public.submit_sale_offer(thread_id,400,null,
    '99999999-9999-4999-8999-999999999999');
end;
$$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare accepted_offer uuid;
begin
  select id into accepted_offer from public.sale_offers where amount_inr=400;
  if public.resolve_sale_offer(accepted_offer,'accept')<>'accepted' then
    raise exception 'Test setup: offer was not accepted';
  end if;
  begin
    perform public.transition_sale_listing(
      '11111111-aaaa-4111-8111-111111111111','sold');
    raise exception 'Seller bypassed accepted-offer handover';
  exception when check_violation then null;
  end;
end;
$$;
commit;

-- A properly completed two-sided exchange must still be able to mark sold.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$
declare offer_id uuid;transaction_id uuid;
begin
  select id into offer_id from public.sale_offers where amount_inr=400;
  transaction_id:=public.start_sale_transaction(offer_id);
  if public.confirm_sale_exchange(transaction_id)<>'pending_handover' then
    raise exception 'Buyer single confirmation marked sold';
  end if;
end;
$$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$
declare transaction_id uuid;
begin
  select id into transaction_id from public.sale_transactions;
  if public.confirm_sale_exchange(transaction_id)<>'completed' then
    raise exception 'Mutual sale handover failed';
  end if;
  if (select status from public.listings
      where id='11111111-aaaa-4111-8111-111111111111')<>'sold' then
    raise exception 'Mutual sale handover did not transition listing to sold';
  end if;
end;
$$;
commit;

-- A new renter cannot request a currently confirmed rental date range.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
do $$
declare
  rental_uuid uuid := '33333333-aaaa-4333-8333-333333333333';
  from_day date := current_date+5;
  until_day date := current_date+7;
begin
  if exists(select 1 from public.rental_bookings) then
    raise exception 'A different renter can see private bookings';
  end if;
  begin
    perform public.request_rental_booking(rental_uuid,from_day,until_day,
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    raise exception 'Request succeeded on occupied rental dates';
  exception when check_violation then null;
  end;
  if exists (select 1 from public.rental_bookings
      where rental_id=rental_uuid) then
    raise exception 'Invalid rental attempt generated a visible booking row';
  end if;
end;
$$;
rollback;

select 'sale/rental state guardrails: passed' as result;
