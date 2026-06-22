# app-monorepo-template

A production-grade **pnpm + Turborepo monorepo starter** for building a **web (Next.js)** app
and a **mobile (Expo)** app that share one design system, architecture, and standards.

---

## Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo                 |
| Web              | Next.js 15 (App Router) + Tailwind CSS v3   |
| Mobile           | Expo (React Native) + NativeWind v4         |
| Design system    | `@app/tokens` — shared tokens + Tailwind preset |
| State            | Zustand                                     |
| Data fetching    | TanStack Query v5                           |
| Language         | TypeScript (strict)                         |
| Linting          | ESLint 9 flat config + 12 plugins           |
| Formatting       | Prettier                                    |
| Git hooks        | Husky + lint-staged + commitlint            |
| Optional backend | Supabase (env-driven, off by default)       |

---

## Monorepo layout

```
app-monorepo-template/
├── pnpm-workspace.yaml
├── package.json            # root scripts + devDeps + lint-staged
├── turbo.json
├── tsconfig.base.json      # shared TS base config (@app/* path aliases)
├── eslint.config.mjs       # root ESLint 9 flat config (all packages + apps)
├── .prettierrc.json        # semi:false, singleQuote, printWidth:75
├── .prettierignore
├── commitlint.config.js    # conventional commits
├── .husky/
│   ├── pre-commit          # pnpm lint-staged
│   └── commit-msg          # pnpm commitlint --edit $1
├── .gitignore
├── LICENSE
│
├── docs/
│   ├── code-standards.md        # BINDING rules for the entire monorepo
│   ├── infrastructure.md        # Vercel + Cloudflare hosting + security guide
│   └── architecture/
│       ├── shared.md            # monorepo layout, sharing model, packages/*
│       ├── mobile.md            # Expo fractal screen-centric layout
│       └── web.md               # Next.js App Router fractal screen-centric layout
│
├── .claude/
│   ├── agents/validator.md      # adversarial validator subagent definition
│   ├── commands/validate-all.md # /validate-all slash command
│   └── skills/validate-all/SKILL.md  # validation harness recipe
│
├── packages/
│   ├── ui/                 # @app/tokens — design tokens + Tailwind preset
│   │   ├── src/tokens.ts   # colors, spacing, radius, typography, shadows
│   │   └── tailwind-preset.cjs
│   ├── core/               # @app/core — AppError, scrubPII, shared contracts (no React/RN/DOM)
│   │   └── src/
│   │       ├── errors/AppError.ts
│   │       ├── utils/scrubPII.ts
│   │       └── index.ts
│   └── i18n/               # @app/i18n — ICU catalogs (en/es) + parity test
│       └── src/
│           ├── locales/{en,es}.ts
│           ├── locales/parity.test.ts
│           └── index.ts
│
└── apps/
    ├── web/                # @app/web — Next.js 15 + App Router
    │   └── src/
    │       ├── app/             # routing only (layout, page, providers)
    │       ├── components/ui/   # Button, Chip, GlassCard
    │       ├── features/items/  # demo feature (fractal — migrate to screens/ over time)
    │       ├── helpers/, lib/, stores/
    │
    └── mobile/             # @app/mobile — Expo + expo-router + NativeWind
        ├── app/             # expo-router file-based routes
        └── src/
            ├── features/items/  # demo feature (fractal — migrate to screens/ over time)
            ├── helpers/, lib/, stores/
```

---

## Shared design system

`packages/tokens` is the **single source of truth** for visual design.

- `src/tokens.ts` — plain TypeScript: colors, spacing, radius, typography, shadows, gradients.
  No framework dependencies. Both apps import these directly.
- `tailwind-preset.cjs` — CommonJS Tailwind preset that maps the same values into Tailwind's
  `theme.extend`. Used by both apps via `require('@app/tokens/tailwind-preset.cjs')`.

**Web** consumes design tokens through Tailwind class names (e.g. `bg-bg-base`, `text-accent`).
**Mobile** uses NativeWind class names + direct token imports for RN `StyleSheet.create()`.

---

## Shared logic packages

### `@app/core`

Pure TypeScript — no React, no RN, no DOM. Safe to import from both apps.

- `AppError` — typed application error with `code` (NETWORK / NOT_FOUND / UNAUTHORIZED / VALIDATION / UNKNOWN)
- `scrubPII` — recursive PII redactor; wire into Sentry `beforeSend` + `beforeBreadcrumb`

### `@app/i18n`

Shared ICU catalogs for web and mobile. Add a locale file, extend the parity test.

- `en.ts` / `es.ts` — typed catalog objects
- `parity.test.ts` — Vitest test that asserts `en` and `es` have identical keys (fail-fast on missing translations)
- Default locale: `en`. Override in each app's i18n adapter.

