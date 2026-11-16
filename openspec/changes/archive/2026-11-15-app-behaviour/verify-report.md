# Verify report: 2026-11-15-app-behaviour

> **Verified:** 2026-11-16 at `1c77842`

## Scenarios

Each task wrote its scenario tests first and ran them before the code; the red column is what
that run showed. A test of behaviour the code already had is marked as such.

| Requirement | Scenario | Test | Red before the code | Result |
| ----------- | -------- | ---- | ------------------- | ------ |
| WEB-07 | the items service rejects | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows the error state and queues no toast when the items query fails" | no element with the role `alert` | green |
| WEB-07 | Try again after a failure | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "loads the items again when Try again is pressed after a failure" | no button named Try again | green |
| WEB-07 | the hook reports the failure | `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry" | `isError` was undefined | green |
| WEB-13 | the gateway accepts the credentials | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "signs in through the auth gateway and replaces the route with the home page" | `replace` never called with `/`: the gateway was never called | green |
| WEB-13 | the sign-in is running | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "disables the submit button while the sign-in runs" | the gateway's `signIn` called 0 times | green |
| WEB-13 | the gateway rejects the credentials | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "queues the error toast and sets no field error when the sign-in fails" | the toast store stayed empty | green |
| WEB-13 | the form hook hands the values to the sign-in | `apps/web/src/screens/Login/hooks/__tests__/useLoginForm.hook.test.ts` › "sends the values to the sign-in on a valid submit and clears errors" | `signIn` called 0 times | green |
| WEB-13 | the service maps a rejection | `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "rejects with an AppError carrying a message key when the gateway rejects", "resolves the session the gateway returns" | `@/services/Auth/auth.service` does not resolve | green |
| WEB-13 | the adapter drops the token | `apps/web/src/services/Auth/__tests__/Auth.adapter.test.ts` › "keeps the user id and drops the access token" | `@/services/Auth/Auth.adapter` does not resolve | green |
| WEB-20 | the Supabase settings are missing | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "returns a no-op gateway without the Supabase settings" | `@/lib/supabase/authGateway.adapter` does not resolve | green |
| WEB-20 | the Supabase settings are present | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "creates one Supabase auth gateway per browser with the settings" | as above | green |
| WEB-20 | the page is rendered on the server | Not covered | — | — |
| WEB-24 | a query fails | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure" | existing test | green |
| WEB-24 | a query keyed by a search text | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure" | existing test, same output with the params object | green |
| WEB-24 | a typed value equal to a registered word | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list filter that equals a registered segment on query failure" | the key was reported as `['items', 'list', 'list']` | green |
| WEB-24 | a mutation fails | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure" | existing test | green |
| WEB-24 | the sink reaches the observability port | `apps/web/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError" | existing test | green |
| WEB-26 | a query fails | `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "queues no toast when the query fails, however many components observe it" | `addToast` called 2 times, once per observer | green |
| WEB-26 | a mutation fails or succeeds | `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows an error toast with the override message on failure", "shows a success toast when successMessage is provided" | existing tests | green |
| WEB-26 | a toast expires | `apps/web/src/stores/__tests__/toast.store.test.ts` › "toast auto-dismisses after 4 seconds" | existing test | green |
| WEB-31 | the origin secret is right | `apps/web/src/__tests__/middleware.test.ts` › "lets a request with the configured origin secret through" | green on the old code: a guard of existing behaviour | green |
| WEB-31 | the origin secret is missing or wrong | `apps/web/src/__tests__/middleware.test.ts` › "answers 403 with an empty body when the origin secret header is missing", "answers 403 with an empty body when the origin secret header is wrong" | green on the old code; red with the guard disabled in a scratch copy of the middleware | green |
| WEB-31 | no origin secret is configured | `apps/web/src/lib/origin-guard/__tests__/originGuard.adapter.test.ts` › "assertTrustedOrigin passes through when no secret is configured" | existing test | green |
| WEB-31 | an exempt path is requested | `apps/web/src/__tests__/middleware.test.ts` › "does not run for the paths the guard exempts", "runs for a page route" | green on the old code; red with `fonts` dropped from the matcher | green |
| WEB-38 | a route crashes while rendering | `apps/web/src/app/__tests__/error.test.tsx` › "renders the generic error state for a render crash", "retries the segment when Try again is pressed" | existing tests | green |
| WEB-38 | the root layout crashes | `apps/web/src/app/__tests__/global-error.test.tsx` › "renders the generic error state in its own document" | existing test | green |
| WEB-38 | the crash is reported | `apps/web/src/app/__tests__/error.test.tsx` › "reports the crash to observability once"; `apps/web/src/app/__tests__/global-error.test.tsx` › "reports the root layout crash to observability once" | the port captured 0 times | green |
| WEB-38 | the report helper | `apps/web/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures an error once however often it is reported", "captures each distinct error" | `@/lib/observability/reportBoundaryError.helper` does not resolve | green |
| WEB-45 | every factory is walked | `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum" | `['probe-value', 'probe-value']` were bare string segments | green |
| WEB-45 | the list filter and the detail id | `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list filter and the detail id in a trailing params object", "keeps the bare list key when no filter is given" | `list('alice')` was `['items', 'list', 'alice']`; the bare key was green on the old code, a guard | green |
| WEB-45 | the items prefix is invalidated | `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key" | green on the old code: a guard that the prefix still matches | green |
| MOBILE-05 | the light theme is active | `apps/mobile/src/lib/theme/__tests__/useRootTheme.hook.test.ts` › "derives the light base, dark glyphs and the light variables under the light theme" | the theme style was `{}` | green |
| MOBILE-05 | the root layout renders | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme" | the routes' frame style was `{}` | green |
| MOBILE-18 | items have loaded | Not covered | — | — |
| MOBILE-18 | the count caption | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the result count once" | no element with the text `2 listResults`: the caption read `2 2 listResults` | green |
| MOBILE-20 | a failing query | `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "adds no toast when the query fails, however many components observe it" | `addToast` called 2 times | green |
| MOBILE-20 | the dashboard fails to load | `apps/mobile/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry" | `isError` was undefined | green |
| MOBILE-20 | the list shows the failure | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state with a retry when the items failed to load" | no element with the role `alert` | green |
| MOBILE-25 | a query key holding an identifier | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure" | existing test | green |
| MOBILE-25 | a query keyed by a search text | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure" | existing test | green |
| MOBILE-25 | a typed value equal to a registered word | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list filter that equals a registered segment on query failure" | the key was reported as `['items', 'list', 'list']` | green |
| MOBILE-25 | a failing mutation | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure" | existing test | green |
| MOBILE-25 | the bridge to the port | `apps/mobile/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError" | existing test | green |
| MOBILE-31 | a valid submit | Not covered | — | — |
| MOBILE-31 | the login screen renders | `apps/mobile/src/screens/Login/__tests__/Login.screen.test.tsx` › "renders no social sign-in button" | the `googleCta` label was rendered | green |
| MOBILE-37 | a route crashes while rendering | `apps/mobile/src/components/RootErrorBoundary/__tests__/RootErrorBoundary.component.test.tsx` › "renders the generic error state for a render crash", "calls retry when the retry control is pressed" | existing tests | green |
| MOBILE-37 | the crash is reported | `apps/mobile/src/components/RootErrorBoundary/__tests__/RootErrorBoundary.component.test.tsx` › "reports the crash to observability once" | the port captured 0 times | green |
| MOBILE-37 | the report helper | `apps/mobile/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures an error once however often it is reported", "captures each distinct error" | `@/lib/observability/reportBoundaryError.helper` does not resolve | green |
| MOBILE-37 | the root layout exports the boundary | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "exports the root error boundary as its ErrorBoundary" | existing test | green |
| MOBILE-40 | a text variant renders | `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "renders a variant's typography" | existing test | green |
| MOBILE-40 | a labelled divider renders | `apps/mobile/src/components/ui/Divider/__tests__/Divider.component.test.tsx` › "renders the label between two rules" | existing test | green |
| MOBILE-40 | a screen surface renders | `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background" | the unthemed surface painted `#0A0B0D` under light (old `Screen` swapped back in) | green |
| MOBILE-42 | a text variant under the light theme | `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour" | `#9A9CA6` where `#525560` was expected (old `Text` swapped back in) | green |
| MOBILE-42 | a class-styled block under the light theme | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset reads every themed colour from its --c- variable, declared in both themes"; `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme" | `accent-surface` was `#241A12`, not `var(--c-accent-surface)`; the frame style was `{}` | green |
| MOBILE-42 | a themed style sheet | `apps/mobile/src/lib/theme/__tests__/createThemedStyles.helper.test.ts` › "builds one style sheet per theme from its palette"; `apps/mobile/src/lib/theme/__tests__/useThemedStyles.hook.test.ts` › "returns the sheet of the active theme" | the helper and the hook did not resolve | green |
| MOBILE-42 | no block reads the static dark palette | `apps/mobile/src/lib/theme/__tests__/createThemedStyles.helper.test.ts` › "leaves no block reading a themed colour from the static dark palette" | 33 files read a themed colour from the static `colors` | green |
| MOBILE-43 | every factory is walked | `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum" | `['probe-value', 'probe-value']` | green |
| MOBILE-43 | the list filter and the detail id | `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list filter and the detail id in a trailing params object", "keeps the bare list key when no filter is given" | `list('alice')` was `['items', 'list', 'alice']`; the bare key a guard | green |
| MOBILE-43 | the items prefix is invalidated | `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key" | green on the old code, a guard | green |
| MOBILE-44 | a component re-renders | `apps/mobile/src/hooks/__tests__/useSession.hook.test.ts` › "returns the same object across renders while the session is unchanged" | "Maximum update depth exceeded" | green |
| MOBILE-44 | the session changes | `apps/mobile/src/hooks/__tests__/useSession.hook.test.ts` › "returns a new object holding the new session after a change" | "Maximum update depth exceeded" | green |
| MOBILE-45 | the dashboard renders | `apps/mobile/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows no View all button" | the `viewAll` label was rendered | green |
| MOBILE-45 | the header renders | `apps/mobile/src/screens/ItemsDashboard/components/DashboardHeader/__tests__/DashboardHeader.component.test.tsx` › "shows no settings button" | a button was rendered | green |
| TOKENS-12 | a themed colour is resolved | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset reads every themed colour from its --c- variable, declared in both themes" | `accent-surface` was `#241A12` | green |
| TOKENS-12 | the dark theme is unchanged | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset resolves to the dark theme's colours under the dark variables" | green on the old code: the guard that the dark values stay | green |
| TOKENS-12 | a shared colour | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset writes every shared colour as a literal" | green on the old code, a guard | green |
| TOKENS-12 | the web app loads no JavaScript config | `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config" | existing test | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the preset is caught" and the three others | after the preset change: the planted string `raised: '#101216'` was no longer in the preset; the plant now edits `raised: 'var(--c-bg-raised)'` | green |
| TOKENS-15 | the source changes and nobody regenerates | `scripts/verify-theme-sync.test.mjs` › "a source change that was not regenerated is caught in every output it reaches" | after the preset change: 2 outputs reported where the case expected 3; it now expects 2 | green |
| TOKENS-15 | a token is renamed and nobody regenerates | `scripts/verify-theme-sync.test.mjs` › "a renamed token that was not regenerated is caught in the theme names too" | existing test | green |
| TOKENS-15 | the outputs are current | `scripts/verify-theme-sync.test.mjs` › "the shipped outputs equal their regeneration", "the gate exits 0 over the shipped outputs" | existing tests | green |

F24 (enum members in UPPER_SNAKE_CASE) touches no requirement. Its red: a probe enum with the
member `NotFound`, linted with the repository config, passed before the `enumMember` selector
and failed after it, as did the 12 PascalCase members of the template, which were then renamed.

## The preset, measured

The preset change was measured on the mobile web export, built twice from `1c77842`'s code:
once with the old preset copied back in, once with the generated one. A one-off Playwright script
read the computed `color`, `background-color`, border colours, `box-shadow`, `opacity` and font of
every element of `/` and `/login` at 390 px, under the dark and the light colour scheme:

| Scheme | Route    | Elements | Differing | Sign in button |
| ------ | -------- | -------- | --------- | -------------- |
| dark   | `/`      | 135      | 0         | not on the route |
| dark   | `/login` | 48       | 0         | identical      |
| light  | `/`      | 135      | 0         | not on the route |
| light  | `/login` | 48       | 0         | identical      |

No route renders a themed NativeWind class: the Sign in button paints with shared colours, and
`Chip` and the secondary `Button` render nowhere. So the script also put a probe with
`text-text-primary bg-glass-fill border-glass-stroke` inside the root frame, which declares
`--c-text-primary` as `#F7F8FA` under dark and `#11131A` under light:

