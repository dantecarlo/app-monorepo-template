# Proposal: sign in through the gateway, keep query errors on screen, theme the whole mobile app

> **Status:** open

## Why

Writing the living specs left five follow-ups on the apps' behaviour, rows F11, F12, F23, F24
and F25 of `docs/INIT_AND_HARNESS_PLAN.md`, which the owner decided as recommended on 2026-11-14
(decision 58 of the same plan):

- **F11.** A valid web sign-in only flips the form to its submitting state and never calls the
  auth gateway (`apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:60-69`, WEB-13), and no
  test drives the origin-guard middleware (`apps/web/src/middleware.ts`, WEB-31 has two scenarios
  `Not covered`).
- **F12.** On mobile the result count shows twice (`ItemsListCard.component.tsx:29-31` writes the
  count before a message that already holds it); `useSession` builds a new object on every read
  (`apps/mobile/src/hooks/useSession.hook.ts:3-4`), which React's external-store hook rejects; the
  light theme reaches only the navigator, the glass card and a `themed` screen, because every
  other block paints the static dark palette; and the dashboard's View all and settings buttons,
  and the login screen's Google button, have no action.
- **F23.** `sanitizeQueryKey` keeps any segment registered in `QueryKeySegmentEnum`, so a typed
  value equal to a registered word survives it: `QueryKeys.items.list('list')` is reported as
  `['items', 'list', 'list']`.
- **F24.** Enum member casing has no rule: the code writes `ErrorStateCodeEnum.Forbidden`, while
  `docs/code-standards.md` § 7 shows `QueryLimitsEnum.DEFAULT_PAGE_SIZE` and Certifipago uses upper
  snake case.
- **F25.** Left open by the error-surfacing change: a failed query queues a toast in both apps,
  once per component that observes it, where `docs/code-standards.md` § 19 sends it to the
  screen's `ErrorState` (web Q3, mobile Q1); and a crash an error boundary catches is never
  reported to observability.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"

## What changes

- **Sign-in (F11, web).** A valid submit sends the email and password to the auth gateway port
  (`IAuthGateway` from `@app/core`) through a new `src/services/Auth/` service and adapter. The
  browser gateway, a no-op without the Supabase settings, moves from `SupabaseProviders.tsx` to
  `src/lib/supabase/authGateway.adapter.ts`, so the provider and the service share one. On
  success the route is replaced with `/`, as Certifipago's sign-in does; on failure the mutation
  toast shows the message of the error's `messageKey` and no field error is set (§ 19: a server
  error is never coupled to a form field). The adapter keeps the user id and drops the access
  token, so the token never sits in the mutation cache.
- **The origin guard (F11, web).** Tests drive `src/middleware.ts` directly: the right origin
  secret passes, a missing or wrong one gets 403 with an empty body, and the exempt paths stay
  exempt (`unstable_doesMiddlewareMatch` of `next/experimental/testing/server`).
- **Query keys (F23, both apps).** Every dynamic value of a key moves into one trailing params
  object, which `sanitizeQueryKey` always redacts: `QueryKeys.items.list(filter)` is
  `['items', 'list', { filter }]` and `detail(id)` is `['items', 'detail', { id }]`, with a new
  `DETAIL` segment. `QueryKeys.items.all` stays the prefix of both. A test in each app walks every
  `QueryKeys` factory and asserts that every string segment is a `QueryKeySegmentEnum` value. The
  `feature`, `screen`, `service` and `arch` skills and the docs show the new shape.
  packages/core is unchanged: `sanitizeQueryKey` already redacts every non-string segment.
- **Enum members (F24, conventions).** An `enumMember` selector with format `UPPER_CASE` joins
  `@typescript-eslint/naming-convention` in `eslint.rules.mjs`; every enum member of the template
  is renamed with its usages, values unchanged (`ErrorStateCodeEnum.FORBIDDEN`,
  `QueryKeySegmentEnum.ITEMS`); the naming table of `docs/code-standards.md` § 4 and every skill
  snippet that shows an enum follow. packages/core needs no rename: its enum-like objects
  (`ServiceErrorCodeEnum`, `ObservabilityLevelEnum`, `OriginGuardReasonEnum`) already use upper
  snake case keys.
- **Query errors (F25, both apps).** `useAppQuery` queues no toast any more, which ends the toast
  per observer; the dashboards show the `ErrorState` in the items list when the items query
  fails, with a retry that runs it again. A failed mutation keeps its toast. The dashboard hooks
  drop the override message they passed only for the toast.
- **Boundary crashes (F25, both apps).** Web `error.tsx` and `global-error.tsx`, and the mobile
  `RootErrorBoundary`, report the crash they catch to the observability port once, through
  `reportBoundaryError` under `src/lib/observability/`, the only code that captures directly.
- **Mobile fixes (F12).** The list caption shows the `listResults` message once. `useSession`
  selects through `useShallow`, so it returns the same object while the session is unchanged; the
  web `useSession` of `src/stores/auth.store.ts` has the same defect and the same fix. Buttons:
  the dashboard's View all button and header settings button, and the login screen's Google
  button with its "or" divider, are removed, since the template has nothing for them to do; every
  other mobile button keeps its action.
- **The mobile light theme (F12).** The theme reaches the whole app from the root: the root
  layout wraps the routes in a view that carries the active theme's `themeVars` (NativeWind
  `vars()`), and every block reads its themed colours from the active theme's palette, through
  `createThemedStyles` and `useThemedStyles` under `src/lib/theme/` for a StyleSheet and through
  `useThemeTokens` in a view. `Screen` paints the active base always and loses its `themed` flag.
  `Button` and `Chip` keep their classes for what does not change with the theme and take their
  themed colours from the palette.
- **Docs.** `docs/architecture/web.md`, `docs/architecture/mobile.md`, `docs/code-standards.md`
  and `docs/maps/global-map.md` say what ships.

## Out of scope

- Pointing the NativeWind preset's colours at the `--c-*` variables. The preset is written by
  `packages/tokens/scripts/generate.mjs`, outside this change; until it reads the variables, the
  `themeVars` the root layout injects have no class to reach, and the blocks take their themed
  colours from the palette instead.
- A specific message for a wrong password: the catalogs hold no auth error key yet, and they are
  outside this change, so a rejected sign-in shows the generic message `buildServiceError` gives.
- The web dashboard's View all and settings buttons and the web Google button, which have no
  action either: F12 names the mobile app, and WEB-01 and WEB-11 state those web buttons.
- The `items.errorMessage` catalog entry, which no code reads once the dashboards drop their
  override: the catalogs are outside this change.
- Mobile sign-in through the gateway (MOBILE-31 keeps it out); F11 names the web.
- A server-rendered no-op gateway test: happy-dom always defines `window`.

## Affected specs

- `openspec/specs/apps/web/spec.md`: modifies WEB-07, WEB-13, WEB-20, WEB-24, WEB-26, WEB-31 and
  WEB-38; adds WEB-44; open question Q3 closes at archive, and Q5 loses the override it cites.
- `openspec/specs/apps/mobile/spec.md`: modifies MOBILE-05, MOBILE-18, MOBILE-20, MOBILE-25,
  MOBILE-31, MOBILE-37 and MOBILE-40; adds MOBILE-42, MOBILE-43, MOBILE-44 and MOBILE-45; open
  questions Q1 and Q5 close at archive.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
