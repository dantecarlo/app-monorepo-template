---
name: modify
description: >
  Safe edit flow for an existing component or screen: pre-flight read sequence
  (component, hook, type, test, styles), wrapper-detection flow, modification types
  (add prop to I{Name}, add logic to hook not view, add Tailwind variant in styles,
  forwardRef, variant refactor at 4th boolean), post checklist runs pnpm typecheck/
  lint:fix/test. Arrow-only snippets, I-prefix interfaces, no-semi, alias imports.
  USE WHEN: "modify component", "update component", "add prop to [name]",
  "refactor [component]", "change [component] behavior", "edit existing [name]".
---

# Modify Component

> Read before you write. Never modify blindly. Always update the test.

---

## Pre-flight (MANDATORY — do all before any change)

1. Read the component file (`{Name}.component.tsx`)
2. Read the hook file if it exists (`use{Name}.hook.ts`)
3. Read the types file (`{Name}.type.ts`)
4. Read the test file (`__tests__/{Name}.component.test.tsx`, in the block's own folder)
5. Read the styles file (`{Name}.style.ts`) if relevant to the change
6. Run the Wrapper Detection Flow below

---

## Wrapper Detection Flow

```
Is this component a thin wrapper around a single library/primitive component?
├── YES → Does it have a hook with business logic?
│   ├── YES → Composed component — modify in place
│   └── NO → Does it have local state?
│       ├── YES → Composed component — modify in place
│       └── NO  → Simple wrapper — consider moving to components/ui/ (separate task)
│                 For now, modify in place.
└── NO → Domain/composed component — modify in place
```

---

## Modification Types

### A — Adding a Prop

1. Add to `{Name}.type.ts` interface (required props before optional)
2. Add to destructuring in the component or hook
3. Pass to JSX or logic
4. Update test: add a test case exercising the new prop
5. Update snapshot: `pnpm test -- --update-snapshots {Name}`

```typescript
// Before: {Name}.type.ts
export interface I{Name} {
  label: string
}

// After: new optional prop added
export interface I{Name} {
  label: string
  disabled?: boolean  // optional props after required
}
```

Rules:
- Required props first, optional after
- Never `any` for new prop types
- Never a type of a UI kit or a primitive (`VariantProps`, `FallbackProps`, `StatusBarStyle`): a
  variant prop takes the block's own union (Type C), and a wrapped primitive's prop takes the
  wrapper's own type (`IAsyncBoundaryFallbackProps`, `StatusBarStyleType`)
- If the prop changes rendering significantly → consider a variant (see Type E)

---

### B — Adding Logic (event handler, computed value, side effect)

1. If a hook exists → add logic to `use{Name}.hook.ts` — NOT to the component
2. If no hook exists → create `use{Name}.hook.ts` first (follow `component` skill)
3. Keep the component file as pure render — no logic in the component body
4. Add test for the new logic path

```typescript
// ❌ Logic in component
export const {Name} = ({ items }: I{Name}) => {
  const sorted = items.sort(...) // ← logic here
  return <div>{sorted.map(...)}</div>
}

// ✅ Logic in hook
export const use{Name} = ({ items }: IUse{Name}) => {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.label.localeCompare(b.label)),
    [items]
  )
  return { sorted }
}
export const {Name} = ({ items }: I{Name}) => {
  const { sorted } = use{Name}({ items })
  return <div>{sorted.map(...)}</div>
}
```

---

### C — Adding a Tailwind Style Variant

1. Add new constant keys to `{Name}.style.ts`
2. Use conditional class application in the component

```typescript
// {Name}.style.ts
export const {NAME} = {
  CONTAINER: 'flex items-center gap-2',
  CONTAINER_COMPACT: 'flex items-center gap-1 py-1'  // new variant
} as const

// {Name}.component.tsx
<div className={compact ? {NAME}.CONTAINER_COMPACT : {NAME}.CONTAINER}>
```

Rules:
- Keys describe purpose — never CSS values
- Never add inline Tailwind strings — always through the styles constant
- A variant of a look is added to the block that owns the look: a `ui/` block, or a block in a
  screen's own `components/`. In a screen, a route or a container the style file only positions
  (`local/style-positions-only`), so a new look there is a variant or a prop of the `ui/` block it
  renders, never a class in the screen (`AGENTS.md` § Styling lives in the components).
- Every value is a token or a step of Tailwind's scale; a raw colour, a palette colour or `[…]`
  fails `local/style-token-values`, and a value no token carries is added to
  `packages/tokens/src/tokens.constant.ts`, then `pnpm --filter @app/tokens generate` writes it
  into every output.
- On web, a variant of a `tv` config is also a union of the block. A new option is added to the
  config and to its tuple in `{Name}.constant.ts`; a new variant gets its tuple, its union and its
  prop in `{Name}.type.ts`, typed by the union, never by the kit's `VariantProps`. The block's
  `__tests__/{Name}.constant.test.ts` compares them with `VariantUnionsType` of
  `@/components/ui/variants.helper` and fails until the config, the tuple and the union agree (see
  the `component` skill, Step 2).

---

### D — Adding `forwardRef`

Only add when the component:
- Is used as a Tooltip or Popover child (needs DOM ref for positioning)
- Needs imperative access (`focus()`, `scrollIntoView()`)
- Is passed to a library's `component` or `as` prop

```typescript
import { forwardRef } from 'react'
import type { I{Name} } from './{Name}.type'

export const {Name} = forwardRef<HTMLButtonElement, I{Name}>(
  ({ label }, ref) => (
    <button ref={ref}>{label}</button>
  )
)
{Name}.displayName = '{Name}'
```

Always set `displayName` for React DevTools clarity.

---

### E — Removing Boolean Prop Accumulation (Variant Refactor)

When a component has 4+ behavior-changing boolean props, refactor into
explicit variants. Trigger: adding a 4th behavior-changing boolean — stop
and refactor instead.

```typescript
// ❌ Boolean accumulation
interface I{Name} {
  isCompact?: boolean
  isEmbedded?: boolean
  isHighlighted?: boolean
  isCondensed?: boolean  // 4th boolean — refactor signal
}

// ✅ Explicit variant components
const Standard{Name} = () => { ... }
const Compact{Name} = () => { ... }
const Embedded{Name} = () => { ... }

// Share logic via a common base hook
const use{Name}Base = ({ ... }: IUse{Name}Base) => { ... }
```

Steps:
1. Identify which boolean combinations are actually used
2. Create one variant component per valid combination
3. Share logic in `use{Name}Base.hook.ts`
4. Update all call sites
5. Delete the old component

---

## Pre-Modification Checklist

- [ ] Prop interface updated in `.type.ts` (not inline)
- [ ] No `any` types introduced
- [ ] No magic strings or numbers
- [ ] Constants named by purpose, not value
- [ ] Imports use `@/` path aliases
- [ ] Logic in hook, not component
- [ ] No inline Tailwind strings (use `.style.ts`)
- [ ] Arrow const — no `function` keyword

## Post-Modification Checklist

- [ ] Test file updated with scenarios for the change
- [ ] Snapshot updated if rendering changed
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] No other tests broken

---

## DO vs DON'T

| DO                                                       | DON'T                                     |
| -------------------------------------------------------- | ----------------------------------------- |
| Read component + hook + test before changing             | Modify blindly                            |
| Add new props as optional when backward-compat is needed | Make existing optional props required     |
| Add logic to hook, not component                         | Add business logic to render functions    |
| Use styles constant for all Tailwind classes             | Add inline `className` strings            |
| Update test for every behavior change                    | Leave tests out of sync with changes      |
| Consider variant refactor at 4th boolean prop            | Keep adding boolean props indefinitely    |
| Arrow const — no `function` keyword                      | `function {Name}(...)` in the component   |
