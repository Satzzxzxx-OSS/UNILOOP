# UNILOOP — Verified repository baseline

Audit date: 2026-10-09
Starting commit on \`main\`: \`582036b735fd151b2680091d76aa387e29f4565b\`.
Work branch: \`feat/foundation-app-router-v1\`.

## Existing files, untouched in this first delivery

- \`index.html\`: static homepage/marketplace demo.
- \`styles.css\`: demo-specific styles.
- \`app.js\`: eight hardcoded listings; sixteen categories; wishlist in localStorage; client-side filtering; modal placeholders.
- \`README.md\`: documents the static demo, not a production app.
- \`uniloop_completeALL.sql\`: **Microsoft SQL Server T-SQL**, not PostgreSQL; contains destructive DROP statements and custom auth schema.

## Confirmed production gaps

- No Next.js app or package manifests at baseline.
- Auth/sign-in demo has no live identity provider.
- Listing form does not persist real listings.
- Chat and making an offer are placeholders, not backend workflows.
- Demo verification badges and sample items are hardcoded.
- Old SQL script MUST NOT be used as a migration against production data.
- No validated integration with database, RLS, cloud storage, or worker pipeline.

## Guardrails

1. Preserve the static demo and old SQL as historical input, not live application logic.
2. Never use demo listings, fake counts, or simulated success messages as real state.
3. A single account can eventually buy, sell, rent, and rent out; each workflow has its own permission/state model.
4. Do not expose pilot eligibility details through the public UI or generic telemetry.
5. Implement auth, data access, listing persistence, and rental availability in later reviewed vertical slices.
6. Never configure a privileged service key in client-side code.
7. No merge to \`main\` before review and reproducible tests.

## Foundation scope

The new \`apps/web\` app is intentionally a front-end foundation only:
real routing, responsive layout, valid taxonomy and query parsing, honest empty states,
and clear disabled/not-ready entry points. It makes **no claim** to have
authentication, listing persistence, messaging, or booking operational.

## Verification limitations

Node.js is available in the development execution environment, but this session
cannot resolve npm registry hosts, so \`pnpm install\`, a Next.js production build,
and browser E2E checks could not yet be executed. Run them in CI or a connected
development environment before merge.
