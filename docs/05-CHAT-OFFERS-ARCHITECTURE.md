# UNILOOP Step 04 — Secure private sale conversations and price offers

Status: code and disposable PostgreSQL integration tests only. This is NOT
deployed, customer-ready, or integrated with live Supabase credentials.
Branch: feat/foundation-app-router-v1 / Draft PR #1.

## Goals
One account may buy or sell; this slice is **sale-only**.
The seller is always the listing's original verified owner. A buyer may open
one conversation per active listing. Chat/offer history survives listing
availability changes when authorized participants need a record.

No fake message delivery, fake balances, online payment, booking guarantees,
escrow, trade completion, identity verification badges, or chat read receipts.

## SQL migration and call contracts

Migration: supabase/migrations/20261009220000_sale_interactions.sql
Prerequisites: identity, sale listing and private media migrations in order.

Tables:
- sale_conversations: immutable listing / buyer / seller; unique listing+buyer.
- sale_messages: persist text only, max 2,000 chars, immutable once sent;
  sender is sourced from auth.uid(); unique per-thread user nonce.
- sale_offers: proposer and recipient from thread, whole INR range 1–10m;
  pending/accepted/rejected/countered/withdrawn lifecycle; immutable client
  status, amount, participant and timestamps.
- user_blocks: blocking and unblock restricted to the authenticated blocker.

Client-exposed write RPCs:
- open_sale_conversation(requested_listing) -> conversation UUID.
- send_sale_message(requested_conversation,content,request_nonce) -> message UUID.
- submit_sale_offer(requested_conversation,requested_amount,parent_offer,request_nonce) -> offer UUID.
- resolve_sale_offer(requested_offer,decision) -> decision status.

Every exposed SECURITY DEFINER function has pinned empty search_path,
explicit narrowed EXECUTE grants, live verified membership checks and
ownership/recipient checks. No client INSERT/UPDATE/DELETE grants on messages,
offers or conversations. Do not add private to Data API exposed schemas.

Message writes serialize by locking a conversation; they include a minimum
two-second interval per sender/thread and an idempotent caller-provided nonce.
This is an initial anti-duplicate control, NOT full per-account anti-spam.

Offer writes lock the parent sale listing before performing status updates.
Only a buyer may open a new offer; an existing pending offer may be countered
only by its recipient; the original becomes countered. There may be only one
pending offer in a conversation. Once an offer is accepted, only one accepted
offer is allowed for a listing, and other outstanding pending offers are
rejected by the DB transaction. The proposer may withdraw its own pending
offer; the recipient may reject or accept it. A stale or second concurrent
acceptance is refused.

Accepted offer never implies payment, a completed transaction, a verified
handover or a real money exchange. It does NOT automatically change listing
status to sold. Transaction confirmation is a separate future module.

User block prevents fresh messages/negotiations on both sides, but history
remains accessible to both eligible parties for evidence and disputes.
Suspended/revoked counterparties cannot receive new messages or new offers.

## Next.js UI and server boundary

- /inbox lists approved, authorized conversations.
- /inbox/[id] displays last 50 persisted messages, last 30 offers, and
  message/offer/action forms when server flag is enabled.
- /offers links to relevant conversation/negotiation history.
- /listing/[id] allows an eligible buyer to open a conversation about
  an active item when the interaction flag is enabled.
- Client form inputs are validated in pure helper functions and again in
  PostgreSQL RPCs; server actions never accept client identity/owner IDs.
- Mutations are disabled by default with server-only
  ENABLE_MARKETPLACE_INTERACTIONS=false.
- Next.js proxy refreshes sessions on private routes; pages are dynamic and
  marked noindex.
- Message updates currently require a **manual Refresh**. There is no
  claimed WebSocket, read receipt, unread counter or guaranteed delivery
  notification.

A server-only flag is a rollout UX gate, not database access control.
Approved clients can call Supabase Data API directly; RLS, audited account
provisioning, membership enforcement and database functions remain the
actual security boundaries.

## CI verification

supabase/tests/05_interactions_rls.sql runs in a **disposable** PostgreSQL
database created by GitHub Actions, with auth and storage simulator fixtures.
It tests buyer/seller threads, retries, private reads, cross-account sends,
blocked messaging, pending/disabled scopes, counter-offers, accepted-offer
uniqueness, direct SQL grants and suspended seller eligibility.

These tests are not evidence that actual Supabase Auth, JWT refresh, SMTP,
PostgREST, Storage, private Realtime or web browsers have been validated.

## Release blockers (must finish before real users)

1. Connect a **real hosted Supabase staging project** and run all migrations;
   verify Auth/Storage behavior and actual session/permission checks.
2. Add moderation reports, user suspension workflows, safe evidence retention,
   blocked-user protection, abuse investigations and support/dispute escalation.
3. Implement account-wide/API-level rate limits, anti-spam, content filtering,
   alerting, cleanup and safe pagination for inbox/messages/offers.
4. Implement Realtime only with reviewed private broadcast channels,
   Realtime Authorization RLS and revocation/reconnect testing. No public
   channel access to private messages.
5. Add E2E, a11y, cross-campus denial, fraud, race-condition/load and
   multi-device tests, backups, monitoring and private data retention.
6. Define transaction/deal lifecycle and liability for offline payment
   before claims of completed sale or money transfer.
7. Add listing and profile reporting, complaint resolution, and support.
8. Keep branch in Draft PR until security and actual staging validation pass.

## Official reference material

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- https://nextjs.org/docs/app/guides/forms
