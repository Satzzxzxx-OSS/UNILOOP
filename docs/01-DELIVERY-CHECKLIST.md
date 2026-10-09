# UNILOOP — Incremental delivery checklist

## Gate 00 — Baseline
- [x] Read complete GitHub tree and baseline branch SHA.
- [x] Inspect static HTML, CSS, JavaScript and SQL header/architecture.
- [x] Preserve the original demo untouched on the working branch.

## Gate 01 — Product foundation
- [x] One-account / buy-sell-rent-rent-out domain direction documented.
- [x] Initial categories as a proposed public discovery taxonomy.
- [ ] Approve identity, eligibility, restricted categories and rental operating policies.
- [ ] Approve final design tokens with real-user visual testing.

## Gate 02 — Application scaffold
- [x] Add isolated Next.js App Router application under apps/web.
- [x] Add semantic navbar, discovery UI, transparent empty states.
- [x] Add basic pure-function tests for safe public URL parsing.
- [x] Resolve dependencies in GitHub Actions and commit pnpm lockfile.
- [x] Pass unit tests, typecheck, ESLint, and production build in GitHub Actions (pre-lockfile run).
- [ ] Reverify quality gates with frozen lockfile and complete browser E2E.
- [ ] Add reviewed Space UI components after source, bundle and accessibility checks.

## Next vertical slice
- Supabase PostgreSQL schema + migrations + row-level access design.
- Account identity and actual authentication.
- Profile and access policy before allowing real interactions.

Never represent planning, a static UI, or unrun tests as launched functionality.

## Gate 03 — Identity foundation (Step 02)
- [x] Supabase PostgreSQL identity migration with private launch scope.
- [x] Automated real PostgreSQL migration and RLS allow/deny checks.
- [x] Client/server cookie SSR wiring, sign-in link and safe auth callback.
- [x] No public self-enrollment: signInWithOtp shouldCreateUser=false.
- [x] Pin dependency lockfile and enforce frozen installs.
- [ ] Hosted Supabase preview project provisioning and migration dry-run.
- [ ] Configure SMTP, PKCE email link template, approved accounts and redirects.
- [ ] Test real email login, session refresh, signout, account bans and eligibility.
- [ ] Browser E2E, mobile accessibility and human security review.

## Gate 04 — Sale marketplace vertical slice (Step 03)
- [x] Curated taxonomy and listing table (draft/active/paused/sold/removed).
- [x] Owner/campus-aware RLS and server-side validated draft creation.
- [x] SQL-controlled listing lifecycle and invalid/concurrent transition checks.
- [x] Private photo bucket; MIME/size/path restrictions; metadata-backed display.
- [x] Publish requires at least one registered real image (database trigger).
- [x] Web routes: Sell draft, My Listings, Details, Buy discovery, image upload.
- [x] Negative tests for third-party access, cross-scope visibility, revocation.
- [x] GitHub CI: Next.js unit/typecheck/lint/build and 3 PG test databases.
- [ ] Production abuse moderation, quotas, cleanup, account deletion safeguards.
- [ ] Hosted Supabase Auth/Storage integration tests and real browser E2E.
- [ ] Signed-image privacy, image processing, load and accessibility reviews.
- [ ] Approved product policy for active selling, then audited pilot enablement.

## Gate 05 — Messaging and sale offers (Step 04)
- [x] One private sale conversation per listing+buyer.
- [x] Persisted text messages, sender derived from auth.uid(), nonce idempotency.
- [x] Row-level buyer/seller-only reads and narrow authorized write RPCs.
- [x] Offer/counter-offer/accept/reject/withdraw state machine.
- [x] Single accepted offer per listing; other pending offers retired on acceptance.
- [x] Block/unblock and suspended/revoked counterparty restrictions.
- [x] New Inbox, conversation and Offers UI with manual refresh.
- [x] SQL allow/deny tests on disposable PostgreSQL.
- [ ] Hosted Supabase staging login, RPC and authorization verification.
- [ ] Abuse moderation, rate limiting, content reporting and alerts.
- [ ] Private Realtime authorization and live browser test coverage.
- [ ] Payments, completed-sale confirmation and rental booking are not implemented.
