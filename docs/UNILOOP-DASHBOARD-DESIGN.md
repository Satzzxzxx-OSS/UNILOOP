# UNILOOP workspace redesign

The marketplace now uses an application dashboard rather than the previous marketing landing page. Existing routes, listing data, authentication, chats, offers, rentals, transactions and server actions remain in place. No database schema or stored records are changed.

## References inspected

FinCo-Pilot: `S2zxx0zxx/FinCo-pilot`, reference commit `e7a35f585d008e7d04ac3014f20e48a564a44311`. Layout references include `frontend/src/components/app-layout.tsx`, `workspace-switcher.tsx`, `page-header.tsx`, `lib/nav-items.ts`, `index.css`, the dashboard, accounts, invoice, transaction and report page compositions, and the checked-in dashboard screenshot. Its current dark tokens are neutral black, low contrast borders, white primary actions, Geist type and reserved semantic status colors.

Space UI: the official showcase and public documentation were reviewed for AI Chat Workspace, Stats Dashboard, Oleap, Sunabase, Rival and Staria. AI Chat Workspace supplies a useful left-sidebar/account/menu pattern; Stats illustrates modular metric panels. Oleap, Sunabase, Rival and Staria are explicitly conceptual demos, not verified live customer sites. These are design references, not claimed production marketplace implementations. Gallery classification and access requirements should be checked before installing any further template.

Sources:
- https://www.spaceui.one/showcase
- https://www.spaceui.one/templates/ai-chat-workspace
- https://www.spaceui.one/templates/stats
- https://www.spaceui.one/templates/oleap
- https://www.spaceui.one/templates/sunabase
- https://www.spaceui.one/templates/rival
- https://www.spaceui.one/templates/staria
- https://github.com/usespaceui/ui
- https://github.com/vercel/geist-font

## Component mapping

| Reference pattern | UNILOOP implementation |
| --- | --- |
| 240px persistent app sidebar | Marketplace, Your activity, Account groups; current route indication |
| Account/workspace control at sidebar bottom | Real signed-in identity; account, settings and help links |
| Small page header + inline actions | Overview, workspace, browse, account and form routes |
| Metric cards with real data | Recent personal listings, rental listings, conversations and bookings |
| Bounded data panels | Buy/Rent feed tabs, recent listings, shortcut rows |
| Compact search and filters | Existing query/mode/category navigation retained |
| Responsive app navigation | Mobile drawer and existing quick navigation; desktop sidebar |
| Neutral dark palette | Black background, #080808 cards, #242424 borders, white primary actions |
| Geist typography | Self-hosted variable font; SIL OFL license included |

Existing MIT Space UI Button, Input, Textarea, Card, Dialog, Badge, Skeleton, Separator and Spinner primitives are retained. The application composition and sidebar are authored specifically for UNILOOP. Paid template source is not included.

## Data semantics

Summary values use the existing account-scoped adapters and show the size of each recent result window, not a claimed global total. Limits are 24 sale listings, 30 rental listings, 50 conversations and 50 bookings. A window at its limit shows `≥ N`. Unavailable, unconfigured, unauthorised or failed results show an em dash. An authorised empty result shows zero. No synthetic items, financial charts, growth claims or activity have been added.

Recent listings include both sale and rental items sorted by their persisted creation date. Every card links to its existing detailed record. No schema, policy, migration, upload destination or mutation handler is replaced by this redesign.

## Verification

The branch uses the existing GitHub quality workflow: unit tests, TypeScript, ESLint, production build, HTTP smoke and Chromium route/navigation/responsive checks. Chromium artifacts cover seven viewport widths and secondary frontend routes. Authenticated record contents require a configured test account and are not claimed as validated by the unconfigured-service screenshots.
