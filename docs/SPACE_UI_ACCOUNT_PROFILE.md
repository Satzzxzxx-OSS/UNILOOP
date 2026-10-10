# UNILOOP — Space UI Sidebar Account Menu & Profile (2026-10-10)

## Actual code audit and target

The existing persistent 240px desktop sidebar used a native `<details>` block at the bottom, with a generic user icon and three plain links. The account `/account` view included a generic icon, email and eligibility indicator. `/settings` already had real profile and notification preference forms (server-gated by `ENABLE_MARKETPLACE_USER_ACTIONS`), but only basic card styling.

The goal is **more attractive and more usable** UI, not a new identity system or an entitlement change.

## Space UI component source audit

Public free MIT sources read (and compared against repo's current components):

- [Menu primitive](https://www.spaceui.one/components/menu), registry `src/registry/primitives/menu/index.tsx` from `usespaceui/ui`. Uses `@base-ui/react/menu`; keyboard arrow and Escape, focus restoration, popup positioning, link items, separators. Chosen for the sidebar bottom popup.
- [Avatar Extended](https://www.spaceui.one/components/avatar-extended), already integrated in auth V2. Chosen for branded avatar with ring/icon. Generated initials, local only; **no** call to `avatars.spaceui.one` (avoids sending identifiers to remote service).
- [Cards](https://www.spaceui.one/components/card), already integrated. Chosen for signed-in identity summary, profile destinations and settings panels.
- [Tabs](https://www.spaceui.one/components/tabs), considered, excluded because dividing editable profile/settings sections into client-side tabs would hide essential information and increase complexity.
- [Status Badge](https://www.spaceui.one/components/status-badge), read and evaluated, but its default `online`/animated indicator is inappropriate for identity or campus approval. Implemented a **static verified-email** marker and actual eligibility text instead.
- [Card Info block](https://www.spaceui.one/blocks/card-info), reviewed, not copied: demo’s hypothetical content/large decorations add no account value.

We adapted the MIT Menu component into `apps/web/components/spaceui/menu.tsx`, reusing the project's already-installed Base UI dependency and CSS conventions. License preserved in `docs/licenses/SPACE-UI-MIT.txt`.

## Changes and behaviors

- `experience-header.tsx`: only the bottom sidebar account button replaced by accessible Space UI menu. Existing 240px width, workspace links, search, all header actions and mobile navigation remain.
- `workspace-frame.tsx`: passes actual email and email confirmation state from `verifiedIdentity`; user name still comes from authenticated profile DB query, with email fallback.
- `account-menu.tsx`: portal-backed dark floating profile menu with name, private email, actual verified-email indicator, Profile, Settings, Saved, Help and **real** Supabase sign-out. Errors displayed visibly under the trigger if logout fails. No placeholder links or destructive account actions.
- `profile-avatar.tsx`: reused Space UI Avatar Extended ring and badge with local deterministic initials; no external images, fake presence, arbitrary random colors or uploads.
- `(public)/account/page.tsx`: signed-in page redesigned with true display name, email, email-confirmation indicator and existing `approved` calculation; existing sign-out and workspace destinations preserved. Logged-out branch remains the unchanged auth flow.
- `(workspace)/settings/page.tsx`: overview plus profile and notification cards; forms and `ENABLE_MARKETPLACE_USER_ACTIONS` flag remain **unchanged**, so disabled editing is not circumvented.
- `account-profile-spaceui.css`: scoped page/popup styling and responsive rules; respects reduced motion.
- `browser-workspace.mjs`: old summary-popup checks updated to accessible menu role, keyboard Escape, focus return and available destinations.

## Security/release boundary

No new DB schema, RLS policies, Supabase clients, session storage, service role privileges, write gates, marketplace operations, user metadata mutations or live authentication settings. Menu cannot grant campus membership; verified-email indicator is not a campus-approved marker. Email remains visible only within the authenticated private workspace. The small avatar uses *name initials*, not remote photos.

Test staging with both feature gate states and a real authenticated member before any public rollout. GitHub browser fixture tests are not a replacement for hosted Supabase verification.

## Integration sequence

Source branch: `feat/spaceui-account-menu-profile-v1` from organization `main` **after** auth V2 merge in the organization. Original `meshishu/UNILOOP` may lag and must receive auth V2 before cross-fork profile PR for a clean path. Don't force an ancestry rewrite or blindly accept GitHub conflict chunks.
