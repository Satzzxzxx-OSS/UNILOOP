# Backend foundation audit and first implementation

Owner-local date: 2026-10-11 (Asia/Kolkata).
Base: original main `43794b363de6abbb1cfc7d118e21c37a79c690ad`.
Branch: `feat/backend-readiness-plan`.
Architecture and remaining gates: [execution plan](UNILOOP_BACKEND_EXECUTION_PLAN.md).

## Implemented changes

| Finding | Evidence / change | Verification |
| --- | --- | --- |
| Disabled-category sale media could bypass listing visibility | Before the fix, a verified non-owner could read photo metadata and Storage objects while the parent listing was hidden. Reproduced with test 12 against the old helper. New migration aligns sale media category checks with listing visibility, retaining eligible owner access. | Regression fails before fix with `Disabled-category sale media leaked to another member`; passes after fix. |
| Existing Auth users did not automatically receive profiles | Original migration only installed a future INSERT trigger. New migration inserts missing profile IDs with `ON CONFLICT DO NOTHING`; no enrollment/role/name is inferred. | Pre-migration Auth fixture receives a profile but no campus/staff access; existing suspended profile/name/timestamp remain intact; new-user trigger still works. |
| Internal trigger EXECUTE permissions were inconsistent | Several internal functions retained default PUBLIC execution privileges. New migration revokes client execution on ten internal trigger functions and narrows future private-function defaults for the migration role. This is privilege hygiene, not a claim that ordinary trigger calls were an exploitable REST endpoint. | Catalog assertions inspect effective privileges and SECURITY DEFINER search paths; domain tests confirm triggers still run. |
| Profile update could report success after RLS filtered every row | An error-free UPDATE is not proof that a row changed. Save now requires the owned row returned by `UPDATE ... RETURNING`. | Unit regression covers null row, wrong row, database error and successful owned update. |
| Readiness status was easy to confuse with configured environment | Added offline migration fingerprints/configuration inventory. It never prints keys, performs network requests, runs SQL or claims hosted readiness. | Secret-shaped config rejection, output redaction, ordered hashing and duplicate-timestamp tests. |

No existing migration was rewritten. Two forward migrations were added. No UI,
preview access, data deletion, new provider, new marketplace feature or hosted
resource change is included.

## Checks completed locally

- 28 application unit tests passed.
- ESLint and TypeScript checks passed.
- Database tests 01, 02, 04, 05, 06, 07, 08, 09, 10, 11 and 12 passed in disposable
  embedded PostgreSQL using PGlite 0.3.14 and its btree_gist extension.
- Full ordered chain of twelve migrations passed in that local database.
- Backfill replay preserved an existing name and suspended account status.
- PostgreSQL 16 CI now includes upgrade fixtures, catalog security contract and
  disabled-category media regression. Local embedded PostgreSQL is not a
  substitute for that CI environment or the hosted Supabase services.

Production build passed. Production HTTP smoke passed for 24 routes, auth
denial, security headers and robots. GitHub PostgreSQL 16 CI and hosted Supabase
verification remain separate checks; do not infer their results from local passes.

## Research basis

Supabase's official [database function guidance](https://supabase.com/docs/guides/database/functions)
requires careful definer search paths and execution grants. Its
[SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
distinguishes current identity/session verification from JWT validation.
Current installed Next.js Server Actions documentation was read before modifying
the action: every action is an untrusted POST entry point and must authorize
independently of navigation or UI checks.

## Scope still outstanding

Source review covered all twelve migration files, auth/session/config/proxy/callback,
the domain actions/data/validators and both upload components. It is an initial
contract review, not exhaustive dependency, browser, penetration or concurrency
verification. Existing domain tests cover significant allow/deny and lifecycle
cases, but there has been no real hosted Auth/SMTP/Storage/Realtime E2E in this work.

The next audit/build slices still need:

1. Hosted project/migration reconciliation, trusted campus provisioning and real
   email sign-in/callback/logout; session expiry/revocation and direct API access.
2. Explicit testing/production auth-mode boundary. Current owner-requested frontend
   preview remains enabled and is a release blocker, not a real login session.
3. Rental counterparty suspension/revocation behavior, terminal-transition retries,
   nonce/payload mismatch semantics, multi-campus context and true concurrent
   transaction tests. Existing SQL fixture success does not settle these contracts.
4. Direct Storage upload quota races, orphan cleanup, actual MIME/byte enforcement,
   existing bucket configuration drift and image content processing. Previously
   issued signed URLs remain valid until expiry; policy changes are not immediate
   signed-URL revocation.
5. Abuse controls for every reachable API/RPC boundary, pagination/full-text search,
   private Realtime and operational moderation procedures.
6. Approved outbox/worker delivery, retries/deduplication/consent, observability,
   backup/restore and pilot/load/rollback verification.

Do not enable writes or declare full-stack production readiness from this PR.

## Commands

From `apps/web`, with Node supporting TypeScript stripping:

```sh
node --experimental-strip-types scripts/backend-readiness.mjs
node --experimental-strip-types scripts/backend-readiness.mjs --release-check
node --experimental-strip-types --test tests/*.test.mjs
```

Inventory exits 0 on successful collection. Release check deliberately exits 1
while hosted and operational evidence is unverified. Invalid invocation or unreadable
migration inventory exits 2. Environment variables are supplied by the caller;
this command does not load dotenv or turn configuration into verification proof.

Use existing CI for PostgreSQL 16 fixtures. **Never apply files under
`supabase/tests` to hosted Supabase.** Apply only reviewed forward migrations via
the project's normal migration process after checking remote migration history.
