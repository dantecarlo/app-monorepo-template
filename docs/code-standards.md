# Code Standards

> **BINDING.** These rules apply to every change across the monorepo and must be
> forwarded to every subagent prompt. "Preferred" does not exist here — violations
> fail the pre-commit hook or the CI lint step.

---

## Source-of-truth map

One home per topic. If a topic appears in another doc, that copy must be a
one-line pointer here — never a restatement. Drift-proof by construction.

| Domain                                               | Owner                                                    | What lives there                            |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| **RULES** — the binding laws                         | this file (`docs/code-standards.md`)                     | every coding rule + the §21 coverage ledger |
| **STRUCTURE** — fractal tree, layers, block shape    | `.claude/skills/arch/SKILL.md`, `docs/architecture/*.md` | how code is organized and built             |
| **FLOW** — data wiring and error surfacing           | §14 and §19 of this file                                 | how data and errors move end-to-end         |
| **OWNERSHIP** — who owns each file, what init prunes | `template.manifest.json`, `docs/manifest.md`             | the deterministic init contract             |

Reading order for any agent: **this file → `arch` skill → the task skill →
`pnpm validate`**.

---

## 0. Reuse Before Scaffolding

**Before creating a service, adapter, hook, component, screen, store, or
constant, verify an equivalent does not already exist.** If one does, the task
is `modify` — never scaffold a duplicate.

- **Indexed repo:** query CodeGraph (`codegraph_explore`, or
  `codegraph explore "<question>"`) before any broad grep sweep.
- **No index:** fall back to a structural sweep — search by artifact suffix
  under the target roots and READ the candidates.
- The index may be missing; **the reuse check never is.**

Enforcement is **review**. No linter can verify "did you look first". The
mechanical backstops (`knip` for dead and duplicate exports, `verify:maps` for
coverage) only catch leftovers _after_ the duplicate exists — this rule is what
prevents it.

> Duplication born of not knowing what already exists is the most expensive
> kind: it survives review and rots the architecture from the inside.

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

### 1.1 ES6+ over ES5

Reach for the modern construct.

`var` is never correct here, and a binding that is never reassigned is not a
`let`.

```ts
// ❌ wrong
var total = 0
let items = getItems()

// ✅ correct
const items = getItems()
```

C-style loops, `for...in`, `while` and `do/while` are ES5 shapes. Prefer spread,
destructuring, and optional chaining over their ES5 equivalents.

```ts
// ❌ avoid — a counter, a mutation, and the intent buried in the body
const gaps = []
for (let id = 1; id <= max; id += 1) {
  if (!declared.has(id)) gaps.push(id)
}

// ✅ prefer — the intent IS the expression
const gaps = Array.from({ length: max }, (_, at) => at + 1).filter(
  (id) => !declared.has(id)
)
```

`for...of` stays legal — it is ES6, and it is the right answer for two cases:

- **Side effects over an iterable.** Clearer than `.forEach()`, which reads
  functional while doing the opposite.
- **One pass genuinely producing several results.** A `reduce` with a five-field
  accumulator is no improvement over the loop it replaced.

**A comparison that must visit every element uses `reduce`, never `every` or
`some`.** Those two stop at the first difference, so the time taken leaks where
it was — see `hmacHexSignature.helper.ts` and the origin-guard adapter.

A poll or a cursor with no fixed count becomes recursion over its own
next-cursor.

> Status: **not yet lint-enforced in this template.** Tracked in §21.

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
`docs/decisions/`, or the doc that owns the topic. Evidence belongs
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

`../` paths are banned. Every import must use a workspace or path alias, or
the `#src/` key of the package that holds the file.

```ts
// ❌ wrong
import { ItemEntity } from '../../domain/Item.type'

// ✅ correct
import { ItemEntity } from '@app/core'
import { Button } from '@/*' // apps/web
import { Button } from '@/*' // apps/mobile
import { AppError } from '#src/errors/AppError.helper' // packages/core
```

Available aliases:

- `@/*` → `src/*` inside each app, and inside each package for its tests
- `@app/*` → workspace packages (`@app/core`, `@app/tokens`, etc.)
- `#src/*` → `src/*` of the package that holds the file, for its own sources

