# Delta: apps/mobile

> **Change:** `2026-11-18-bootstrap-supabase-seams`

## ADDED Requirements

### Requirement: MOBILE-74 — The root layout boots through lib/bootstrap

The mobile app SHALL hold the native splash screen when the root layout loads, through
`holdSplashScreen` of `src/lib/bootstrap/splashScreen.adapter.ts`, load its fonts and hide the
splash through `useAppBootstrap` of `src/lib/bootstrap/useAppBootstrap.hook.ts` (MOBILE-02), and
give its tree the device's safe area through `AppSafeAreaProvider` of
`src/lib/bootstrap/AppSafeAreaProvider.component.tsx`. Only `splashScreen.adapter.ts` SHALL import
`expo-splash-screen`, only `useAppBootstrap.constant.ts`, which names the faces, and
`useAppBootstrap.hook.ts`, which loads them, the `@expo-google-fonts` packages, and only
`AppSafeAreaProvider.component.tsx` and `ui/AuthShell` `react-native-safe-area-context`, so the
root layout imports project modules only and its test mocks project modules, never a vendor.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the splash screen is held, then hidden

- **GIVEN** the native splash screen
- **WHEN** `holdSplashScreen` runs, then `hideSplashScreen`
- **THEN** the splash screen is kept up once, then hidden once
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/splashScreen.adapter.test.ts` › "keeps the native splash screen up until it is hidden"
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/splashScreen.adapter.test.ts` › "hides the native splash screen"

#### Scenario: the root layout loads

- **GIVEN** the root layout's module
- **WHEN** it loads
- **THEN** it holds the splash screen through `lib/bootstrap`, once
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "holds the splash screen through lib/bootstrap as it loads"

#### Scenario: the safe area

- **GIVEN** a tree
- **WHEN** `AppSafeAreaProvider` renders around it
- **THEN** the tree renders inside the device's safe-area provider
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/AppSafeAreaProvider.component.test.tsx` › "renders its tree inside the device's safe-area provider"

#### Scenario: the root layout or its test reaches a vendor

- **GIVEN** the root layout or its test importing or mocking `expo-splash-screen`, a font package,
  `react-native-safe-area-context`, `nativewind` or `posthog-react-native`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-75 — The auth gateway is built in lib/supabase

The mobile app SHALL build its one auth gateway in `src/lib/supabase/authGateway.adapter.ts`, a
Supabase auth gateway over the very client `src/lib/supabase/client.adapter.ts` creates, and the
root layout SHALL hand that gateway to the auth provider; only the `*.adapter.ts` files of
`src/lib/supabase/` SHALL import `@app/supabase`, tests included.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the gateway over the app's client

- **GIVEN** the app's Supabase client
- **WHEN** the auth gateway module loads
- **THEN** one Supabase auth gateway is created over that same client, and it is the gateway the
  module exports
- **Test:** `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "builds the auth gateway over the client the client adapter creates"

#### Scenario: the root layout renders

- **GIVEN** the gateway of `lib/supabase`
- **WHEN** the root layout renders
- **THEN** the auth provider bootstraps the session from that gateway
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "hands the auth provider the gateway lib/supabase builds"

#### Scenario: a file outside lib/supabase imports the package

- **GIVEN** the root layout or its test importing or mocking `@app/supabase`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-76 — The Supabase client is the opaque backend client

The mobile app SHALL type its Supabase client, `supabase` of `src/lib/supabase/client.adapter.ts`,
as the opaque `BackendClientType` of packages/supabase (SUPABASE-30), so no type of the app names
the Supabase client or a Supabase generic.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the client's type

- **GIVEN** the client adapter
- **WHEN** the type of the client it exports is read
- **THEN** it is `BackendClientType`
- **Test:** `apps/mobile/src/lib/supabase/__tests__/client.adapter.test.ts` › "types the client as the opaque backend client"

## MODIFIED Requirements

### Requirement: MOBILE-02 — Splash held until the fonts settle

The mobile app SHALL keep the native splash screen up and render no route until the Inter and
Montserrat fonts have loaded or failed to load: `useAppBootstrap` of
`src/lib/bootstrap/useAppBootstrap.hook.ts` loads the seven faces `APP_FONTS` of
`useAppBootstrap.constant.ts` names (Inter 400 and 500, Montserrat 400 to 800), hides the splash
screen once they settle, and tells the root layout when it may render.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the faces the app loads

- **GIVEN** the app has just launched
- **WHEN** the bootstrap starts
- **THEN** it loads Inter 400 and 500 and Montserrat 400, 500, 600, 700 and 800
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.constant.test.ts` › "holds the Inter and Montserrat faces the app uses"
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "loads the faces the app renders its text in"

#### Scenario: fonts still loading

- **GIVEN** the app has just launched
- **WHEN** the fonts have neither loaded nor failed
- **THEN** the bootstrap is not ready, the splash screen stays visible, and the root layout renders
  nothing
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "keeps the splash screen up and the routes back while the fonts load"
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "renders no route until the bootstrap is ready"

#### Scenario: the fonts load

- **GIVEN** the app has just launched
- **WHEN** the fonts load
- **THEN** the splash screen hides and the bootstrap is ready
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "hides the splash screen and lets the routes render once the fonts load"

#### Scenario: a font fails to load

- **GIVEN** the app has just launched
- **WHEN** loading a font fails
- **THEN** the splash screen hides and the routes render with the fallback font
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "hides the splash screen and lets the routes render when a font fails to load"

### Requirement: MOBILE-73 — A theme is applied through lib/theme

The mobile app SHALL apply a theme to NativeWind's live color scheme, without storing it, through
`applyTheme` of `src/lib/theme/colorScheme.adapter.ts`, so every theme-token consumer reads that
theme; the theme config SHALL apply the start-up theme and a chosen one through it, and a block's
or a route's test SHALL switch the theme through it, never through `nativewind`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a theme is applied

- **GIVEN** the dark theme is active
- **WHEN** `applyTheme` applies the light theme, then the dark one
- **THEN** the theme tokens read the light theme and its palette, then the dark ones
- **Test:** `apps/mobile/src/lib/theme/__tests__/colorScheme.adapter.test.ts` › "applies a theme to the live color scheme"

#### Scenario: the theme config

- **GIVEN** a light theme in the device storage
- **WHEN** the theme config starts, then the dark theme is chosen
- **THEN** it applies the light theme, then the dark one, each through `applyTheme`
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "applies the start-up theme and a chosen one through applyTheme"

#### Scenario: a block under the light theme

- **GIVEN** the light theme applied through `applyTheme`
- **WHEN** the `Text` block renders a caption and the `Screen` block a surface
- **THEN** each paints the light theme's colour
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour"
- **Test:** `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background"

#### Scenario: the root layout under the light theme

- **GIVEN** the light theme applied through `applyTheme`
- **WHEN** the root layout renders
- **THEN** the routes sit inside a view whose style holds the light theme's variables
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme"

#### Scenario: a block or route test imports nativewind

- **GIVEN** a `ui/` block test or the root layout's test that imports `nativewind`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`
