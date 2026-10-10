# UNILOOP — Space UI upgrade mapping

Reviewed on 2026-10-10. Branch: `feat/space-ui-polish-v4`. Starts from the light palette in PR #4 and targets main as a complete replacement review. No backend, schema, data access, feature flags, dependencies, lockfile, or account permissions change.

## Research coverage

The supplied catalogue pages were read, and the official public UI repository was checked locally. `space-ui-catalogue.json` indexes 284 documentation entries from that source snapshot, including Pro markers. It is a catalogue inventory, not a claim that every live demo was manually exercised. The live Squishmoji tool was inspected with its selected engine. Relevant free source files and their dependencies were reviewed before integration.

| Supplied source | Findings and decision |
| --- | --- |
| https://www.spaceui.one/components | Bouncy Accordion selected. Keep its 300/20 spring and detached 16px rows; use Lucide already installed, native buttons, inert closed regions and reduced-motion support. Heavy WebGL, animated text and decorative orbs do not improve marketplace tasks. |
| https://www.spaceui.one/hooks | useClipboard selected with dependency correction for onCopy. useAutoHeight adapted with cancelled animation frames and observer cleanup. Network and local preference subscriptions use SSR-safe useSyncExternalStore. |
| https://www.spaceui.one/interactions | Reviewed the interaction catalogue. Most entries model AI agents, deployments or currency; do not fabricate agent status, events or currencies in this marketplace. Adopt restrained tactile press, focus and hover feedback. |
| https://www.spaceui.one/tools | Select locally generated SVG identity art. Flag sets, image splitting, 3D plush/reveal and video tools are unrelated to current tasks. Coming-soon resources are not represented as usable components. |
| https://www.spaceui.one/templates | Stats Dashboard is explicitly Pro. Free AI chat and immersive portfolio templates do not match the existing marketplace data model. Keep the established dashboard architecture and integrate free primitives. No gated template copied. |
| https://www.spaceui.one/primitives | Public MIT Tabs, Tooltip, Progress and EmptyMedia integrated. Existing Button, Input, Textarea, Badge, Card, Skeleton, Spinner, Separator and Dialog remain in use. |
| https://www.spaceui.one/tools/avatars?type=squishmoji | Generated the ghost companion with the official free @usespaceui/squishmoji 0.1.0 core in a temporary generator. Monochrome SVG stored locally. No email/identity seed goes to an external avatar service and no runtime avatar dependency added. Decorative companion only, not a fake profile or presence indicator. |
| https://sounds.spaceui.one/ | MIT Web Audio engine from https://github.com/usespaceui/sounds. Reviewed core source, vendored only its eight core files, with attribution. Dynamic import only on eligible opted-in clicks. Default off, low volume, respects reduced motion, local preference, cleanup. No autoplay or success chime before a server response. |

## Selection and implementation

| Existing surface | Upgrade | Source / engineering decision |
| --- | --- | --- |
| Sidebar and header on all routes | Clear white active item, consistent neutral icons, shortcut hints, contextual tooltips, focused search dialog with filtered destinations | Free Space UI Dialog/Tooltip. Search orchestration is authored for existing UNILOOP routes; this is not the Pro Morphing Command Bar. |
| Overview | Refined metric surfaces, clearer action hierarchy and grouped discovery panel | Original layout with Space UI visual hierarchy; count adapter unchanged, unknown remains em dash, capped counts remain bounded. |
| Marketplace feed tabs | Sliding indicator and built-in keyboard/focus/ARIA semantics | Free Space UI Tabs based on Base UI. Sale/rental content uses the existing server results. |
| Explore buy/rent and category filters | Polished segmented links, selected filters, focus treatment and consistent results cards | URL query and category mapping unchanged. Existing free Dialog handles mobile categories. |
| Sale and rental cards | Subtle hover elevation, small photo zoom, quiet badge and price hierarchy | Shared authored CSS, actual seller photos unchanged. No remote samples or invented listings. |
| Sale and rental details | Full-size gallery dialog, labelled controls; native share with clipboard fallback and truthful copy/error feedback | Existing free Dialog/Button plus public useClipboard. Photos maintain object-fit:contain in lightbox. |
| Sale and rental posting | Thin completed-step progress, tactile steps and accessible drop target states | Free Space UI Progress. Original validation, file type/size limits, local previews, draft action and feature gates retained. |
| Help | Bouncy single-open FAQ with original answer text | Public free Bouncy Accordion source; native controls, measured content, inert hidden panel. |
| Private activity and empty states | Consistent cards, local monochrome companion and useful existing CTAs | Free EmptyMedia; original sign-in/error/unavailable distinctions kept. |
| Account, settings, notifications, saved and posting transitions | Shared skeleton loading component, scoped route boundaries | Existing free Skeleton. No global boundary: preserve HTTP 404 concealment and invalid private detail status. |
| All forms | Consistent field radius, stronger focus outline, button press feedback | Existing input and action payloads retained. No replacement of safe native dates/selects with a new data model. |
| Mobile navigation | Floating dock with safe-area spacing and tactile active items | All existing destination links retained. No additional navigation hierarchy. |
| Interface preferences | Opt-in sound control and truthful offline notice | Audio is lazy loaded, local only. Network status is not claimed to be backend/service health. |

