---
name: store
description: >
  Generate a typed Zustand store slice in src/stores/{name}.store.ts with state
  interface I{Name}State, named selector functions select{Name}{Field}, actions,
  and optional persist middleware. Arrow-only store creator and selectors, single-object
  action params where >1 arg. Replaces Context + useReducer for cross-feature state;
  TanStack Query for server/async state.
  USE WHEN: "create store", "new Zustand store", "add global state for [name]",
  "replace context with store", "add [name] slice", "cross-feature state for [name]".
---

# Create Store

> Zustand replaces Context + useReducer for all application state.
> Context is reserved for framework-required providers (theme, i18n, auth session).
> TanStack Query owns all async / server state — do not put it in a store.

---

## Do You Need a New Store?

```
Is this state shared across 2+ unrelated screens or features?
├── YES → Zustand store (you are here)
└── NO  → Is it server/async data?
    ├── YES → TanStack Query cache (use `service` skill)
    └── NO  → useState in the component or screen hook
```

---

## Store Complexity Levels

| Level    | When                       | Includes                              |
| -------- | -------------------------- | ------------------------------------- |
| Simple   | UI toggles, sidebar, theme | state + setters                       |
| Stateful | List with add/remove/clear | state + array actions                 |
| Full     | Complex domain state       | state + actions + selectors + persist |

---

## Generated File: `src/stores/{name}.store.ts`

### Simple store

```typescript
import { create } from 'zustand'

interface I{Name}State {
  isOpen: boolean
  activeItemId: string | null

  setIsOpen: (open: boolean) => void
  setActiveItemId: (id: string | null) => void
  reset: () => void
}

// Named selectors — one per subscribable value
// Consumers: useStore(select{X}) — subscribe to exactly one value
export const select{Name}IsOpen = (s: I{Name}State): boolean =>
  s.isOpen
export const select{Name}ActiveItemId = (s: I{Name}State): string | null =>
  s.activeItemId
export const select{Name}SetIsOpen = (s: I{Name}State) =>
  s.setIsOpen
export const select{Name}SetActiveItemId = (s: I{Name}State) =>
  s.setActiveItemId

export const use{Name}Store = create<I{Name}State>((set) => ({
  isOpen: false,
  activeItemId: null,

  setIsOpen: (open) => set({ isOpen: open }),
  setActiveItemId: (id) => set({ activeItemId: id }),
  reset: () => set({ isOpen: false, activeItemId: null })
}))
```

### Stateful store (array items)

```typescript
import { create } from 'zustand'

export interface I{Item}Shape {
  id: string
  label: string
}

interface I{Name}State {
  items: I{Item}Shape[]
  add: ({ item }: { item: I{Item}Shape }) => void
  remove: ({ id }: { id: string }) => void
  clear: () => void
}

export const select{Name}Items = (s: I{Name}State): I{Item}Shape[] =>
  s.items
export const select{Name}Add = (s: I{Name}State) => s.add
export const select{Name}Remove = (s: I{Name}State) => s.remove
export const select{Name}Clear = (s: I{Name}State) => s.clear

export const use{Name}Store = create<I{Name}State>((set) => ({
  items: [],

  add: ({ item }) =>
    set((s) => ({ items: [...s.items, item] })),

  remove: ({ id }) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  clear: () => set({ items: [] })
}))
```

### With `persist` middleware

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface I{Name}State { ... }

export const use{Name}Store = create<I{Name}State>()(
  persist(
    (set) => ({
      // state + actions
    }),
    {
      name: '{project}-{name}',        // localStorage / AsyncStorage key
      partialize: (s) => ({            // only persist what must survive reload
        // selected fields
      })
    }
  )
)
```

---

## Consuming the Store

```typescript
// ✅ Subscribe to one value — re-renders only when that value changes
import {
  use{Name}Store,
  select{Name}IsOpen,
  select{Name}SetIsOpen
} from '@/stores/{name}.store'

export const MyComponent = () => {
  const isOpen = use{Name}Store(select{Name}IsOpen)
  const setOpen = use{Name}Store(select{Name}SetIsOpen)
  // ...
}
```

```typescript
// ❌ Subscribes to the whole store — re-renders on any state change
const store = use{Name}Store()
```

---

## Naming Conventions

| Concern          | Convention                                                        |
| ---------------- | ----------------------------------------------------------------- |
| File             | `{name}.store.ts` (camelCase)                                     |
| Hook             | `use{Name}Store`                                                  |
| State interface  | `I{Name}State`                                                    |
| Selector         | `select{Name}{Field}` (arrow const)                               |
| Actions          | verbs: `add`, `remove`, `set{Field}`, `reset`, `toggle{Field}`    |
| Storage key      | `'{project}-{name}'`                                              |

---

## DO vs DON'T

| DO                                                  | DON'T                                                       |
| --------------------------------------------------- | ----------------------------------------------------------- |
| Export one named selector per subscribable value    | Inline lambda selectors inside components                   |
| Use `partialize` to persist only necessary fields   | Persist the entire store (includes ephemeral UI state)      |
| Keep actions in the store — no external mutators    | Mutate state from outside the store                         |
| Use Zustand for cross-feature UI + domain state     | Use Zustand for server/async data (use TanStack Query)      |
| Single-object params when action takes >1 argument  | Positional arguments in actions: `add(item, index)`        |
| Arrow const for selectors and store creator         | `function` keyword anywhere in the store file               |
| Reset on logout / route change where appropriate    | Leave stale state across sessions or users                  |
