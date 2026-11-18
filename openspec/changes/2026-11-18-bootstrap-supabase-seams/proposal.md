# Proposal: the mobile bootstrap seam and the opaque Supabase client

> **Status:** open

## Why

Decision 51 of `docs/INIT_AND_HARNESS_PLAN.md` puts every library outside the core stack behind
one adapter of the template, and F.8 unit 1 froze every import that broke its seam in
`eslint-dependency-seam-allowlist.json`. Eleven of the 22 left belong to F.8 units 6 and 7, all in
the mobile root layout and its test:

- **The root layout's bootstrap, 9 (unit 6).** `apps/mobile/src/app/_layout.tsx` loads the fonts
  from `@expo-google-fonts/inter` and `@expo-google-fonts/montserrat`, holds and hides the splash
  screen through `expo-splash-screen` and provides the safe area from
  `react-native-safe-area-context`. Its test mocks those vendors, switches the theme through
  `nativewind`'s `colorScheme`, and mocks `posthog-react-native`, which the root reaches through
  its observability binding. `src/lib/theme/theme.config.ts` still sets NativeWind's color scheme
  itself, beside the `applyTheme` unit 5 added for exactly that.
- **The Supabase client, 2 (unit 7).** The root layout and its test import `@app/supabase` to build
  the auth gateway, and the client crosses the package boundary typed `SupabaseClient<Database>`:
  `createSupabaseClient` returns it, the web's `getSupabaseClient` and `createServerClient` hand it
  on as `ReturnType<typeof createSupabaseClient>`, so a swap of the backend SDK reaches every app
  type that holds a client.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "every package that is not core must be decoupled and have
  an adapter, in ui as a wrapper for example, and so think a strategy for each one; currently the
  Certifipago project already more or less does it, but evaluate and analyze and put it in the
  plan"
- 2026-11-15 (translated from Spanish): "Not only the UI libraries, but all the libraries
  themselves."
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **`lib/bootstrap` (unit 6).** `apps/mobile/src/lib/bootstrap/` holds what the root layout boots
  with: `holdSplashScreen` and `hideSplashScreen` of `splashScreen.adapter.ts`, the one
  `expo-splash-screen` import; `useAppBootstrap` of `useAppBootstrap.hook.ts`, which loads the
  seven faces `APP_FONTS` of `useAppBootstrap.constant.ts` names (the two files the font packages
  are imported in), hides the splash once they settle and returns `isReady`; and
  `AppSafeAreaProvider`, which with `ui/AuthShell` is the one import of the
  safe-area package. One hook, not a fonts hook and a splash hook: the splash staying up until the
  fonts settle is one rule (MOBILE-02), and the hold is a module-load call no hook can make, so it
  is the adapter's.
- **The root layout imports project modules only.** It calls `holdSplashScreen()` where it called
  `SplashScreen.preventAutoHideAsync()`, renders nothing until `useAppBootstrap` is ready, and wraps
  its tree in `AppSafeAreaProvider`. Its test mocks `@/lib/bootstrap/*`, the observability binding
  and, from unit 7, the app's auth gateway, and switches the theme through `applyTheme`: no vendor
  is imported or mocked.
- **Every theme through `applyTheme`.** `theme.config.ts` applies the start-up theme and a chosen
  one through `applyTheme` of `colorScheme.adapter.ts`, so it is the one call to NativeWind's
  color scheme outside the tests of `lib/theme` (unit 5's pending item).
- **The opaque client (unit 7).** `@app/supabase` exports `BackendClientType`, a branded type that
  names no Supabase type; `createSupabaseClient` and `createSupabaseServerClient` return it, the
  auth gateway takes it, and only `packages/supabase/src/backendClient.adapter.ts` turns it back
  into the SDK client, for the package's own adapters. `IBackendClientProvider` of `@app/core`
  stays the port, now of `BackendClientType`.
- **Both apps' `lib/supabase` on it.** The web's `getSupabaseClient` returns `BackendClientType`
  and `createServerClient` resolves to one; the mobile `supabase` client is typed by it, and a new
  `apps/mobile/src/lib/supabase/authGateway.adapter.ts` builds the gateway the root layout hands
  the auth provider, as the web's does. Sessions, cookies, the gateway's behaviour, row-level
  security and the origin guard are unchanged; every auth, session and gateway test keeps its
  assertions, and a test per app proves the gateway still gets the very client the app's client
  adapter creates.
- **The seams narrowed, the allowlist from 22 to 11.** `expo-splash-screen`, the two font packages
  and the safe-area package point at their `lib/bootstrap` files (the safe-area package also at
  `ui/AuthShell`), and `@app/supabase` at `apps/*/src/lib/supabase/*.adapter.ts`. The 11 entries
  leave the allowlist.
- **The docs and skills.** The `lib` and `arch` skills, `docs/code-standards.md` § 23,
  `docs/architecture/mobile.md` and `shared.md`, `packages/supabase/docs/database.md` and
  `docs/maps/global-map.md` name the new files and the opaque client.

## Out of scope

- **A PostHog provider.** The root layout mounts none: it binds observability through
  `src/lib/observability/observability.adapter.ts`, which already owns the client, so nothing
  moves; only its test stops mocking `posthog-react-native` and mocks that binding instead.
- **A data adapter over the client.** No app reads data through the client yet; when one does, its
  adapter lives in `packages/supabase/src/*.adapter.ts`, the one place the opaque client unwraps.
- **The web's routing and cache seams** (the rest of unit 6), which another change owns, and
  units 8 and 9.
- **`packages/supabase/README.md`**, which says a service calls the wired client: it is outside
  this change's files, and the note for it is recorded in `verify-report.md`.

## Affected specs

- `openspec/specs/apps/mobile/spec.md`: added MOBILE-74, MOBILE-75, MOBILE-76; modified MOBILE-02,
  MOBILE-73.
- `openspec/specs/apps/web/spec.md`: added WEB-80.
- `openspec/specs/packages/supabase/spec.md`: added SUPABASE-30; modified SUPABASE-01,
  SUPABASE-02.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
