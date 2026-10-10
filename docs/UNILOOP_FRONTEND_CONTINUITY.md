# UNILOOP landing and existing-workflow polish

Date: 2026-10-10. Branch: feat/landing-workflow-polish. Base: latest main after PR #5.

## Fixed scope
Keep the monochrome workspace, current taxonomy, all existing features/data and server-side permissions. No new marketplace features, currencies, analytics, payments, ratings or invented inventory. The requested public landing and email onboarding are the only new entry surfaces. Use attributed public MIT Space UI source, not Pro templates. Use gradients in hero and photo selection only.

## Research and application
- OLX official posting flow: category/details/photos/price. https://help.olx.in/hc/en-us/articles/10877414982557-How-can-I-post-an-ad
- OfferUp official listing flow: clear title, cover photo, condition, category, price; validate before submission. https://help.offerup.com/hc/en-us/articles/360031987592-Post-an-item-to-sell and https://help.offerup.com/hc/en-us/articles/360032334651-How-to-create-a-great-listing
- Hygglo official rental journey: discover, request/discuss, collect and return. https://play.google.com/store/apps/details?id=se.hygglo.android and https://hygglo.com/uk
- Adopt sequence/hierarchy only. Do not copy competitor design, insurance, verification claims, fees, AI features or payment guarantees.
- Space UI public Gradient File Upload: extract original LuminousBorder and use local selection, existing five-file JPEG/PNG/WebP limits; omit demo simulated upload/progress/success. Free Gradient Background and Interactive Grid Hero provide bounded landing art. Existing Button/Card/Badge/Tabs/BouncyAccordion/Tooltip remain.
- Supabase official passwordless docs: https://supabase.com/docs/guides/auth/auth-email-passwordless. Signup requests may create auth identity; sign-in cannot. Email verification precedes workspace. Existing campus membership RLS still governs marketplace access. No auto membership/approval or schema changes.

## Wireframe and workflows
1. Public `/`: compact navigation -> explanation and join CTA -> three existing intents Buy/Sell/Rent -> existing eight categories -> discover/discuss/exchange sequence -> safety facts -> FAQ -> join CTA. No live counts or invented listing demos.
2. Public `/account`: explicit create account/sign-in intents -> email link requested -> email verification -> fixed `/dashboard`. Missing provider config means honest unavailable UI, never fake login.
3. Private `/dashboard`: existing four metrics link to my/listings, rent/my, inbox, rentals. Counts remain real/capped. Discovery and marketplace sections preserve server results.
4. Explore: search -> buy/rent mode -> existing categories -> item card -> existing detail/actions. Query state preserved.
5. Listing: details/category/condition -> local photos -> price/rental terms -> honest review -> real draft action when existing gates permit. The photo surface gets the actual Space UI luminous border. Review shows the actual selected local cover.
6. Saved: existing saved items -> detail, no new lists. Inbox: existing conversation -> offers/deal actions. Menu: shared grouped desktop/mobile navigation and account/safety. Bordered focus/press and cards apply consistently to existing surfaces.
7. Workspace routes retain URLs, but verified session is required to enter. Root dashboard moves to `/dashboard`; root becomes landing. Auth callback uses fixed success path; no arbitrary return URL.

## Todo
- [x] Inspect latest main, existing auth, all existing route mapping and relevant free registry sources.
- [x] Research official marketplace and auth workflows; fix scope and wireframe sequence.
- [x] Split public and verified workspace layouts, migrate overview to /dashboard and preserve deep links.
- [x] Build responsive landing using free Space UI components and truthful product copy.
- [x] Add explicit email signup/sign-in intent without auto granting marketplace eligibility.
- [x] Integrate attributed gradient upload border, improve review and shared button/card boundaries.
- [x] Verify logged-out route gates and isolated authenticated fixture navigation/forms; screenshots 320–1440px.
- [x] Run lint, type, unit, production build and HTTP/browser checks. GitHub CI status follows the published branch/PR checks.
- [x] Publish new branch/PR with exact local validation and remaining live-provider constraints recorded here and in the PR description.

## Continuity
Previous PR #5 is merged into main. This work starts from that merged state, not an old redesign. Preserve data/RLS/backend actions. Never claim verified real SMTP or live authenticated transactions from local test fixtures. Record final commit/PR and checks below before handoff.

## Screen-by-screen acceptance map

