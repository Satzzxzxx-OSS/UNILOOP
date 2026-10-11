# Notification outbox: implementation and activation boundary

Recorded 2026-10-11. This is a transactional event/worker foundation, not an
activated email integration. Existing in-app notification behavior remains.

## Implemented contract

New notification rows enqueue one private event in the same PostgreSQL transaction.
A rolled-back notification cannot leave an orphan event. Historical notifications
are not replayed. Payloads contain IDs/category, not email addresses or message
bodies. Deleting a notification also deletes its event; this is notification
delivery work, not a permanent business audit ledger.

Only `service_role` may execute the three worker RPCs. Public, anonymous and user
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
2. Implement a delivery adapter using the approved provider. Resolve current
   notification, recipient identity, preferences and eligibility before sending;
   suppress deleted/revoked/opted-out recipients according to agreed policy.
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

No email provider, cron endpoint, Redis queue, SMTP delivery, credentials or live
deployment is configured by this change. Provider/worker hosting stays a separate
activation gate; frontend preview remains available for existing testing.
