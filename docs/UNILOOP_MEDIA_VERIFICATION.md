# Media authorization and remaining hosted verification

Recorded 2026-10-11. Existing upload paths, UI, five-photo registration slots,
private bucket IDs and file limits are retained.

The upload RLS helpers now lock their parent sale/rental listing before counting
objects. They are VOLATILE so the post-lock count uses a fresh READ COMMITTED
snapshot. Higher transaction isolation fails closed, since a fixed older snapshot
must not authorize an extra object after waiting. Native CI uses two separate
clients at four existing objects; only one extra upload may commit and the other
must receive RLS denial. Final count must be five for both bucket types.

No managed Storage tables, triggers or metadata are altered by the migration.
Object writes inside tests use a disposable Storage facade only. Production
uploads/deletions must use the real Storage API. Trusted service-role operations
bypass user RLS and are outside these user upload limits.

The migration also verifies both existing marketplace buckets are private, have
the expected 5 MiB limit and JPEG/PNG/WebP allowlist. It aborts for incompatible
existing settings rather than overwrite an operator's configuration or leave
an unexpected public bucket unnoticed. Review actual bucket configuration on
staging before deployment.

Hosted checks still required:

- Confirm actual Storage transaction isolation and compatibility of the locking
  RLS helper. Repeat simultaneous upload tests through the real Storage API,
  including preflight, failed object writes and request timeouts.
- Verify MIME/size enforcement, invalid/foreign paths, ownership, revoked campus
  access, signed URL expiry and enabled/disabled category behavior using users.
- Verify object storage rollback behavior: metadata denial does not itself prove
  that provider-side bytes were cleaned up.
- Inventory unregistered/orphan objects via the real API; define a reviewed age
  threshold/reservation model and recover failed registrations before enabling
  scheduled cleanup. No automatic deletion or historical object cleanup runs here.
- Verify orphan-delete policy, publication photo gate and service-key isolation.
  Previously issued signed URLs remain usable until their expiry.

Sources:
[PostgreSQL function snapshots](https://www.postgresql.org/docs/16/xfunc-volatility.html),
[Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control).
