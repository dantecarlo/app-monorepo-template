# Mobile architecture — Expo (fractal, screen-centric)

> Companion docs: [shared.md](shared.md) (monorepo + what's shared vs per-app) and
> [web.md](web.md) (Next.js). Binding code rules: [../code-standards.md](../code-standards.md).

## 1. Philosophy — fractal, screen-centric

The structure is **fractal**: the _same folder shape_ repeats at every level, from the root of
`src/` down to each screen. There are two homes for everything:

- **Shared / transversal** → lives at the **root of `src/`** (`src/components`, `src/services`,
  `src/hooks`, `src/helpers`, `src/stores`, `src/lib`, `src/constants`). Used by many screens.
- **Screen-specific** → lives **inside that screen's folder** (`src/screens/<Screen>/components`,
  `/hooks`, `/models`, `/styles`, …). Used only by that one screen.

We build **by screen** (not by feature): take a view, build its screen, and for each thing it
needs apply the **decision rule** below.

## 2. Directory layout

```
apps/mobile/
├── app.json · metro.config.js · babel.config.js · tailwind.config.js · global.css
└── src/
    ├── app/                      # Expo Router routes ONLY (thin; delegate to a screen)
    │   ├── _layout.tsx           # root Stack + providers (AppSafeAreaProvider, AppQueryProvider,
    │   │                         # AuthProvider), the Toast viewport and the root ErrorBoundary export
    │   ├── index.tsx             # /       → ItemsDashboardScreen
    │   └── login.tsx             # /login  → LoginScreen
    │
    ├── screens/                  # one folder per screen — FRACTAL (ItemsDashboard, Login)
    │   └── <ScreenName>/
    │       ├── <ScreenName>.screen.tsx
    │       ├── <ScreenName>.style.ts · <ScreenName>.constant.ts   # when needed
    │       ├── components/       # components used ONLY by this screen
    │       ├── hooks/            # hooks used ONLY by this screen
    │       ├── models/           # types/interfaces specific to this screen
    │       └── index.ts          # barrel (public API of the screen)
    │
    ├── components/               # SHARED UI (used across ≥2 screens)
    │   ├── AuthProvider/         # session bootstrap from the @app/core auth gateway
    │   ├── RootErrorBoundary/    # render-crash fallback: ErrorState + retry on the theme background
    │   └── ui/                   # Button, Chip, GlassCard, ErrorState, EmptyState, …
    ├── services/                 # SHARED, transversal services — one folder per domain
    │   └── <Domain>/             # e.g. Items/
    │       ├── <domain>.service.ts · <Domain>.adapter.ts
    │       ├── <domain>.constant.ts                               # optional
    │       └── index.ts          # barrel — consumers import from @/services/<Domain>
    ├── hooks/                    # SHARED hooks (used across screens, e.g. useSession)
    ├── stores/                   # state slices (auth, toast, ui) through createAppStore — shared
    ├── lib/                      # framework wiring: bootstrap/ (the fonts, the splash screen and
    │                             # the safe area the root boots with), i18n/ (the translator over
    │                             # react-i18next), observability/, posthog/, query/ (the query API over
    │                             # TanStack Query), storage/ (the device key-value storage),
    │                             # store/ (createAppStore, the one zustand import), supabase/, theme/
    ├── helpers/                  # shared pure helpers + layout.style.ts (positioning only)
    ├── validation/               # shared zod schemas (or per-screen in the screen's models/)
    └── test/                     # test helper, setup, MSW and native-module mocks
```

Every folder that holds a unit keeps that unit's test in its own `__tests__/`, named after it:
`components/ui/Toast/__tests__/Toast.component.test.tsx`, `stores/__tests__/auth.store.test.ts`.
A route test sits in the `__tests__/` of its route's folder and is named after its route file as
`<route>.route.test.tsx`: `app/__tests__/layout.route.test.tsx` tests `app/_layout.tsx`. Metro's
default `resolver.blockList` keeps `__tests__/` out of the bundle
([code-standards § 9](../code-standards.md)).

A shared `src/constants/` folder is created on first use; none ships today.

## 3. The decision rule (shared vs specific)

When a screen needs something, ask **"is it used by more than this screen?"**

