---
name: lib
description: >
  Wrap a third-party library behind a project-internal API: register the package and its seam
  in .agents/contracts/dependencies.json, write the src/lib/{name}/ wrapper, the vendor adapter
  behind a port, or the components/ui block that owns it, under the project's own types, move
  every caller onto it, and mock the project module in tests, never the vendor. The one
  procedure of ADR 0002; never adds an allowlist entry. Arrow-only, alias imports.
  USE WHEN: "wrap library", "create lib for [vendor]", "abstract [library]",
  "add [name] lib", "create a wrapper for [package]", "hide [vendor] behind a port".
---

# Lib — wrap a library behind its seam

> The one procedure for putting a library behind the project's own API
> (`docs/decisions/0002-every-library-behind-an-adapter.md`, `docs/code-standards.md` §23).
> Features import the project module, `@/lib/{name}`, `@/components/ui/{Block}` or `@app/*`,
> never the vendor. `local/dependency-seam` refuses an import outside the package's seam and an
> unregistered package anywhere; `local/wrapped-import` refuses a name a wrapper owns outside it;
> `pnpm verify:dependency-seams` holds the registry to every `package.json`.

---

## Pre-flight Checklist

Before writing anything:

1. Read the package's entry in `.agents/contracts/dependencies.json`. No entry means the package
   is new: Step 1 registers it.
2. Look for a wrapper that already exists: `src/lib/` of each app, the app's
   `src/components/ui/`, and the workspace packages (`docs/code-standards.md` §0). If one does,
   extend it: never a second wrapper for one package.
3. List the files that import the package today (`rg "from '{package}'" apps packages`): each
   one moves to the project module in Step 3.
4. Read the worked example below, `lib/cache`: it is the shape every wrapper takes.

---

## Decision Tree — which seam

```
Is the package core (the language, the framework runtime, an @app/* core package)?
├── YES → no wrapper: import it directly. Only what the registry narrows is wrapped:
│         next/navigation, next/cache and next/image, a react-native primitive a ui/ block
│         is named after, an expo-router hook. Stop here unless it is one of those.
└── NO → what is it?
    ├── a UI kit, its primitives or its class helpers → category "ui",
    │     seam: the components/ui block that wraps it (built through `component` or `modify`)
    ├── a vendor SDK (backend, analytics, errors, edge) → category "vendor",
    │     seam: its *.adapter.ts behind a port in @app/core, and the framework configs it needs
    ├── an @app/* package that wraps a vendor → category "vendor-package",
    │     seam: apps/*/src/lib/{name}/*.adapter.ts
    ├── an infrastructure library (i18n, query, state, storage, validation, theme)
    │     → category "infra", seam: the app's src/lib/{name}/ wrapper
    ├── dev tooling (lint, test, build) → category "build",
    │     seam: the tests, configs and scripts that run it
    └── installed for a framework, never imported → category "peer", seam: []
```

---

## Step 1 — Register the package and its seam

In the same change that adds the package to a `package.json`, add its entry to
`.agents/contracts/dependencies.json`, grouped with the entries of its category:

```json
{
  "name": "{package}",
  "category": "infra",
  "seam": ["apps/web/src/lib/{name}/{name}.adapter.ts"],
  "note": "Behind {publicApi} of lib/{name}; its tests mock @/lib/{name}."
}
```

Rules:

- A `core` entry has no `seam`; every other category has one: the repository globs of the files
  that may import the package, by pattern where a rule holds for every app
  (`apps/*/src/lib/query/**`).
- Narrow the seam to the files that need the vendor: one file when one file does
  (`next/cache` → `cachePolicy.adapter.ts`), the wrapper's folder when the wrapper spans
  several files (`apps/*/src/lib/query/**`).
- A seam glob must match a file, so the entry and the wrapper land in the same commit.
- Leave `types` out: a type-only import needs the seam too (decision 58). `"anywhere"` is only
  for a type the plan allows outside the seam, and no entry has one.
- A subpath (`next/navigation`) gets its own entry, which wins over its package's.

---

## Step 2 — Write the wrapper under a project-owned API and types

Follow the branch the decision tree chose.

**An infrastructure library** gets `src/lib/{name}/` in each app that uses it, or a workspace
package in `packages/{name}/` when both apps share it:

