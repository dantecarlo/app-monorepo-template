---
name: service
description: >
  Generate the full data layer for a domain: per-domain PascalCase service folder
  under src/services/<Domain>/, paired service + adapter files, index.ts barrel
  (service + adapter only, never constants/tests), optional domain constants, and
  useAppQuery / useAppMutation hook wrappers. Service owns fetch + generic <T> and
  returns raw DTOs; adapter is pure (no async/IO) mapping DTO → domain shape.
  Error handling via buildServiceError/AppError from @app/core. Supabase only via
  adapter (provider-behind-ports). Arrow-only, single-object params, alias imports.
  USE WHEN: "create service", "new service [name]", "add data fetching for [name]",
  "hook for [name] API", "add [name] mutation", "scaffold the data layer for [name]".
---

# Create Service

> Service + Adapter is a mandatory pair. Never create one without the other (Rule 6).
>
> Read `arch` for the full pattern contract. After product discovery, this is
> the first implementation layer to scaffold.

---

## Architecture Overview

```
useAppQuery / useAppMutation  ← hook (screen or shared hooks layer)
    ↓
queryFn calls service          ← items.service.ts — async, returns raw DTOs
    ↓
adapter maps DTO → domain      ← Items.adapter.ts — pure, no async
    ↓
hook returns domain shape      ← UI consumes typed domain model
```

---

## Do You Need a New Service?

```
Does a service for this domain already exist in src/services/<Domain>/?
├── YES → add a new function to the existing service file
└── NO  → create a new per-domain folder (full scaffold below)
```

---

## Generated Structure

```
src/services/<Domain>/            # PascalCase folder
├── <domain>.service.ts           # async fetch functions, returns DTOs
├── <Domain>.adapter.ts           # pure DTO → domain shape
├── <domain>.constant.ts          # optional domain constants (QueryKeys entry goes in lib/query)
├── index.ts                      # barrel: service + adapter exports ONLY
└── __tests__/                    # each unit's test, named after it
    ├── <domain>.service.test.ts
    └── <Domain>.adapter.test.ts
```

---

## Step 1 — Register Query Keys

Add to `src/lib/query/queryKeys.constant.ts`:

```typescript
// The existing enum, with one member added for the new feature:
export enum QueryKeySegmentEnum {
  DETAIL = 'detail',
  {FEATURE_NAME} = '{featureName}', // the new feature's segment
  ITEMS = 'items',
  LIST = 'list'
}

{featureName}: {
  all:    [QueryKeySegmentEnum.{FEATURE_NAME}] as const,
  list:   (contextId: string) =>
    [QueryKeySegmentEnum.{FEATURE_NAME}, QueryKeySegmentEnum.LIST, { contextId }] as const,
  detail: (id: string) =>
    [QueryKeySegmentEnum.{FEATURE_NAME}, QueryKeySegmentEnum.DETAIL, { id }] as const,
}
```

Write every hand-written segment as a member of `QueryKeySegmentEnum`. When a
query fails, the query client reports its key through `sanitizeQueryKey` from
`@app/core`, which keeps only the values of that enum: an id, a search text or
a hand-written segment missing from the enum shows up as `[redacted]`. Never
pass a live key through `sanitizeQueryKey` yourself: every item would share one
cache entry.

Put every dynamic value of a key, an id, a search text or a filter, in one trailing
params object, never as a bare segment: `sanitizeQueryKey` redacts the object whole,
while a bare value equal to a registered word (`list('list')`) would survive it. The
feature's `all` key stays the prefix of each of its keys, so invalidating it reaches
them all; `pnpm validate` runs a test that walks every factory of `QueryKeys`.

---

## Step 2 — Types (`<domain>.type.ts` or in the shared type file)

```typescript
// Raw DTO — shape as it arrives from the API / DB (snake_case matching wire format)
export interface I{Domain}Dto {
  id: string
  created_at: string
  // ... exact API fields
}

// Domain model — UI-ready, computed, formatted (camelCase)
export interface I{Domain}ViewModel {
  id: string
  createdAt: Date
  createdAtDisplay: string
  // ...
}
```

Place in `models/{Domain}.type.ts` if screen-local, or inside the service folder as `{domain}.type.ts`.

---

## Step 3 — Service (`<domain>.service.ts`)

```typescript
import { buildServiceError } from '@app/core'
import type { I{Domain}Dto } from '@/services/{Domain}/{domain}.type'

// GET list
export interface IGet{Domain}ListParams {
  contextId: string
  limit?: number
  cursor?: string
}

export const get{Domain}List = async (
  params: IGet{Domain}ListParams
): Promise<I{Domain}Dto[]> => {
  const res = await fetch(`/api/{resource}?contextId=${params.contextId}`)
  if (!res.ok) {
    throw buildServiceError({ error: new Error('FETCH_FAILED') })
  }
  return res.json() as Promise<I{Domain}Dto[]>
}

// GET single
export const get{Domain}ById = async (
  { id }: { id: string }
): Promise<I{Domain}Dto | null> => {
  const res = await fetch(`/api/{resource}/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw buildServiceError({ error: new Error('FETCH_FAILED') })
  return res.json() as Promise<I{Domain}Dto>
}

// POST (create)
export interface ICreate{Domain}Payload {
  // fields required for creation
}

export const create{Domain} = async (
  payload: ICreate{Domain}Payload
): Promise<I{Domain}Dto> => {
  const res = await fetch('/api/{resource}', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  })
  if (!res.ok) throw buildServiceError({ error: new Error('CREATE_FAILED') })
  return res.json() as Promise<I{Domain}Dto>
}

