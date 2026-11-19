# Verify report: 2026-11-18-bootstrap-supabase-seams

> **Verified:** 2026-11-18 at `d2a3ac9`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `d2a3ac9` (exit 0): the mobile
suite 91 files and 274 tests, the web suite 131 files and 501 tests, and packages/supabase 9 files
and 39 tests. At the base, `13f3a83`, they were 86 files and 260 tests, 131 and 498, and 6 and 33.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| MOBILE-74 | the splash screen is held, then hidden | `apps/mobile/src/lib/bootstrap/__tests__/splashScreen.adapter.test.ts` › "keeps the native splash screen up until it is hidden" | green |
| MOBILE-74 | the splash screen is held, then hidden | `apps/mobile/src/lib/bootstrap/__tests__/splashScreen.adapter.test.ts` › "hides the native splash screen" | green |
| MOBILE-74 | the root layout loads | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "holds the splash screen through lib/bootstrap as it loads" | green |
| MOBILE-74 | the safe area | `apps/mobile/src/lib/bootstrap/__tests__/AppSafeAreaProvider.component.test.tsx` › "renders its tree inside the device's safe-area provider" | green |
| MOBILE-74 | the root layout or its test reaches a vendor | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, 11 allowlist entries, none in the root layout or its test) | green gate |
| MOBILE-75 | the gateway over the app's client | `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "builds the auth gateway over the client the client adapter creates" | green |
| MOBILE-75 | the root layout renders | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "hands the auth provider the gateway lib/supabase builds" | green |
| MOBILE-75 | a file outside lib/supabase imports the package | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, no `@app/supabase` entry left) | green gate |
| MOBILE-76 | the client's type | `apps/mobile/src/lib/supabase/__tests__/client.adapter.test.ts` › "types the client as the opaque backend client" | green |
| MOBILE-02 | the faces the app loads | `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.constant.test.ts` › "holds the Inter and Montserrat faces the app uses" | green |
| MOBILE-02 | the faces the app loads | `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "loads the faces the app renders its text in" | green |
| MOBILE-02 | fonts still loading | `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "keeps the splash screen up and the routes back while the fonts load" | green |
| MOBILE-02 | fonts still loading | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "renders no route until the bootstrap is ready" | green |
| MOBILE-02 | the fonts load | `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "hides the splash screen and lets the routes render once the fonts load" | green |
| MOBILE-02 | a font fails to load | `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "hides the splash screen and lets the routes render when a font fails to load" | green |
| MOBILE-73 | a theme is applied | `apps/mobile/src/lib/theme/__tests__/colorScheme.adapter.test.ts` › "applies a theme to the live color scheme" | green |
| MOBILE-73 | the theme config | `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "applies the start-up theme and a chosen one through applyTheme" | green |
| MOBILE-73 | a block under the light theme | `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour" | green |
| MOBILE-73 | a block under the light theme | `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background" | green |
| MOBILE-73 | the root layout under the light theme | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme" | green |
| MOBILE-73 | a block or route test imports nativewind | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, no `nativewind` entry left) | green gate |
| WEB-80 | the browser client's type | `apps/web/src/lib/supabase/__tests__/client.adapter.test.ts` › "types the client as the opaque backend client" | green |
| WEB-80 | the server client's type | `apps/web/src/lib/supabase/__tests__/server.adapter.test.ts` › "types the server client as the opaque backend client" | green |
| WEB-80 | the gateway over the browser client | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "hands the gateway the very client the browser client adapter creates" | green |
| SUPABASE-30 | the client is wrapped and unwrapped | `packages/supabase/src/__tests__/backendClient.adapter.test.ts` › "hands back the very client it wrapped" | green |
| SUPABASE-30 | the type names no Supabase type | `packages/supabase/src/__tests__/backendClient.adapter.test.ts` › "names no Supabase type in the client it hands out" | green |
| SUPABASE-30 | the factories' types | `packages/supabase/src/__tests__/client.adapter.test.ts` › "returns the opaque backend client" | green |
| SUPABASE-30 | the factories' types | `packages/supabase/src/__tests__/server.adapter.test.ts` › "returns the opaque backend client" | green |
| SUPABASE-30 | the gateway over an opaque client | `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "getSession maps the SDK session to IAuthSession" | green |
| SUPABASE-01 | an app imports the package | Not covered — only the consumers' typecheck reads the entry points (both apps' typecheck exit 0, importing `BackendClientType` from the main entry) | green typecheck |
| SUPABASE-02 | a browser client | `packages/supabase/src/__tests__/client.adapter.test.ts` › "creates the client for the URL and anon key it is handed" | green |
| SUPABASE-02 | a server client | `packages/supabase/src/__tests__/server.adapter.test.ts` › "creates the SSR client over the cookie methods it is handed" | green |