| Need         | Used by 1 screen               | Used by ≥2 screens                                       |
| ------------ | ------------------------------ | -------------------------------------------------------- |
| Component    | `screens/<S>/components/`      | `src/components/`                                        |
| Hook         | `screens/<S>/hooks/`           | `src/hooks/`                                             |
| Type / model | `screens/<S>/models/`          | `src/<domain>` types or `packages/core`                  |
| Service      | (rare) `screens/<S>/services/` | **`src/services/<Domain>/`** (the default — transversal) |
| Constants    | `screens/<S>/<S>.constant.ts`  | `src/constants/`                                         |

**Services are transversal by default** → almost always `src/services/<Domain>/`, one folder per
domain holding the service, its **adapter** (DTO → ViewModel, pure), optional constants and a
barrel `index.ts`. Consumers import from the barrel (`@/services/Items`). **Never `fetch` in a
component** — data flows `screen → hook → service → adapter`. Adapters are created **per
service/shape**, not shared.

## 4. Routing

`src/app/` is the **routing layer only** (Expo Router file-based). A route file is thin and
delegates to its screen:

```tsx
// src/app/index.tsx
import { ItemsDashboardScreen } from '@/screens/ItemsDashboard'
const HomePage = () => <ItemsDashboardScreen />
export default HomePage
```

