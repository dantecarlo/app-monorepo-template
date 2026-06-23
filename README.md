# app-monorepo-template

A production-grade **pnpm + Turborepo monorepo starter** for building a **web (Next.js)** app
and a **mobile (Expo)** app that share one design system, architecture, and standards — with the
**fractal, screen-centric** architecture enforced automatically by guardrails (so the structure
can't silently rot as the codebase grows).

---

## Stack

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo                             |
| Web              | Next.js 15 (App Router) + Tailwind CSS v3              |
| Mobile           | Expo (React Native, `src/app` router) + NativeWind v4 |
| Design system    | `@app/tokens` — shared tokens + Tailwind preset        |
| Backend client   | `@app/supabase` — single typed client factory          |
| i18n             | `@app/i18n` — shared JSON catalogs (en/es) + parity    |
| State            | Zustand                                                 |
| Data fetching    | TanStack Query v5                                       |
| Language         | TypeScript (strict)                                     |
| Linting          | ESLint 9 flat config + shared rule module (all 6 workspaces) |
| Formatting       | Prettier (no `;`, single quotes, width 75)             |
| Testing          | Vitest + happy-dom + vitest-axe + MSW                   |
| Git hooks        | Husky + lint-staged + commitlint                        |

---

## Monorepo layout

```
app-monorepo-template/
├── pnpm-workspace.yaml
├── package.json            # root scripts + devDeps + lint-staged
├── turbo.json
├── tsconfig.base.json      # shared TS base config (@app/* path aliases)
├── eslint.config.mjs       # ESLint 9 flat config — wires the shared rules into every workspace
├── eslint.rules.mjs        # SHARED rule module (BASE + REACT + FILENAME + overrides)
├── scripts/
│   ├── verify-tests.mjs    # fails if any unit lacks a sibling *.test.* (tests-per-unit gate)
│   └── verify-maps.mjs     # validates docs/maps refs + audits inline magic numbers (AST)
├── .prettierrc.json · .prettierignore · commitlint.config.js
├── .husky/{pre-commit,commit-msg}
│
├── docs/
│   ├── code-standards.md            # BINDING rules for the entire monorepo
│   ├── infrastructure.md            # Vercel + Cloudflare hosting + security guide
│   ├── architecture/{shared,mobile,web}.md   # fractal screen-centric layout per platform
│   └── maps/
│       ├── global-map.md            # navigable index of every shared/global thing
│       └── screen-map.template.md   # per-screen internal map template
│
├── .claude/
│   ├── agents/validator.md          # adversarial validator subagent
│   ├── commands/validate-all.md     # /validate-all slash command
│   └── skills/
│       ├── validate-all/            # validation harness (G-standards/tests/security/a11y/fractal)
│       ├── fractal-verify/          # audits one built block against the fractal contract
│       └── product-discovery/       # product → screens/services/data/components → launch map
│
├── packages/                        # SHARED, framework-agnostic only
│   ├── tokens/    # @app/tokens — src/tokens.constant.ts + tailwind-preset.cjs (VALUES, no components)
│   ├── core/      # @app/core — errors/AppError.helper.ts, utils/scrubPII.helper.ts (no React/RN/DOM)
│   ├── i18n/      # @app/i18n — locales/{en,es}.json + i18n.constant.ts + resources.constant.ts + parity test
│   └── supabase/  # @app/supabase — src/{client.adapter,server.adapter,types}.ts + supabase/{config,migrations,tests}
│
└── apps/
    ├── web/       # @app/web — Next.js 15 (App Router)
    │   └── src/
    │       ├── app/                 # routing only (layout, page, providers)
    │       ├── screens/ItemsDashboard/   # example FRACTAL screen (the pattern to copy)
    │       │   ├── ItemsDashboard.screen.tsx · index.ts
    │       │   ├── components/ItemCard/   · hooks/useItems.hook.ts · models/Item.type.ts
    │       ├── components/ui/{Button,Chip,GlassCard}   # shared UI
    │       ├── services/            # transversal services + adapters (items.service + Items.adapter)
    │       ├── helpers/ · lib/{query,supabase} · stores/ · test/{mocks}
    │
    └── mobile/    # @app/mobile — Expo + expo-router (src/app) + NativeWind
        └── src/
            ├── app/                 # expo-router file-based routes (src/app, not root app/)
            ├── screens/ItemsDashboard/   # same fractal anatomy as web
            ├── services/ · helpers/ · lib/{query,supabase} · stores/ · test/{mocks}
```

---

## Shared design system — `@app/tokens`

The **single source of truth** for visual design.

- `src/tokens.constant.ts` — plain TypeScript: colors, spacing, radius, typography, shadows,
  gradients. No framework dependencies. Both apps import these directly.
- `tailwind-preset.cjs` — Tailwind preset mapping the same values into `theme.extend`, consumed
  by both apps via `require('@app/tokens/tailwind-preset.cjs')`.

**Web** uses Tailwind class names (e.g. `bg-bg-base`, `text-accent`). **Mobile** uses NativeWind
class names + direct token imports for RN `StyleSheet.create()`.

---

## Shared logic packages

### `@app/core`

Pure TypeScript — no React/RN/DOM. Safe to import from both apps.

- `AppError` — typed application error with a `code` (NETWORK / NOT_FOUND / UNAUTHORIZED / VALIDATION / UNKNOWN).
- `scrubPII` — recursive PII redactor; wire into Sentry `beforeSend` + `beforeBreadcrumb`.

### `@app/i18n`

Shared ICU **JSON** catalogs for web and mobile.

- `locales/{en,es}.json` — translation catalogs.
- `i18n.constant.ts` — locale constants (languages, default/fallback, `FORMATTING_LOCALE`).
- `resources.constant.ts` — builds the i18next resources object.
- `__tests__/catalog-parity.test.ts` — fails fast if `en` and `es` keys diverge.

### `@app/supabase`

The single typed Supabase source (no per-app client duplication).

- `client.adapter.ts` — browser client factory, single-object param `{ url, anonKey }`.
- `server.adapter.ts` — SSR server client factory (cookies adapter).
- `types.ts` — generated `Database` types (run `gen:types`); placeholder until generated.
- `supabase/` — `config.toml` + `migrations/` + `tests/` (pgTAP).

---

## Code standards & guardrails

All code must conform to **[docs/code-standards.md](docs/code-standards.md)**. The key difference
from a typical starter: **the rules are enforced automatically across all 6 workspaces** via the
shared `eslint.rules.mjs` — no workspace escapes.

- **Arrow functions only** — no `function` keyword (`no-restricted-syntax`)
- **Alias imports only** — `@/*`, `@app/*`; ban `../`
- **File suffixes enforced** — `.component.tsx`, `.screen.tsx`, `.styles.ts`, `.hook.ts`,
  `.service.ts`, `.adapter.ts`, `.type.ts`, `.store.ts`, `.constant.ts`, `.helper.ts`, `.test.*`
  (via `eslint-plugin-check-file` — not honor-system)
- **Constants, not inline** — `no-magic-numbers` is an **error**; literals live in `*.constant.ts`
- **Logic in hooks, not views** — `useEffect`/`useMemo`/`useCallback` are banned in `.screen.tsx`
  and `.component.tsx`; logic belongs in `.hook.ts`
- **Naming** — `I{Name}` interfaces, `{Name}Type`, `{Name}Enum`, `ALL_CAPS` consts
- **Single-object params** · **Service + Adapter always paired** · **never `fetch` in a component**
- **Tests-per-unit** — every `*.component/*.hook/*.helper/*.service/*.adapter` has a sibling test
  (`scripts/verify-tests.mjs`)
- **Max 500 lines** · **auto-sorted** imports/keys/props · **conventional commits** (commitlint)

### Validation gate — nothing is DONE until it's green

1. `pnpm validate` — `turbo run lint typecheck test build format:check` **+ `verify:tests` + `verify:maps`**
2. `/validate-all` — five parallel adversarial validator subagents:
   **G-standards · G-tests · G-security · G-a11y-design-dod · G-fractal**
3. `fractal-verify` skill — audit any freshly scaffolded screen/component against the fractal
   contract (folder structure, constants-not-inline, logic-in-hook, service+adapter, tests-per-unit)
   before committing.

---

## Architecture — fractal, screen-centric

Documented per platform:

- **[docs/architecture/shared.md](docs/architecture/shared.md)** — monorepo layout, packages, sharing model
- **[docs/architecture/mobile.md](docs/architecture/mobile.md)** — Expo screen-centric structure
- **[docs/architecture/web.md](docs/architecture/web.md)** — Next.js App Router screen-centric structure
- **[docs/maps/global-map.md](docs/maps/global-map.md)** — where every shared/global thing lives

Build **by screen**, not by feature. Each screen owns its `components/hooks/models/styles`; the
screen file is render-only and delegates logic to its hooks. Shared things (used by ≥2 screens)
live at `src/{components,services,hooks,…}`. Services are transversal, each paired with an adapter.

The template ships with `src/screens/ItemsDashboard/` (both apps) as the **reference example** —
copy its anatomy for new screens.

---

## Getting started

```bash
pnpm install            # install all workspace dependencies
pnpm prepare            # initialize git hooks (run once after clone)
pnpm --filter @app/web dev      # start the web app
pnpm --filter @app/mobile start # start the mobile app
```

### Scripts

| Script              | Purpose                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `pnpm dev`          | Start all dev servers                                               |
| `pnpm lint`         | ESLint across all workspaces (shared rules)                         |
| `pnpm lint:fix`     | Auto-fix ESLint (imports, keys, etc.)                               |
| `pnpm typecheck`    | TypeScript check across all packages                                |
| `pnpm format:check` | Prettier check (CI gate)                                            |
| `pnpm verify:tests` | Tests-per-unit presence check                                       |
| `pnpm verify:maps`  | Map-reference + inline-magic-number audit                           |
| `pnpm validate`     | Full gate: lint + typecheck + test + build + format:check + verify:tests + verify:maps |
| `pnpm prepare`      | Initialize Husky git hooks                                          |

### Environment variables

```
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both apps ship with mock data + placeholder Supabase env, so they render without a backend.

---

## How to add a screen

```
src/screens/<ScreenName>/
├── <ScreenName>.screen.tsx    # render-only container: composes children from hook data
├── <ScreenName>.styles.ts     # Tailwind / RN StyleSheet constants
├── components/<Child>/        # components used ONLY by this screen
├── hooks/                     # hooks (own ALL logic/derivation) used ONLY by this screen
├── models/                    # types specific to this screen
└── index.ts                   # barrel (public API)
```

Decision rule: **"Used by more than this screen?"** → yes → `src/{components,services,hooks}/`.

### Data chain

1. Add query key to `lib/query/queryKeys.constant.ts`
2. `services/<name>.service.ts` (fetch) + `services/<Name>.adapter.ts` (DTO → ViewModel)
3. `hooks/use<Name>.hook.ts` using `useAppQuery` (owns derivation)
4. Build the screen + screen-local components (render-only)
5. Add `<Child>.test.*` per unit · export via `index.ts`
6. Add route in `src/app/` (web: `page.tsx`; mobile: route file) importing from the barrel
7. Run `fractal-verify` on the block, then `pnpm validate`

---

## Infrastructure

Default hosting: **Next.js on Vercel** behind **Cloudflare** (DNS proxy, WAF, DDoS, CDN,
Turnstile, rate limiting). See **[docs/infrastructure.md](docs/infrastructure.md)** for origin-lock
setup, the security checklist, Vercel-behind-Cloudflare gotchas, and cache rules.

---

## Dev tooling (Claude Code plugins + skills)

Install once (user-level):

```
/plugin marketplace add dantecarlo/claude-plugins
/plugin install react-fractal@dantecarlo-plugins
/plugin install frontend-testing@dantecarlo-plugins
/plugin install frontend-quality@dantecarlo-plugins
```

- **react-fractal** — `/arch /feature /component /screen /service /store /lib`
- **frontend-testing** — `/test /mock /fix-test`
- **frontend-quality** — `/quality /pre-commit /perf /a11y /modify /security`

Project skills (in `.claude/skills/`): **validate-all** (the gate), **fractal-verify** (per-block
architecture audit), **product-discovery** (turn an idea into a buildable plan + launch map).

---

## License

Proprietary — All Rights Reserved. This repository is published for viewing and evaluation only.
To use, deploy, or build upon this code, you must obtain written permission or a paid license from the author.
Contact: https://github.com/dantecarlo