**A package imports its own files through `#src/`.** Each package another
workspace consumes by source (`core`, `cloudflare`, `i18n`, `supabase`,
`tokens`) declares `"imports": { "#src/*": "./src/*.ts" }` in its
`package.json`, plus `"#src/*.json": "./src/*.json"` in `i18n` for its
catalogs, and its sources, the `index.ts` barrel and its re-exports included,
reach their siblings through that key. `@/` cannot serve there: it resolves
against the `src` of the workspace that compiles the file, which is the
consuming app. A `#` key resolves against the `package.json` that holds the
file, whoever compiles it: Turbopack (Next 16), Metro, TypeScript with
`moduleResolution: bundler` and Vitest all read it (decision 45 of
`docs/INIT_AND_HARNESS_PLAN.md`, measured 2026-11-12). The key is private to its
package: a file reaches another workspace by its `@app/*` name, never through a
`#` key, and Node refuses a relative target that leaves the package. In
`packages/core`, `core-import-boundary` reports every `#` key but `#src/`, and a
test pins core's mapping to `./src/*.ts`. A package test reaches the unit it
tests through `#src/` or `@/`: it runs inside its own package, where both
resolve.

**One exception remains: an app barrel.** An `index.ts` under `apps/*/src` may
re-export its block's files by `./` (`export { X } from './X.component'`). A
package barrel has no exception: it re-exports through `#src/`.

> Status: **lint** (`no-relative-import-paths`, `allowSameFolder: false`) over
> every `import` declaration in the apps and the packages, with no override for
> a package source; test files sit outside it (`TEST_FILE_OVERRIDE` in
> `eslint.rules.mjs`). It reads `import` statements, so an `export … from`
> re-export in a barrel is outside what it sees and holds by review.

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
| Style          | `Name.style.ts`      | `ItemCard.style.ts`      |
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
`perfectionist/sort-interfaces`, `perfectionist/sort-enums`,
`sort-destructure-keys`, `react/jsx-sort-props`).
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

Prettier formats code and JSON, never Markdown: `.prettierignore` lists
`*.md`. Markdown is prose, and Prettier broke two docs and realigns a whole
table when one cell changes. `verify:maps` checks the links of `docs/maps/global-map.md`
and `verify:specs` the shape of `openspec/`; the links of every other doc are
checked in review. Align a table by hand when you edit it.

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

Separate logic from rendering. A `*.component.tsx` / `*.screen.tsx` is
**render and composition ONLY**. The moment a view holds logic, that logic
moves into a colocated `use{Name}.hook.ts`.

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

| Check                                                                   | Where                                           | Tier  |
| ----------------------------------------------------------------------- | ----------------------------------------------- | ----- |
| 2+ `useState` in a view                                                 | `local/logic-in-view`                           | ERROR |
| Exactly 1 `useState` (trivial toggle vs business state — not decidable) | `local/single-use-state`                        | WARN  |
| `useEffect` / `useMemo` / `useCallback` / `useRef` in a view            | `no-restricted-syntax` (FORBIDDEN_HOOK_CALLEES) | ERROR |
| Event handler with 2+ statements / `if` / `switch` / `await`            | `local/logic-in-view`                           | ERROR |
| Captured `.map` / `.filter` / `.sort` / `.reduce` (not inline in JSX)   | `local/logic-in-view`                           | ERROR |
| Client `async` view body / `.then` chain                                | `no-restricted-syntax` (NO_ASYNC_VIEW)          | ERROR |

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

### 15.1 i18n Catalog Conventions

Catalog keys use **PascalCase namespace segments, camelCase leaf segments**,
plus two verbatim exceptions that mirror external shapes:

- numeric-index maps (`weekday.0`…`weekday.6`, `byCode.404`),
- snake_case enum-value keys copied from database enums (`status.past_due`).

Anything else — kebab-case, spaces, SCREAMING, non-ASCII, a leading digit — is
drift.

Every catalog value must be non-empty and keep its ICU MessageFormat braces
**balanced**. ICU uses single braces (`{count}`) nested for plural and select,
so the structural check is brace balance, not a `{{` scan.

