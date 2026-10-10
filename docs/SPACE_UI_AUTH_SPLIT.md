# Compact Space UI authentication and frontend testing access

2026-10-10 · Branch `feat/spaceui-auth-split-preview` · Base `e539adf`.

## Owner request
Replace the current broad dark login/signup composition with the actual free Space UI authentication block. Restore the previous campus story panel, including Discover/Connect/Exchange, on both desktop and mobile. Use a Space UI tool avatar instead of the custom bot. Temporarily allow direct workspace entry for frontend testing.

## Source and decisions
- Actual free MIT block: https://www.spaceui.one/blocks/sign-in; public registry `block-sign-in`, source `src/registry/blocks/sign-in/sign-in-1/index.tsx` at UI snapshot `7b22c0b494cec56a2f569c3a1dd4ceab604b4c53`.
- `components/spaceui/sign-in-block.tsx` retains the original 384px card, centered header, labeled email/password fields and separated footer using the existing Space UI primitives. Adds signup name/intent and working links. Placeholder OAuth buttons, fake attempt counters and dead password-reset links are omitted. This is an explicit adaptation, not an unchanged source dump or a claim that a separate signup block exists.
- Real Squishmoji avatar export from official `@usespaceui/squishmoji` 0.1.0 `createAvatar('UNILOOP', {size:120, shape:'ghost', expression:'happy', backgroundStyle:'solid'})`; official gradients package 0.1.4. Saved as a static SVG in `public/avatars`, rendered with Next Image. No handwritten bot or remote avatar API. Original source repository: https://github.com/usespaceui/squishmoji.
- Existing Space UI ProximityGrid recreates the requested prior panel. Desktop side-by-side; mobile form first, full story below including all three steps. Nothing is hidden at the mobile breakpoint.
- Old `auth-experience.css` and `auth-v2.css` removed, replaced by auth-scoped `auth-split.css`. Existing marketplace, heading/border improvements and later account/profile work preserved.

## Temporary testing behavior
`lib/auth/frontend-preview.ts` contains `FRONTEND_PREVIEW = true`. Login/signup primary actions navigate directly to `/dashboard` without form validation, an email provider or a cookie. Input values are never sent, persisted or converted into an identity. Public messaging calls this frontend preview.

GET/HEAD workspace navigation and the workspace layout render for guests. WorkspaceFrame provides the existing sidebar/mobile drawer with a preview label. Existing real-user queries, server actions, database permissions, RLS, staff checks and feature flags remain unchanged; private records are never supplied by invented credentials. Existing screens can show their real unavailable/empty states. The existing email-link form is retained behind the preview switch for later authentication integration. Reset the switch and restore authenticated-navigation test expectations when ending this temporary frontend testing period.

## Checklist
- [x] Inspect all four supplied screenshots and latest merged frontend.
- [x] Read actual free sign-in registry source and official avatar source/export.
- [x] Create a new branch preserving independently merged account/profile work.
- [x] Replace old auth composition and remove its two old stylesheets.
- [x] Compact login/signup form and real Space UI avatar.
- [x] Restore complete story panel on desktop and mobile.
- [x] Primary auth actions open frontend workspace without verification.
- [x] Keep provider identities, data authorization and writes unchanged.
- [x] Complete browser checks and record final validation.
- [x] Prepare and publish the review branch and PR description.

## Validation
23 unit tests passed. TypeScript, lint and production build passed. Production HTTP smoke covers 24 routes, invalid auth confirmation, private headers, concealed staff route and POST authentication. Production Chromium checks covered landing at seven widths and both auth pages at 320/390/768/1024/1440px: compact cards, complete story, avatar, no overflow, direct entry and no generated session.

Disposable-provider workspace checks covered seven widths, mobile drawer, account popup, wizard photo/review, preferences, secondary routes and provider callback/sign-out. Search/filter/audio sections passed in a focused follow-up run. The full workspace script is rerun together by CI. Local fixture uses Webpack to avoid a Turbopack disk-cache panic; production build remains Turbopack. Tests wait for persisted-preference hydration and keyboard-shortcut listener readiness; Next's concealed staff 404 is checked as a 404, not as a marketplace form theme. No production-provider transactions were performed.
