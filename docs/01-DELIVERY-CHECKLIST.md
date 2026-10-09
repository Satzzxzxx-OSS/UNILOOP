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
