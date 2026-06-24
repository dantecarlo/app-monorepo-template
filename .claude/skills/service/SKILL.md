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
├── <domain>.service.test.ts
└── <Domain>.adapter.test.ts
```

---

## Step 1 — Register Query Keys

Add to `src/lib/query/queryKeys.constant.ts`:

```typescript
{featureName}: {
  all:    ['{featureName}'] as const,
  list:   (contextId: string) => ['{featureName}', contextId, 'list'] as const,
  detail: (id: string)        => ['{featureName}', id] as const,
}
```

Use `sanitizeQueryKey` from `@app/core` when any segment may contain PII:

```typescript
import { sanitizeQueryKey } from '@app/core'

queryKey: sanitizeQueryKey({ key: QueryKeys.items.list(contextId) })
```

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

import { useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '@/lib/query/useAppMutation.hook'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
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
    },
    errorMessage: 'Could not load {domain} data.'
  })

// Mutation (write)
export const useCreate{Domain} = () => {
  const queryClient = useQueryClient()
  return useAppMutation<I{Domain}ViewModel, ICreate{Domain}Payload>({
    mutationOptions: {
      mutationFn: async (payload) => {
        const dto = await create{Domain}(payload)
        return adapt{Domain}(dto)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.{featureName}.all
        })
      }
    },
    errorMessage: 'Could not create {domain}.',
    successMessage: '{Domain} created.'
  })
}
```

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
| Use `sanitizeQueryKey` for PII-bearing keys   | Include PII (email, name) raw in query key |
