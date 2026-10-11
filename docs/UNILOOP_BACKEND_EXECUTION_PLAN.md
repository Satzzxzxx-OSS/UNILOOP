# UNILOOP backend: recovered architecture and execution plan

Recorded 2026-10-10. Source baseline: original `meshishu/UNILOOP` main
`43794b363de6abbb1cfc7d118e21c37a79c690ad` (merged selected UI PR #13).
Working branch: `feat/backend-readiness-plan`.

## Authority and scope

The owner's instruction is audit → current official research → plan → build,
one stage at a time. Recover the agreed architecture before implementation.
This document reconciles recovered personal context with repository evidence;
it does not claim to reproduce a missing original architecture file verbatim.
FinCoPilot is a visual reference, not UNILOOP's backend architecture.

Preserve existing UI, preview navigation, data, routes and domain behavior.
No hosted database migration, deployment, provider configuration or auth switch
has been performed by this planning work. This is an initial architecture and
domain inventory, not a completed line-by-line security audit.

## Recovered architecture

Use a **modular monolith**, with event-driven background processing and a
**Python FastAPI sidecar only for specialized asynchronous intelligence**.
Keep transactional marketplace operations in the TypeScript/PostgreSQL core.

| Layer | Previously agreed direction | Current repository evidence |
| --- | --- | --- |
| Application | Next.js App Router, React, TypeScript | Implemented; Server Actions and domain modules |
| Database / identity / files | Supabase PostgreSQL, Auth, Storage, Realtime | SQL migrations, SSR clients, RLS and storage policies exist; hosted verification and Realtime subscriptions not established |
| Contracts / data tooling | Zod and Drizzle | Not installed; pure validators and authenticated Supabase SDK queries currently used |
| Async processing | Transactional outbox, Redis/queue, Upstash | Not implemented; notification triggers currently create in-app database rows |
| Search | PostgreSQL full-text first, semantic search later | Current search uses title ILIKE with a result cap; not full-text |
| Specialist intelligence | Python FastAPI; Railway/Fly.io as hosting options | Deferred; no sidecar implementation found |
| Delivery / monitoring | Vercel, GitHub Actions, Sentry, PostHog, pnpm | Vercel/GitHub CI workflow exists; Sentry/PostHog integration not found |

Native SQL migrations remain the current schema authority. Drizzle adoption must
be a deliberate compatibility decision, not a second competing migration chain.
Ordinary user operations must retain authenticated request context and RLS;
introducing a privileged direct database connection must not silently bypass
those protections. Zod can be introduced incrementally at existing contract
boundaries after auditing their actual requirements.

## Current domain inventory

Ten ordered migrations exist under `supabase/migrations`, covering:

1. Identity, campus membership and trusted campus eligibility.
2. Sale listings and categories.
3. Sale listing media and private Storage access.
4. Conversations, messages, offers and user blocks.
5. Favorites, preferences, reports and moderation roles/audit.
6. Rental listings, blocked dates, booking lifecycle and condition notes.
7. Rental media.
8. Sale transactions, independent exchange confirmations and reviews.
9. In-app notifications.
10. Sale completion and rental availability guardrails.

Corresponding modules exist in `apps/web/lib/auth`, `supabase`, `listings`,
`interactions`, `rentals`, `sales`, `trust` and `notifications`. Disposable
PostgreSQL tests cover these domains in `supabase/tests`.

Previous code commit `c229d7819dbe027c8c4b66a1ea643e154ec4655a` had successful
web and database jobs in fork CI run `38079896292`. This establishes repository
test evidence, **not** hosted Supabase Auth/SMTP/Storage end-to-end evidence.
Historical checklist statements saying rentals or sale completion are wholly
unimplemented are stale; payment custody/escrow is still not implemented.

## Constraints and audit questions

- `FRONTEND_PREVIEW = true` is an intentional owner-requested testing mode.
  Navigation does not create a real identity. Preserve it until a separately
  planned environment boundary and real hosted auth are ready. Do not release
  production with unreviewed preview behavior.
- UI/write feature flags are not database authorization boundaries. Audit direct
  authenticated API/RPC access against RLS, grants and trusted campus membership.
- Campus context currently selects the first eligible campus. Validate the
  intended multi-campus behavior before changing that contract.
- Verify email-confirmation, revoked-session and campus-approval behavior against
  real provider settings and direct API paths; do not infer provider behavior
  solely from an application's helper.
- Notifications are in-app records, not a durable external-delivery outbox.
- Search and manual message refresh are real existing behavior; full-text search
  and Realtime remain planned work rather than already-integrated features.
- Examine SECURITY DEFINER ownership, search_path and EXECUTE grants explicitly,
  including trigger functions. A static grep alone does not prove exploitability.
- Preserve the rental exclusion constraint as the concurrency authority; an
  availability precheck alone cannot prevent concurrent overlapping approvals.
- Review old-user profile backfill, trusted campus provisioning, media limits,
  orphan cleanup, retries, idempotency and moderation operations.
- Never run historical `uniloop_completeALL.sql` against PostgreSQL. Never apply
  disposable test Auth/Storage fixtures to a hosted Supabase project.

## Official research and decisions

Research checked 2026-10-10; revisit the relevant source at each build stage.

| Official source | Implication for UNILOOP |
| --- | --- |
| [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [advanced SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide) | Use verified identity; cookie session data alone is not authorization. JWT signature/expiry checking differs from checking current server-side session state. |
| [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [database functions](https://supabase.com/docs/guides/database/functions) | Audit user policies, function ownership, fixed search paths and narrow grants together. |
| [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) | Verify real object operations under user RLS; service credentials bypass policies and cannot enter browser code. |
| [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) and [SMTP](https://supabase.com/docs/guides/auth/auth-smtp) | Hosted auth/email and abuse protection are explicit readiness work, not implied by local tests. |
| [Upstash rate limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) | Fits the planned serverless stack; model limits at every reachable trust boundary, not only UI actions. |
| [Drizzle with Supabase](https://orm.drizzle.team/docs/connect-supabase) | Integration is supported, but decide migration ownership and authenticated access before adoption. |
| [Supabase Queues](https://supabase.com/docs/guides/queues) | A possible evaluated queue option, not an approved architecture replacement. External side effects still need idempotency/retry design. |

## Ordered execution gates

### Gate 0 — recover and reconcile

- [x] Recover prior architecture from personal context.
- [x] Locate current domain modules, ten migrations and database test suite.
- [x] Reconcile implemented versus planned capabilities and stale checklist claims.
- [x] Research official identity, RLS, Storage, SMTP and planned tooling guidance.
- [ ] Complete detailed per-file backend audit; current inventory is only its start.

### Gate 1 — identity and staging foundation (next bounded work)

- [ ] Audit auth/session/config/proxy/callback and identity migration/tests line by line.
- [ ] Record identity/campus contracts and exact allow/deny cases before code changes.
- [ ] Identify the intended hosted staging project and current migration state without
  exposing credentials or treating another provider as an automatic replacement.
- [ ] Plan an explicit preview-versus-verified environment boundary; preserve current
  frontend testing until the real authentication path has been verified.
- [ ] Verify trusted campus provisioning, existing-user backfill, unconfirmed email,
  session expiry/revocation and multi-campus isolation.
- [ ] Add only evidence-backed fixes and meaningful regression tests; then run the
  relevant existing checks. Google OAuth remains deferred.

Exit evidence: audited contract map, passing local allow/deny tests, and a clearly
separate hosted verification record. Missing hosted access is a reported blocker,
not permission to manufacture a passing result or turn off protections.

### Gate 2 — domain integrity and files

- [ ] Audit listings → media → conversations/offers → rentals → sales/reviews →
  saved/report/moderation → notifications in dependency order.
- [ ] Check RLS/grants, transition constraints, cross-campus/participant denial,
  concurrency, idempotency and pagination for each domain.
- [ ] Verify Storage MIME/size/ownership policies, rollback/orphan behavior and cleanup.
- [ ] Decide Zod/Drizzle boundaries explicitly; preserve migration ownership.

### Gate 3 — hosted vertical slices

- [ ] Verify real email sign-in/callback/logout with the configured email provider.
- [ ] Exercise two approved users and an unapproved/cross-campus user through
  listing upload, chat/offer, sale confirmation/review and rental transitions.
- [ ] Verify real Storage signed URLs and direct RPC denial cases.
- [ ] Enable existing capabilities only after their hosted checks pass.

### Gate 4 — operational protection and async delivery

- [ ] Plan and implement abuse/rate controls for reachable endpoints and direct API
  operations; define moderation provisioning and audit operations.
- [ ] Implement the approved transactional outbox/worker boundary, deduplication,
  retries and failure recovery for real external-delivery needs.
- [ ] Verify notification preferences and private Realtime authorization/revocation
  before enabling live delivery. Do not add unrelated marketplace features.

### Gate 5 — pilot readiness

- [ ] Privacy-aware monitoring, error reporting and operational alerts.
- [ ] Backup/restore verification, load/concurrency checks and release runbook.
- [ ] Production auth boundary and rollback review; supervised pilot evidence.
- [ ] Python intelligence and semantic search only after a concrete requirement,
  keeping the previously agreed transactional core intact.

## Continuation rule

Start the next backend session at Gate 1. Append actual files changed, checks,
commit/PR and hosted evidence after each bounded slice. Never mark a checkbox
complete from plans, screenshots or local fixtures alone.
