---
name: component
description: >
  Generate a presentational React component block. Mandatory first step:
  decompose the target into PARTS and extract cross-cutting/recurring parts
  as reusable wrappers (checking components/ui first) BEFORE writing any file.
  Then scaffold: I{Name} interface in {Name}.type.ts, Tailwind constants in
  {Name}.styles.ts, optional useName.hook.tsx, arrow-const named export in
  {Name}.component.tsx, and index.ts barrel. Arrow-only, no-semi, alias imports,
  no inline Tailwind, no default export, aria-label on icon-only elements.
  DO NOT USE for screens or data-fetching containers — use `screen` instead.
  USE WHEN: "create component", "new component [name]", "generate component",
  "add a [name] component", "build the [name] UI block".
---

# Create Component

> A component is DESIGNED before it is written. First list its PARTS; then
> extract the cross-cutting and recurring parts as reusable wrappers. Only
> after that do you scaffold files.
>
> Read `arch` for naming and import conventions before generating.

For container screens that own data fetching, use `screen` instead.

---

## Step 0 — Decompose into Wrappers (MANDATORY — do this BEFORE writing any file)

### 0a. PARTS LIST

Enumerate every visual or behavioral part of the target component. For example,
designing an `ItemCard`:

```
ItemCard parts:
- Container shell (outer wrapper + border + padding)
- Avatar / thumbnail (image or initials circle)
- Title / primary label
- Meta line (secondary text, timestamp, status)
- Action button (icon-only or labeled CTA)
- Status badge
- Loading state variant
- Empty / error state variant
```

### 0b. Wrapper extraction decision tree

For each part, answer the question:

```
Is this part cross-cutting (reused across multiple components)
OR recurring (appears 2+ times here or will appear elsewhere)?
│
├── YES → Check components/ui/ first:
│         Does a matching wrapper already exist? (Avatar, Button, Chip,
│         EmptyState, ErrorState, LoadingState, Badge, …)
│         ├── YES → Compose it in — do NOT re-create it.
│         └── NO  → Create a new reusable block in
│                   apps/*/src/components/ui/<Wrapper>/
│                   with its own .component.tsx + .styles.ts + index.ts
│                   BEFORE working on the target component.
│
└── NO  → Keep it local to this component's file/styles.
```

### 0c. Composition sketch

Before writing real code, write a comment sketch of the target component
as a composition of extracted wrappers + local parts:

```tsx
// ItemCard = <Card shell> + <Avatar (ui/Avatar)> + <Title (local)>
//           + <MetaLine (local)> + <ActionButton (ui/Button)> + <StatusBadge (ui/Chip)>
```

Only proceed to Step 1 after this sketch is written.

---

### Decision tree (ASCII)

```
Part identified
│
├─ Already exists in components/ui/?
│   └─ YES → import and compose — STOP (no new file)
│
├─ Used in 2+ places OR cross-cutting?
│   └─ YES → create ui/<Wrapper>/ block first, then compose
│
└─ Truly local (one-off, not reused)?
    └─ YES → keep inline in this component's styles + template
```

### DO / DON'T

| DO                                                  | DON'T                                                   |
| --------------------------------------------------- | ------------------------------------------------------- |
| Check `components/ui/` before creating any wrapper  | Re-create Avatar, Button, Chip if they already exist    |
| Extract recurring parts into `ui/` wrapper blocks   | Inline a part you will repeat in 2+ components          |
| Sketch the composition BEFORE writing code          | Start writing files without a decomposition step        |

---

## Step 1 — Types (`{Name}.type.ts`)

```typescript
export interface I{Name} {
  // Required props first
  label: string
  // Optional props after
  disabled?: boolean
  onPress?: () => void
}
```

Rules:
- Interface name = `I{Name}` (I-prefix, Rule 4)
- Required before optional
- Callback types are explicit: `(value: string) => void`
- Never `any` — use specific types or `unknown`

---

## Step 2 — Styles Constant (`{Name}.styles.ts`)

```typescript
export const {NAME_UPPER} = {
  CONTAINER: 'flex items-center gap-2',
  LABEL: 'text-sm font-medium text-foreground',
  ICON: 'h-4 w-4 shrink-0',
  DISABLED: 'opacity-50 cursor-not-allowed'
} as const
```

Rules:
- One exported `const` in `SCREAMING_SNAKE_CASE` named after the component
- Keys describe purpose: `CONTAINER`, `LABEL`, `BADGE` — not `FLEX_CENTER`
- Use `as const` for type narrowing
- No token values hardcoded — use `var(--color-...)` or Tailwind token classes

---

## Step 3 — Hook (`use{Name}.hook.tsx`) — only if logic needed

```typescript
import type { I{Name} } from '@/{path}/I{Name}.type'

export interface IUse{Name} {
  onPress?: () => void
}

export interface IUse{Name}Return {
  handlePress: () => void
  isActive: boolean
}

export const use{Name} = ({ onPress }: IUse{Name}): IUse{Name}Return => {
  const handlePress = () => {
    onPress?.()
  }
  return { handlePress, isActive: false }
}
```

Skip this file entirely if the component has no interaction logic.

---

## Step 4 — Component (`{Name}.component.tsx`)

```typescript
import type { I{Name} } from '@/{path}/{Name}.type'
import { {NAME_UPPER} } from '@/{path}/{Name}.styles'
// import { use{Name} } from '@/{path}/use{Name}.hook'

export const {Name} = ({ label, disabled = false, onPress }: I{Name}) => {
  // const { handlePress } = use{Name}({ onPress })

  return (
    <button
      className={`${NAME_UPPER.CONTAINER} ${disabled ? NAME_UPPER.DISABLED : ''}`}
      disabled={disabled}
      onClick={onPress}
      type="button"
    >
      <span className={NAME_UPPER.LABEL}>{label}</span>
    </button>
  )
}
```

Rules:
- Arrow const, named export — no `export default`, no `function` keyword
- No logic in the component body — delegate to hook
- No inline Tailwind strings — use the styles constant
- JSX props sorted alphabetically (ESLint enforces)
- Icon-only interactive elements **must** have `aria-label`
- No JSX prop spreading (`{...props}` is banned, Rule 11)

---

## Step 5 — Barrel (`index.ts`)

```typescript
export { {Name} } from './{Name}.component'
export type { I{Name} } from './{Name}.type'
```

---

## After Creation

- [ ] Import from the barrel in consuming files, not from the implementation file
- [ ] Run `pnpm typecheck` — verify no type errors
- [ ] Write tests: use `test` skill for `{Name}.test.tsx`
- [ ] Verify `aria-label` on all interactive elements without visible text
- [ ] Run `pnpm lint:fix` — auto-sorts JSX props

---

## Common Mistakes

| Mistake                                                 | Fix                                         |
| ------------------------------------------------------- | ------------------------------------------- |
| Default export (`export default`)                       | Named export only                           |
| `function {Name}(...)` keyword                         | Arrow const: `const {Name} = (...) => ...` |
| Logic in component body (handlers, computed values)     | Move to hook                                |
| Inline Tailwind class strings                           | Extract to `{Name}.styles.ts` constant      |
| Magic numbers / hardcoded strings                       | Named constant with purpose name            |
| Relative imports (`'../something'`)                     | `@/` path alias                             |
| Interface `{Name}Props` without I prefix                | `I{Name}`                                   |
| JSX prop spreading `{...props}`                         | List each prop explicitly                   |
| Recreating `Avatar`, `Button`, `Chip` from scratch      | Import from `@/components/ui/`              |
