# Global architecture map

> The navigable index of every **shared / global** thing in this monorepo:
> where it lives, what it's for, and which suffix it carries. Per-screen
> internals are mapped separately — see
> [screen-map.template.md](screen-map.template.md), filled once per screen.
>
> Binding rules: [../code-standards.md](../code-standards.md). Layer model:
> [../architecture/shared.md](../architecture/shared.md),
> [../architecture/web.md](../architecture/web.md),
> [../architecture/mobile.md](../architecture/mobile.md).
>
> This file is gated: `node scripts/verify-maps.mjs` fails if any path
> referenced below no longer exists. Update the map when you move things.

## How to read this map

The monorepo is **fractal and screen-centric**. The same shape repeats at
every level:

> **shared** lives at the root of a `src/` (or in `packages/`), **screen-local**
> lives inside `src/screens/<Screen>/`. The litmus test for every new thing:
> **"used by more than this screen?"** → yes = shared (here), no = screen-local
> (see the per-screen template).

Anything below is **shared**. If you are looking for a screen's own component,
hook, model, or styles, it is not here — open that screen's folder.

---

## 1. Cross-app shared packages (`packages/`)

Framework-agnostic, shared by BOTH apps. Pure values / logic / contracts —
**never** React, RN, or DOM. Imported via the `@app/*` alias.

| Thing                 | Path                                                                     | Suffix         | What it holds                                                     |
| --------------------- | ------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------- |
| Design tokens         | `packages/tokens/src/tokens.constant.ts`                                 | `.constant.ts` | Colors, spacing, type scale — the design source of truth          |
| Tailwind preset       | `packages/tokens/tailwind-preset.cjs`                                    | `.cjs`         | Token-derived preset consumed by web Tailwind + mobile NativeWind |
| Domain errors         | `packages/core/src/errors/AppError.helper.ts`                            | `.helper.ts`   | `AppError` + typed error contract (messageKey, cause chaining, prototype fix) |
| Service error mapper  | `packages/core/src/errors/buildServiceError.helper.ts`                   | `.helper.ts`   | Maps provider errors to typed AppError codes + i18n keys via injectable mapper |
| Service error mapper type | `packages/core/src/errors/IServiceErrorMapper.type.ts`               | `.type.ts`     | `IServiceErrorMapper` port — injectable mapError seam for provider-specific error detection |
| Auth gateway port     | `packages/core/src/ports/auth/IAuthGateway.type.ts`                      | `.type.ts`     | `IAuthGateway` port + session/user/subscription primitive types — no SDK imports |
| Backend client port   | `packages/core/src/ports/client/IBackendClientProvider.type.ts`          | `.type.ts`     | `IBackendClientProvider<TClient>` port — url + anonKey provisioning contract  |
| Query-key sanitizer   | `packages/core/src/observability/sanitizeQueryKey.helper.ts`             | `.helper.ts`   | Redacts dynamic id segments from query keys before error reporting (PII-safe) |
| PII scrubbing         | `packages/core/src/utils/scrubPII.helper.ts`                             | `.helper.ts`   | Scrub sensitive fields before they reach any monitoring sink      |
| i18n catalogs         | `packages/i18n/src/locales/es.json`, `packages/i18n/src/locales/en.json` | `.json`        | ICU message catalogs (default `es`, plus `en`)                    |
| i18n constants        | `packages/i18n/src/locales/i18n.constant.ts`                             | `.constant.ts` | Locale codes + default-locale constant                            |
| i18n resources        | `packages/i18n/src/locales/resources.constant.ts`                        | `.constant.ts` | Catalog registry consumed by each app's i18n adapter              |
| Backend client        | `packages/supabase/src/client.adapter.ts`                                | `.adapter.ts`  | Browser/native Supabase client factory; satisfies `IBackendClientProvider` |
| Backend server client | `packages/supabase/src/server.adapter.ts`                                | `.adapter.ts`  | Server/SSR client factory                                         |
| Backend SSR client    | `packages/supabase/src/ssr.adapter.ts`                                   | `.adapter.ts`  | Cookie-aware SSR client (@supabase/ssr) for RLS propagation       |
| Supabase error mapper | `packages/supabase/src/mapSupabaseError.adapter.ts`                      | `.adapter.ts`  | `IServiceErrorMapper` implementation — maps Postgrest errors to `ServiceErrorCodeType` |
| Supabase error builder | `packages/supabase/src/buildSupabaseServiceError.helper.ts`             | `.helper.ts`   | Wired default: `buildServiceError` + `mapSupabaseError`; use in services  |
| Backend types         | `packages/supabase/src/types.ts`                                         | `.ts`          | Generated DB types + typed exports                                |
| Core test config      | `packages/core/vitest.config.ts`                                         | `.config.ts`   | Vitest config for the core package (node env, includes src/**/*.test.ts)  |