```
src/lib/{name}/
├── {name}.adapter.ts       # the one file that imports the vendor (or use{Name}.hook.ts)
├── {name}.constant.ts      # the app's own enums and values, never the vendor's
├── {name}.type.ts          # the project-owned types the API takes and returns
├── index.ts                # the barrel callers import
└── __tests__/              # {name}.adapter.test.ts, the only test that mocks the vendor
```

**A UI kit** gets a `components/ui/{Block}/` built through the `component` skill, or an existing
block changed through `modify`. Only the block's component file imports the kit, and its props
are its own: variant unions from its `*.constant.ts`, never the kit's `VariantProps` or prop
types (`docs/code-standards.md` §22).

**A vendor SDK** gets a port in `@app/core` and an adapter that implements it:

```typescript
// packages/core/src/ports/client/IBackendClientProvider.type.ts
export interface IBackendClientProvider<TClient = unknown> {
  createClient(params: ICreateBackendClientParams): TClient
}

// packages/supabase/src/client.adapter.ts — a factory that satisfies the port
export const createSupabaseClient = ({
  anonKey,
  url
}: ICreateBackendClientParams): BackendClientType =>
  toBackendClient({ client: createClient<Database>(url, anonKey) })
```

The client leaves the package as the opaque `BackendClientType`; only
`packages/supabase/src/backendClient.adapter.ts` turns it back into the SDK client, so no app type
names the vendor's.

Rules, on every branch:

- The API takes and returns the project's types: never re-export a vendor type, and never
  `Pick` one into a public type.
- Expose what the callers use today, nothing more; a new need joins the wrapper with its first
  caller.
- Config comes from environment variables, never a hardcoded key or URL.
- The wrapper is domain-agnostic: no feature logic in it.
- Arrow const, single-object params, alias imports, the binding suffixes.

---

## Step 3 — Move every caller onto the project module

Every file listed in pre-flight step 3 imports the project module instead:

```typescript
// WRONG — a service reaches the vendor
import { cacheLife, cacheTag } from 'next/cache'

// RIGHT — it imports the project module that owns the seam
import { applyCachePolicy } from '@/lib/cache'
```

Then `pnpm lint` reports any caller left behind: it is outside the seam Step 1 registered.

---

## Step 4 — Mock the project module in tests

- The wrapper's own test inherits its seam, and is the one test that mocks the vendor.
- Every other test mocks the project module (`vi.mock('@/lib/{name}')`), or renders through the
  app's shared double in `src/test/` (`createRoutingDouble`, `createQueryWrapper`,
  `renderWithIntl`, `renderWithI18n`). A test that mocks the vendor fails `local/dependency-seam`
  like any other file of its unit.
- Add the double to `src/test/{name}.helper.ts` when several tests need the same one.

---

## Step 5 — Never add an allowlist entry

`eslint-dependency-seam-allowlist.json` ships empty. It held the imports that broke the rule
when it landed, and it only shrinks. An import that cannot move yet is a reason to stop and ask,
never an entry: the gate accepts an entry whose reason names an F.8 unit, and only review would
catch a new one, which is why this procedure never writes one.

---

## Worked example — `lib/cache` (web)

`next/cache` is a subpath of the core `next`, narrowed to one file. Copied from the code as it is.

The registry entry, `.agents/contracts/dependencies.json:48-53`:

```json
    {
      "name": "next/cache",
      "category": "infra",
      "seam": ["apps/web/src/lib/cache/cachePolicy.adapter.ts"],
      "note": "Behind applyCachePolicy of lib/cache, which a 'use cache' function calls with one of the app's CacheLifeEnum profiles and its tags; its tests mock @/lib/cache."
    },
```

The app's own values, `apps/web/src/lib/cache/cachePolicy.constant.ts`:

```typescript
/**
 * The cache-life profiles Next ships. Each sets how long a cached result
 * stays fresh on the client, when the server revalidates it and when it
 * expires; a profile configured in next.config.ts adds its member here.
 */
export const CacheLifeEnum = {
  DAYS: 'days',
  DEFAULT: 'default',
  HOURS: 'hours',
  MAX: 'max',
  MINUTES: 'minutes',
  SECONDS: 'seconds',
  WEEKS: 'weeks'
} as const
```

The project-owned types, `apps/web/src/lib/cache/cachePolicy.type.ts`:

