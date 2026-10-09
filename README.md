# UNILOOP — Buy, Sell, and Rent

This repository contains the Next.js App Router application under `apps/web`,
PostgreSQL/Supabase schema migrations under `supabase/migrations`, and
automated tests in `apps/web/tests` and `supabase/tests`.

> **Development status:** The source code is implemented and has automated
> GitHub CI coverage, but it has not been approved for production use.
> In particular, hosted Supabase Auth/Storage, external email delivery,
> moderation operations, browser E2E, load tests and incident recovery
> still require real staging verification. The default marketplace
> mutation flags are OFF. Do not switch them on for public users.

## Main application

Prerequisites: Node.js 22+, pnpm 10, a dedicated **staging** Supabase project.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @uniloop/web dev
```

The local web app is in `apps/web`; the root `index.html`, `app.js`
and `styles.css` are retained as a historical, **nonfunctional** static
preview. That static demo has no real authentication, offers, or listings.

## Environment configuration

Copy `apps/web/.env.example` to `apps/web/.env.local` and configure
your own Supabase URL and publishable key for **staging**. Never commit
secrets, service-role tokens or real personal data.

All server-side feature gates must remain disabled until their corresponding
real-Supabase staging integration and release-security checks pass:

- `ENABLE_MARKETPLACE_WRITES=false`
- `ENABLE_MARKETPLACE_INTERACTIONS=false`
- `ENABLE_MARKETPLACE_USER_ACTIONS=false`
- `ENABLE_RENTAL_OPERATIONS=false`
- `ENABLE_SALE_TRANSACTIONS=false`

These gates affect application UX and server actions only; **database RLS
and Storage policies are the actual authorization boundary**.

## Database

Migration files are ordered lexicographically under
`supabase/migrations/`. The SQL integration tests use disposable PostgreSQL
16 databases, with test-only Auth/Storage simulators. They are not an
adequate substitute for actual hosted Supabase Storage/Auth tests.

Never run the archived `uniloop_completeALL.sql` file against PostgreSQL.
It is a legacy SQL Server sample, not an application migration.

## Current functional scope in source code

- Identity/session code and controlled membership
- Listing drafts, private photo storage policies and Buy discovery
- Sale conversations, price offers and counter-offers
- Saved items, account settings and private notifications
- Rental item drafts, date availability and booking lifecycle
- Sale/rental handover confirmation and private sale reviews
- Basic listing reports with permission-checked moderation review

**Not yet validated as live:** real data setup, staging email login,
file upload/download, browser journeys, realtime push, outbound email
transport, production abuse rate-limiting, support/dispute resolution,
payment processing or any public-facing launch.

## Release gates

See `docs/01-DELIVERY-CHECKLIST.md` and the architecture guides.
Merge of source into `main` does **not** mean marketplace writes are enabled,
a hosted deployment exists or real users may transact safely.

Security findings and future work should be handled on reviewable branches
with tested pull requests, not direct edits to production.