| Existing area | Wireframe priority | Action and destination | Important preserved state |
| --- | --- | --- | --- |
| Overview | Heading/actions, four summary cards, discovery, marketplace, recent activity | Your listings -> /my/listings; rental listings -> /rent/my; conversations -> /inbox; bookings -> /rentals | Real capped counts; no fake totals while eligibility/data unavailable |
| Explore | Search and buy/rent intent before categories/results | Existing query/category links -> real item detail | URL retains mode/query/category; no hardcoded inventory |
| List | Intent -> item details -> local photos -> terms -> review | Existing gated draft action -> item detail -> real photo upload/publish | Five files, JPEG/PNG/WebP, 5MB; preview is not persisted upload |
| Saved | Personal results with item title/photo/price and real empty state | Existing card -> item detail | Account-scoped favorites; no new collections |
| Inbox | Existing conversation list -> specific conversation -> existing offers/deal controls | /inbox/[id], /offers, /transactions/[id] | Existing block/participant/feature gates and real statuses |
| Rental activity | Existing requests/bookings -> owner approval -> mutual handover -> return | /rentals -> /rentals/[id] | Request is not approval; no payment/insurance invention |
| Account | Create account vs sign-in -> verification -> workspace | Fixed /auth/confirm -> /dashboard | Signup identity does not grant campus membership; missing config never fakes success |
| Menu | Desktop group parity, selected route, mobile scroll, persistent actions | Existing marketplace/activity/account links | 44px mobile targets, modal focus/escape/outside dismissal |
| Help and Safety | Original guidance/FAQs remain reachable before and after login | Original routes preserved | Guests get public chrome; verified users retain workspace chrome |

## Engineering notes
- Root document owns CSS only; route groups own public and private layouts. Existing URLs stay stable except the old root overview moves to /dashboard.
- Verified identity is request-scoped via React.cache and Supabase getUser, requiring email confirmation. Proxy denies guest workspace requests before streaming; the server layout verifies again. No client-only authentication gate.
- The shared WorkspaceFrame preserves sidebar/dock on signed-in Account, Help and Safety pages.
- Public Space UI source additions: ProximityGrid from Interactive Grid Hero, GradientBackground, original LuminousBorder extracted from Gradient File Upload. Imports and reduced-motion safeguards adapted; simulated demo upload/progress/sounds omitted. Existing uploader/backend payload unchanged.
- Test fixtures live only in tests/browser-ui.mjs and a disposable Next dev child. They emulate provider endpoints on local ports, deny staff RPC, grant no campus membership and send no real email. Production code has no fixture/bypass flag.
- Local production public pages and anonymous HTTP gates are tested separately from fixture-authenticated workspace behavior.

## Local validation completed

Production build, TypeScript, lint and all 23 unit tests passed. HTTP smoke passed for 22 public/private/404 route cases. Production Chromium checks passed at 320, 360, 390, 430, 768, 1024 and 1440px: landing geometry, readable primary CTA/heading, eight real categories, FAQ, signup navigation and anonymous workspace denial. Disposable provider checks passed: forged-cookie rejection, signup create_user=true vs sign-in false, email callback to dashboard, returning-user redirect and logout denial. Existing workspace regression suite passed: navigation/search/filter state, active tabs, sidebar, FAQ, preferences/lazy audio, photo validation/drop/remove/review, disabled save gate and secondary routes. No live email or real marketplace transaction was sent.

Live-provider completion remains outside this frontend change: configure actual Supabase public settings, SMTP and the token-hash email template/allowed redirect URLs; enroll eligible campus membership and verify hosted transactions before activating the existing write gates. Signup cannot self-grant membership, staff access or enabled marketplace actions.

Publication: `feat/landing-workflow-polish` targets `main`; the matching draft PR contains the commit/check links. Nothing in this follow-up is merged or deployed automatically.


## Catalogue fit follow-up — 2026-10-10
Branch `feat/spaceui-catalogue-fit` continues on main `d54e033` after merged PR #8. New login/signup URLs and dark auth/avatar work are preserved. Complete catalogue decisions and public source fingerprints are saved in `SPACE_UI_CATALOGUE_AUDIT.md` and `SPACE_UI_CATALOGUE_SOURCE_MANIFEST.json`. Six free additions: Glass Button (secondary landing CTA), Blur Reveal Text (landing h1), Liquid Switch (existing opt-in sound preference), Timeline (existing four listing steps), Status Badge (real sale/rental/exchange state), Rating (existing completed-exchange reviews, read-only stars). Exact/capped dashboard counts and server review submission stay unchanged. No dependencies, marketplace features, backend actions, schema, eligibility or real data changed. Live provider limitations still apply.

Catalogue follow-up validation: clean build/type/lint, 23 unit tests, 24 HTTP routes and production/authenticated-fixture Chromium suites passed; keyboard and drag sound-switch behavior verified. Matching branch PR carries publication/CI status. No real provider launch verification is claimed.