---

## Code standards

All code in this monorepo must conform to **[docs/code-standards.md](docs/code-standards.md)**.

Key rules (see the doc for full details and examples):

- **Arrow functions only** — no `function` keyword
- **Alias imports only** — `@/*`, `@app/*`; ban `../`
- **File suffixes required** — `.component.tsx`, `.service.ts`, `.adapter.ts`, etc.
- **Naming** — `I{Name}` interfaces, `{Name}Type`, `{Name}Enum`, `ALL_CAPS_PURPOSE` consts
- **Single-object params** — no positional args; destructure from one typed object
- **Service + Adapter always paired** — never `fetch` in components
- **No magic numbers/strings** — enums and constants always
- **Max 500 lines** per file (ESLint error)
- **Tests** — `test()`, semantic queries, no `data-testid`
- **Auto-sort** — imports, keys, props (ESLint enforced)
- **Prettier** — no `;`, single quotes, width 75
- **Conventional commits** — enforced by commitlint

### Validation gate

Nothing is **DONE** until the harness is green:

1. `pnpm validate` — runs `turbo run lint typecheck test build format:check`
2. `/validate-all` — four parallel adversarial validator subagents (G-standards, G-tests, G-security, G-a11y-design-dod)

---

## Architecture

The fractal, screen-centric philosophy is documented in:

- **[docs/architecture/shared.md](docs/architecture/shared.md)** — monorepo layout, packages, sharing model
- **[docs/architecture/mobile.md](docs/architecture/mobile.md)** — Expo screen-centric structure
- **[docs/architecture/web.md](docs/architecture/web.md)** — Next.js App Router screen-centric structure

The short version: build **by screen**, not by feature. Each screen owns its components/hooks/models.
Shared things (used by ≥2 screens) live at `src/{components,services,hooks,…}`.
Services are transversal by default — each paired with an adapter. **Never `fetch` in a component.**

The template ships with `src/features/items/` as a starting point — it already follows the
service+adapter+hook pattern. Migrate to `src/screens/` over time as described in the architecture docs.

---

## Getting started

```bash
# Install all workspace dependencies
pnpm install

# Initialize git hooks (run once after clone)
pnpm prepare

# Start the web app
pnpm --filter web dev

# Start the mobile app
pnpm --filter mobile start
```

### Scripts

| Script              | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `pnpm build`        | Build all apps                                            |
| `pnpm dev`          | Start all dev servers                                     |
| `pnpm lint`         | Run ESLint across all packages                            |
| `pnpm lint:fix`     | Auto-fix ESLint (imports, keys, etc.)                     |
| `pnpm format`       | Prettier write                                            |
| `pnpm format:check` | Prettier check (CI gate)                                  |
| `pnpm typecheck`    | TypeScript check across all packages                      |
| `pnpm validate`     | Full gate: lint + typecheck + test + build + format:check |
| `pnpm prepare`      | Initialize Husky git hooks                                |

### Environment variables

Web (`apps/web/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Mobile (`apps/mobile/.env`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both apps ship with mock data by default — Supabase is optional.

---

## How to add a screen

The target structure is screen-centric (see [docs/architecture](docs/architecture/)):

```
src/screens/<ScreenName>/
├── <ScreenName>.screen.tsx    # container: wires hooks, renders layout
├── <ScreenName>.styles.ts     # Tailwind / RN StyleSheet constants
├── components/                # components used ONLY by this screen
├── hooks/                     # hooks used ONLY by this screen
├── models/                    # types specific to this screen
└── index.ts                   # barrel (public API)
```

For each thing the screen needs: **"Used by more than this screen?"** → yes → `src/{components,services,hooks}/`.

### Data chain

1. Add query key to `lib/query/queryKeys.constant.ts`
2. Implement `services/<name>.service.ts` (fetch) + `services/<Name>.adapter.ts` (DTO → ViewModel)
3. Create `hooks/use<Name>.hook.ts` using `useAppQuery`
4. Build the screen + components
5. Export via `index.ts`
6. Add route in `src/app/` (web: `page.tsx`; mobile: route file)

---

## Infrastructure

Default hosting: **Next.js on Vercel** behind **Cloudflare** (DNS proxy, WAF, DDoS, CDN,
Turnstile, rate limiting).

See **[docs/infrastructure.md](docs/infrastructure.md)** for: origin-lock setup, security
checklist, Vercel-behind-Cloudflare gotchas, cache rules, and the public/private static-asset split.

---

## Dev tooling (Claude Code plugins)

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

---

## License

Proprietary — All Rights Reserved. This repository is published for viewing and evaluation only.
To use, deploy, or build upon this code, you must obtain written permission or a paid license from the author.
Contact: https://github.com/dantecarlo
