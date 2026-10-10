# UNILOOP — Space UI account menu & profile

## Verified component selection

- [Space UI Menu](https://www.spaceui.one/primitives/menu): inspected public MIT source and adapted Base UI Menu, MenuLinkItem, MenuItem, MenuSeparator into components/spaceui/menu.tsx. True keyboard focus/Arrow/Escape semantics replace an HTML details popup.
- [Space UI Avatar Extended](https://www.spaceui.one/components/avatar-extended): use already installed AvatarExtended, AvatarRing, AvatarIcon with private, deterministic initials. No network requests to the external Space UI Avatars API. Decorative sparkle does not pretend the user is verified.
- [Space UI Card](https://www.spaceui.one/primitives/card): real identity card on both account and settings pages; no demo marketing identities.
- [Space UI Tabs](https://www.spaceui.one/primitives/tabs): already vendored accessible Profile / Notifications / Privacy tabs.
- [Status Badge](https://www.spaceui.one/components/status-badge) evaluated, but online/presence badges intentionally omitted since the app has no real-time presence service. Actual email verification and marketplace status are rendered with existing Badge primitives.
- [Liquid Switch](https://www.spaceui.one/components/liquid-switch) evaluated but not used for disabled settings; a decorative interactive switch would incorrectly imply preferences had been saved.

All reused upstream pieces are public MIT, see docs/licenses/SPACE-UI-MIT.txt. No new dependencies or paid components.

## Data and security

WorkspaceFrame passes the email from its verified identity to the sidebar popup, alongside the database display name. The popup provides working Account, Settings, Notifications, Help and Safety links and genuine Supabase signOut(). Sign-out failures are shown rather than claimed successful. No external avatar API, telemetry or fabricated activity.

Both signed-in /account and /settings reuse AccountProfileCard. The name and email are fetched from the authenticated Supabase user and personal profile; email verified is only displayed after verifiedIdentity() guards. Marketplace access retains the existing profile account_status plus campus availability rule, rather than being manufactured.

Settings uses current ProfileSettingsForm and PreferenceSettingsForm without changes to server actions. With ENABLE_MARKETPLACE_USER_ACTIONS=false, fields remain read-only with explicit explanation; notifications are not claimed to be delivered. Account deletion and data export controls are not automated and are not presented as working.

Unchanged: authentication providers, session/security guard, public login/signup, Supabase migrations/RLS, campus approval, listings, rental operations, payments, API keys, feature flags and mobile drawer navigation.

## Quality gates

Require Node lint, unit/typecheck, Next production build, anonymous and fixture-backed Chromium browser tests at 320/390/1024/1440 widths, account popup keyboard Escape/focus restoration, profile tabs, PostgreSQL identity RLS. Real hosted authentication and profile write actions still require staging end-to-end verification. Do not enable marketplace writes as part of a UI change.