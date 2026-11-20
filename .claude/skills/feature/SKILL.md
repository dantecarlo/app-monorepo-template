---
name: feature
description: >
  Scaffold a complete coordinated slice across the template's real layers in dependency
  order: domain types/ports in @app/core (when cross-app) → service folder
  src/services/<Domain>/ (service+adapter+barrel) → query hook (useAppQuery) →
  component block(s) → screen block → route registration → QueryKeys. Enforces all
  template conventions (arrow-only, alias imports, per-domain service folders, I-prefix,
  no-semi). De-businessified end-to-end. After product-discovery, this is the first
  implementation scaffold.
  USE WHEN: "scaffold feature", "create feature", "new feature [name]",
  "build the [name] feature end to end", "implement [name] from scratch".
  DO NOT USE: shaping a raw product idea before any code (use `product-discovery`), or
  one layer alone: a component (use `component`), a screen (use `screen`) or a service
  (use `service`).
---

# Feature Scaffold

> Generates a complete coordinated feature in one pass across the template's layers.
> The template has no `features/` fractal — a feature is a coordinated slice across
> `src/services/<Domain>/`, `src/screens/{Name}/`, and `src/components/{Name}/`.
>
> Read `arch` before starting. If you haven't done product discovery, run the
> `product-discovery` skill first to clarify scope before scaffolding.

---

## Pre-flight

1. Read `arch` for all naming and structural rules.
2. Confirm these are known before generating:
   - Feature name (PascalCase for folders, camelCase for file prefixes)
   - Data shape (fields of the DTO from the API or DB)
   - Primary actions: list, detail, create, edit, delete (or a combination)
   - Platform: web (Next.js), mobile (Expo), or both
3. Check existing services for established query key prefixes and patterns.

---

## Generated Structure

```
src/services/<Domain>/
├── <domain>.service.ts          # async fetch functions, returns raw DTOs
├── <Domain>.adapter.ts          # pure DTO → domain shape
├── <domain>.constant.ts         # optional domain constants
├── index.ts                     # barrel: service + adapter ONLY
└── __tests__/                   # each unit's test, named after it
    ├── <domain>.service.test.ts
    └── <Domain>.adapter.test.ts

src/lib/query/queryKeys.constant.ts
└── # add <domain>: { all, list, detail } entry

src/screens/<Name>/
├── <Name>.screen.tsx            # container — composes components, owns layout
├── <Name>.style.ts              # screen positioning only (local/style-positions-only)
├── index.ts                     # barrel
├── __tests__/<Name>.screen.test.tsx
├── hooks/
│   ├── use<Name>.hook.ts        # useAppQuery wrapper
│   └── __tests__/use<Name>.hook.test.ts
└── components/                  # optional — private screen components
    └── <Name>Row/
        ├── <Name>Row.component.tsx
        ├── <Name>Row.style.ts
        ├── index.ts
        └── __tests__/<Name>Row.component.test.tsx

src/app/{route}/page.tsx         # Next.js App Router entry (web)
app/(tabs)/{route}.tsx           # Expo Router entry (mobile)
```

---

## Step 1 — Types

Place in `src/services/<Domain>/<domain>.type.ts` (domain-scoped) or
`@app/core` ports (if the type is used cross-app):

```typescript
// Raw DTO — wire format (snake_case matching API contract)
export interface I{Domain}Dto {
  id: string
  created_at: string
  context_id: string
  // ... all API fields
}

// Domain model — UI-ready, computed fields, camelCase
export interface I{Domain}ViewModel {
  id: string
  createdAt: Date
  createdAtDisplay: string
  contextId: string
  // ...
}

// Optional aggregate for dashboard cards
export interface I{Domain}Summary {
  totalCount: number
  // ...
}
```

---

## Step 2 — Service (`src/services/<Domain>/<domain>.service.ts`)

```typescript
import { buildServiceError } from '@app/core'
import type { I{Domain}Dto } from '@/services/{Domain}/{domain}.type'

export interface IGet{Domain}ListParams {
  contextId: string
  limit?: number
}

export const get{Domain}List = async (
  params: IGet{Domain}ListParams
): Promise<I{Domain}Dto[]> => {
  const res = await fetch(
    `/api/{resource}?contextId=${params.contextId}`
  )
  if (!res.ok) {
    throw buildServiceError({ error: new Error('FETCH_FAILED') })
  }
  return res.json() as Promise<I{Domain}Dto[]>
}

export interface ICreate{Domain}Payload {
  contextId: string
  // required creation fields
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
```

---

## Step 3 — Adapter (`src/services/<Domain>/<Domain>.adapter.ts`)

```typescript
import type { I{Domain}Dto, I{Domain}ViewModel }
  from '@/services/{Domain}/{domain}.type'

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(iso)
  )

export const adapt{Domain} = (dto: I{Domain}Dto): I{Domain}ViewModel => ({
  id: dto.id,
  contextId: dto.context_id,
  createdAt: new Date(dto.created_at),
  createdAtDisplay: formatDate(dto.created_at)
})

export const adapt{Domain}s = (dtos: I{Domain}Dto[]): I{Domain}ViewModel[] =>
  dtos.map(adapt{Domain})
```

---

## Step 4 — Barrel (`src/services/<Domain>/index.ts`)