> Status: **cross-locale key parity is enforced** by
> `packages/i18n/src/__tests__/catalog-parity.test.ts` inside `pnpm validate`.
> Key **casing** and brace balance are not yet enforced. Tracked in §21.

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
- [ ] Unit tests pass (`pnpm exec turbo run test`)
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)

---

## 18. Validation Gate (definition of done)

Nothing is **DONE** until the validation harness is green.

After generating any feature, change, or fix:

1. **Run `ATL_TEMPLATE_SELF=1 pnpm validate`** — the deterministic gate. It runs
   the manifest gates and the lint-rule tests first (instant, so structural
   drift fails before anything expensive), then
   `turbo run lint typecheck test build format:check`, then the `verify:*`
   scripts, the diagram drift check and `knip`. Any failure is a BLOCKER.

   > Check the **exit code**, not the tail of a pipe. `pnpm validate | tail`
   > reports the exit status of `tail`, which is always 0. Use
   > `pnpm validate > log 2>&1; echo $?`.

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

## 19. Error Surfacing — One Global Path

Errors flow through **one** path. Screens and hooks must not bypass it.

- **Typed errors only.** Services throw an `AppError` (`@app/core`) carrying
  `messageKey` (i18n) + `code` + optional `cause`. User-facing copy lives in the
  `messageKey` — **never hardcoded** in a hook or a screen.
- **Centralized resolution.** One resolver owns the precedence:
  explicit override → `AppError.messageKey` via i18n → `error.message` →
  generic fallback.
- **An explicit override is a rare exception.** Default to letting
  `messageKey` resolve. Pass an override only when a screen genuinely needs
  different copy than the domain error, and say why on the line above.
- **Where each error type shows:**

  | Error type                   | Channel                                   |
  | ---------------------------- | ----------------------------------------- |
  | Field **validation**         | inline, on the field                      |
  | **Mutation** (server/domain) | global toast, from `messageKey`           |
  | **Query** (data load)        | per-screen `ErrorState` / `AsyncBoundary` |
  | **Render** crash             | global `ErrorBoundary` + `ErrorState`     |

- **Never couple a server or domain error to a form field's error state.** A
  failed login is not a "wrong password" on the password field.
- **Single-sourced observability.** Every failed query and mutation is captured
  **once**, in the `QueryCache` / `MutationCache` `onError` sink, PII-scrubbed
  via `scrubPII` and `sanitizeQueryKey`. No ad-hoc `captureError` in hooks or
  screens — only code under `src/lib/**` may capture directly.
- **`messageKey` parity.** Every `messageKey` must exist in **all** i18n
  catalogs, or the toast silently degrades to the raw technical message.

> Status: the ports and helpers exist (`AppError`, `buildServiceError`,
> `scrubPII`, `sanitizeQueryKey`). The **mechanical** contract check is not yet
> here. Tracked in §21.

---

## 20. Lint Severity Ratchet

Warnings are **scaffolding, not a resting place.** A rule shipped at `warn` is a
rule mid-migration; the target for every rule is `error` under a
`--max-warnings 0` gate, so neither an error nor a warning can pass.

**The ratchet:** clear a rule's backlog → flip it to `error` → it can never
regress. Never flip a rule to `error` over code that still violates it. Never
leave a rule at `warn` forever.

**Flexibility without weakening the gate** — three tiers, in order of preference:

1. **Tune the rule** (options, selectors) so it never fires on the legitimate
   pattern. Zero noise. Best.
2. **Scoped path override** — `off` for one glob, when the false positive is
   _systematic_ in one area, declared in `eslint.config.mjs`.
3. **Justified inline disable** for one-offs, with a written reason, one rule
   per line, and `reportUnusedDisableDirectives: 'error'` so a stale disable
   becomes an error and auto-expires.

That third tier is what keeps escape hatches **visible, greppable, and
self-cleaning**.

> **No allowlist files.** A `*-allowlist.json` freezes a backlog into a file
> nobody reads and the ratchet stops moving. A rule either passes clean here, or
> the code is fixed, or the rule does not land. See `docs/GENERALIZATION_PLAN.md`
> decision 1.
>
> **The one exception** is `scripts/verify-english.allow.json`, the allowlist
> of `verify:english` (§15). It cannot hold a backlog: it ships empty, each
> entry names its file, its line (the text or a pattern) and the reason the
> line keeps that text, and the gate fails an entry that excuses no line, so a
> stale one cannot stay. See `docs/harness.md`.

