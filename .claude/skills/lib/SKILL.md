---
name: lib
description: >
  Wrap a third-party vendor behind a project-internal API in src/lib/{name}/ or a
  workspace package. Features import from @/lib/{name} or @app/*, never from the
  vendor package directly (provider-behind-ports). Config from env vars only. The
  Supabase-behind-@app/supabase pattern is the canonical neutral wrapping example
  already in the template. Arrow-only, alias imports.
  USE WHEN: "wrap library", "create lib for [vendor]", "abstract [library]",
  "add [name] lib", "create a wrapper for [package]", "hide [vendor] behind a port".
---

# Create Lib

> A lib wrapper makes the vendor API a project-internal detail.
> Features import from `@/lib/{name}` or `@app/*`, never from the vendor package
> directly. This is the provider-behind-ports pattern — enforced by Rule 2 and the
> layer contract in `arch`.
>
> The canonical example in the template is the Supabase client:
> features never `import { createClient } from '@supabase/supabase-js'` — they
> import from `@app/supabase` or access the client via `IBackendClientProvider` from
> `@app/core`.

---

## Where a Vendor May Be Imported

The answer lives in one file, `.agents/contracts/dependencies.json`, and nowhere else: each
package's entry names its category and its seam, the globs of the files that may import it
(`docs/code-standards.md` §23). `local/dependency-seam` refuses an import outside the seam, an
unregistered package anywhere, and a test that reaches a vendor its unit's seam does not admit.

- **Before you write the wrapper**, read the package's entry. A seam that is `[]`, or a frozen
  entry for it in `eslint-dependency-seam-allowlist.json`, is the F.8 unit this lib delivers.
- **When the wrapper lands**, point the entry's `seam` at it (`apps/*/src/lib/{name}/**`, or the
  one `{name}.config.ts` or hook that imports the vendor), move every importer to `@/lib/{name}`,
  and delete their allowlist entries: `pnpm verify:dependency-seams` fails an entry whose import is
  gone.
- **A new vendor** is registered in the same change that adds it to a `package.json`, with its
  category and its seam; the gate fails an unregistered dependency.
- **Tests** of the wrapper inherit its seam and may mock the vendor; every other test mocks
  `@/lib/{name}`.

### Example: the i18n seam

One API, one implementation per app. `IAppTranslator` (`t(key, values?)`, `has(key)`,
`locale`) is a vendor-free type in `@app/i18n`, its keys the paths of the English catalog.
Each app implements it in `src/lib/i18n/`: the web's `useAppTranslator.hook.ts` and
`appTranslator.adapter.ts` over next-intl, with `AppI18nProvider` for the client tree; the
mobile's `useAppTranslator.hook.ts` over react-i18next. A block reads the same in either app:

```typescript
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

const { t } = useAppTranslator()
t('items.dashboard.listResults', { count })
```

The registry gives next-intl the seam `apps/web/src/lib/i18n/**` plus the two framework files
that must name it (the request config, which next-intl loads by path, and `next.config.ts`,
which loads its plugin); the i18next family, `apps/mobile/src/lib/i18n/**`. Swapping either
runtime rewrites that folder and nothing else.

### Example: the query and store seams

A wrapper declares its own types instead of passing the vendor's through. `useAppQuery` and
`useAppMutation` of `src/lib/query/` take `IAppQueryOptions` and `IAppMutationOptions` and return
`IAppQueryResult` and `IAppMutationResult`, only the fields a caller reads, and the mutation
callbacks receive one object; `AppQueryProvider` gives a tree its client and
`useInvalidateAppQuery` invalidates a `QueryKeys` prefix. Every store is
`createAppStore({ initializer: ({ get, set }) => …, persist? })` of
`src/lib/store/createAppStore.helper.ts`, the registry's whole zustand seam, with its selector
hook, `getState`, `setState`, `getInitialState` and `useShallow`. A test reaches the query seam
through `createQueryWrapper` of `src/test/query.helper.tsx`:

```typescript
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import { createAppStore } from '@/lib/store/createAppStore.helper'

const { data, isError, refetch } = useAppQuery<IItemViewModel[]>({
  queryOptions: { queryFn: loadItems, queryKey: QueryKeys.items.all }
})
```

### Example: the routing and cache seams (web)

A framework subpath the registry narrows gets a wrapper of the app's own, even though `next` is
core. `useAppRouter` of `src/lib/routing/` returns `IAppRouter`, only `push(href)`,
`replace(href)` and `refresh()`, the same object while Next's router is the same; an `href` is an
`AppRouteType`, which the typed routes check. A function under `'use cache'` sets its life and
tags once through `applyCachePolicy({ life, tags })` of `src/lib/cache/`, `life` one of the app's
`CacheLifeEnum` profiles. Only `useAppRouter.hook.ts` imports `next/navigation` and only
`cachePolicy.adapter.ts` imports `next/cache`; every other test mocks the project module, the
router through `createRoutingDouble` of `src/test/routing.helper.ts`:

```typescript
import { applyCachePolicy, CacheLifeEnum } from '@/lib/cache'
import { useAppRouter } from '@/lib/routing'

const router = useAppRouter()
router.replace('/')

applyCachePolicy({ life: CacheLifeEnum.MINUTES, tags: [CACHE_TAG] })

vi.mock('@/lib/routing', async () =>
  (await import('@/test/routing.helper')).createRoutingDouble({
    router: { replace }
  })
)
```

A wrapper exposes what its callers use: the pathname, the search params, `redirect` and
`revalidateTag` join it with their first caller.

---

## Do You Need a New Lib?

```
Does any feature import directly from the vendor package?
├── YES → wrap it so the vendor is isolated
└── NO → Is there already a lib for this vendor?
    ├── YES → extend the existing lib
    └── NO  → create a new lib
```

---

## Complexity Levels

| Level    | When                                 | Files                            |
| -------- | ------------------------------------ | -------------------------------- |
| Minimal  | Config + re-export only              | `index.ts`                       |
| Standard | Config + hook + constants            | config + hook + constants + barrel |
| Full     | Config + hook + helpers + types + constants | all files               |

---

## Generated Structure

```
src/lib/{name}/
├── {name}.config.ts        # Initialization and configuration
├── {name}.constant.ts      # URLs, keys, limits, status enums
├── {name}.type.ts          # Project-specific types wrapping vendor types
├── use{Name}.hook.ts       # React hook wrapping vendor hook (if applicable)
├── {name}.helper.ts        # Pure utility functions
├── index.ts                # Barrel export
└── __tests__/              # each unit's test, named after it ({name}.helper.test.ts, …)
```

For cross-app vendor wrapping, the lib becomes a workspace package in `packages/{name}/`.

---

## Step 1 — Config (`{name}.config.ts`)

```typescript
import { VendorClient } from '{vendor-package}'

// Config from environment variables only — no hardcoded keys
export const {name}Client = new VendorClient({
  apiKey: process.env.NEXT_PUBLIC_{NAME}_API_KEY
})
```

---

## Step 2 — Constants (`{name}.constant.ts`)

```typescript
export const {NAME}_CONFIG = {
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT_MS: 10_000,
  BASE_URL: '/api/{name}'
} as const

export enum {Name}StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
```

---

## Step 3 — Types (`{name}.type.ts`)

```typescript
// Project-scoped types — do NOT re-export vendor types directly
import type { VendorOptions } from '{vendor-package}'

export type {Name}OptionsType = Pick<VendorOptions, 'timeout' | 'retries'>

export interface I{Name}Result {
  data: unknown
  error: string | null
}
```

---

## Step 4 — Hook (`use{Name}.hook.ts`) — if the lib has a React integration

```typescript
'use client' // web only

import { useVendorHook } from '{vendor-package}'
import type { {Name}OptionsType } from '@/lib/{name}/{name}.type'

export interface IUse{Name} {
  // project-specific params only — flatten vendor surface
}

export interface IUse{Name}Return {
  // expose only what features actually need
}

export const use{Name} = (params: IUse{Name}): IUse{Name}Return => {
  const vendor = useVendorHook(/* mapped params */)
  return {
    // expose only what features need
  }
}
```

---

## Step 5 — Barrel (`index.ts`)

```typescript
export { use{Name} } from './use{Name}.hook'
export { {name}Client } from './{name}.config'
export { {NAME}_CONFIG, {Name}StatusEnum } from './{name}.constant'
export type { {Name}OptionsType, I{Name}Result } from './{name}.type'
```

---

## Ports and Provider-Behind-Ports

When the vendor is a backend client (database, auth, analytics), define a port
interface in `@app/core` and let the lib implement it:

```typescript
// packages/core/src/ports/client/IBackendClientProvider.type.ts
export interface IBackendClientProvider {
  // narrow, project-specific surface — not the full vendor API
}

// packages/supabase/index.ts  (or src/lib/supabase/supabase.config.ts)
import type { IBackendClientProvider } from '@app/core'
// export a factory that satisfies the port
```

Features then depend on `IBackendClientProvider`, not on Supabase concretely.

---

## Extending an Existing Lib

When adding to `@/lib/query/` or similar:

1. Does a matching constant already exist in `{name}.constant.ts`?
2. Does a matching type already exist in `{name}.type.ts`?
3. Is the new function consistent in naming with existing functions?

Never add feature-specific logic to a lib — libs must be domain-agnostic.

---

## DO vs DON'T

| DO                                                               | DON'T                                    |
| ---------------------------------------------------------------- | ---------------------------------------- |
| Import vendor package only in its registered seam (`{name}.config.ts` or hook) | Import vendor directly in features/screens |
| Expose only what the project uses (narrow surface)               | Re-export the entire vendor API          |
| Config from environment variables                                | Hardcode API keys or base URLs           |
| Keep lib domain-agnostic                                         | Add feature business logic to a lib      |
| Project-specific types wrapping vendor types                     | Expose vendor types directly to features |
| Define a port interface in `@app/core` for backend vendors       | Let features import vendor SDK directly  |
