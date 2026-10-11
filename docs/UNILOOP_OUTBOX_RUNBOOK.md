# Notification outbox: implementation and activation boundary

Recorded 2026-10-11. This is a transactional event/worker foundation, not an
activated email integration. Existing in-app notification behavior remains.

## Implemented contract

New notification rows enqueue one private event in the same PostgreSQL transaction.
A rolled-back notification cannot leave an orphan event. Historical notifications
are not replayed. Payloads contain IDs/category, not email addresses or message
bodies. Deleting a notification also deletes its event; this is notification
delivery work, not a permanent business audit ledger.

Only `service_role` may execute worker, delivery-context and job-health RPCs. Public, anonymous and user
roles cannot claim work, acknowledge it or record failures. Direct outbox table
privileges are revoked, including for the service role. Privileged database
operators remain trusted administrators; credentials must stay server-side.

Claims use row locks with `SKIP LOCKED`, batches of at most 20 and two-minute
leases. The TypeScript worker requests five and runs bounded handlers in parallel.
Each claim gets a new lease token; stale/expired acknowledgements are rejected.
Acknowledgement can retry with the same completed token. Failed work backs off
from 60 seconds; after five attempts it becomes `dead`. An abandoned final lease
is also moved to `dead` on the next claim. Failure records use fixed codes and
never store arbitrary exception messages.

`apps/web/lib/jobs/outbox.ts` accepts an injected server RPC client and real
delivery handler. Handler timeout defaults to 15 seconds and is bounded at 30
seconds. Missing handlers reject before claiming. An uncertain acknowledgement
leaves lease recovery to the database rather than falsely recording delivery
failure. Summary counters contain no recipient information.

## Required before activation

1. Provision the intended staging database and apply reviewed migrations. Supply
   a service client only in the worker host, never in browser/public variables.
2. Configure and verify the implemented optional Resend adapter and verified
   sender domain in staging. Delivery lookup checks current confirmed email,
   both participants' active/verified campus access, enabled campus/category,
   blocks and source availability. Missing/disabled saved preferences suppress
   outbound email. Only message/offer emails are supported by existing preferences;
   rental/sale emails remain suppressed. In-app notifications still exist.
3. Use the stable event ID as the provider idempotency key and verify its retention
   window against the maximum retry/recovery interval. The contract is **at least
   once**; an external side effect followed by a crashed acknowledgement can be
   retried. A key alone does not establish permanent exactly-once delivery.
4. Honor the supplied AbortSignal. A timed-out handler that ignores cancellation
   may still complete its external side effect; provider deduplication is needed.
5. Configure authenticated worker scheduling, concurrency, provider timeouts,
   privacy-safe failure alerts, pending-age monitoring and dead-job review.
6. Verify staging crash recovery, simultaneous claims, provider failures, expired
   leases, opt-out/revocation and uncertain acknowledgement using real credentials.
   Never mark an event acknowledged with a placeholder/no-op handler.
7. Define retention and an operator-reviewed redrive procedure before production.
   No unrestricted redrive endpoint or automated replay is exposed in this slice.

## Implemented operator commands (2026-10-11 continuation)

`backend:notifications` runs exactly one batch using the Resend HTTPS API. It
requires `ENABLE_NOTIFICATION_EMAIL_DELIVERY=true` and private worker variables:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Intended HTTPS database API origin |
| `SUPABASE_SERVICE_ROLE_KEY` | Private worker authority; anonymous/user keys rejected before network access |
| `RESEND_API_KEY` | Private email-provider credential |
| `NOTIFICATION_EMAIL_FROM` | Verified sender address |
| `APP_ORIGIN` | HTTPS public app origin used in private workspace/settings links |

Do not use `NEXT_PUBLIC_` names for private credentials. These commands read the
worker environment; they never load an arbitrary local file or print credentials.
Supabase Auth SMTP remains separate: this adapter sends marketplace notifications,
not sign-in links. No Auth provider settings were changed.

The handler resolves recipient data using the current lease, then sends plain
text with a generic notification title and app link, without message bodies.
The stable event UUID forms the provider idempotency key. Resend documents a
24-hour key window; the database suppresses events older than 20 hours to avoid
sending stale work beyond that deduplication window. Suppressed events can be
acknowledged without sending; acknowledged therefore means processed, not
delivered. Configuration/payload changes during retries can cause provider
idempotency conflicts and require operator review rather than a new key.

Transport requests honor worker cancellation and reject redirects. Database RPCs
have bounded network deadlines. Non-success/invalid provider acknowledgements
remain failures; arbitrary provider response bodies never enter logs/outbox.
Provider acceptance is not proof of inbox delivery. Revocation is checked just
before send, not atomically with an external provider; staging must verify that
remaining race and provider behavior. Sending limits apply at the provider too;
worker concurrency and account-wide gateway limits require deployment tuning.

`backend:health` reads only counts, expired-lease count and oldest pending age from
the service-only health RPC. It exits nonzero for dead work, expired leases or
pending work older than one hour. Output explicitly covers **outbox only**, not
overall backend readiness. Wire it to private monitoring/alerts after deployment.

No provider credentials, worker schedule, Redis queue, SMTP configuration, live
emails or deployment are activated by this change. Provider/worker hosting stays
a separate activation gate; frontend preview remains available for testing.

Official transport references:
[send email](https://resend.com/docs/api-reference/emails/send-email),
[idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys).