Each package exposes its public surface through a barrel: `packages/core/src/index.ts`,
`packages/i18n/src/index.ts`, `packages/supabase/src/index.ts`, `packages/tokens/src/index.ts`.

**Rule of thumb**: imports React / RN / DOM or a UI lib → it does NOT belong
here (it goes per-app, sections 2–3). Pure logic / values / contracts → here.

---

## 2. Per-app shared globals — Web (`apps/web/src/`)

App-specific shared layer. Lives at the root of `apps/web/src/`, imported via
the `@/*` alias. UI here is DOM / shadcn / Tailwind.

| Thing                  | Path                                                                    | Suffix                        | What it holds                                              |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| Shared UI kit          | `apps/web/src/components/ui`                                            | `.component.tsx`              | Reusable primitives (`Button`, `Chip`, `GlassCard`, `AsyncBoundary`, `Toast`) |
| Transversal services   | `apps/web/src/services/Items/items.service.ts`                          | `.service.ts`                 | Items data access (mock + HTTP variants)                   |
| Transversal adapter    | `apps/web/src/services/Items/Items.adapter.ts`                          | `.adapter.ts`                 | DTO → IItemViewModel mapping                               |
| Service constants      | `apps/web/src/services/Items/items.constant.ts`                         | `.constant.ts`                | Time units, mock tuning, API URL                           |
| Services barrel        | `apps/web/src/services/Items/index.ts`                                  | `index.ts`                    | Public API barrel for the Items domain                     |
| Cached summary service | `apps/web/src/services/ItemsSummary/itemsSummary.service.ts`            | `.service.ts`                 | 'use cache' server fetch — cacheLife('minutes') + cacheTag |
| Summary adapter        | `apps/web/src/services/ItemsSummary/ItemsSummary.adapter.ts`            | `.adapter.ts`                 | IItemDto[] → IItemsSummaryViewModel counts                 |
| Summary constants      | `apps/web/src/services/ItemsSummary/itemsSummary.constant.ts`           | `.constant.ts`                | CACHE_LIFE_PROFILE, CACHE_TAG (no magic strings in service)|
| Summary barrel         | `apps/web/src/services/ItemsSummary/index.ts`                           | `index.ts`                    | Public API barrel for the ItemsSummary domain              |
| Style constants        | `apps/web/src/helpers/style.constant.ts`                                | `.constant.ts`                | Shared Tailwind class-string constants                     |
| Query keys             | `apps/web/src/lib/query/queryKeys.constant.ts`                          | `.constant.ts`                | Central React Query key registry                           |
| Query client factory   | `apps/web/src/lib/query/createQueryClient.helper.ts`                    | `.helper.ts`                  | Configured QueryClient with PII-safe cache error sinks     |
| Error message resolver | `apps/web/src/lib/query/resolveErrorMessage.helper.ts`                  | `.helper.ts`                  | Standardized query/mutation error → user string (override > messageKey > message > fallback) |
| App-query hook         | `apps/web/src/lib/query/useAppQuery.hook.ts`                            | `.hook.ts`                    | Wrapper over `useQuery` (project defaults)                 |
| App-mutation hook      | `apps/web/src/lib/query/useAppMutation.hook.ts`                         | `.hook.ts`                    | Wrapper over `useMutation` (project defaults)              |
| Supabase client wiring | `apps/web/src/lib/supabase/client.adapter.ts`                           | `.adapter.ts`                 | App-local client adapter over `@app/supabase`              |
| Supabase server wiring | `apps/web/src/lib/supabase/server.adapter.ts`                           | `.adapter.ts`                 | App-local server adapter over `@app/supabase`              |
| Global stores          | `apps/web/src/stores/ui.store.ts`, `apps/web/src/stores/toast.store.ts` | `.store.ts`                   | Cross-screen Zustand slices                                |
| Route tree             | `apps/web/src/app`                                                      | Next App Router               | RSC pages, layout, providers                               |
| Test infra             | `apps/web/src/test`                                                     | (no suffix)                   | Vitest setup, MSW mocks, test helper (harness, not a unit) |

