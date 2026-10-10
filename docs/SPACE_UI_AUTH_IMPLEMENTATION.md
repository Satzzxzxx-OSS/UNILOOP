# UNILOOP — Space UI Auth Experience (October 10, 2026)

## Scope and security boundary

The new public `/login` and `/signup` routes use one shared, responsive
`AuthExperience` composition. Existing `/account` and
`/account?mode=signup` continue to work as compatibility entry points;
signed-in account management remains unchanged. Existing `/auth/confirm`,
proxy/session logic, Supabase PostgreSQL migrations, RLS, marketplace operations,
storage policies and server-side feature gates are **unchanged**.

Authentication is **real provider calls only**. We use the existing
`supabase.auth.signInWithOtp()` contract, with `shouldCreateUser=true` only
for explicit signup. No passwords, Google sign-in, GitHub sign-in, paid
prototypes, demo credentials, fake users or simulated success. The provider
must acknowledge the email request before any confirmation UI appears.
Signup gives an Auth identity **not** a verified campus membership.

The server still requires `auth.getUser()` and confirmed email for protected
workspace routes. The existing fixed callback destination remains `/dashboard`;
untrusted return URLs are not accepted. Database RLS remains the marketplace
authorization boundary.

## Live Space UI evaluation and component selection

Official public components/docs reviewed:

- https://www.spaceui.one/components
- https://www.spaceui.one/blocks/sign-in
- https://www.spaceui.one/components/blur-reveal-text
- https://www.spaceui.one/components/glass-button
- https://www.spaceui.one/components/button-squircle
- https://www.spaceui.one/components/frost-blurred
- https://www.spaceui.one/components/liquid-switch
- https://www.spaceui.one/components/gradient
- https://www.spaceui.one/blocks/interactive-grid-hero
- https://github.com/usespaceui/ui/tree/main/src/registry/blocks/sign-in/sign-in-1
- https://github.com/usespaceui/ui/tree/main/src/registry/components/spaceui/blur-reveal-text
- https://github.com/usespaceui/ui/tree/main/src/registry/components/button/glass-button

The public MIT Sign In Page registry source was examined. It is a **UI demo**:
password, social buttons, remember-me, forgot-password links and maximum
attempts are not wired to any real provider. None have been copied into the
production auth flow.

Chosen, selectively adapted to current app:

1. **Sign In Page**: form hierarchy, intent separation, cards, typographic
   organization. Use the existing real provider instead of demo inputs.
2. **Blur Reveal Text**: staggered heading reveal concept. Auth version uses
   SSR-visible text and CSS animation; no client JS needed for content, honors
   `prefers-reduced-motion`.
3. **Gradient Background and Interactive Grid Hero's ProximityGrid**: already
   vendored public MIT Space UI primitives, restrained in a branded feature
   panel. No WebGL/shaders, simulated metrics, or example listings.
4. **Button, Input, Card and Badge primitives**: already integrated and reused
   for the authentic form, error and success states.
5. **Glass Button**: reviewed visual layering for a restrained glass badge;
   not imported because official button depends on `@usespaceui/squircle`
   which UNILOOP does not otherwise need.

Excluded after review: Liquid Switch has no truthful auth option to control;
password reveal is irrelevant to passwordless login; phone input, uploading,
sortable lists, timers, animations, online status, realtime presence, premium
shaders and Pro components add cost/confusion without helping secure account
entry. Google OAuth remains deliberately **not active**: later add the real
Supabase OAuth provider and approved callback/redirect configuration before
exposing a usable Google action.

Existing public MIT source license: `docs/licenses/SPACE-UI-MIT.txt`.
Layout and CSS are authored specifically for UNILOOP.

## UX/engineering behavior

- Dedicated `/login` and `/signup` page titles/metadata and links.
- Legacy account URLs, unauthorized redirect notices and invalid/expired
  link errors remain operational.
- Desktop split visual/form; tablet form-first stacked layout; mobile focused
  form-first view. Responsive at 320, 360, 390, 430, 768, 1024 and 1440px.
- Real email request loading/error/success states, generic provider errors to
  reduce account enumeration, disabled double submits, email normalization.
- Resend with client-side 60-second UX cooldown and change-email action.
  **Frontend cooldown is not server-side abuse protection.** Provider quotas,
  SMTP, CAPTCHA, abuse monitoring and request limiting require hosted setup.
- Accessible native email input, labels, status/error live regions, visible
  keyboard focus, minimum ~44px auth controls, reduced motion support.
- No provider secrets, credentials, mocked accounts, new dependencies, data
  migrations or mutations.

## Validation and launch gates

Check Node unit/typecheck/lint, production build and PostgreSQL RLS.
Run public/anonymous browser viewports, connected local protocol-fixture
signup and sign-in, confirmation, logout, forgery rejection, account route
compatibility and workspace regression. Local protocol fixtures must never
be deployed as application dependencies or counted as hosted authentication
tests.

**Still required before real user launch**: provision staging Supabase, apply
approved migrations, configure publishable settings, SMTP, email PKCE token
hash template and redirect allowlist; verify actual two-user login, resend,
expiry, session refresh/revocation, membership/eligibility and browser storage
on devices. Configure server-side abuse controls and human security review.

Do not activate marketplace write flags until their separate release gates
are completed. Do not claim live Google OAuth or a public-ready login based
only on CI/mock provider tests.