```typescript
import type { CacheLifeEnum } from '@/lib/cache/cachePolicy.constant'

export type CacheLifeType =
  (typeof CacheLifeEnum)[keyof typeof CacheLifeEnum]

/** The life and the tags of a cached function's result. */
export interface ICachePolicy {
  /** How long the result stays fresh, revalidates and expires. */
  life: CacheLifeType
  /** The tags an on-demand revalidation purges the result by. */
  tags: readonly string[]
}
```

The one file that imports the vendor, `apps/web/src/lib/cache/cachePolicy.adapter.ts`:

```typescript
import { cacheLife, cacheTag } from 'next/cache'

import { CacheLifeEnum } from '@/lib/cache/cachePolicy.constant'
import type {
  CacheLifeType,
  ICachePolicy
} from '@/lib/cache/cachePolicy.type'

// Each profile of the app, set through the overload of cacheLife that Next
// declares for that one profile name.
const SET_CACHE_LIFE: Record<CacheLifeType, () => void> = {
  [CacheLifeEnum.DAYS]: () => cacheLife(CacheLifeEnum.DAYS),
  [CacheLifeEnum.DEFAULT]: () => cacheLife(CacheLifeEnum.DEFAULT),
  [CacheLifeEnum.HOURS]: () => cacheLife(CacheLifeEnum.HOURS),
  [CacheLifeEnum.MAX]: () => cacheLife(CacheLifeEnum.MAX),
  [CacheLifeEnum.MINUTES]: () => cacheLife(CacheLifeEnum.MINUTES),
  [CacheLifeEnum.SECONDS]: () => cacheLife(CacheLifeEnum.SECONDS),
  [CacheLifeEnum.WEEKS]: () => cacheLife(CacheLifeEnum.WEEKS)
}

/**
 * Sets the life profile and the tags of the result of the function under
 * 'use cache' that calls it, once while that function runs. Next throws
 * when it runs outside such a function.
 */
export const applyCachePolicy = ({ life, tags }: ICachePolicy): void => {
  SET_CACHE_LIFE[life]()
  cacheTag(...tags)
}
```

The barrel callers import, `apps/web/src/lib/cache/index.ts`:

```typescript
export { applyCachePolicy } from './cachePolicy.adapter'
export { CacheLifeEnum } from './cachePolicy.constant'
```

The wrapper's own test, the one that mocks the vendor,
`apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts:10-20`:

```typescript
// cacheLife and cacheTag run only inside a 'use cache' function of a Next
// render, so the test replaces them with spies.
const { cacheLife, cacheTag } = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn()
}))

vi.mock('next/cache', () => ({ cacheLife, cacheTag }))

import { applyCachePolicy, CacheLifeEnum } from '@/lib/cache'
import type { ICachePolicy } from '@/lib/cache/cachePolicy.type'
```

A caller, `apps/web/src/services/ItemsSummary/itemsSummary.service.ts:1-3` and `:24-30`:

```typescript
'use cache'

import { applyCachePolicy } from '@/lib/cache'
```

```typescript
export const getItemsSummary =
  async (): Promise<IItemsSummaryViewModel> => {
    applyCachePolicy({ life: CACHE_LIFE_PROFILE, tags: [CACHE_TAG] })

    const dtos = await getItems({})
    return adaptItemsSummary(dtos)
  }
```

The caller's test mocks the project module, never `next/cache`,
`apps/web/src/services/ItemsSummary/__tests__/itemsSummary.service.test.ts:8-15` and `:76-84`:

```typescript
const { applyCachePolicy } = vi.hoisted(() => ({
  applyCachePolicy: vi.fn()
}))

vi.mock('@/lib/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cache')>()),
  applyCachePolicy
}))
```

```typescript
  test('sets the minutes life profile and the items-summary tag once', async () => {
    await getItemsSummary()

    expect(applyCachePolicy).toHaveBeenCalledExactlyOnceWith({
      life: CacheLifeEnum.MINUTES,
      tags: [CACHE_TAG]
    })
    expect(CACHE_TAG).toBe('items-summary')
  })
```

What it leaves out on purpose: `revalidateTag`, `revalidatePath` and `updateTag` have no caller,
so the wrapper does not expose them; the first caller adds one, under the app's own types.

---

## The other seams to read before writing one

Each is the shape for its kind of library; `docs/code-standards.md` §23 states them all.

