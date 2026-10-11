# Marketplace write budgets

Recorded 2026-10-11. These limits protect successful authenticated creation at
the PostgreSQL boundary, through both direct table access and authorized RPCs.
They supplement existing grants, RLS, domain checks and message cooldowns.

| Operation | Fixed window | Maximum per account |
| --- | --- | --- |
| Sale drafts | Hour | 10 |
| Rental drafts | Hour | 10 |
| New conversations | Hour | 30 |
| New messages across conversations | Minute | 60 |
| New offers | Hour | 30 |
| Rental requests | Hour | 20 |
| Listing reports | Hour | 10 |

The private policy table is editable only by trusted database operators; these
are initial pilot defaults, not values derived from production traffic. Review
them against actual pilot use before activation. UTC epoch buckets are independent
of client clocks. A fixed-window boundary can permit two adjacent budgets in a
short interval; this is not a sliding-window rate limiter.

AFTER INSERT triggers charge only real new rows. Canonical retries/reused
conversations consume no new budget. Atomic conditional upserts serialize shared
account/window counters; rejected work rolls back the mutation, notifications,
outbox and counter together. Rolled-back/invalid attempts do not consume budget.
Clients cannot write private counters, policies or call trigger/cleanup helpers.
Trusted maintenance without a user JWT is outside account budgets; ordinary
unauthenticated writes remain denied by existing permissions/domain contracts.

`PT429` gives the Data API a quota error and application mutation forms use a
fixed friendly message without exposing raw database details. Updates, recovery
transitions and opt-outs remain available; account quotas do not strand returns.

The service-only `prune_marketplace_write_usage` RPC deletes at most 1,000 old
buckets by default (maximum 10,000), retaining the latest two days. Configure its
private schedule and monitor storage before production; no cron was enabled.

This is **not** failed-attempt, IP, read/scrape, Auth, Storage bandwidth or DDoS
protection. The previously planned Upstash/gateway layer is still needed for
those boundaries. A PostgREST pre-request hook alone does not protect other
Supabase products; do not report these write budgets as full abuse protection.

Coverage includes direct draft insert denial, global cross-conversation message
denial, canonical retry accounting, rollback isolation, private grants and bounded
cleanup. CI also executes two separate native PostgreSQL transactions competing
for a one-write budget; expected result is one commit, one quota rejection and
one persisted counter. This focused test is not a marketplace load test.

Official references:
[Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api),
[PostgreSQL INSERT concurrency](https://www.postgresql.org/docs/16/sql-insert.html).
