# Launch operations continuation

Recorded 2026-10-12. Branch `feat/launch-operations` starts from the current merged
fork main `8777fb1`, including admin main merge `edf4d51`. No deployed app, hosted
schema, bucket, credentials, production flag or user data was changed.

## Implemented here

- Bounded page navigation for Explore sale/rent, owned sale/rental lists, inbox,
  offer conversations, rental bookings, sale transactions, saved items,
  notifications and conversation message history. Filters survive navigation;
  timestamp ties are ordered by ID. One extra row detects a following page.
  Offset windows are limited to 1,000 pages. Concurrent inserts/deletes can shift
  offset pages; this is not a snapshot or an unlimited-history export.
- Offers are filtered before pagination using the existing PostgREST FK join,
  eliminating the previous 50-conversation/500-offer discovery cutoff.
- Active-campus preference from an HttpOnly cookie. Both selection and every
  read/write context recheck current RLS eligibility. A cookie grants no access;
  revoked selection falls back to an eligible campus. Selector appears only when
  the verified account has multiple eligible campuses. Private conversation and
  exchange recovery remain participant-authorized across eligible campuses.
- RLS-protected message/offer publication; opt-in browser subscriptions trigger
  server refresh without rendering websocket payloads. Debounced refresh,
  foreground recovery, per-minute authoritative refetch and channel/auth/timer
  cleanup. History remains readable under the existing block contract; blocking
  prevents new interactions. Revocation is not guaranteed instantly and already
  displayed messages cannot be recalled from a recipient's device.
- Private job endpoints `/api/jobs/notifications`, `/api/jobs/maintenance`, and
  `/api/jobs/health`, authenticated using a timing-safe Bearer secret comparison
  (minimum 32 characters), no-store responses, generic failures and explicit
  HEAD denial. Service keys are confined to server-only code. Existing durable
  outbox leases make concurrent notifications safe; GET is intended for trusted
  schedulers, not public links. Each notification call processes at most 5 jobs.
- Opt-in GitHub Actions scheduler, bounded to 5 notification batches per run,
  counter pruning and health check; no dependencies or raw response/secret logs.
  `ENABLE_BACKEND_SCHEDULES=true` and repository secrets/variables are required.
  It is inactive by default. GitHub schedule timing is best-effort; it is not an
  email delivery SLA or a substitute for capacity measurements/external alerts.
- Explicit `FRONTEND_PREVIEW=false` activation option. Current testing behavior
  remains the default; all existing mutation gates remain disabled by default.

## Activation order and remaining gates

1. Identify intended Supabase project and review current migration ledger; apply
   migrations including the new narrow realtime publication in staging first.
   Do not apply test fixtures or historical root SQL to a real project.
2. Configure real Auth SMTP/origins/email confirmations and trusted campus/staff
   provisioning; test two approved accounts and denied/cross-campus users.
3. Verify real uploads/concurrency/signed URLs and registration failure recovery.
   Reservation/grace-based orphan deletion is NOT implemented here and remains
   pending; this change deletes no files. Do not automate deletion on age alone.
4. Configure private service/email keys and verified sending domain. Set the
   same random CRON_SECRET in Vercel and the admin repository Actions secrets;
   set repository APP_ORIGIN variable to the intended HTTPS origin. Validate
   endpoints manually, then opt into ENABLE_BACKEND_SCHEDULES. Review actual
   queue capacity; up to 25 events per nominal 5-minute run is not unlimited.
5. Test actual PostgREST offer join, page 2+ for each screen, campus switching,
   websocket publication/auth/current RLS, reconnect, logout and revocation.
   Offer history inside a conversation still has its existing 30-row cap, rental
   condition notes 50-row cap and moderation list needs pagination review.
6. Complete host-level read/IP/write-attempt limits and provider Auth/Storage
   limits. Existing successful-write budgets do not cover these request paths.
   Vercel firewall discovery returned 404 even with the known explicit team;
   no custom firewall state was assumed and no policy was overwritten.
7. Wire failures/health to external alerts and application error reporting;
   validate managed DB plus independent file-byte backups and actual restore.
   Run staging load tests, rollback drill and real end-to-end transactions.
8. Only after those gates, set FRONTEND_PREVIEW=false and activate required write
   flags in a supervised pilot. Local/source/fixture tests cannot clear live gates.

## Verification

Unit tests: 46 passed. TypeScript and ESLint passed. Production build, HTTP,
responsive Chromium and native database checks are recorded on the PR after
observed results. Native SQL catalog test 22 verifies publication scope and
anonymous denial. HTTP smoke checks all job endpoints reject missing credentials
and HEAD cannot invoke work. Hosted checks above are still unverified.
