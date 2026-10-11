-- Backend foundation audit: preserve existing identities and narrow internal
-- trigger execution. No campus enrollment, role or launch flag is fabricated.
begin;

-- The Auth insert trigger only sees future signups. Repair pre-existing users
-- without overwriting names, suspension/closure decisions or timestamps.
insert into public.profiles(id)
select u.id from auth.users u
on conflict (id) do nothing;

-- Trigger execution is internal; clients do not need EXECUTE on these functions.
-- PostgreSQL checks trigger-function permission when the trigger is created;
-- revoking direct EXECUTE does not disable the existing triggers.
revoke all on function private.create_profile_for_auth_user() from public,anon,authenticated;
revoke all on function private.listing_touch_updated_at() from public,anon,authenticated;
revoke all on function private.listing_requires_photo() from public,anon,authenticated;
revoke all on function private.rental_active_requires_photo() from public,anon,authenticated;
revoke all on function private.notify_on_sale_message() from public,anon,authenticated;
revoke all on function private.notify_on_sale_offer() from public,anon,authenticated;
revoke all on function private.notify_on_rental_booking() from public,anon,authenticated;
revoke all on function private.notify_on_sale_completion() from public,anon,authenticated;
revoke all on function private.prevent_premature_sold_status() from public,anon,authenticated;
revoke all on function private.prevent_unavailable_rental_request() from public,anon,authenticated;

-- These defaults apply to objects subsequently created by THIS migration role,
-- not every role in the project. Policy helpers/RPCs still require explicit grants.
alter default privileges in schema private revoke execute on functions from public;

commit;