```typescript
export { adapt{Domain}, adapt{Domain}s } from './{Domain}.adapter'
export {
  create{Domain},
  get{Domain}List
} from './{domain}.service'
```

Service + adapter exports only — never constants, types, or test utilities.

---

## Step 5 — Query Keys

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
    [QueryKeySegmentEnum.{FEATURE_NAME}, QueryKeySegmentEnum.DETAIL, { id }] as const
}
```

Write every hand-written segment as a member of `QueryKeySegmentEnum`: an error
report keeps only its values and shows every other segment as `[redacted]`.

Put every dynamic value of a key, an id, a search text or a filter, in one trailing
params object, never as a bare segment: `sanitizeQueryKey` redacts the object whole,
while a bare value equal to a registered word (`list('list')`) would survive it. The
feature's `all` key stays the prefix of each of its keys, so invalidating it reaches
them all; `pnpm validate` runs a test that walks every factory of `QueryKeys`.

---

## Step 6 — Hook (`src/screens/<Name>/hooks/use<Name>.hook.ts`)

```typescript
'use client' // web only

import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook' // the same in both apps
import { useAppMutation } from '@/lib/query/useAppMutation.hook'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import { useInvalidateAppQuery } from '@/lib/query/useInvalidateAppQuery.hook'
import { QueryKeys } from '@/lib/query/queryKeys.constant'
import {
  adapt{Domain}s,
  create{Domain},
  get{Domain}List
} from '@/services/{Domain}'
import type { I{Domain}ViewModel } from '@/services/{Domain}/{domain}.type'

export interface IUse{Name} {
  contextId: string
}

export const use{Name} = ({ contextId }: IUse{Name}) => {
  const query = useAppQuery<I{Domain}ViewModel[]>({
    queryOptions: {
      queryKey: QueryKeys.{featureName}.list(contextId),
      queryFn: async () => {
        const dtos = await get{Domain}List({ contextId })
        return adapt{Domain}s(dtos)
      }
    }
  })

  const invalidate = useInvalidateAppQuery()
  const { t } = useAppTranslator()
  const mutation = useAppMutation<I{Domain}ViewModel, ICreate{Domain}Payload>({
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

  return { mutation, query }
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

## Step 7 — Component Block (`src/screens/<Name>/components/<Name>Row/`)

### `{Name}Row.style.ts`

```typescript
export const {NAME}_ROW = {
  CONTAINER: 'flex items-center gap-3 py-3',
  TITLE: 'font-body text-body font-medium text-text-primary',
  META: 'font-body text-caption text-text-tertiary'
} as const
```

A screen-local block owns its look, and its values are tokens (`local/style-token-values`); the
screen's own `<Name>.style.ts` only positions (`AGENTS.md` § Styling lives in the components).
Reach for `ui/Text` before writing a text recipe a second screen will want.

### `{Name}Row.component.tsx`

```typescript
import type { I{Domain}ViewModel }
  from '@/services/{Domain}/{domain}.type'
import { {NAME}_ROW } from './{Name}Row.style'

export interface I{Name}Row {
  item: I{Domain}ViewModel
  onPress?: () => void
}

export const {Name}Row = ({ item, onPress }: I{Name}Row) => (
  <button
    className={NAME}_ROW.CONTAINER}
    onClick={onPress}
    type="button"
  >
    <span className={{NAME}_ROW.TITLE}>{item.id}</span>
    <span className={{NAME}_ROW.META}>{item.createdAtDisplay}</span>
  </button>
)
```

---

## Step 8 — Screen (`src/screens/<Name>/<Name>.screen.tsx`)

```typescript
'use client' // web only

import { {Name}Row } from './components/{Name}Row'
import { use{Name} } from './hooks/use{Name}.hook'
import { {NAME}_SCREEN } from './{Name}.style'

export const {Name}Screen = () => {
  const { query } = use{Name}({ contextId: /* from context or store */ '' })
  const { data, isError, isLoading } = query

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message="Could not load {domain} data." />
  if (!data?.length) return <EmptyState />

  return (
    <main className={{NAME}_SCREEN.CONTAINER}>
      <section aria-label="{Domain} list" className={{NAME}_SCREEN.LIST}>
        {data.map((item) => (
          <{Name}Row item={item} key={item.id} />
        ))}
      </section>
    </main>
  )
}
```

---

## Step 9 — Route Registration

**Next.js** (`src/app/{route}/page.tsx`):

```typescript
import { {Name}Screen } from '@/screens/{Name}'

const {Name}Page = () => <{Name}Screen />

export default {Name}Page
```

**Expo Router** (`app/(tabs)/{route}.tsx`):

```typescript
import { {Name}Screen } from '@/screens/{Name}'

const {Name}Route = () => <{Name}Screen />

export default {Name}Route
```

---

## After Scaffold

- [ ] `pnpm typecheck` — verify all types resolve
- [ ] Register the screen in the router
- [ ] Register both the `<Domain>` service folder and `<Name>` screen folder in `docs/maps/global-map.md` — `pnpm validate` (verify-maps check D) will fail if either is missing.
- [ ] `pnpm lint:fix` — auto-sort imports and JSX props
- [ ] Write tests with the `test` skill
- [ ] Verify loading, empty, and error states are implemented
- [ ] Run `pnpm validate` — full gate