Expo Router resolves `src/app/` automatically (no root `app/`). The shipped routes are flat —
`/` and `/login` under the root `Stack` in `_layout.tsx`, with no route guard. When an area needs
shared chrome, add a route group (`(auth)`, `(tabs)`, …) with its own `_layout.tsx`. The root
`_layout.tsx` boots through `src/lib/bootstrap/` and imports project modules only: it holds the
splash screen with `holdSplashScreen` as it loads, renders nothing until `useAppBootstrap` has
loaded the faces `APP_FONTS` names (or one failed to load) and hidden the splash, and wraps its tree
in `AppSafeAreaProvider`. Only those files import `expo-splash-screen`, the font packages and, with
`ui/AuthShell`, `react-native-safe-area-context`, so the route's test mocks `@/lib/bootstrap/*`,
never a vendor. The root `_layout.tsx` exports `RootErrorBoundary` as its `ErrorBoundary` (Expo
Router convention), so a
render crash in any route shows the `ErrorState` with a retry and is reported to observability
once, through `useReportBoundaryError` and `reportBoundaryError` in `src/lib/observability/`; a
route can export its own `ErrorBoundary`, re-exported from its screen barrel, to catch its crashes
closer. A failed query adds no toast: the screen shows its `ErrorState`, as the dashboard's items
list does with a retry that refetches; a failed mutation is the toast
([code-standards § 19](../code-standards.md)). A query key holds its dynamic values in one trailing
params object (`['items', 'list', { limit, search }]`), which the error report always redacts. A
key holds every value its query reads, so two items lists of different limits never share a cache
entry. A hook queries through `useAppQuery` and `useAppMutation` of `src/lib/query/`, which take
and return the app's own types, and invalidates with `useInvalidateAppQuery`; the root layout
renders `AppQueryProvider`, and only `src/lib/query/` imports TanStack Query. Every store under
`src/stores/` is created through `createAppStore` of `src/lib/store/createAppStore.helper.ts`, the
one file that imports zustand, and a persisted store keeps its fields on the device through
`keyValueStorage` of `src/lib/storage/`, as the theme and language choices do; only that adapter
imports AsyncStorage. The observability port is bound to PostHog in
`src/lib/observability/observability.adapter.ts`; its one client, `src/lib/posthog/posthogClient.adapter.ts`, is the only file that imports
`posthog-react-native` and constructs the client only when PostHog may run (in `opt-in` mode,
after a grant), and Sentry is an optional capability `/init` can prune. The consent API a
banner calls is bound in `src/lib/observability/consent.adapter.ts`, and
`EXPO_PUBLIC_POSTHOG_CONSENT` picks PostHog's consent mode
([../observability.md](../observability.md#consent)).

## 5. Conventions

All of [../code-standards.md](../code-standards.md) applies: arrow-only, alias imports (`@/*`),
file suffixes (`.screen.tsx`/`.component.tsx`/`.hook.ts`/`.service.ts`/`.adapter.ts`/`.type.ts`/
`.style.ts`/`.constant.ts`), `I{Name}`/`{Name}Type`/`{Name}Enum`, single-object params, UI
strings via i18n, screens handle loading/empty/error states. Every user-facing string of a block
is a catalog message of the active language, accessibility labels included (the toast's dismiss
control, the busy labels of `Button`, `LoadingSkeleton` and the async boundary); an adapter
returns data, never a sentence, so the items adapter gives an item's age as a unit and a count,
which the item card words through `items.age`. A block reads its copy through
`useAppTranslator()` of `src/lib/i18n/useAppTranslator.hook.ts`, the `IAppTranslator` of
`@app/i18n` the web gives too, with full keys (`t('items.dashboard.title')`); only
`src/lib/i18n/` imports react-i18next, i18next, its ICU plugin, the plural rules polyfill and
expo-localization, and the language setter is `setLanguage` of `src/lib/i18n/i18n.config.ts`
(code-standards § 15). A component test reads that copy through `renderWithI18n` in
`src/test/i18n.helper.tsx`, an i18next instance on the real catalogs, or mocks
`@/lib/i18n/useAppTranslator.hook`, never react-i18next.

**Styling lives in the components** (`AGENTS.md` LAW, `docs/code-standards.md` §22). A block under
`src/components/ui/`, or a screen's own `components/`, owns its look, in NativeWind classes or a
StyleSheet built from `@app/tokens`. A screen, a route file and a container under
`src/components/<Name>/` only position: their StyleSheet entries and style props carry flex,
gap, alignment, position, size and spacing, never a colour, a font or a radius. Text is
`ui/Text`, a labelled rule `ui/Divider`, a screen's surface `ui/Screen` (the active theme's
base), a gradient `ui/Gradient`, the accent gradient `ui/AccentGradient` and the status bar
`ui/StatusBar`; the navigator's themed background and the status bar's glyphs come from
`useRootTheme`. Only `ui/` imports a UI kit or a drawing primitive
(`expo-linear-gradient`, `react-native-svg`), and a primitive with a wrapper only through it:
`ui/Gradient` alone imports `expo-linear-gradient`, `ui/StatusBar` alone `expo-status-bar`, whose
style type, `StatusBarStyleType`, is the block's own, and the async boundary alone
`react-error-boundary`, whose fallback takes `IAsyncBoundaryFallbackProps`. `local/style-positions-only`,
`local/style-token-values` and `local/ui-kit-boundary` hold it; a number in a StyleSheet is not
read.

**Tokens and the light theme.** The light theme reaches the whole app from the root. The root
layout wraps the routes in a view carrying `themeVars[active]` through NativeWind's `vars()`
(`useRootTheme`), so every NativeWind colour class follows the theme: the preset
(`@app/tokens/tailwind-preset.cjs`, which `tailwind.config.js` loads) writes each themed colour
as `var(--c-<name>)` and each shared colour as its literal. A StyleSheet that paints a themed
colour is built once per theme with `createThemedStyles` (or `createThemedValues` for a colour
map) from `src/lib/theme/`, and the block reads the active one through `useThemedStyles`; a view
that reads a colour inline takes the palette from `useThemeTokens`. `applyTheme` of
`src/lib/theme/colorScheme.adapter.ts` applies a theme to the live scheme without storing it; the
theme config applies the start-up and the chosen theme through it, and a block's or a route's test
switches the theme through it, never through nativewind. A module-level StyleSheet over
the static `colors` stays dark, and `createThemedStyles.helper.test.ts` fails on one. `spacing`,
`radius`, `fontSize` and the shared colours are read from `@app/tokens` directly. A new value goes
in the token source, then `pnpm --filter @app/tokens generate`; never edit a generated file
(`pnpm verify:theme-sync`).

## 6. The shipped sample

There is no `src/features/` folder; the sample code already follows the layout above.

| Unit                                                                              | Where                                                      |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Items dashboard and its five screen-local components (`ItemCard`, `StatsCard`, …) | `screens/ItemsDashboard/`                                  |
| Login form                                                                        | `screens/Login/`                                           |
| Items data access                                                                 | `src/services/Items/` (transversal)                        |
| Session state                                                                     | `src/hooks/useSession.hook.ts`, `src/stores/auth.store.ts` |