// Supabase variant (via adapter / provider-behind-ports)
// The backend client is accessed via IBackendClientProvider from @app/core.
// Never import the Supabase SDK directly in a service — use the injected client.
```

Rules:
- Arrow const, single-object params
- Returns raw DTO — never ViewModel, never formatted string
- Throws `buildServiceError` on error (not `new Error` inline)
- No data transformation here — that's the adapter's job
- For Supabase: access the client via the port, not a direct SDK import

---

## Step 4 — Adapter (`<Domain>.adapter.ts`)

```typescript
import type { I{Domain}Dto, I{Domain}ViewModel }
  from '@/services/{Domain}/{domain}.type'

// Private helpers — pure, locale-aware formatting
const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso))

export const adapt{Domain} = (dto: I{Domain}Dto): I{Domain}ViewModel => ({
  id: dto.id,
  createdAt: new Date(dto.created_at),
  createdAtDisplay: formatDate(dto.created_at)
  // map every field
})

export const adapt{Domain}s = (dtos: I{Domain}Dto[]): I{Domain}ViewModel[] =>
  dtos.map(adapt{Domain})
```

Rules:
- Pure arrow functions — no async, no side effects, no React/TanStack imports
- Formatting helpers are private (not exported)
- The only place where DTO fields become domain model fields

---

## Step 5 — Barrel (`index.ts`)

```typescript
export { adapt{Domain}, adapt{Domain}s } from './{Domain}.adapter'
export { create{Domain}, get{Domain}ById, get{Domain}List } from './{domain}.service'
```

Barrel exports service functions and adapter functions **only**. Never export
constants, types, or test utilities from the barrel.

- **Register**: add the new `<Domain>` folder to `docs/maps/global-map.md` — `pnpm validate` (verify-maps check D) will fail if it's missing.

---

## Step 6 — Query Hook (`use{Domain}List.hook.ts` — in screen hooks/ or shared hooks/)

```typescript
'use client' // web only

import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook' // the same in both apps
import { useAppMutation } from '@/lib/query/useAppMutation.hook'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import { useInvalidateAppQuery } from '@/lib/query/useInvalidateAppQuery.hook'
import { QueryKeys } from '@/lib/query/queryKeys.constant'
import { adapt{Domain}s, create{Domain}, get{Domain}List }
  from '@/services/{Domain}'
import type { I{Domain}ViewModel } from '@/services/{Domain}/{domain}.type'

// Query (read)
export interface IUse{Domain}List {
  contextId: string
}

export const use{Domain}List = ({ contextId }: IUse{Domain}List) =>
  useAppQuery<I{Domain}ViewModel[]>({
    queryOptions: {
      queryKey: QueryKeys.{featureName}.list(contextId),
      queryFn: async () => {
        const dtos = await get{Domain}List({ contextId })
        return adapt{Domain}s(dtos)
      }
    }
  })

// Mutation (write)
export const useCreate{Domain} = () => {
  const invalidate = useInvalidateAppQuery()
  const { t } = useAppTranslator()
  return useAppMutation<I{Domain}ViewModel, ICreate{Domain}Payload>({
    mutationOptions: {
      mutationFn: async (payload) => {
        const dto = await create{Domain}(payload)
        return adapt{Domain}(dto)
      },
      onSuccess: () => {
        void invalidate({ queryKey: QueryKeys.{featureName}.all })
      }
    },
    // A failure's toast is its AppError's messageKey (code-standards § 19), and
    // every user-facing string is a catalog message, never a literal (§ 15).
    successMessage: t('{featureName}.created')
  })
}
```

The options are the app's own (`src/lib/query/useAppQuery.type.ts` and `useAppMutation.type.ts`).
Besides `queryKey` and `queryFn`, a query takes `enabled`, `staleTime`, `retry`, `networkMode`
(`'online'`, `'always'` or `'offlineFirst'`) and `keepPreviousData`; besides `mutationFn`, a mutation
takes `mutationKey`, `gcTime` and the callbacks `onMutate({ variables })`,
`onSuccess({ data, variables })`, `onError({ error, variables })` and
`onSettled({ data, error, variables })`. An option left out keeps the query client's default. A
control that waits on a keyed mutation reads `useIsAppMutating({ mutationKey })`. Each hook returns
the same result object while none of its fields changed.

A failed query queues no toast (`docs/code-standards.md` § 19): the screen reads
`isError` and renders `ErrorState`, or wraps the block in `AsyncBoundary`, with the
query's `refetch` as its retry. Only a mutation's failure is a toast.

---

## DO vs DON'T

| DO                                            | DON'T                                      |
| --------------------------------------------- | ------------------------------------------ |
| Return raw DTOs from service functions        | Map/transform inside service functions     |
| Keep adapter functions pure (no async)        | Call async functions in adapters           |
| Use `useAppQuery` / `useAppMutation`          | Call `useQuery`/`useMutation` directly     |
| Register query keys in `QueryKeys`            | Inline array literals in `queryKey`        |
| Single-object params in service functions     | Positional arguments                       |
| Use `buildServiceError` for error mapping     | Throw raw `new Error(...)` strings         |
| Access Supabase only via port/adapter         | Import Supabase SDK directly in features   |
| Export service + adapter only from barrel     | Export constants or tests from the barrel  |
| Write key segments from `QueryKeySegmentEnum` | Wrap a live key in `sanitizeQueryKey`      |
