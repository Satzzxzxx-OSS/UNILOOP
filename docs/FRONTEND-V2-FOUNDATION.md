# UNILOOP — FRONTEND V2 PRODUCT CONSTITUTION
**Status:** rebuild branch, research + frontend only. No backend rollout. No production change.

## Nonnegotiable goals
One account supports Buy / Sell / Rent / Rent Out. Limited approved-community first release without publicly naming institution. Startup-grade mobile-first UI. Zero paid UI dependencies, no fake listings/users/reviews/transactions. No previous root HTML demo reused. Keep server-side contracts untouched until visual flows accepted.

## Screen-by-screen UX map

| Page | Layout | Main interactions |
|---|---|---|
| Home | 3-zone nav, editorial hero, Buy/Rent search mode, large category tiles, real listings grid or honest empty, rental grid, trust, how-it-works, CTA, footer | Search -> Explore with mode; category -> filtered Explore; list -> post wizard |
| Explore | query, mode, category rail, sorting, desktop filters, mobile filter drawer, result count, cards | URL-sync mode/filter/search; Reset; card -> detail; genuine empty/error |
| Listing detail | gallery/thumbnail bar, title/condition/price, seller context, sticky mobile actions, safety notes | Save; message; negotiate; report; similar |
| Rental detail | photo gallery, daily price & refundable-deposit disclosure, date timeline, lender context, rental terms | date selection; availability; request; report |
| Sell wizard | Basics -> Photos -> Pricing -> Review | Next/back, validation, preview, save draft, final publish only when real |
| Rent Out wizard | Basics -> Photos -> Rate/Deposit -> Availability -> Review | Date blocking, preview, draft, publish when ready |
| My listings | tabs for drafts/live/paused/closed; owner cards | edit, pause, re-open when allowed, remove |
| Saved | segmented Buy/Rent, item grid, empty state | save/remove, open listing |
| Inbox | mobile conversation list and detail; desktop split view | open, compose, report/block, offers |
| Offers | received/sent/pending, offer cards, status chips | counter, accept/reject/withdraw, discuss |
| Rentals/Transactions | upcoming requests, activity timeline, pickup/return & handover | approve, cancel, confirm, review with real server |
| Notifications | grouped activity and unread | open event, mark read |
| Account/Settings | auth/verification summary, profile, preferences, privacy | sign in/out, edit when enabled |
| Report/Help/Safety/Legal | self-contained trust/help content | report and policy navigation |
| Admin | NOT included in consumer navigation; protected triage | review, audit |
| System states | polished skeleton, empty/access denied/offline/error/404 | truthful status and recovery |

## Layout design
Desktop width <= 1320px, max 3 top-level nav links (Discover, Buy, Rent) plus primary List item; search + Saved/Inbox/Account behind compact utilities. Avoid ten-link crowded header.
Mobile fixed width=device-width; 60px top header (brand/search/menu); 5-item bottom dock (Home, Explore, Sell, Saved, Inbox), safe-area inset; accessible filter sheet. No desktop-downscaling or horizontal body overflow.
Product detail mobile: edge-to-edge media, price details and single sticky CTA. Search and modal/filters are keyboard and touch reachable, 44px+ touch target.

## Visual system
Midnight indigo #15223A; linen #F9F7F2; paper #FFFEFC; amber #ECB256; soft mint #D6F2E7; ink #16243E; muted slate #65728A; border #E5EAF0.
High-quality editorial typography; system/Geist-like stack without paid bundled font; responsive text scale; 4/8/12/16/24/32/48 grid spacing; 14/20/28px corners; soft layered surfaces. Subtle spring motion, no heavy shader on marketplace list. Visible focus, WCAG targets, reduced motion.

## Space UI audit, pricing and zero-budget rules
Official installation: https://www.spaceui.one/docs/installation/manual
Verified React 19, Tailwind 4, Base UI, Motion, shadcn open-code distribution. Current components.json only registers the registry: this is NOT actual integration.
- Verified accessible free registry: https://www.spaceui.one/r/primitives-button.json (Base UI/Button); https://www.spaceui.one/r/primitives-dialog.json (Base UI/Dialog).
- Explore free tabs/select/sheet/skeleton primitives one by one via actual registry and audit license/deps, accessibility, mobile and source code.
- Compound Filters/Date Selector/Gradient File Upload/Notification List are candidates, NOT approved for inclusion before cost and dependency verification.
- Morphing Search Pill registry redirected to pricing when fetched; do not use for zero-budget build.
- Native links represent navigation; tabs for panels, radio choices for form values. Don't mimic buttons with inert decorations.
- Prefer selective transitions and motion-safe fallback. Never install unverified Pro components or proprietary assets.

## Frontend quality and release gates
G1 fresh shell + new design tokens + mobile navigation, browser widths 320/360/390/430/768/1024/1440.
G2 Home + mode search + cards + category navigation.
G3 Explore filters, URL state, list/gallery/detail.
G4 Sell and Rent Out multistep visual workflows.
G5 Inbox, saved, offers, bookings, account, safety pages coherent states.
G6 Visual screenshot comparison, keyboard/focus tests, a11y, performance, reduced-motion, false-data audit.
G7 Install vetted Space UI source components and verify CI. Backend credentials, migrations, payments, rollout excluded.
Don't mark page complete just because file compiles. No merge before UI review and tests.

## Branch discipline
Branch feat/space-ui-frontend-v2 is the sole place for rebuilding UI; main is untouched. Remove only root legacy index.html, styles.css, app.js, uniloop_completeALL.sql from this branch; keep new Next.js app and Supabase code during frontend work. No destructive live operations.
