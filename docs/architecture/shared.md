# Monorepo architecture — shared foundation (general)

> The cross-platform doc. Per-platform detail: [mobile.md](mobile.md) (Expo) and
> [web.md](web.md) (Next.js). Binding code rules: [../code-standards.md](../code-standards.md).

## 1. Workspace layout

```
app/                              # pnpm workspaces + Turborepo
├── apps/
│   ├── mobile/   # Expo (React Native) — see mobile.md
│   └── web/      # Next.js 16 (App Router) — see web.md
└── packages/                     # SHARED, framework-agnostic only
    ├── tokens/    # design tokens (colors/spacing/type) + tailwind preset — VALUES, no components
    ├── core/      # domain/app logic: AppError, scrubPII, shared types/contracts (no React/RN/DOM)
    ├── i18n/      # shared ICU catalogs (es/en) + locale constants
    ├── supabase/  # Supabase client, schema types and the service-error mapper (backend adapter)
    └── cloudflare/ # Cloudflare adapters: origin guard, Turnstile, R2 and image delivery
```

## 2. The fractal, screen-centric philosophy (applies to BOTH apps)

Same shape at every level: **shared lives at the root of `src/`** (`components`, `services`,
`hooks`, `helpers`, `stores`, `lib`, `validation`, `constants`); **screen-specific lives inside
`src/screens/<Screen>/`** (its own `components`, `hooks`, `models`, `styles`). We build **by
screen**, not by feature: take a view, build its screen, and for each thing it needs apply:

> **"Used by more than this screen?"** → yes = shared (`src/…`), no = screen-local
> (`src/screens/<S>/…`). **Services are transversal by default** — each domain lives in
> `src/services/<Domain>/` (PascalCase), with its **adapter**, a barrel `index.ts`, and
> optional constants. External consumers import from the barrel; internal files use the
> full alias path. **Never `fetch` in a component.** Data flows
> `screen → hook → service → adapter`.

## 3. Shared vs per-app — the sharing model ("intermediate")

The deliberate middle ground: a **shared base** + **everything UI-specific separated per app**.

| Layer                                     | Where                    | Shared? | Why                                                                                |
| ----------------------------------------- | ------------------------ | :-----: | ---------------------------------------------------------------------------------- |
| Design tokens (values)                    | `packages/tokens`        |   ✅    | Platform-agnostic values; consumed by NativeWind (mobile) + Tailwind (web) presets |
| Domain/app logic, `AppError`, contracts   | `packages/core`          |   ✅    | Pure TS, no framework                                                              |
| i18n catalogs (ICU JSON)                  | `packages/i18n`          |   ✅    | Same keys both apps; adapter differs (react-i18next vs next-intl)                  |
| Optional backend client + generated types | project-specific package |   ✅    | One backend contract                                                               |
| **UI components, screens, navigation**    | `apps/<app>/src`         |   ❌    | **RN/NativeWind vs DOM/Tailwind — never shared**                                   |
| Hooks/stores/lib wiring                   | `apps/<app>/src`         |   ❌    | App-specific (Expo Router vs Next App Router)                                      |

**Rule of thumb:** imports React/RN/DOM or a UI lib → **per-app**. Pure logic / values / contracts
→ **`packages/`**. (We never share React components across the DOM↔RN boundary.)

## 4. Cross-cutting standards (both apps)

- **i18n-first** — all user-facing strings from the shared catalogs.
- **Error-handling DoD** — every screen handles loading/empty/error + boundary; PII scrubbed.
- **Code standards** — arrow-only, alias imports, suffixes, naming, single-object params
  ([code-standards.md](../code-standards.md)), enforced by ESLint/Prettier/Husky.
- **Validation gate** — nothing is done until `pnpm validate` + the grouped validators are green.

### Host APIs in `packages/core`

`packages/core` compiles under `lib: ["ES2022"]` with **no DOM lib and no
`@types/node`**, because it must run unchanged in Node, the browser, and React
Native. That is deliberate: anything the ES language does not define — `console`,
`fetch`, `setTimeout`, `process`, `crypto` — has no type in this layer, so
reaching for it is a compile error.

**Do not fix that error by widening the package.** Adding `@types/node` hands
this layer `process` and `Buffer`; adding the DOM lib hands it `window` and
`document`. Either one lets code call APIs that do not exist in every target
runtime, and the type system stops enforcing the contract the package exists to
hold.

**Declare the dependency narrowly and locally instead.** The pattern lives in
[`packages/core/src/utils/hostConsole.helper.ts`](../../packages/core/src/utils/hostConsole.helper.ts):

```ts
export interface IHostConsole {
  error: (...args: readonly unknown[]) => void
  warn: (...args: readonly unknown[]) => void
}

// Module-scoped: shadows nothing globally, so it cannot collide with the real
// console types that apps/web (DOM) and apps/mobile already carry.
declare const console: IHostConsole

export const hostConsole: IHostConsole = console
```

Three rules for a new host API:

1. Declare only the members actually used — never the whole interface.
2. Keep the declaration **module-scoped**. A `declare global` would leak into
   every consumer and collide with their real DOM or Node types.
3. Only do this for an API that genuinely exists in **every** target runtime. If
   it does not, it belongs behind a port in `packages/core/src/ports/` with a
   per-app adapter — see the observability, bot-protection, and origin-guard
   ports for the shape.

Tests spy on the seam (`vi.spyOn(hostConsole, 'error')`), not on the bare global.

## 5. Adding a new app (or new project)

Clone the per-app structure from [mobile.md](mobile.md) / [web.md](web.md), depend on the shared
`packages/*`, and inherit the standards from the template. The shared
base travels; each app keeps its own UI/screens.
