# UNILOOP Auth V2 — black Space UI and visible account form

## Source-backed cause of the missing panel

The V1 account page conditionally rendered the *entire* `EmailSignIn`
component only when `serverSupabase()` returned a client. The Vercel
`uniloop` project's environment variable list was checked via connected
Vercel API (2026-10-10) and contained no variables. Its production page
therefore showed only "secure account service is connected" notice, not
an email field or submit action.

V2 **always renders** the real passwordless EmailSignIn component with an
explicit `configured` prop. Without proper configuration the email input
remains visible and the submit button is disabled, accompanied by a clear
service-unavailable message. Nothing claims to have sent an email.

## Space UI research and design selection

Reviewed the official public MIT [Sign In Page](https://www.spaceui.one/blocks/sign-in)
block source, [Avatar Extended](https://www.spaceui.one/components/avatar-extended),
[Glass Button](https://www.spaceui.one/components/glass-button),
[Blur Reveal Text](https://www.spaceui.one/components/blur-reveal-text)
and existing UNILOOP Space UI primitives. The sign-in block contains a
UI-only password field and social login placeholders. Copying these without
a provider would mislead users.

The V2 retains one truthful **email magic-link** auth method, but uses
the visual card structure, spacing, dark glass surface, segmented form
tabs and readable error states inspired by Space UI. Avatar Extended's
ring/icon composition is locally adapted (MIT, LICENSE in
`docs/licenses/SPACE-UI-MIT.txt`). Our friendly UNILOOP companion is an
original SVG rendered locally. No avatar service, user profile photo lookup,
external tracking script, WebGL, bot chat API or Google provider is added.

## Files and boundaries

- `apps/web/components/auth/auth-experience.tsx`: fully redesigned
  semantic, separate-intent V2 layout, avatar and error/provisioning states.
- `apps/web/components/auth/auth-bot-avatar.tsx`: locally rendered brand
  bot with per-instance SVG gradient IDs.
- `apps/web/components/spaceui/avatar-extended.tsx`: locally adapted
  free Space UI wrapper/ring/icon helpers, no remote avatar API.
- `apps/web/app/auth-v2.css`: scoped black theme for auth pages only;
  mobile form-first responsive layout, visible focus and reduced motion.
- `apps/web/app/layout.tsx`: import scoped V2 CSS last.
- `apps/web/components/email-sign-in.tsx`: real form remains visible
  regardless of provider configuration, with no submits when unconfigured.
- `apps/web/tests/browser-ui.mjs`: black theme, visible bot/form,
  no fake password, disabled submit when unconfigured and fixture-backed
  real Supabase protocol checks.

No Supabase authentication methods, protected-route decisions, database
migrations, RLS policies, metadata privileges, marketplace writes, storage,
payments, sessions, or signed-in account page are changed. The
`/login`, `/signup` and legacy `/account` routes continue to work.
The actual `supabase.auth.signInWithOtp` call remains the only submit path.
On configured installations, requests receive normal loading, email-sent,
resend (60s UX cooldown) and error responses.

## Enable **real** authentication — must be configured by project operator

1. Provision an authorized Supabase project, apply migrations through a
   reviewed staging run, and configure the campus membership lifecycle.
2. Add **only** the public `NEXT_PUBLIC_SUPABASE_URL` (HTTPS) and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_` prefix) to
   the intended Vercel environment(s). Their existence alone does not prove
   hosted Auth/SMTP work. **Never** expose a secret/service-role key.
3. Configure email delivery, login email template token hash, Auth Site URL
   and permitted redirects on the actual public domain.
4. Redeploy for Next's baked-in public variables and run real multi-user
   signup/sign-in/expiry/logout and session refresh/revocation tests.
5. Validate bot/abuse controls, domain redirects and memberships in
   staging before onboarding end users.

Google OAuth can be added later with the *actual* provider, approved OAuth
redirect URLs and account linking safeguards; no cosmetic Google button
or invented user account is offered now.

## Acceptance and quality gates

At widths 320, 360, 390, 430, 768, 1024 and 1440 px, both auth intents
must be readable without sideways overflow. The bot/avatar, dark brand
theme, email field and account switch should remain visible. Without
provider configuration the form's submit action cannot send requests.
With the local auth protocol fixture it must still send genuine OTP
requests with `create_user=true` only on signup, reject invalid sessions,
honor token hash verification and support logout.

Visual QA on real phones / accessible contrast review and hosted
Supabase E2E are separate from code build/CI. Keep marketplace write
flags off until their own approvals.