**Not present yet, but reserved by convention** (create when first needed,
following the same suffix rules): a root `constants/` folder for cross-screen
enums/constants, a root `hooks/` folder for cross-screen hooks, and a root
`validation/` folder for shared schemas. Until a thing is shared by more than
one screen it stays screen-local.

---

## 3. Per-app shared globals — Mobile (`apps/mobile/src/`)

Same shape as web, but UI is React Native / NativeWind. Imported via `@/*`.

| Thing                  | Path                                                                          | Suffix                        | What it holds                                       |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------- |
| Transversal services   | `apps/mobile/src/services/Items/items.service.ts`                             | `.service.ts`                 | Items data access (mock implementation)             |
| Transversal adapter    | `apps/mobile/src/services/Items/Items.adapter.ts`                             | `.adapter.ts`                 | DTO → IItemViewModel mapping                        |
| Service constants      | `apps/mobile/src/services/Items/items.constant.ts`                            | `.constant.ts`                | Time units, mock tuning                             |
| Services barrel        | `apps/mobile/src/services/Items/index.ts`                                     | `index.ts`                    | Public API barrel for the Items domain              |
| Style constants        | `apps/mobile/src/helpers/style.constant.ts`                                   | `.constant.ts`                | Shared NativeWind / RN style constants              |
| Query keys             | `apps/mobile/src/lib/query/queryKeys.constant.ts`                             | `.constant.ts`                | Central React Query key registry                    |
| Shared UI kit          | `apps/mobile/src/components/ui`                                               | `.component.tsx`              | Reusable primitives (`AsyncBoundary`, `Toast`)      |
| Query client factory   | `apps/mobile/src/lib/query/createQueryClient.helper.ts`                       | `.helper.ts`                  | Configured QueryClient with PII-safe cache error sinks |
| Error message resolver | `apps/mobile/src/lib/query/resolveErrorMessage.helper.ts`                     | `.helper.ts`                  | Standardized query/mutation error → user string     |
| App-query hook         | `apps/mobile/src/lib/query/useAppQuery.hook.ts`                               | `.hook.ts`                    | Wrapper over `useQuery` (project defaults)          |
| App-mutation hook      | `apps/mobile/src/lib/query/useAppMutation.hook.ts`                            | `.hook.ts`                    | Wrapper over `useMutation` (project defaults)       |
| Supabase client wiring | `apps/mobile/src/lib/supabase/client.adapter.ts`                              | `.adapter.ts`                 | App-local client adapter over `@app/supabase`       |
| Global stores          | `apps/mobile/src/stores/ui.store.ts`, `apps/mobile/src/stores/toast.store.ts` | `.store.ts`                   | Cross-screen Zustand slices                         |
| Route tree             | `apps/mobile/src/app`                                                         | Expo Router                   | `_layout.tsx`, `index.tsx`, file-based routes       |
| Test infra             | `apps/mobile/src/test`                                                        | (no suffix)                   | Vitest setup + mocks (harness, not a unit)          |

The same reserved-by-convention folders apply (`constants/`, `hooks/`,
`components/`, `validation/`): add them per app only once a thing is shared by
more than one screen.

---

## 4. Screens (fractal roots)

