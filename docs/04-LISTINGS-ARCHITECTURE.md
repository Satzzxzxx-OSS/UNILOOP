# UNILOOP Step 03 — Sale listing vertical slice

Implementation state: branch-only, CI integration tests. No live hosted Supabase
project, login, storage, data or third-party deployment has been configured.

## Architecture

- Listings are sale-only, not rental inventory.
- \`public.categories\` is the initial curated catalog taxonomy. UI mirrors
  these slugs; taxonomy needs migration+UI synchronization until the admin
  registry is built.
- \`public.listings\` has immutable owner/campus once created.
  \`status\`: draft → active → paused/active/sold/removed; sold and removed
  cannot be reactivated. A category must be enabled to activate a listing.
- \`public.listing_photos\` stores only Storage paths, not file contents.
  Photo slots 1..5 and unique position per listing.
- \`storage.buckets\` configured as private \`listing-media\` bucket, with
  5 MB max and JPEG/PNG/WebP allowlist. The real Storage API owns objects;
  NEVER insert or delete storage.objects records using SQL in production.
- Actual object owner + verified membership + listing lifecycle are checked
  via RLS and tightly constrained helpers in non-exposed \`private\` schema.
- A registered photo is required by a DB trigger before status can become active.
- Only an approved account can list or see active items, scoped to its approved
  campus. Draft and paused items are visible only to their owners.
- Client cannot alter owner/campus/status/published_at columns directly.
  Status changes use row-locked guarded \`transition_sale_listing\` RPC.
- Server Action \`ENABLE_MARKETPLACE_WRITES=true\` feature flag is REQUIRED
  for create/publish/pause/sold mutations; disabled by default.
- Signed URLs for private images should be short-lived (at most 180 seconds);
  no bucket public URLs or service-role keys on the client.
- The initial feed is capped at 24 rows and uses server-authenticated RLS
  filtering. It does not claim the entire catalog or all matching results.

## Known constraints / blockers

- Production moderation/reporting is pending: **do not turn on public writes**.
- Storage deletion/reordering of registered photos needs a reviewed operator
  workflow. Orphan cleanup is best-effort; a crash can leave abandoned files.
- Storage count checks use a per-listing cap, but concurrent uploads can race.
  Add server-side quotas, abuse throttling and cleanup before mass access.
- Media contents are MIME-restricted by Storage and client-side type checks,
  but antivirus, magic-byte validation and content moderation are not yet live.
- Search uses a bounded literal title ILIKE and limited listing count.
  Add indexes/full-text relevance and pagination before scaling.
- Sale completion here marks a listing sold; it is **not** a verified trade or
  paid transaction. Offers, receipts, reviews and dispute handling are separate
  future slices.
- Live Supabase Auth email template, staging project, environment settings,
  real storage policy testing, browser E2E/a11y are still unverified.
- In-flight migrations have not been applied to hosted Supabase.
- Space UI premium components have not been installed without source review.
- Rental dates, payments, chat and offers are not implemented here.

## Local/staging checklist

1. Apply identity migration in clean preview Supabase.
2. Apply sale listings migration.
3. Apply private storage listing-media migration with Storage installed.
4. Provision verified approved test accounts/campus under trusted operations.
5. Set public Supabase URL/publishable key in local/staging environment only.
6. Validate actual private bucket upload/getSignedUrl and policies as two users.
7. Only in controlled staging set server-side \`ENABLE_MARKETPLACE_WRITES=true\`.
8. Run browser tests for draft→photo→publish→discover→pause→sold.
9. Review owner impersonation, cross-campus access, disallowed categories,
   spam, image abuse, concurrent image uploads and revocation.
10. Do not merge until E2E, deployment and security review pass.

## Sources

https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/storage/security/access-control
https://supabase.com/docs/guides/storage/security/ownership
https://supabase.com/docs/guides/storage/buckets/creating-buckets
https://nextjs.org/docs/app/guides/forms
