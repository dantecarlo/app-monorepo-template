# Code Standards

> **BINDING.** These rules apply to every change across the monorepo and must be
> forwarded to every subagent prompt. "Preferred" does not exist here — violations
> fail the pre-commit hook or the CI lint step.

---

## 1. Functions — Arrow Only

No `function` keyword. Arrow expressions everywhere.

```ts
// ❌ wrong
function formatDate(isoString: string): string { ... }

// ✅ correct
const formatDate = (isoString: string): string => { ... }
```

React components follow the same rule — arrow expression assigned to a `const`.

---

### 1.2 Comments Say What the Code Does

A comment states **what the code does**, plus only the mechanical fact a reader
needs in order not to break it. It is not a defense of the choice, and never a
log of how the change was made.

```ts
// ❌ wrong — defends the placement against alternatives nobody proposed,
//    and records the session rather than the code
// Imported HERE, once, rather than inside each test. It stays a dynamic
// import because vi.mock hoists above static ones. Measured 2026-07-27.

// ✅ correct
// Loads the module under test. Dynamic so vi.mock applies first.
```

**The tell.** Any comment containing _"rather than"_, _"instead of"_, _"not
because"_, _"exists to"_, _"deliberately"_, _"on purpose"_ or _"would have"_ is
arguing with an alternative. Grep your diff before pushing:

```bash
rg -n '^\s*//.*(rather than|instead of|not because|exists to|deliberately|on purpose|would have)'
```

Two related smells: a comment that restates the PR description, and a comment
that outlives the code it defended.

**Where the reasoning goes instead:** the commit message, the ADR under
`docs/architecture/decisions/`, or the doc that owns the topic. Evidence belongs
where it is dated and attributable, not inline where it silently rots.

### The two halves of this rule

The grep above is a **review aid**, not the gate. Those broad phrasings were
measured across 2421 files upstream and produce hundreds of false positives:
plenty of legitimate behavior descriptions and constraint statements contain
"rather than" or "instead of".

What **fails the build** is a narrow set of seven phrases, listed in
`eslint-local-rules/justifying-comment.detect.mjs` and enforced at `error` by
`local/no-justifying-comment`. The idea is broader than the gate, and the gate
says so out loud instead of pretending otherwise.

> Status: **lint-enforced** (narrow set). Measured at 0 violations in this repo
> when the rule landed.

---

## 2. Imports — Alias Only, Never Relative

`../` paths are banned. Every import must use a workspace or path alias.

```ts
// ❌ wrong
import { ItemEntity } from '../../domain/Item.type'

// ✅ correct
import { ItemEntity } from '@app/core'
import { Button } from '@/*' // apps/web
import { Button } from '@/*' // apps/mobile
```

Available aliases:

- `@/*` → `src/*` inside each app
- `@app/*` → workspace packages (`@app/core`, `@app/tokens`, etc.)

---

## 3. File Suffixes — Required

| Kind           | Pattern              | Example                  |
| -------------- | -------------------- | ------------------------ |
| Component      | `Name.component.tsx` | `ItemCard.component.tsx` |
| Screen         | `Name.screen.tsx`    | `Dashboard.screen.tsx`   |
| Hook           | `useName.hook.ts`    | `useItems.hook.ts`       |
| Service        | `name.service.ts`    | `items.service.ts`       |
| Adapter        | `Name.adapter.ts`    | `Items.adapter.ts`       |
| Type/Interface | `Name.type.ts`       | `Item.type.ts`           |
| Constant       | `Name.constant.ts`   | `queryKeys.constant.ts`  |
| Test           | `Name.test.tsx`      | `ItemCard.test.tsx`      |

---

### 3.1 Type Placement

Where a type is **declared** follows one rule:

> **A view or hook file declares no types.** Every `interface` / `type` / `enum`
> a block uses lives in that block's `*.type.ts` — props, hook param and return
> contracts, and view-model shapes alike.

- **MUST move to `*.type.ts`** — every type that would otherwise sit in a
  `*.component.tsx`, `*.screen.tsx`, or `*.hook.ts`. This includes single-use
  prop interfaces and hook contracts. **There is no "single-use" exception**: a
  props type that starts single-use is exactly how a block's contract ends up
  buried in a `.tsx` with a dozen importers and nobody aware it became public
  API. One home from birth means no promotion later.
- SCREAMING_SNAKE constants follow the same contract — they live in
  `*.constant.ts`, never in a view or hook.
- **Two narrow homes remain**, because the alias cannot leave its source without
  a circular import:
  - aliases **derived from a const** stay in the declaring `*.constant.ts`
    (`type XType = (typeof X_ENUM)[keyof typeof X_ENUM]`),
  - types **inferred from a schema** stay in the `*.schema.ts`
    (`type X = z.infer<typeof x>`).

> Status: **lint-enforced** by `local/suffix-contract` on `*.component.tsx`,
> `*.screen.tsx` and `*.hook.ts`. The 133 pre-existing declarations were moved
> to their block siblings first, so the rule landed with no exemption file.