| Scheme | Old preset | New preset |
| ------ | ---------- | ---------- |
| dark   | `rgb(247, 248, 250)` on `rgba(24, 27, 34, 0.42)` | the same |
| light  | `rgb(247, 248, 250)` on `rgba(24, 27, 34, 0.42)`: the dark values | `rgb(17, 19, 26)` on `rgba(255, 255, 255, 0.66)`, border `rgba(0, 0, 0, 0.08)` |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`, run over the archive: exit 0, 2026-11-16, on `eeeaac7` with
  the deltas merged (turbo 24 of 24 tasks; web 338 tests, mobile 152, tokens 23;
  `verify:specs` and `verify:theme-sync:test` green).

The run before the archive and the fixture update, kept for the record:

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-16, at `1c77842`. Every gate before
  `verify:specs` passed: the projection check, the manifest gates, the lint-rule and allowlist
  gates, `turbo run lint typecheck test build format:check` (24 of 24 tasks; web 338 tests,
  mobile 152, tokens 23), `verify:tests:test`, `verify:tests`, `tests:into-blocks:test` and
  `verify:specs:test`. `verify:specs` then failed on the nine test titles the living specs still
  cite (WEB-13, WEB-26, MOBILE-20, MOBILE-40, TOKENS-12), each replaced in this change's deltas;
  the archive merges them.
- The gates after `verify:specs`, run one by one at `1c77842`, each exit 0 except one:
  `git-free-env:test`, `report:spec-drift:test`, `report:spec-drift`, `verify:english:test`,
  `verify:english`, `verify:instruction-entry:test`, `verify:instruction-entry`,
  `codex-budget:test`, `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`,
  `verify:structure`, `verify:security`, `verify:theme-sync`, `mcp:docs:test`,
  `verify:mcp-docs:test`, `verify:mcp-docs`, `docs:diagrams:check`, `pnpm --filter @app/i18n test`
  and `knip`. `verify:theme-sync:test` exits 1: two of its cases were written against the old
  preset (TOKENS-15 above), and `scripts/verify-theme-sync.test.mjs` is outside this change's
  edit surfaces.
- `pnpm --filter @app/web build`: exit 0. `pnpm --filter @app/mobile export:web`: exit 0, its
  `dist-web` deleted afterwards.

## Not verified

- Native resolution of a `var(--c-*)` class through the root view's `vars()`: the web export
  above shows it on react-native-web; on iOS and Android it is covered only by the CI-only
  Hermes smoke, `pnpm smoke:mobile`, which was not run.
- WEB-20 "the page is rendered on the server": happy-dom always defines `window`.
- MOBILE-18 "items have loaded" and MOBILE-31 "a valid submit": as before, no test renders the
  card list or calls the mobile form hook.
- That Next mounts `error.tsx` and `global-error.tsx` around a route that really throws, and that
  Expo Router wraps the layout in its `ErrorBoundary`: the tests render the boundaries directly.
