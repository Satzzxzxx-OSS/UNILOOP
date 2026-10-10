# Selected Space UI frontend polish

Branch: feat/spaceui-selected-polish. Base: original meshishu/UNILOOP main ca534d0, after merged auth PR #12.

## Verified source and placement

Public MIT source snapshot usespaceui/ui 7b22c0b494cec56a2f569c3a1dd4ceab604b4c53. Existing license retained in docs/licenses/SPACE-UI-MIT.txt.

| Owner selection | Integration | Source / boundary |
|---|---|---|
| Avatar Extended | Sidebar account menu, mobile account identity, signed-in account/profile, settings | Existing real AvatarExtended/Ring/Icon primitives retained; verified badge still derives from real email confirmation |
| Squishmoji tool | All ProfileAvatar sizes now use the actual official static Squishmoji export already used by auth | public/avatars/spaceui-squishmoji.svg; official @usespaceui/squishmoji 0.1.0; no custom initials/icon replacement or remote identity upload |
| Thinking Orb | Shared post/settings/saved/my-listings/notifications/rent-post/rent-my route loading and Explore loading | Public components/orb/thinking source; theme detection adapted to React useSyncExternalStore and numeric config typed without any; Canvas animation honors reduced motion, document visibility, intersection, unmount cleanup; existing skeletons retained |
| Heat Shade | Not copied: live catalogue explicitly marks PRO and public snapshot contains no Heat Shade source | https://www.spaceui.one/components/heat-shade. WebGPU requirement also limits device coverage. Auth story uses actual public GradientBackground instead, retaining original ProximityGrid, full desktop/mobile story, compact form and preview entry |
| Timeline | Landing existing how-it-works steps, rental booking lifecycle, sale handover confirmations | Existing public Timeline primitives; no synthetic dates, payment status or backend operation. Landing is instructional, not user progress |
| Button Squircle | Dashboard create-listing/rent actions | Actual public button/button-squircle/index.tsx. Adapted utils import, native corner-shape fallback and explicit default button type; Next Link render semantics preserved |
| Existing Space UI Button | Shared submit, search, wizard, gallery, auth, share and confirmation buttons | Source tactile transition/corner treatment applied to existing accessible primitive, preserving loading state, ref, disabled, form type and polymorphic links |
| Glass Button | Existing landing How it works CTA retained | Chosen for decorative secondary CTA; not forced onto destructive/admin actions |

## Button coverage decisions

The frontend inventory includes landing/public header, auth, dashboard, Explore/filter dialog, global/mobile navigation, account menu, listing wizard, media viewer/share, listing status/save/chat, conversations/offers/block, sale handover/reviews, rental requests/status/date blocking/decisions/notes, account/settings, notifications, report/admin moderation, error recovery. Existing base Button usage receives the shared treatment; intentional link navigation, menu items, radio selectors, tabs, switches and accordion triggers retain their appropriate semantic primitives. They are not indiscriminately converted to buttons or animated Glass Buttons. Older unused SiteHeader/CreateListingForm remain intact. No duplicate feature, fake social counter, presence, verification or payment is introduced.

## Verification

Production build, TypeScript and lint passed; 23 unit tests passed. HTTP smoke passed for 24 routes including malformed detail URLs, private headers and POST authentication. Production Chromium selected-component checks passed at 320/390/768/1024/1440px across landing, login, signup, dashboard, explore and both listing modes (35 combinations): no horizontal overflow or browser exceptions. Full landing/auth/anonymous-preview browser follow-up passed, including direct dashboard entry and preview sign-out. Screenshots inspected for mobile landing and auth. Isolated browser fixtures passed in both reduced-motion and animated modes: canvas mounted/rendered, independent buyer/seller confirmation markers and unknown approval history remained accurate, and no overflow/JavaScript errors. Fixture route was removed; no testing-only route is published. GitHub CI reruns the full existing workspace suite; authenticated live-provider exchanges were not performed.

Cancelled bookings do not invent a prior approval: approval history is shown as Not available because the existing selected record has no approval timestamp. Buyer/seller confirmations are marked independently, not inferred from their display order.