---

## 4. TypeScript Naming Conventions

| Kind                     | Convention                                 | Example                               |
| ------------------------ | ------------------------------------------ | ------------------------------------- |
| Interface                | `I{Name}`                                  | `IItemCard`, `IUseItems`              |
| Type alias               | `{Name}Type`                               | `ItemRowType`, `StatusType`           |
| Enum                     | `{Name}Enum`                               | `ItemStatusEnum`, `CategoryEnum`      |
| Const (object/primitive) | `ALL_CAPS_SNAKE_CASE` named by **purpose** | `MAX_RETRY_ATTEMPTS`, `DEFAULT_LIMIT` |

**Name constants by functionality, not value.**

```ts
// ❌ wrong — names the value
const NUMBER_THREE = 3

// ✅ correct — names the purpose
const MAX_RETRY_ATTEMPTS = 3
```

---

## 5. Single-Object Parameters

Every function, hook, service, and component takes one object argument and
destructures it. No positional arguments.

```ts
// ❌ wrong
const useItems = (limit: number, search: string) => { ... }

// ✅ correct
const useItems = ({ limit, search }: IUseItems) => { ... }
```

Exceptions: React event handlers, array callbacks, reducer signatures,
third-party library callbacks (TanStack `queryFn`, MSW handlers, etc.).

---

## 6. Service + Adapter — Always Paired

Every `*.service.ts` must have a corresponding `*.adapter.ts`. Never call
`fetch` directly in components or hooks — always through a service function.

```
features/items/services/
├── items.service.ts      # fetch logic, generic <T>
└── Items.adapter.ts      # pure transformation → domain shape
```

---

#### Services are folder-grouped per domain

Each domain's service files live in a dedicated subfolder under `src/services/`:

```
src/services/
└── <Domain>/               # PascalCase domain folder
    ├── <domain>.service.ts
    ├── <Domain>.adapter.ts
    ├── <domain>.constant.ts    # optional
    ├── index.ts                # barrel: re-exports public API only
    ├── <domain>.service.test.ts
    └── <Domain>.adapter.test.ts
```

- Folder name: PascalCase matching the domain (e.g. `Items/`, `Payments/`).
- Barrel (`index.ts`): exports service functions + adapter functions.
  Never exports constants or test utilities.
- External consumers import from the barrel:
  `import { ... } from '@/services/Items'`.
- Internal files (service, adapter, tests) import siblings via the full
  alias path: `@/services/Items/<file>` (no `../`).
- Mirrors the same per-domain grouping used by screens and components.

---

## 7. No Magic Numbers or Strings

Every literal must live in a constant or enum.

```ts
// ❌ wrong
if (results.length > 50) { ... }

// ✅ correct
if (results.length > QueryLimitsEnum.DEFAULT_PAGE_SIZE) { ... }
```

---

## 8. Max File Length — 500 Lines

Files exceeding 500 non-blank, non-comment lines are an ESLint error.
Split the file into smaller units before committing.

---

## 9. Tests — `test()` + Semantic Queries

```ts
// ❌ wrong
it('renders', () => { ... })
screen.getByTestId('title')

// ✅ correct
test('renders the item title', () => { ... })
screen.getByRole('heading', { name: /item title/i })
```

- Use `test()`, never `it()`
- Semantic queries only: `getByRole`, `getByText`, `getByLabelText`
- No `data-testid`, no `container`, no `getByTestId`
- One test file per component/hook

---

## 10. Auto-Sort — Imports, Keys, Props

Enforced by ESLint (`simple-import-sort`, `sort-keys-fix`,
`typescript-sort-keys`, `sort-destructure-keys`, `react/jsx-sort-props`).
Run `pnpm lint:fix` to auto-correct before committing.

---

## 11. No JSX Prop Spreading

```tsx
// ❌ wrong
<Button {...props} />

// ✅ correct
<Button disabled={props.disabled} label={props.label} />
```

---

## 12. Component Folder Casing

In `apps/web/src/components/` all subfolder names are **PascalCase**.
Feature folders at the route level follow lowercase convention (e.g.
`features/items`, `screens/Home`).

---

## 13. Prettier — Format Contract

```json
{
  "semi": false,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 75,
  "tabWidth": 2,
  "endOfLine": "auto"
}
```

No semicolons, single quotes, 75-character print width.

---

## 14. Data Flow

```
Component → Hook → Service → Adapter
```

- Components render and dispatch — no data fetching
- Hooks coordinate queries/mutations via services
- Services own `fetch` + generic `<T>` shape
- Adapters are pure functions — no side effects, no I/O

---

## 14a. Logic in Hooks — Views Stay Render-Only

Separate logic from rendering. A `*.component.tsx` / `*.screen.tsx` is **render
+ composition ONLY**. The moment a view holds logic, that logic moves into a
colocated `use{Name}.hook.ts`.

A `use{Name}.hook.ts` is **REQUIRED** when a view contains LOGIC. LOGIC means
any of:

