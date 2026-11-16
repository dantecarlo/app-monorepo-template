---
name: screen
description: >
  Generate a screen (container) block that owns data fetching, loading/error/empty
  states, and layout composition. Scaffolds {Name}.screen.tsx + {Name}.style.ts +
  index.ts (mandatory); optional components/, hooks/, models/, services/ subfolders.
  Uses useAppQuery/useAppMutation from @/lib/query and the QueryKeys constant.
  Arrow-only, alias imports, named export. Handles Next.js app/ and Expo Router
  registration. DO NOT USE for presentational components — use `component` instead.
  USE WHEN: "create screen", "new screen [name]", "build the [name] page/screen",
  "scaffold the [name] route", "generate container for [name]".
---

# Create Screen

> Screens are containers. They fetch data, handle loading/error/empty states,
> and compose presentational components. They own no rendering logic — they
> delegate to components.
>
> Read `arch` before starting. For presentational components, use `component`.

---

## Screen vs Component

| Screen                              | Component                         |
| ----------------------------------- | --------------------------------- |
| Owns data fetching (via hooks)      | Receives data via props            |
| Handles loading, error, empty states | Renders one visual concern        |
| Lives in `src/screens/{Name}/`      | Lives in `src/components/{Name}/` |
| Maps to a route                     | Not directly routable             |
| Thin render — only composition      | All rendering logic self-contained |

---

## Generated Structure

```
src/screens/{Name}/
├── {Name}.screen.tsx        # mandatory — container, composes components
├── {Name}.style.ts          # mandatory — positioning classes only (local/style-positions-only)
├── index.ts                 # mandatory — barrel
├── components/              # optional — private components of this screen
│   └── {Name}Row/
│       ├── {Name}Row.component.tsx
│       ├── {Name}Row.style.ts
│       └── index.ts
├── hooks/                   # optional — logic hooks (use*.hook.ts)
│   └── use{Name}.hook.ts
├── models/                  # optional — block-local *.type.ts
│   └── {Name}.type.ts
└── services/                # optional — when the screen owns its data layer
    └── {name}.service.ts + {Name}.adapter.ts
```

---

## Step 1 — Types (`models/{Name}.type.ts`) — only if needed

```typescript
// Route / URL params (if any)
export interface I{Name}RouteParams {
  id?: string
}

// Screen-level ViewModel if you aggregate multiple queries
export interface I{Name}ScreenData {
  items: I{Entity}ViewModel[]
  total: number
}
```

---

## Step 2 — Query Keys

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

## Step 3 — Hook (`hooks/use{Name}.hook.ts`)

```typescript
'use client' // web only — remove for mobile

import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import { QueryKeys } from '@/lib/query/queryKeys.constant'
import { getItems } from '@/services/Items'
import { adaptItems } from '@/services/Items'
import type { I{Entity}ViewModel } from '@/services/Items'

export interface IUse{Name} {
  contextId: string
}

export const use{Name} = ({ contextId }: IUse{Name}) => {
  return useAppQuery<I{Entity}ViewModel[]>({
    queryOptions: {
      queryKey: QueryKeys.{feature}.list(contextId),
      queryFn: async () => {
        const dtos = await getItems({ contextId })
        return adaptItems(dtos)
      }
    }
  })
}
```

A failed query queues no toast (`docs/code-standards.md` § 19): the screen reads
`isError` and renders `ErrorState`, or wraps the block in `AsyncBoundary`, with the
query's `refetch` as its retry. Only a mutation's failure is a toast.

---

## Step 4 — Styles (`{Name}.style.ts`)

```typescript
export const {NAME}_SCREEN = {
  CONTAINER: 'flex flex-col gap-4 p-4',
  HEADER: 'flex items-center justify-between',
  LIST: 'flex flex-col gap-2'
} as const
```