The type scenarios (`expectTypeOf`) are proven by each workspace's `tsc --noEmit`, which includes
its tests, inside `pnpm validate`; at run time they assert nothing.

## Red before green

- **lib/bootstrap** (MOBILE-02, MOBILE-74): the bootstrap tests failed with `Failed to resolve
  import "@/lib/bootstrap/splashScreen.adapter"` (and `useAppBootstrap.hook`,
  `AppSafeAreaProvider.component`), and the root layout's test, once it stopped mocking the
  vendors, failed to load with `ReferenceError: __DEV__ is not defined`: the root still imported
  `expo-splash-screen` and the font packages itself. `pnpm verify:dependency-seams` then failed
  with 15 problems: 7 allowlist entries the root no longer needed, and 8 imports of the new files
  outside their empty seams.
- **applyTheme** (MOBILE-73): `applies the start-up theme and a chosen one through applyTheme`
  failed with `expected [] to deeply equal [ [ { theme: 'light' } ], …(1) ]`: the theme config
  set NativeWind's color scheme directly.
- **The opaque client** (SUPABASE-30, SUPABASE-02): the package's three new test files failed with
  `Cannot find package '@/backendClient.adapter'`, and `tsc` with `Cannot find module
  '@/backendClient.type'`.
- **The mobile gateway** (MOBILE-75): `builds the auth gateway over the client the client adapter
  creates` failed with `Failed to resolve import "@/lib/supabase/authGateway.adapter"`, and `hands
  the auth provider the gateway lib/supabase builds` with `expected "vi.fn()" to be called once,
  but got 0 times`: the root built its own gateway from `@app/supabase`.
- **Pins, green at their base.** The app type tests (WEB-80, MOBILE-76) were written after T4 and
  passed at once: the apps inferred `BackendClientType` through `ReturnType<typeof
  createSupabaseClient>`; their red is the package's type test above. The web gateway's identity
  test (WEB-80) pins the behaviour it already had. `APP_FONTS`'s test was written when the map
  moved out of the hook on `local/suffix-contract`; its expectation was the hook test's first form,
  seen red as a missing module.

Every test that existed before kept its assertions: across the 14 test files the change touches,
no `expect` line was removed or changed. The root layout's test lost only its vendor mocks and its
`nativewind` setup calls, which `applyTheme` replaced.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `d2a3ac9`.
- `pnpm verify:dependency-seams`: 22 allowlist entries at the base, 11 after (11 removed: 2
  `@expo-google-fonts/inter`, 2 `@expo-google-fonts/montserrat`, 2 `expo-splash-screen`, 1
  `nativewind`, 1 `posthog-react-native`, 1 `react-native-safe-area-context`, 2 `@app/supabase`).
- `npx expo export --platform web` from `apps/mobile`, into a scratch folder outside the worktree:
  exit 0 at `d2a3ac9`, 1421 modules, the root layout's chunk holding the splash hold and the font
  map; no native build ran.

## Not verified

- MOBILE-74, MOBILE-75 and MOBILE-73's seam scenarios have no test of their own: the lint rule and
  the gate hold them, whose own scenarios are harness/dependency-seams SEAM-03 and SEAM-07.
- No device run: the splash screen, the fonts and the safe area act only in a native build; the
  tests mock `expo-splash-screen`, the font packages and the safe-area provider.
- No Supabase project: the client and the gateway ran over mocked SDK factories, so the session
  and cookie behaviour is proven unchanged by the unchanged tests and the identical runtime object,
  not against a live project.
- `packages/supabase/README.md` still says a service calls the wired client (step 3 of "Swapping
  the backend provider"); with the opaque client, a data adapter over it lives in the package. The
  file is outside this change's edit surface.
- WEB-70, WEB-71 and WEB-72 cite `.agents/contracts/dependencies.json` lines that moved by 5: this
  change edits only the web requirements about `lib/supabase`.
