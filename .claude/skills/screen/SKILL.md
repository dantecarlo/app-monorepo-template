---
name: screen
description: >
  Generate a screen (container) block that owns data fetching, loading/error/empty
  states, and layout composition. Scaffolds {Name}.screen.tsx + {Name}.styles.ts +
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
├── {Name}.styles.ts         # mandatory — Tailwind class constants for the screen layout
├── index.ts                 # mandatory — barrel
├── components/              # optional — private components of this screen
│   └── {Name}Row/
│       ├── {Name}Row.component.tsx
│       ├── {Name}Row.styles.ts
│       └── index.ts
├── hooks/                   # optional — logic hooks (use*.hook.tsx)
│   └── use{Name}.hook.tsx
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
{featureName}: {
  all:    ['{featureName}'] as const,
  list:   (contextId: string) => ['{featureName}', contextId, 'list'] as const,
  detail: (id: string)        => ['{featureName}', id] as const,
}
```

Use `sanitizeQueryKey` from `@app/core` when any key segment may contain PII.

---

## Step 3 — Hook (`hooks/use{Name}.hook.tsx`)

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
    },
    errorMessage: 'Could not load data.'
  })
}
```

---

## Step 4 — Styles (`{Name}.styles.ts`)

```typescript
export const {NAME}_SCREEN = {
  CONTAINER: 'flex flex-col gap-4 p-4',
  HEADER: 'flex items-center justify-between',
  LIST: 'flex flex-col gap-2'
} as const
```

---

## Step 5 — Screen (`{Name}.screen.tsx`)

```typescript
'use client' // web only — remove for mobile

import { use{Name} } from './hooks/use{Name}.hook'
import { {Component} } from './components/{Component}'
import { {NAME}_SCREEN } from './{Name}.styles'

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
- [ ] Run `pnpm typecheck`
- [ ] Run `pnpm lint:fix`
- [ ] Write tests with the `test` skill
- [ ] Verify loading, empty, and error states are implemented (Rule 17 DoD)

---

## Common Mistakes

| Mistake                                             | Fix                                              |
| --------------------------------------------------- | ------------------------------------------------ |
| Data transformation inline in the screen JSX       | Move to adapter + hook                           |
| Direct `fetch()` or service call in the screen      | Use a hook that wraps `useAppQuery`              |
| Missing loading / error / empty guard               | Always all three, in that order                  |
| Inline Tailwind class strings                       | Extract to `{Name}.styles.ts`                    |
| `function {Name}Screen(...)` keyword               | Arrow const: `const {Name}Screen = () => ...`   |
| Default export on the screen component              | Named export on screen; default only for route page |