> Status: **not in place.** Packages lint with `eslint .` — no
> `--max-warnings 0`, no `reportUnusedDisableDirectives`. Tracked in §21.

---

## 21. Rule → Validation Coverage

Every rule needs a concrete validation method. **A rule that nothing validates
is not a rule — it is a wish.**

Methods: **lint** (ESLint, fails the gate) · **tsc** (a compiler flag) ·
**script** (a `verify:*` node script in `pnpm validate`) · **test** (a unit
test) · **hook** (a git hook) · **CI** (a workflow job) · **review** (a human or
routed skill — it runs when someone routes to it, and not otherwise).

An instruction is not a gate. Two rules written in the same voice, in the same
file, hold very differently when one is backed by a hook and the other by prose.
This table exists so that difference is visible.

| Rule                        | Method        | Mechanism                                                           |
| --------------------------- | ------------- | ------------------------------------------------------------------- |
| §0 Reuse before scaffolding | review        | backstops: `knip`, `verify:maps`                                    |
| §1 Arrow only               | lint          | `func-style` + `no-restricted-syntax`                               |
| §1.1 ES6+ over ES5          | **none yet**  | needs `no-var`, `prefer-const`, ES5-shape selectors                 |
| §1.2 Comment discipline     | lint          | `local/no-justifying-comment` — narrow set; broad tell stays review |
| §2 Alias imports            | lint          | `no-relative-import-paths`                                          |
| §3 File suffixes            | lint          | `check-file/filename-naming-convention`                             |
| §3.1 Type placement         | lint          | `local/suffix-contract` on views and hooks                          |
| §4 Naming conventions       | lint          | `@typescript-eslint/naming-convention`                              |
| §5 Single-object params     | **warn only** | `local/single-object-params` at `warn`; no `--max-warnings 0` (§20) |
| §6 Service + adapter paired | script        | `verify:pairing`                                                    |
| §6 Adapter purity           | lint          | `local/pure-domain-adapter` on `src/services/**/*.adapter.ts`       |
| §7 No magic values          | lint+script   | `no-magic-numbers` + `verify:maps` literal audit                    |
| §8 Max 500 lines            | lint          | `max-lines`                                                         |
| §9 Tests per unit           | script        | `verify:tests`                                                      |
| §10 Auto-sort               | lint          | `simple-import-sort/*`, `perfectionist/sort-*`, `sort-keys`         |
| §11 No JSX prop spreading   | lint          | `react/jsx-props-no-spreading`                                      |
| §12 Component folder casing | script        | `verify:structure`                                                  |
| §13 Prettier                | **partial**   | `prettier/prettier` on workspace TS/TSX; `format:check` has no task |
| §14 Data flow               | review        | —                                                                   |
| §14a Logic in hooks         | lint          | `local/logic-in-view` + `local/single-use-state`                    |
| Core import boundary        | lint          | `local/core-import-boundary` on `packages/core/src/**`              |
| §15 English everywhere      | script        | `verify:english` (allowlist: §20 exception); identifier lint `warn` |
| §15.1 i18n catalogs         | test          | `catalog-parity.test.ts` — **parity only**, casing not yet          |
| §16 Conventional commits    | hook          | `commitlint` on `commit-msg`                                        |
| §17 Per-feature DoD         | review        | —                                                                   |
| §18 Validation gate         | script        | the `pnpm validate` chain                                           |
| §19 Error surfacing         | **none yet**  | needs an `error-contract` verify script                             |
| §20 Severity ratchet        | **none yet**  | needs `--max-warnings 0` + `reportUnusedDisableDirectives`          |
| §21 This table              | review        | —                                                                   |
| File ownership / init prune | script        | `verify:manifest` + `verify:manifest:coverage`                      |

**Rows that read "none yet", "warn only" or "partial"** are not aspirations
hidden in prose — they are named gaps with a named mechanism, tracked as
harvest work in
`docs/GENERALIZATION_PLAN.md` phases 2 and 3. A row moves to a real method only
when the mechanism lands **and passes clean with no exemption file**; the
`verify:english` allowlist is the one exception, and §20 says how it stays
honest.

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