Screens are the build unit. Each one is self-contained and owns its data
fetching, layout, and local members. Their internals are mapped per screen by
[screen-map.template.md](screen-map.template.md).

| App    | Screens root              | Example screen                           |
| ------ | ------------------------- | ---------------------------------------- |
| Web    | `apps/web/src/screens`    | `apps/web/src/screens/ItemsDashboard`    |
| Web    | `apps/web/src/screens`    | `apps/web/src/screens/ItemsSummary`      |
| Mobile | `apps/mobile/src/screens` | `apps/mobile/src/screens/ItemsDashboard` |

Data flow inside every screen: **screen → hook → service → adapter**. A screen
never calls `fetch` directly and never holds business logic in the view.

---

## 5. Design tokens & styling

| Concern         | Where                                                                                 | Notes                                            |
| --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Token values    | `packages/tokens/src/tokens.constant.ts`                                              | Single source of truth (colors / spacing / type) |
| Tailwind preset | `packages/tokens/tailwind-preset.cjs`                                                 | Web Tailwind + mobile NativeWind both extend it  |
| Web Tailwind    | `apps/web/tailwind.config.ts`                                                         | Extends the shared preset                        |
| Mobile Tailwind | `apps/mobile/tailwind.config.js`                                                      | Extends the shared preset                        |
| Class constants | `apps/web/src/helpers/style.constant.ts`, `apps/mobile/src/helpers/style.constant.ts` | No inline class strings in views — import these  |

Inline literals (numbers/strings) belong in `*.constant.ts` or `*.styles.ts`
only — enforced by ESLint and by `node scripts/verify-maps.mjs`.

---

## 6. Tooling, gates & agent skills

| Thing                | Path                                     | What it does                                                                          |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Deterministic gate   | `package.json`                           | `pnpm validate` → `turbo run lint typecheck test build format:check` + verify scripts |
| Tests-per-unit check | `scripts/verify-tests.mjs`               | Fails if a unit lacks a sibling `*.test.*`                                            |
| Maps + literal check | `scripts/verify-maps.mjs`                | This map's integrity + magic-literal audit (`pnpm verify:maps`)                       |
| Project rename       | `scripts/init-project.mjs`               | Rewrites `@app/*`, `app-monorepo-template`, and bundle ID to a real project slug      |
| Identity guard       | `scripts/check-identity.mjs`             | Fails if template-default identity is still present; wired into `pnpm validate`       |
| CI workflow          | `.github/workflows/ci.yml`               | Runs `pnpm install` + `pnpm validate` on PR and push to main (ATL_TEMPLATE_SELF=1)   |
| Lint rules           | `eslint.rules.mjs`, `eslint.config.mjs`  | Arrow-only, alias imports, suffixes, naming, no-magic-numbers                         |
| Prettier             | `.prettierrc.json`                       | No semicolons, single quotes, width 75                                                |
| Commit lint          | `commitlint.config.js`                   | Conventional commits (commit-msg hook)                                                |
| Turbo pipeline       | `turbo.json`                             | Task graph + `dependsOn` ordering                                                     |
| Validation harness   | `.claude/skills/validate-all/SKILL.md`   | Deterministic gate + grouped adversarial validators                                   |
| Fractal audit skill  | `.claude/skills/fractal-verify/SKILL.md` | Per-block fractal architecture audit                                                  |
| Validator subagent   | `.claude/agents/validator.md`            | Subagent definition used by the harness                                               |

---

## 7. Where does a new thing go? (decision shortcut)

1. **Pure value / logic / contract, no framework** → `packages/` (section 1).
2. **Shared by 2+ screens, app-specific** → that app's `src/` root (sections 2–3).
3. **Used by exactly one screen** → that screen's folder (per-screen template).
4. **Data access** → `src/services/<Domain>/` (PascalCase folder) containing
   `.service.ts` + paired `.adapter.ts` + optional `.constant.ts` + barrel `index.ts`.
   External consumers import from the barrel; never `fetch` in a view.
5. **Magic value** → a `*.constant.ts` (or `*.styles.ts` for styling), never inline.
