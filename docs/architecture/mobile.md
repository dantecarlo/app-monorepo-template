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
    │   ├── _layout.tsx           # root Stack + providers (SafeArea, QueryClient, AuthProvider)
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
    │   └── ui/                   # Button, Chip, GlassCard, ErrorState, EmptyState, …
    ├── services/                 # SHARED, transversal services — one folder per domain
    │   └── <Domain>/             # e.g. Items/
    │       ├── <domain>.service.ts · <Domain>.adapter.ts
    │       ├── <domain>.constant.ts                               # optional
    │       └── index.ts          # barrel — consumers import from @/services/<Domain>
    ├── hooks/                    # SHARED hooks (used across screens, e.g. useSession)
    ├── stores/                   # Zustand slices (auth, toast, ui) — shared by definition
    ├── lib/                      # framework wiring: i18n/, observability/, query/, supabase/, theme/
    ├── helpers/                  # shared pure helpers + style.constant.ts
    ├── validation/               # shared zod schemas (or per-screen in the screen's models/)
    └── test/                     # test helper, setup, MSW and native-module mocks
```

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
shared chrome, add a route group (`(auth)`, `(tabs)`, …) with its own `_layout.tsx`; a route can
also re-export an `ErrorBoundary` from its screen barrel (Expo Router convention, none ships).

## 5. Conventions

All of [../code-standards.md](../code-standards.md) applies: arrow-only, alias imports (`@/*`),
file suffixes (`.screen.tsx`/`.component.tsx`/`.hook.ts`/`.service.ts`/`.adapter.ts`/`.type.ts`/
`.style.ts`/`.constant.ts`), `I{Name}`/`{Name}Type`/`{Name}Enum`, single-object params, UI
strings via i18n, screens handle loading/empty/error states.

## 6. The shipped sample

There is no `src/features/` folder; the sample code already follows the layout above.

| Unit                                                                              | Where                                                      |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Items dashboard and its five screen-local components (`ItemCard`, `StatsCard`, …) | `screens/ItemsDashboard/`                                  |
| Login form                                                                        | `screens/Login/`                                           |
| Items data access                                                                 | `src/services/Items/` (transversal)                        |
| Session state                                                                     | `src/hooks/useSession.hook.ts`, `src/stores/auth.store.ts` |