## Route inventory

All 23 existing page sources were inspected. Shared refinements apply to the authenticated routes as well, but private server-backed interactions cannot be verified without approved account services. Browser coverage uses the truthful unauthenticated/unconfigured states.

| Route | Existing component integration points |
| --- | --- |
| `/account` | email-sign-in, account-sign-out, experience/experience-header |
| `/admin/reports` | trust-forms |
| `/explore` | spaceui/button, spaceui/input, experience/category-filter-dialog, category-icon, listing-results, rental-results, experience/experience-header |
| `/help` | spaceui/bouncy-accordion, experience/experience-header |
| `/inbox/[id]` | sale-deal-forms, sale-interaction-forms |
| `/inbox` | experience/workspace-shell, experience/experience-header |
| `/listing/[id]` | experience/share-item, experience/media-gallery, experience/experience-header, listing-photo-upload, listing-status-form, trust-forms, sale-interaction-forms |
| `/my/listings` | listing-card, experience/workspace-shell |
| `/notifications` | experience/workspace-shell, notification-read-form |
| `/offers` | experience/workspace-shell, experience/experience-header |
| `/` | category-icon, listing-results, rental-results, experience/experience-header, experience/experience-search, experience/marketplace-panel, spaceui/card |
| `/post` | experience/listing-wizard |
| `/rent/[id]` | experience/share-item, experience/media-gallery, experience/experience-header, rental-ui, rental-photo-upload |
| `/rent/my` | experience/workspace-shell, experience/experience-header |
| `/rent/post` | experience/listing-wizard |
| `/rentals/[id]` | rental-ui |
| `/rentals` | experience/workspace-shell, experience/experience-header |
| `/report/[id]` | trust-forms |
| `/safety` | experience/experience-header |
| `/saved` | listing-card, experience/workspace-shell |
| `/settings` | trust-forms, experience/workspace-shell |
| `/transactions/[id]` | sale-deal-forms |
| `/transactions` | experience/workspace-shell, experience/experience-header |

## Architecture and constraints

- Design tokens remain white surfaces, black actions/text, neutral gray borders. Meaningful error/status colors remain distinguishable.
- Client behavior stays in small leaf components. Existing server-side queries and parallel dashboard fetching stay untouched.
- Copied primitives and sounds are MIT-attributed under `docs/licenses/SPACE-UI-MIT.txt`; registry/source files remain owned and reviewable locally.
- Sound vendor snapshot: 77817cd7e8e094a052017a7d5bfd72a3e0dfdad2. UI vendor snapshot: 7b22c0b494cec56a2f569c3a1dd4ceab604b4c53. Local avatar asset license includes MIT Space UI and its generator's MIT gradients dependency, both Copyright 2026 Space UI.
- No paid components, external avatar service, hosted asset dependency, device fingerprinting, fake online users, fake totals, fake upload completion or fake backend success.
- Testing: unit tests, TypeScript, lint, production build, existing HTTP/browser route checks. Extended Chromium tests cover persisted opt-in sound preference, search shortcut/filter/escape/focus restoration, tabs arrow navigation, FAQ single-open behavior and completed-step progress. 320–1440px captures and reduced-motion checks retained.
- Real authenticated listings/gallery/share can only be exercised against approved account fixtures. Verify those before treating this as launch readiness; this change does not alter backend availability.

### Mobile sidebar follow-up

Mobile and tablet widths up to 900px expose a labeled Menu button. It opens a left-hand Base UI modal drawer with the shared desktop navigation groups, active route markers, search, account, and both listing actions. The drawer has a scrollable middle section, 44px touch targets, safe-area spacing, outside/close/Escape dismissal, focus trapping and restoration, reduced-motion support, and automatic dismissal when resizing to desktop. The bottom dock remains available outside the drawer. Browser checks cover all small viewports, link parity, drawer geometry, reachability, and dismissal.
