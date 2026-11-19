---
name: store
description: >
  Generate a typed store slice in src/stores/{name}.store.ts through createAppStore of
  src/lib/store, with state interface I{Name}State, named selector functions
  select{Name}{Field}, actions, and an optional persist. Arrow-only selectors,
  single-object action params where >1 arg. Replaces Context + useReducer for cross-feature
  state; TanStack Query, behind lib/query, for server/async state.
  USE WHEN: "create store", "new Zustand store", "add global state for [name]",
  "replace context with store", "add [name] slice", "cross-feature state for [name]".
  DO NOT USE: server or async data, which belongs in the query cache through
  `useAppQuery` (use `service`).
---

# Create Store

> A store replaces Context + useReducer for all application state.
> Context is reserved for framework-required providers (theme, i18n, auth session).
> The query cache, through `@/lib/query`, owns all async / server state — do not put it in a store.

Every store is created through `createAppStore` of `src/lib/store/createAppStore.helper.ts`, the
only file of the app that imports zustand (`docs/code-standards.md` §23). A store never imports
`zustand`, `zustand/middleware` or `zustand/react/shallow`: `local/dependency-seam` refuses it.

---

## Do You Need a New Store?

```
Is this state shared across 2+ unrelated screens or features?
├── YES → a store through createAppStore (you are here)
└── NO  → Is it server/async data?
    ├── YES → the query cache, through useAppQuery (use `service` skill)
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

## What createAppStore takes and returns

```typescript
createAppStore<I{Name}State>({
  initializer: ({ get, set }) => ({ /* state + actions */ }),
  persist: { name: '{project}-{name}', partialize: (s) => ({ /* kept fields */ }) } // optional
})
```

- `set` takes some fields, or a function of the state that returns them; `get` reads the state
  inside an action.
- The store is a hook: `use{Name}Store(select{Name}{Field})` returns that value and re-renders
  when it changes. `use{Name}Store.getState()`, `.setState({ … })` and `.getInitialState()`
  read and change it outside React (tests, other stores).
- `use{Name}Store.useShallow((s) => ({ a: s.a, b: s.b }))` reads an object of several fields as
  one reference while each field is unchanged; a plain selector that builds a new object never
  settles.
- `persist` keeps the fields `partialize` names under `name`: in local storage on the web, on the
  device through `keyValueStorage` of `src/lib/storage/` on mobile.

---

## Generated File: `src/stores/{name}.store.ts`

### Simple store

```typescript
import { createAppStore } from '@/lib/store/createAppStore.helper'

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

export const use{Name}Store = createAppStore<I{Name}State>({
  initializer: ({ set }) => ({
    isOpen: false,
    activeItemId: null,

    setIsOpen: (open) => set({ isOpen: open }),
    setActiveItemId: (id) => set({ activeItemId: id }),
    reset: () => set({ isOpen: false, activeItemId: null })
  })
})
```

### Stateful store (array items)

```typescript
import { createAppStore } from '@/lib/store/createAppStore.helper'

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

export const use{Name}Store = createAppStore<I{Name}State>({
  initializer: ({ set }) => ({
    items: [],

    add: ({ item }) =>
      set((s) => ({ items: [...s.items, item] })),

    remove: ({ id }) =>
      set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

    clear: () => set({ items: [] })
  })
})
```

### With `persist`

```typescript
import { createAppStore } from '@/lib/store/createAppStore.helper'

interface I{Name}State { ... }

export const use{Name}Store = createAppStore<I{Name}State>({
  initializer: ({ set }) => ({
    // state + actions
  }),
  persist: {
    name: '{project}-{name}',        // the storage key, on the web and on the device
    partialize: (s) => ({            // only persist what must survive reload
      // selected fields
    })
  }
})
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
// ✅ Several fields as one object — the same object while they are unchanged
export const useSession = () =>
  useAuthStore.useShallow((s) => ({ session: s.session, status: s.status }))
```

```typescript
// ❌ A new object on every read — the component never settles
const session = useAuthStore((s) => ({ session: s.session, status: s.status }))
```

---

## Naming Conventions

| Concern          | Convention                                                        |
| ---------------- | ----------------------------------------------------------------- |
| File             | `{name}.store.ts` (camelCase)                                     |
| Test             | `src/stores/__tests__/{name}.store.test.ts`                       |
| Hook             | `use{Name}Store`                                                  |
| State interface  | `I{Name}State`                                                    |
| Selector         | `select{Name}{Field}` (arrow const)                               |
| Actions          | verbs: `add`, `remove`, `set{Field}`, `reset`, `toggle{Field}`    |
| Storage key      | `'{project}-{name}'`                                              |

---

## DO vs DON'T

| DO                                                  | DON'T                                                       |
| --------------------------------------------------- | ----------------------------------------------------------- |
| Create the store through `createAppStore`          | Import `zustand` (or its middleware) in a store or a hook   |
| Export one named selector per subscribable value    | Inline lambda selectors inside components                   |
| Read an object of several fields through `useShallow` | Build a new object in a plain selector                    |
| Use `partialize` to persist only necessary fields   | Persist the entire store (includes ephemeral UI state)      |
| Keep actions in the store — no external mutators    | Mutate state from outside the store                         |
| Use a store for cross-feature UI + domain state     | Use a store for server/async data (use `useAppQuery`)       |
| Single-object params when action takes >1 argument  | Positional arguments in actions: `add(item, index)`        |
| Arrow const for selectors                           | `function` keyword anywhere in the store file               |
| Reset on logout / route change where appropriate    | Leave stale state across sessions or users                  |
