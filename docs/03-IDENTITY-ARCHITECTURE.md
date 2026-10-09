# UNILOOP — Step 02 identity and authorization architecture

State: implemented foundation, **not deployed to a Supabase project**.
Baseline branch: feat/foundation-app-router-v1. Root T-SQL is historical; do not run.

## Authority and trust boundaries

- **Supabase Auth** exclusively owns credentials, OTP, email confirmation,
  sessions, refresh tokens and the \`auth.users\` identity store.
- **public.profiles** is non-credential information. Users may update
  only their display_name, never account_status.
- **public.campus_memberships** stores trusted verification state; users can
  read their own membership but cannot grant or change their membership.
- **private.enabled_campuses** is the non-public launch allowlist. It is
  provisioned by trusted operations, never by client code or public seed data.
- **private.can_access_campus(uuid)** consults the current database state:
  active profile + verified membership + enabled campus. It never relies on
  user-editable JWT metadata or email domain alone.
- No institution names or rollout rules are hard-coded in public website UI.
- Supabase \`anon\` role cannot read profiles or memberships. RLS also filters
  \`authenticated\` members by ownership and current campus eligibility.
- A signed-in user is **not** automatically permitted to post/rent/message.
  Each future mutation must validate both membership and transaction-specific
  ownership/state; data layer checks are mandatory.

## Database deployment and provisioning

Migration: \`supabase/migrations/20261009170000_identity_foundation.sql\`.

Apply the migration to a disposable Supabase preview project, then staging,
then production after review. It does **not** seed campuses, enabled scopes,
memberships or users. Trusted operators provision campuses and membership
records separately and audit changes. Private schema must not be enabled in
the Supabase Data API's Exposed Schemas configuration.

Critical existing-user case: auth users created before the trigger migration
will not automatically have public.profiles rows. Backfill missing profiles
in a separately reviewed, idempotent operation if necessary; do not assume a
new empty project without checking it first.

## Cookie-based SSR and sign-in

- Next.js 16 \`proxy.ts\` refreshes via \`getClaims()\` for session routes.
- \`auth.getUser()\` checks current Auth identity on private server pages.
- Never use \`getSession()\` as authorization evidence in server code.
- Session-refresh and account responses are marked private/no-store.
  Verify CDN cache behavior for response Set-Cookie headers during staging.
- Never deploy a Supabase service-role or secret key to browser/Next public env.
- Passwordless email currently uses \`shouldCreateUser: false\`; accounts
  must be provisioned by approved operational process. This prevents public
  auto-enrollment until signup and eligibility policies are reviewed.
- Supabase's email template must send links in PKCE token-hash form:
  \`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email\`.
  Set correct Site URL / allowed redirect URLs in Supabase Auth dashboard.
  See the official passwordless documentation before enabling email delivery.
- Real SMTP, abuse throttling, bot protection, secure email change and
  recovery flows must be configured/tested before launch.
- The callback only accepts a validated email token_hash and redirects
  to fixed local account routes. No open redirects from URL parameters.
- Revoking membership is checked against live database state, not stale JWT;
  for urgent account bans also apply Supabase Auth session controls.

## Implemented vs future data model

Implemented here: campuses, profiles, verified memberships, private enabled
campus allowlist, auth-profile trigger, read-only RLS access controls and
limited profile display_name edits.

Future separately reviewed migrations: listing catalog and images, sell/rent
inventory, offers and transactions, conversations/messages, rental calendar,
handover evidence, incidents, reviews, reports, notifications, audit trail,
idempotency and outbox. Their state machines, indexes, constraints and
allow/deny RLS tests will be added before end-users can use those features.

## Tests

- \`supabase/tests/00_auth_fixture.sql\`: minimal Auth mock for **disposable CI
  Postgres only**. NEVER execute in a hosted Supabase installation.
- \`supabase/tests/01_identity_rls.sql\`: allow/deny membership, disabled
  scope, anonymous access, profile ownership, column privileges, immediate
  revocation. Runs with actual PostgreSQL RLS in GitHub Actions.
- These mock integration tests do not replace real Supabase Auth/SMTP,
  browser login, refresh/revocation, or security tests in staging.

## Official references

https://supabase.com/docs/guides/auth/server-side/creating-a-client
https://supabase.com/docs/guides/auth/managing-user-data
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/auth/auth-email-passwordless
https://nextjs.org/docs/app/api-reference/file-conventions/proxy