1. **State** — 2+ `useState`, OR a single `useState` holding derived / business
   / multi-value data (NOT a single trivial boolean open/closed toggle).
2. **Behavioural hooks** — any `useEffect` / `useMemo` / `useCallback` /
   `useRef` that carries behaviour.
3. **Branching handlers** — an event-handler body with branching or 2+
   statements (validation, state+callback combos, conditional navigation, cache
   invalidation).
4. **Derivation** — a data transform / `.map` / `.filter` / `.sort` / `.reduce`
   in the render body that is **captured into a variable** and produces a NEW
   shape (i18n view-model mapping counts).
5. **Async** — client-side `async` / `await` / `.then` / `fetch`.

**ALLOWED INLINE** (no hook required):

- Pure presentational render.
- ONE `useState` boolean toggle (`isOpen` / `isExpanded`) with a single trivial
  setter.
- Direct prop pass-through handlers — `onPress={onPress}` or
  `onPress={() => onPress?.()}`.
- `.map` over a prop/hook array **inline in JSX** that ONLY renders JSX (no
  captured new-shape derivation).
- RSC async **server** components that call a data / use-case layer (a Next.js
  App Router framework pattern). A NAKED service call still belongs behind a
  loader / use-case — keep the screen body an await-and-render, not a raw
  service call wired straight into JSX.

### Enforcement

The deterministic subset is enforced by ESLint and is a **hard gate** (ERROR):

| Check                                                                    | Where                                        | Tier  |
| ------------------------------------------------------------------------ | -------------------------------------------- | ----- |
| 2+ `useState` in a view                                                  | `local/logic-in-view`                        | ERROR |
| Exactly 1 `useState` (trivial toggle vs business state — not decidable)  | `local/single-use-state`                     | WARN  |
| `useEffect` / `useMemo` / `useCallback` / `useRef` in a view             | `no-restricted-syntax` (FORBIDDEN_HOOK_CALLEES) | ERROR |
| Event handler with 2+ statements / `if` / `switch` / `await`             | `local/logic-in-view`                        | ERROR |
| Captured `.map` / `.filter` / `.sort` / `.reduce` (not inline in JSX)    | `local/logic-in-view`                        | ERROR |
| Client `async` view body / `.then` chain                                 | `no-restricted-syntax` (NO_ASYNC_VIEW)       | ERROR |

`apps/web` RSC async screens are an explicit allowlist
(`RSC_ASYNC_SCREEN_OVERRIDE`) — they may be `async`, since RSC vs client is not
distinguishable by file suffix. Every other rule above still applies to them.

Whether a single `useState` is a trivial toggle, whether a one-statement handler
hides business meaning, and whether a derivation is "trivial" are **not
statically decidable** — they stay WARN-tier guidance, caught in review / by the
`fractal-verify` skill.

---

## 15. English Everywhere

All identifiers, comments, file names, and commit messages are in English.
UI strings go through the i18n layer (`@app/i18n`).

---

## 16. Conventional Commits

Enforced by commitlint on the `commit-msg` hook.

```
feat(items): add search filter
fix(mobile): recover background service after OS kill
chore: update eslint config
```

No `Co-Authored-By` or AI attribution.

---

## 17. Per-Feature Definition of Done

Before marking a task complete:

- [ ] Loading, empty, and error states implemented
- [ ] Unit tests pass (`pnpm test`)
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)

---

## 18. Validation Gate (definition of done)

Nothing is **DONE** until the validation harness is green.

After generating any feature, change, or fix:

1. **Run `pnpm validate`** — the deterministic gate:
   `turbo run lint typecheck test build`. Any failure is a BLOCKER.

2. **Run the grouped validator subagents** via `/validate-all` — five
   adversarial subagents run in parallel (G-standards, G-tests, G-security,
   G-a11y-design-dod, G-fractal). Each returns a PASS/FAIL verdict with findings tagged
   BLOCKER / WARNING / INFO.

3. **Overall DONE** only when:
   - `pnpm validate` passes (exit 0)
   - Zero BLOCKERs across all validator groups

See `.claude/skills/validate-all/SKILL.md` for the full harness recipe and
`.claude/agents/validator.md` for the validator subagent definition.

Every subagent that writes code must be told to comply with this document
(`docs/code-standards.md`) as part of its prompt.

---

## Tooling Reference

| Command             | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `pnpm lint`         | Run ESLint across all packages             |
| `pnpm lint:fix`     | Auto-fix ESLint (sort imports, keys, etc.) |
| `pnpm format`       | Prettier write                             |
| `pnpm format:check` | Prettier check (CI)                        |
| `pnpm typecheck`    | TypeScript across all packages             |
| `pnpm validate`     | Full gate: lint + typecheck + test + build |
| `pnpm prepare`      | Initialize Husky hooks                     |

Pre-commit hook runs `lint-staged` (ESLint + Prettier on staged `.ts/.tsx`).
Commit-msg hook enforces conventional commits via commitlint.
