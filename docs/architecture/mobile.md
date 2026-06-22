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
    │   ├── _layout.tsx           # root layout + providers + route guard
    │   ├── index.tsx
    │   ├── (auth)/{login,signup}.tsx
    │   └── (home)/index.tsx
    │
    ├── screens/                  # one folder per screen — FRACTAL
    │   └── <ScreenName>/
    │       ├── <ScreenName>.screen.tsx
    │       ├── <ScreenName>.styles.ts
    │       ├── components/       # components used ONLY by this screen
    │       ├── hooks/            # hooks used ONLY by this screen
    │       ├── models/           # types/interfaces specific to this screen
    │       └── index.ts          # barrel (public API of the screen)
    │
    ├── components/               # SHARED UI (used across ≥2 screens)
    │   └── ui/                   # Button, Chip, GlassCard, ErrorState, EmptyState
    ├── services/                 # SHARED, transversal services — each paired with its adapter
    │   ├── auth.service.ts + Auth.adapter.ts
    │   └── items.service.ts + Items.adapter.ts
    ├── hooks/                    # SHARED hooks (used across screens, e.g. useSession)
    ├── stores/                   # Zustand slices (auth, toast, ui) — shared by definition
    ├── lib/                      # framework wiring: query/, i18n/, observability/
    ├── helpers/                  # shared pure helpers + style.constant.ts
    ├── constants/                # shared constants/enums
    └── validation/              # shared zod schemas (or per-screen in the screen's models/)
```

## 3. The decision rule (shared vs specific)

When a screen needs something, ask **"is it used by more than this screen?"**

| Need         | Used by 1 screen               | Used by ≥2 screens                                           |
| ------------ | ------------------------------ | ------------------------------------------------------------ |
| Component    | `screens/<S>/components/`      | `src/components/`                                            |
| Hook         | `screens/<S>/hooks/`           | `src/hooks/`                                                 |
| Type / model | `screens/<S>/models/`          | `src/<domain>` types or `packages/core`                      |
| Service      | (rare) `screens/<S>/services/` | **`src/services/`** (the default — services are transversal) |
| Constants    | `screens/<S>/<S>.constant.ts`  | `src/constants/`                                             |

**Services are transversal by default** → almost always `src/services/`, each with its **adapter**
(DTO → ViewModel, pure). **Never `fetch` in a component** — data flows
`screen → hook → service → adapter`. Adapters are created **per service/shape**, not shared.

## 4. Routing

`src/app/` is the **routing layer only** (Expo Router file-based). A route file is thin and
delegates to its screen:

```tsx
// src/app/(home)/index.tsx
import { HomeScreen } from '@/screens/Home'
const HomeRoute = () => <HomeScreen />
export default HomeRoute
export { ErrorBoundary } from '@/screens/Home' // per-route error boundary
```

Expo Router resolves `src/app/` automatically (no root `app/`). Route groups `(auth)` /
`(home)` map to areas; each group's `_layout.tsx` sets shared chrome.

## 5. Conventions

All of [../code-standards.md](../code-standards.md) applies: arrow-only, alias imports (`@/*`),
file suffixes (`.screen.tsx`/`.component.tsx`/`.hook.ts`/`.service.ts`/`.adapter.ts`/`.type.ts`/
`.styles.ts`/`.constant.ts`), `I{Name}`/`{Name}Type`/`{Name}Enum`, single-object params, UI
strings via i18n, screens handle loading/empty/error states.

## 6. Migration map (features → screens)

The template ships with a `src/features/` structure as a starting point. The target
screen-centric layout collapses it as follows:

| Current                                             | Target                              |
| --------------------------------------------------- | ----------------------------------- |
| `features/items/screens/ItemsDashboard.screen.tsx`  | `screens/ItemsDashboard/`           |
| `features/auth/screens/Login.screen.tsx`            | `screens/Login/`                    |
| `features/auth/screens/SignUp.screen.tsx`           | `screens/SignUp/`                   |
| `features/items/components/ItemCard` (reused)       | `src/components/ItemCard/` (shared) |
| `features/*/services/*.service.ts` + `*.adapter.ts` | `src/services/` (transversal)       |
| screen-only hooks                                   | `screens/<S>/hooks/`                |
| shared hooks                                        | `src/hooks/`                        |
| `features/` directory                               | **removed**                         |
