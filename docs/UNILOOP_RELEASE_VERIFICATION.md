# Backend release evidence and hosted gates

Recorded 2026-10-11. The owner authorized backend implementation while retaining
existing frontend preview. Local/CI evidence is recorded separately from hosted
evidence. No real database configuration, data or deployed app was changed.

## Implemented regression gates

- Ordered forward migrations, identity backfill, table RLS/function grants and
  domain/campus allow-deny cases.
- Sale/rental exact retries, counterparty trust and exchange recovery.
- Private media access and per-parent upload serialization.
- Indexed full-text search with campus isolation.
- Atomic successful-write budgets and separate native competing transactions.
- Transactional outbox, leases, retry recovery, opt-out/revocation lookup, bounded
  optional email transport and privacy-safe worker metrics.
- Unit, lint, TypeScript, build, HTTP and responsive browser CI checks.
- Native fixture backup/restore into a second database: canonical row hashes/counts
  for application/Auth/Storage facade tables must match, then security contracts
  and indexed-search regression tests run on the restored database.

The fixture restore uses a disposable local PostgreSQL cluster with existing
fixture roles. It does not prove a fresh-cluster global-role recovery, a managed
Supabase restore, provider Auth/SMTP settings or recovery of Storage file bytes.
Database backups contain Storage metadata, not stored file contents. Dumps stay
private in the ephemeral runner, are deleted on exit and are not uploaded as CI
artifacts. The script refuses non-CI/non-local database targets.

## Activation order

1. Identify the intended Supabase staging project, region, access and current
   migration ledger. Review existing custom policies/hooks and bucket settings.
   Do not create a substitute provider/project or guess IDs/credentials.
2. Review/apply the ordered forward migrations. Use a suitable window for generated
   search columns/indexes. Never apply Auth/Storage test fixtures or historical
   `uniloop_completeALL.sql` to hosted Supabase.
3. Configure real email Auth/SMTP, allowed origins/callbacks and trusted campus
   approval/provisioning; keep user metadata out of privilege decisions.
4. With two approved users and a denied/cross-campus user, verify sign-in,
   confirmation/logout/revocation, drafts, actual uploads/signed URLs, direct RPCs,
   chat/offers, mutual sale confirmation/review and rental pickup/return.
5. Verify real Storage MIME/size/ownership/concurrency and provider rollback;
   define reservation/grace/retention rules before scheduled orphan cleanup.
6. Configure private notification transport/provider domain and worker/cleanup
   schedules; test suppression, provider failure, duplicate/crashed sends and
   account-wide delivery capacity. Auth SMTP and notification email are separate.
7. Complete gateway/IP/read/Auth/Storage abuse controls, pagination/multi-campus
   contract review and authorized Realtime. Database write budgets cover only
   successful creation, not those other request boundaries.
8. Wire private metrics to alerts/error reporting; verify managed database and
   independent file backups/restore, global roles/configuration and an agreed
   recovery objective. Test real load and cross-domain concurrent operations.
9. Review preview-versus-production auth boundary, environment flags and rollback
   before enabling writes in a supervised pilot. A successful build/green CI does
   not satisfy these hosted gates.

No hosted access/configuration was available during implementation. Readiness
CLI intentionally returns `not_verified` while these evidence gates are open.

Official references:
[Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod),
[Supabase backups](https://supabase.com/docs/guides/platform/backups),
[PostgreSQL restore](https://www.postgresql.org/docs/16/app-pgrestore.html).
