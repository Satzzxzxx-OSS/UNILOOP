# UNILOOP web foundation — developer setup

This is a pre-production application scaffold. The existing root-level static
demo is preserved as a reference; the Next.js app lives at \`apps/web\`.

## Requirements

- Node.js 22 (Next.js requires at least Node 20.9).
- pnpm 10.18.3 through Corepack or pnpm installation.

## Local start

\`\`\`bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
\`\`\`

Open http://localhost:3000.

The dependency lockfile is committed. CI installs using
\`pnpm install --frozen-lockfile\` for repeatable builds.

## Quality gates

\`\`\`bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
\`\`\`

Also manually verify small-screen navigation, keyboard focus, motion settings,
search URL parsing, and absence of fake listings or simulated success.

## Routes in this slice

- \`/\`: homepage, categories, navigation, and transparent feed state.
- \`/explore\`: Buy/Rent mode, bounded search input, category route filtering.
- \`/post\`: clear not-available status until real publishing exists.
- \`/account\`: clear not-available status until authentication exists.

Real listings, persistence, checkout, bookings and authentication are **not
implemented**. Keep staging unindexed until launch readiness.

## UI registry

\`apps/web/components.json\` registers \`@spaceui\`. **No Space UI component
has been copied into the codebase yet.** Add one only after checking its code,
license, dependencies, keyboard behavior, reduced-motion behavior and bundle
impact. Avoid duplicate dialog/menu primitives across UI providers.

## Safety

Do not execute \`uniloop_completeALL.sql\` against a production or Supabase
database. It is a destructive SQL Server-specific artifact, not a PostgreSQL
migration. A separately reviewed Postgres migration series must be created
before real accounts or marketplace operations.

## Identity foundation (Step 02)

Optional secure Auth activation requires actual hosted Supabase project credentials:
copy \`apps/web/.env.example\` to \`apps/web/.env.local\`, fill public-only
Supabase URL and publishable key. Without valid settings, the account page is
explicitly disabled; no fake login action exists. **Never commit secrets**.
The build is expected to succeed without credentials. SQL schema should be
applied in Supabase staging first and approved membership rows provisioned by
operators. The PKCE token-hash email template and site/redirect URLs are
required before sign-in links work. See \`docs/03-IDENTITY-ARCHITECTURE.md\`.
