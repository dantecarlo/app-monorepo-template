---
name: component
description: >
  Generate a presentational React component block. Mandatory first step:
  decompose the target into PARTS and extract cross-cutting/recurring parts
  as reusable wrappers (checking components/ui first) BEFORE writing any file.
  Then scaffold: I{Name} interface in {Name}.type.ts, Tailwind constants in
  {Name}.style.ts, optional useName.hook.ts, arrow-const named export in
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
│                   with its own .component.tsx + .style.ts + index.ts
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

## Step 2 — Styles Constant (`{Name}.style.ts`)

```typescript
export const {NAME_UPPER} = {
  CONTAINER: 'flex items-center gap-2',
  LABEL: 'font-body text-label font-medium text-text-secondary',
  ICON: 'size-4 shrink-0',
  DISABLED: 'opacity-50 cursor-not-allowed'
} as const
```

Rules:
- One exported `const` in `SCREAMING_SNAKE_CASE` named after the component
- Keys describe purpose: `CONTAINER`, `LABEL`, `BADGE` — not `FLEX_CENTER`
- Use `as const` for type narrowing
- The styling pillar (`AGENTS.md` § Styling lives in the components,
`docs/code-standards.md` §22): a `ui/` block, or a block in a screen's own `components/`, owns its
look; a screen, a route entry and a container only position. This block is where its look goes:
  colour, type, border, radius, shadow, opacity, states and variants.
- Every value is a token (`text-text-primary`, `max-w-content`, `px-pill-x`; `colors.accent` in a
  React Native StyleSheet) or a step of Tailwind's scale (`px-2.75`). No raw colour, no palette
  colour (`bg-white/…`), no arbitrary value (`[…]`): `local/style-token-values` fails them. A value
  no token carries is added to `packages/tokens/src/tokens.constant.ts` first, then
  `pnpm --filter @app/tokens generate` writes it into the web theme, the NativeWind preset, the
  mobile theme variables and the theme names; never edit those generated files, nor add a value to
  `globals.css`.
- On web, every `ui/` style file imports `tv` from `@/components/ui/variants.helper`, never from
  `tailwind-variants`: its shared tailwind-merge config registers every token name of `@app/tokens`
  (`themeNames`). Plain tailwind-merge keeps both of two token paddings (`p-sm p-lg`), reads a token
  font size (`text-title`) as a colour and drops it, and drops a token shadow beside a shadow
  colour.
- On web, a block with variants types its props with its own unions, never the kit's
  `VariantProps`: its `{Name}.constant.ts` declares one tuple of option names per variant and the
  union it derives, as the mobile constants do, and the props take the unions. Its
  `__tests__/{Name}.constant.test.ts` holds them to the `tv` config through `VariantUnionsType` of
  `@/components/ui/variants.helper`, so typecheck fails when a union and its config disagree (the
  snippet below). Only `variants.helper.ts` imports `tailwind-variants`, type-only imports included
  (`local/dependency-seam`).
- Only a `ui/` block imports a UI kit or its helpers (`tailwind-variants`, Radix,
  `class-variance-authority`, `expo-linear-gradient`, …): `local/ui-kit-boundary`. A screen-local
  block that needs one renders the `ui/` wrapper, or a wrapper is added to `ui/`.
- A primitive has one wrapper, and only its component file imports it
  (`.agents/contracts/dependencies.json`): `ui/Image` draws `next/image` on web, `ui/Gradient`
  `expo-linear-gradient` and `ui/StatusBar` `expo-status-bar` on mobile, and `ui/AsyncBoundary`
  wraps `react-error-boundary` in both. Their props are their own types
  (`IAsyncBoundaryFallbackProps`, `StatusBarStyleType`), so a block renders the wrapper, and a test
  mocks it, never the library.
- Text, a labelled rule and a screen surface already have blocks: `ui/Text`, `ui/Divider`,
  `ui/Screen`.
- A `react-native` primitive a `ui/` block is named after is imported only under that block's
  folder, every other file renders the block, other `ui/` blocks included (`local/wrapped-import`,
  which reads the blocks from disk): on mobile `Text`, `Modal`, `Button` and `StatusBar`. A block
  that shows text renders `Text` of `@/components/ui/Text/Text.component`, which takes the
  block's NativeWind classes (`className`), its `accessibilityRole`, a variant, a style and a line
  limit. `View`, `ScrollView`, `Pressable`, `TextInput` and every primitive no block is named
  after are imported from `react-native` directly.

```tsx
// WRONG — a mobile block draws react-native's Text itself
import { Pressable, Text } from 'react-native'

// RIGHT — it renders the Text block, with the classes its own style file holds
import { Pressable } from 'react-native'

import { Text } from '@/components/ui/Text/Text.component'

<Text className={BADGE_TEXT_CLASS}>{label}</Text>
```

```typescript
// Button.constant.ts — one tuple per variant, in the order of the tv config's keys
export const BUTTON_SIZE_VARIANTS = ['lg', 'md', 'sm'] as const
export type ButtonSizeType = (typeof BUTTON_SIZE_VARIANTS)[number]

// Button.type.ts — the props name the unions, no kit type
export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSizeType
}

// __tests__/Button.constant.test.ts — fails typecheck or the run when they drift
expectTypeOf<VariantUnionsType<typeof buttonVariants>>().toEqualTypeOf<{
  fullWidth: boolean
  size: ButtonSizeType
  variant: ButtonVariantType
}>()
expect(BUTTON_SIZE_VARIANTS).toEqual(Object.keys(buttonVariants.variants.size))
```

---

## Step 3 — Hook (`use{Name}.hook.ts`) — only if logic needed

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
import { {NAME_UPPER} } from '@/{path}/{Name}.style'
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
- [ ] Write tests: use `test` skill for `__tests__/{Name}.component.test.tsx`, in the block's own
      folder
- [ ] Verify `aria-label` on all interactive elements without visible text
- [ ] Run `pnpm lint:fix` — auto-sorts JSX props

---

## Common Mistakes

| Mistake                                                 | Fix                                         |
| ------------------------------------------------------- | ------------------------------------------- |
| Default export (`export default`)                       | Named export only                           |
| `function {Name}(...)` keyword                         | Arrow const: `const {Name} = (...) => ...` |
| Logic in component body (handlers, computed values)     | Move to hook                                |
| Inline Tailwind class strings                           | Extract to `{Name}.style.ts` constant       |
| Magic numbers / hardcoded strings                       | Named constant with purpose name            |
| Relative imports (`'../something'`)                     | `@/` path alias                             |
| Interface `{Name}Props` without I prefix                | `I{Name}`                                   |
| JSX prop spreading `{...props}`                         | List each prop explicitly                   |
| Recreating `Avatar`, `Button`, `Chip` from scratch      | Import from `@/components/ui/`              |
| A hex, a palette colour or `[…]` in a style             | The token (`bg-neutral-tint`, `max-w-narrow`) |
| A UI kit imported outside `components/ui`               | Wrap it in a `ui/` block and render that    |
| `VariantProps<typeof {name}Variants>` in a block's props | The block's own unions in `{Name}.constant.ts` |
| `next/image`, `expo-linear-gradient` or `expo-status-bar` in a block | Render `ui/Image`, `ui/Gradient` or `ui/StatusBar` |