The styling pillar (`AGENTS.md` § Styling lives in the components,
`docs/code-standards.md` §22): a `ui/` block, or a block in a screen's own `components/`, owns its
look; a screen, a route entry and a container only position. So this file holds flex and grid, gap,
alignment, position, z-index, placing size and spacing, and nothing else:
`local/style-positions-only` fails a colour, a type size or weight, a border, a radius, a shadow
or an opacity here, and the same in an inline `style` or a `*Style` constant of the screen. The
look comes from the blocks the screen renders: `ui/Text` for text, `ui/Screen` for the surface,
`ui/Divider`, `ui/Button`, `ui/GlassCard`, or a block in the screen's own `components/`. A look no
block has becomes a variant of the `ui/` block (`modify`) or a new block (`component`). The screen
imports no UI kit (`local/ui-kit-boundary`).

---

## Step 5 — Screen (`{Name}.screen.tsx`)

```typescript
'use client' // web only — remove for mobile

import { use{Name} } from './hooks/use{Name}.hook'
import { {Component} } from './components/{Component}'
import { {NAME}_SCREEN } from './{Name}.style'

export const {Name}Screen = () => {
  const { data, isLoading, isError } = use{Name}({
    contextId: /* from context, route param, or store */
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message="Could not load data." />
  if (!data?.length) return <EmptyState />

  return (
    <main className={NAME}_SCREEN.CONTAINER}>
      <section aria-label="{Name} list" className={{NAME}_SCREEN.LIST}>
        {data.map((item) => (
          <{Component} item={item} key={item.id} />
        ))}
      </section>
    </main>
  )
}
```

Rules:
- Three guard clauses: loading → error → empty → data
- `aria-label` on landmark elements (`section`, `nav`, etc.)
- No inline data transformation — all in hook/adapter
- No direct service calls in the screen — only hooks
- Arrow const named export — no `export default`, no `function` keyword
- No inline Tailwind strings — use the styles constant

---

## Step 6 — Barrel (`index.ts`)

```typescript
export { {Name}Screen } from './{Name}.screen'
export { use{Name} } from './hooks/use{Name}.hook'
export type { I{Name}RouteParams } from './models/{Name}.type'
```

---

## Step 7 — Route Registration

**Next.js App Router** — create `src/app/{route}/page.tsx`:

```typescript
import { {Name}Screen } from '@/screens/{Name}'

const {Name}Page = () => <{Name}Screen />

export default {Name}Page
```

**Expo Router** — create `app/(tabs)/{route}.tsx`:

```typescript
import { {Name}Screen } from '@/screens/{Name}'

const {Name}Route = () => <{Name}Screen />

export default {Name}Route
```

Note: Expo Router pages require default exports. The screen component itself
keeps a named export.

---

## After Creation

- [ ] Register in the router (see Step 7)
- [ ] Register the new `{Name}` folder in `docs/maps/global-map.md` — `pnpm validate` (verify-maps check D) will fail if it's missing.
- [ ] Run `pnpm typecheck`
- [ ] Run `pnpm lint:fix`
- [ ] Write tests with the `test` skill: `__tests__/{Name}.screen.test.tsx` in the screen folder,
      and each sub-block's test in its own folder's `__tests__/`
- [ ] Verify loading, empty, and error states are implemented (Rule 17 DoD)

---

## Common Mistakes

| Mistake                                             | Fix                                              |
| --------------------------------------------------- | ------------------------------------------------ |
| Data transformation inline in the screen JSX       | Move to adapter + hook                           |
| Direct `fetch()` or service call in the screen      | Use a hook that wraps `useAppQuery`              |
| Missing loading / error / empty guard               | Always all three, in that order                  |
| Inline Tailwind class strings                       | Extract to `{Name}.style.ts`                     |
| A colour, type or radius class in the screen style  | Render the `ui/` block that owns it (`ui/Text`, `ui/Screen`) |
| `function {Name}Screen(...)` keyword               | Arrow const: `const {Name}Screen = () => ...`   |
| Default export on the screen component              | Named export on screen; default only for route page |