- **i18n, one API in two apps.** `IAppTranslator` (`t(key, values?)`, `has(key)`, `locale`) is a
  vendor-free type in `@app/i18n`, its keys the paths of the English catalog. The web implements
  it in `src/lib/i18n/` over next-intl, with `AppI18nProvider` for the client tree; the mobile
  over react-i18next. The registry gives next-intl the seam `apps/web/src/lib/i18n/**` plus the
  two framework files that must name it (the request config, which next-intl loads by path, and
  `next.config.ts`, which loads its plugin); the i18next family `apps/mobile/src/lib/i18n/**`.
- **Query and store, a wrapper that owns its types.** `useAppQuery` and `useAppMutation` of
  `src/lib/query/` take `IAppQueryOptions` and `IAppMutationOptions` and return
  `IAppQueryResult` and `IAppMutationResult`, only the fields a caller reads. Every store is
  `createAppStore({ initializer: ({ get, set }) => …, persist? })` of
  `src/lib/store/createAppStore.helper.ts`, the whole zustand seam. A test reaches the query seam
  through `createQueryWrapper` of `src/test/query.helper.tsx`.
- **Routing on web, a subpath narrowed like `next/cache`.** `useAppRouter` of `src/lib/routing/`
  returns `IAppRouter`, only `push(href)`, `replace(href)` and `refresh()`, with an `href` the
  typed routes check; every other test mocks `@/lib/routing` through `createRoutingDouble` of
  `src/test/routing.helper.ts`.
- **Routing on mobile, names of a core package.** `expo-router` is core: its layout components
  (`Stack`, `Tabs`, `Slot`, `Redirect`, `Link`) and its types are imported directly. Its hooks,
  every `use…` name, and its `router` object pass only under the app's `src/lib/routing/`
  (`local/wrapped-import`). The app calls no hook yet, so that folder holds no module; the first
  caller adds the hook there, under the app's own types, with its own test.
- **A start-up root.** The mobile root layout boots through `src/lib/bootstrap/`: the one
  `expo-splash-screen` import, the fonts `APP_FONTS` names, and `AppSafeAreaProvider`.
- **A UI primitive.** `ui/Image` draws `next/image` on web, `ui/Gradient` `expo-linear-gradient`
  and `ui/StatusBar` `expo-status-bar` on mobile; a `react-native` primitive a `ui/` block is named
  after (`Text`, `Modal`, `Button`, `StatusBar`) is imported only under that block.

---

## After Lib

- [ ] `pnpm verify:dependency-seams` exits 0: the package is registered and every seam glob
      matches a file.
- [ ] `pnpm lint` exits 0: no caller and no test outside the seam.
- [ ] `pnpm typecheck` exits 0: no public type names a vendor type.
- [ ] `pnpm verify:tests` exits 0: the wrapper's units have their tests in `__tests__/`.
- [ ] `eslint-dependency-seam-allowlist.json` is unchanged: still `[]`.
- [ ] `ATL_TEMPLATE_SELF=1 pnpm validate` (`pnpm validate` in a derived project) exits 0.

---

## DO vs DON'T

| DO                                                                     | DON'T                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Register the package and its seam in the change that adds it           | Add a dependency and leave the registry for later                   |
| Narrow the seam to the files that need the vendor                      | Give a whole app (`apps/web/src/**`) as a seam                      |
| Type the API with the project's own types                              | Re-export a vendor type, or `Pick` one into a public type           |
| Expose what the callers use today                                      | Re-export the whole vendor API                                      |
| Mock `@/lib/{name}` in every test but the wrapper's own                | Mock the vendor in a screen, hook or service test                   |
| Stop and ask when an import cannot move yet                            | Add an entry to `eslint-dependency-seam-allowlist.json`             |
| Wrap a UI kit in a `components/ui` block                               | Import a kit primitive in a screen, a section or a screen component |
| Define a port in `@app/core` for a backend or a telemetry vendor       | Let a feature import the vendor SDK                                 |

---

## Common Mistakes

1. **A seam glob that matches no file.** The gate fails it: write the wrapper file in the same
   commit as the entry.
2. **A type leak.** `import type { X } from '{package}'` in a public type file is judged like any
   import: declare the project's type in `{name}.type.ts` instead.
3. **A test that mocks the vendor.** It fails the rule outside the wrapper's own test: mock
   `@/lib/{name}` or use the shared double in `src/test/`.
4. **A second wrapper.** A package with a seam already has one: extend it (pre-flight step 2).
5. **Wrapping a core package.** `react`, `next`, `react-native`, `expo` and `expo-router` are
   imported directly; only the subpaths and names the registry narrows go through a wrapper.
