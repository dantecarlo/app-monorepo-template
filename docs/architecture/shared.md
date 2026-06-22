# Monorepo architecture — shared foundation (general)

> The cross-platform doc. Per-platform detail: [mobile.md](mobile.md) (Expo) and
> [web.md](web.md) (Next.js). Binding code rules: [../code-standards.md](../code-standards.md).

## 1. Workspace layout

```
app/                              # pnpm workspaces + Turborepo
├── apps/
│   ├── mobile/   # Expo (React Native) — see mobile.md
│   └── web/      # Next.js 15 (App Router) — see web.md
└── packages/                     # SHARED, framework-agnostic only
    ├── tokens/    # design tokens (colors/spacing/type) + tailwind preset — VALUES, no components
    ├── core/      # domain/app logic: AppError, scrubPII, shared types/contracts (no React/RN/DOM)
    └── i18n/      # shared ICU catalogs (es/en) + locale constants
```

## 2. The fractal, screen-centric philosophy (applies to BOTH apps)

Same shape at every level: **shared lives at the root of `src/`** (`components`, `services`,
`hooks`, `helpers`, `stores`, `lib`, `validation`, `constants`); **screen-specific lives inside
`src/screens/<Screen>/`** (its own `components`, `hooks`, `models`, `styles`). We build **by
screen**, not by feature: take a view, build its screen, and for each thing it needs apply:

> **"Used by more than this screen?"** → yes = shared (`src/…`), no = screen-local
> (`src/screens/<S>/…`). **Services are transversal by default** (`src/services/`, each with its
> **adapter**). **Never `fetch` in a component.** Data flows `screen → hook → service → adapter`.

## 3. Shared vs per-app — the sharing model ("intermediate")

The deliberate middle ground: a **shared base** + **everything UI-specific separated per app**.

| Layer                                     | Where                    | Shared? | Why                                                                                |
| ----------------------------------------- | ------------------------ | :-----: | ---------------------------------------------------------------------------------- |
| Design tokens (values)                    | `packages/tokens`        |   ✅    | Platform-agnostic values; consumed by NativeWind (mobile) + Tailwind (web) presets |
| Domain/app logic, `AppError`, contracts   | `packages/core`          |   ✅    | Pure TS, no framework                                                              |
| i18n catalogs (ICU JSON)                  | `packages/i18n`          |   ✅    | Same keys both apps; adapter differs (react-i18next vs next-intl)                  |
| Optional backend client + generated types | project-specific package |   ✅    | One backend contract                                                               |
| **UI components, screens, navigation**    | `apps/<app>/src`         |   ❌    | **RN/NativeWind vs DOM/shadcn — never shared**                                     |
| Hooks/stores/lib wiring                   | `apps/<app>/src`         |   ❌    | App-specific (Expo Router vs Next App Router)                                      |

**Rule of thumb:** imports React/RN/DOM or a UI lib → **per-app**. Pure logic / values / contracts
→ **`packages/`**. (We never share React components across the DOM↔RN boundary.)

## 4. Cross-cutting standards (both apps)

- **i18n-first** — all user-facing strings from the shared catalogs.
- **Error-handling DoD** — every screen handles loading/empty/error + boundary; PII scrubbed.
- **Code standards** — arrow-only, alias imports, suffixes, naming, single-object params
  ([code-standards.md](../code-standards.md)), enforced by ESLint/Prettier/Husky.
- **Validation gate** — nothing is done until `pnpm validate` + the grouped validators are green.

## 5. Adding a new app (or new project)

Clone the per-app structure from [mobile.md](mobile.md) / [web.md](web.md), depend on the shared
`packages/*`, and inherit the standards from the template. The shared
base travels; each app keeps its own UI/screens.
