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
coverage) only catch leftovers _after_ the duplicate exists, and
`local/wrapped-import` only a `react-native` primitive drawn outside the `ui/`
block named after it — this rule is what prevents it. The wrapper of a library
is found the same way: its entry in `.agents/contracts/dependencies.json` names
the seam that holds it (`docs/decisions/0002-every-library-behind-an-adapter.md`).

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
test pins each package's mapping into its own `src`. A package test reaches the unit it
tests through `#src/` or `@/`: it runs inside its own package, where both
resolve.

**One exception remains: an app barrel.** An `index.ts` under `apps/*/src` may
re-export its block's files by `./` (`export { X } from './X.component'`). A
package barrel has no exception: it re-exports through `#src/`.

> Status: **lint**. In the apps, `no-relative-import-paths` (`allowSameFolder:
> false`) reads every `import` declaration; an `export … from` re-export is
> outside what it sees and holds by review. In a package's production files,
> `package-src-alias` (`eslint-local-rules/index.mjs`) reads imports, re-exports
> and `import()`, and its fix writes the `#src/` form from the file's own path,
> whichever folder ESLint runs from, and only when that alias resolves back to
> the same file through the package's `imports` map. Test files sit outside both
> (`TEST_FILE_OVERRIDE` in `eslint.rules.mjs`).

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
| Test           | `__tests__/<unit>.test.tsx` | `__tests__/ItemCard.component.test.tsx` (§ 9) |

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
| Enum member              | `UPPER_SNAKE_CASE`                         | `ItemStatusEnum.PAST_DUE`             |
| Const (object/primitive) | `ALL_CAPS_SNAKE_CASE` named by **purpose** | `MAX_RETRY_ATTEMPTS`, `DEFAULT_LIMIT` |

An enum member is written like any `ALL_CAPS` constant, whatever its value:
`ErrorStateCodeEnum.NOT_FOUND = '404'`, `QueryKeySegmentEnum.ITEMS = 'items'`. The
`enumMember` selector of `@typescript-eslint/naming-convention` holds it.

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
    └── __tests__/              # each unit's test, named after it (§ 9)
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
- **A unit's test lives in the `__tests__/` of the unit's own folder and carries the unit's
  stem**: `X/Y.<suffix>.tsx` is tested by `X/__tests__/Y.<suffix>.test.tsx`. That holds in a
  block folder (`components/ui/ErrorState/__tests__/ErrorState.component.test.tsx`), a hook's
  own folder, a folder of plain units (`lib/query/__tests__/useAppQuery.hook.test.ts`), a
  package's `src/` folders, and for a unit outside `src/`: `apps/web/next.config.ts` is tested by
  `apps/web/__tests__/next.config.test.ts`. An index file is a unit like any other. Owner
  decision 57 (2026-11-15) chose this over a test beside its unit.
- An Expo Router route test is named after its route file as `<route>.route.test.tsx`, in the
  `__tests__/` of the route's folder: `src/app/_layout.tsx` is tested by
  `src/app/__tests__/layout.route.test.tsx`, `src/app/index.tsx` by
  `src/app/__tests__/index.route.test.tsx`. Metro's default `resolver.blockList` keeps every
  `__tests__/` out of the bundle, so Expo Router never reads a route test as a route.
- A test imports a unit under `src/` through the alias (`@/lib/query/useAppQuery.hook`), never
  `../`; `@app/tooling`, plain `.mjs` with no alias, is the one workspace that uses `../`.
- `src/test/` (setup, the test helper, MSW handlers and server, module mocks) and `__mocks__/`
  are shared test infrastructure, not unit tests, and no rule judges where they sit.
- `pnpm verify:tests` fails a test beside its unit, one in a higher `__tests__/`, one whose stem
  names no unit of the folder that holds its `__tests__/`, and a `__tests__/` inside another; a
  frozen exception in `scripts/verify-tests.mjs` carries its reason and fails once it exempts
  nothing. `pnpm tests:into-blocks` moves every test it can place with `git mv`, rewriting the
  test's relative imports and every citation of its old path in `openspec/specs/` and `docs/`;
  a project that adopts the rule runs it once. The Vitest configs read `src/**/__tests__/` and
  the workspace's root `__tests__/`.
- Every Vitest suite runs shuffled. `@app/tooling/vitest-sequence` seeds the order of the tests
  inside each file from the commit, so a test that passes only after another one can fail on the
  next commit. A checkout with no commit fails to load the config unless `VITEST_SEQUENCE_SEED`
  is set. Each run prints its seed, and
  `VITEST_SEQUENCE_SEED=<seed> pnpm --filter <workspace> test` replays that order. A package's
  `vitest.config.ts` builds on `packageTestBase` (`@app/tooling/vitest-package-base`) and states
  only its `include`; an app config takes `sequence: testSequence({ packageDir: __dirname })`.

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
UI strings go through the i18n layer (`@app/i18n`): every user-facing string of
a component or an adapter is a catalog message, in every catalog, accessibility
labels included. An adapter returns data, never a sentence (an item's age is a
unit and a count), and the component words it through the catalog in the
active language.

**A block reads its copy through the app's translator**, never a translation runtime. Both
apps give the same `IAppTranslator` of `@app/i18n`: `useAppTranslator()` of
`@/lib/i18n/useAppTranslator.hook`, and on the web `getAppTranslator()` of
`@/lib/i18n/appTranslator.adapter` in a server component. It holds `t(key, values?)`, whose
key is a full path of the English catalog (`TranslationKeyType`, so a path the catalog lacks
and a namespace fail typecheck); `has(key)`, which turns a string that arrives at run time,
such as an `AppError`'s message key, into a key; and `locale`, the active language.

```ts
// WRONG — a block reaches the runtime, and reads differently in each app
const t = useTranslations('items.dashboard') // web
const { t } = useTranslation('translation', { keyPrefix: 'items.dashboard' }) // mobile

// RIGHT — the same line in both apps, the key in full
const { t } = useAppTranslator()
t('items.dashboard.listResults', { count })
```

next-intl, react-i18next and the i18next family are imported only by each app's
`src/lib/i18n/` and the framework files that must name them (§ 23). A test mocks
`@/lib/i18n/…` or renders through the app's test helper (`renderWithIntl`, `renderWithI18n`).

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

The catalog key type is the shape of the English catalog, the catalog of the
default and fallback language, and `resources` is typed by it: a catalog that
lacks a key of the English one fails typecheck.

> Status: **cross-locale key parity is enforced** by
> `packages/i18n/src/locales/__tests__/resources.constant.test.ts` inside `pnpm validate`:
> it compares every catalog of `resources` with every other and needs one per supported
> language. Key **casing** and brace balance are not yet enforced. Tracked in §21.

---

## 16. Conventional Commits

Enforced by commitlint on the `commit-msg` hook, and on the commits of a pull request by CI's `commitlint` job, which also catches a `--no-verify` commit; in both, commitlint's default ignores pass, unlinted, a message with any line that starts `Merge pull request`, `Merge branch …`, `Merge … into …` or `Merge tag …`, one whose first line starts with `Merged`, `Merge remote-tracking branch`, `Automatic merge`, `Auto-merged`, `Revert`, `Reapply`, `fixup!`, `squash!` or `amend!`, or one that is only a version number.

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
> `scrubPII`, `sanitizeQueryKey`), and both apps follow the table: `useAppQuery`
> queues no toast and the dashboards show their `ErrorState`, `useAppMutation`
> queues the toast, and the error boundaries report a crash once through
> `reportBoundaryError` in `src/lib/observability/`. A query key holds its
> dynamic values in a trailing params object, which `sanitizeQueryKey` always
> redacts. The **mechanical** contract check is not yet here. Tracked in §21.

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
> **Three exceptions.** `scripts/verify-english.allow.json`, the allowlist of
> `verify:english` (§15), cannot hold a backlog: it ships empty, each entry
> names its file, its line (the text or a pattern) and the reason the line keeps
> that text, and the gate fails an entry that excuses no line, so a stale one
> cannot stay. `eslint-style-positioning-allowlist.json`, read by the styling
> rules (§22), is held the same way: it ships empty, an entry names its file,
> its rule and why the value cannot move, and `verify:allowlist-freshness` fails
> an entry whose file no longer breaks its rule. The owner asked for it with
> the styling pillar (2026-11-14). `eslint-dependency-seam-allowlist.json`, read
> by `local/dependency-seam` (§23), is the one that can hold a backlog: the
> imports a migration has yet to move, frozen per file and package, each naming
> a migration the registry declares open, and counting only while it is open.
> `verify:dependency-seams` fails an entry whose import is gone, an entry whose
> migration is not open, an open migration no entry names and every import it
> does not list, so it only shrinks. F.8 drove it to empty, and the template
> declares no open migration, so it refuses any entry (decision 51, F59). See
> `docs/harness.md`.

> Status: **not in place.** Packages lint with `eslint .` — no
> `--max-warnings 0`, no `reportUnusedDisableDirectives`. Tracked in §21.

---

## 21. Rule → Validation Coverage

Every rule needs a concrete validation method. **A rule that nothing validates
is not a rule — it is a wish.**

Methods: **lint** (ESLint, fails the gate) · **tsc** (a compiler flag) ·
**script** (a `verify:*` node script in `pnpm validate`) · **test** (a unit
test) · **hook** (a git hook) · **agent hook** (a runtime hook every tool call
of an agent passes through) · **CI** (a workflow job) · **review** (a human or
routed skill — it runs when someone routes to it, and not otherwise).

An instruction is not a gate. Two rules written in the same voice, in the same
file, hold very differently when one is backed by a hook and the other by prose.
This table exists so that difference is visible.

| Rule                        | Method        | Mechanism                                                           |
| --------------------------- | ------------- | ------------------------------------------------------------------- |
| §0 Reuse before scaffolding | review        | backstops: `knip`, `verify:maps`; `local/wrapped-import` refuses a primitive its `ui/` block wraps |
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
| §9 Tests per unit, in place | script        | `verify:tests` (and `verify:tests:test`) — presence and location    |
| §10 Auto-sort               | lint          | `simple-import-sort/*`, `perfectionist/sort-*`, `sort-keys`         |
| §11 No JSX prop spreading   | lint          | `react/jsx-props-no-spreading`                                      |
| §12 Component folder casing | script+lint   | `verify:structure`; `check-file/folder-naming-convention` on every app's `src/components/ui/` |
| §13 Prettier                | **partial**   | `prettier/prettier` on workspace TS/TSX; `format:check` has no task |
| §14 Data flow               | review        | —                                                                   |
| §14a Logic in hooks         | lint          | `local/logic-in-view` + `local/single-use-state`                    |
| Core import boundary        | lint          | `local/core-import-boundary` on `packages/core/src/**`              |
| §15 English everywhere      | script        | `verify:english` (allowlist: §20 exception); identifier lint `warn` |
| §15 Copy via the translator | lint + types  | `local/dependency-seam` keeps the runtimes in `src/lib/i18n/`; `TranslationKeyType` refuses a key the catalog lacks |
| §15.1 i18n catalogs         | test + types  | `resources.constant.test.ts` + typed `resources` — casing not yet   |
| §16 Conventional commits    | hook + CI     | `commitlint` on `commit-msg`, and the CI job `commitlint` over the commits of a pull request; not a message its default ignores pass (`Merge`, `Revert`, `fixup!` and the like) |
| §17 Per-feature DoD         | review        | —                                                                   |
| §18 Validation gate         | script        | the gate registry `.agents/contracts/gates.json`, run in order by `pnpm validate` (`scripts/validate.mjs`), and `pnpm validate:test` |
| §19 Error surfacing         | **none yet**  | needs an `error-contract` verify script                             |
| §20 Severity ratchet        | **none yet**  | needs `--max-warnings 0` + `reportUnusedDisableDirectives`          |
| §21 This table              | review        | —                                                                   |
| File ownership / init prune | script        | `verify:manifest` + `verify:manifest:coverage`                      |
| One instruction entry       | script        | `verify:instruction-entry` — `AGENTS.md` present, no `CLAUDE.md`    |
| No invisible Unicode        | script        | `verify:unicode-safety` — no zero-width, direction, tag or filler character in a tracked text file; the emoji joiner only in the i18n catalogs |
| CI actions pinned           | script        | `verify:workflow-pins` — every `uses:` a full commit SHA; local and `docker://` exempt; not whether the SHA is the tag its comment names |
| Every skill findable        | script        | `verify:skill-frontmatter` — frontmatter parses, `name` is the folder, description within 1,024 characters with `USE WHEN:` and `DO NOT USE:` (vendored skills: parse, name and length only); not whether the triggers are the right ones |
| No skill names a downstream project | script | `verify:skill-neutrality` — no file under `.claude/skills/` names a name `.agents/contracts/downstream-projects.json` declares, as a whole word in any case; not a name spelled another way, a project's domain vocabulary, or a project described without its name, which review reads |
| `AGENTS.md` fits Codex      | test          | `codex-budget:test` — CRLF bytes within `project_doc_max_bytes`     |
| Merged worktrees removed    | hook + test   | `.husky/post-merge` runs `worktrees:prune`, held by `worktrees:prune:test`: a merged worktree goes only when nothing in it would be lost, hidden edits and a moved branch included, and the main checkout fast-forwards only when it holds no tracked local change and git allows it; not a pull request merged on the forge with no local merge or pull after it, a merge run with `HUSKY=0`, which skips every hook, or what the pruner's `NOT_COVERED` names |
| Orphan processes ended      | agent hook + test | the process reaper (`reap:test`, `docs/harness.md` §3g): at every Claude Code `SessionStart`, one reaper at a time, an orphan whose executable and script match a one-shot family of `.agents/contracts/process-reaper.json` is ended with its whole tree, its pid read again right before, never its own ancestry, a spared process (the MCP proxy, Git for Windows, tmux), persistent or watch work, a process younger than the grace or anything outside the families; not a runaway that still has its parent, an orphan outside the families, an orphan whose parent pid a process that does not read as newer reused, or Codex, OpenCode and Copilot, which run no adapter |
| MCP servers by area         | script + test | `verify:mcp-docs` (and `:test`): every catalog server has the area `web` or `mobile` and runs `node scripts/mcp/launch.mjs <its name>`, and every `.mcp.json` catalog server and launcher entry runs it with one catalog name; `mcp:launch:test`: the launcher starts a server only when `ATL_MCP_AREA` is unset, empty or names its area, importing the pinned entry in its own process; not whether a session was opened from its area's Desktop environment, a server whose entry starts only as the main module, nor Codex and OpenCode, which have no area yet |
| Suites safe in a git hook   | test          | `hook-git-dir:test` + `git-free-env:test`; each suite that spawns git runs one end-to-end case under `withHookGitDir` and asserts the decoy `GIT_DIR` is left alone; not a suite that never adds the case, or a git a child starts with the hook's variables a suite passed it, which review reads |
| Agent projections in sync   | script        | `agent-harness:projection-check` — each projection equals its source |
| Every agent names its grader | script       | `verify:agent-context` (and `:test`) — every agent has a `gradedBy` in `.agents/agent-context.json` naming skills that exist, a `writes` that is true or false, a well-formed `surface` if any, and no other key, and no entry outlives its agent; not whether the skill is the right grader, whether `writes` is the right one, or that its evals ever ran |
| `AGENTS.md` LAWs            | review        | — no gate reads a LAW; the one below has an agent hook too          |
| LAW: a rule is not edited to fit the work | agent hook + review | the write guard (`write-guard:test`, `docs/harness.md` §3f): in Claude Code, an Edit, Write or NotebookEdit of a rule file of `.agents/contracts/write-guard.json` asks the human, the main session included, and a read-only agent is refused; not Bash or PowerShell, not Codex, OpenCode or Copilot, which run no adapter yet, and not why a rule changed, which review reads |
| `AGENTS.md` Router          | script        | `verify:router-coverage` — every "Load skill" cell a shipped skill, every skill a row, every "Validated by" script one `package.json` defines; not whether a row routes the right requests, which review reads |
| §22 Screens only position   | lint+script   | `local/style-positions-only` + `verify:allowlist-freshness`         |
| §22 Values are tokens       | lint+script   | `local/style-token-values` + `verify:allowlist-freshness`           |
| §22 The kit behind `ui/`    | lint          | `local/ui-kit-boundary` on every app                                |
| §22 A primitive through its block | lint    | `local/wrapped-import`: a `react-native` primitive a `ui/` block is named after, only under that block; not `Pressable`, `TextInput` or a block that stands in under another name (`ui/Toggle` for `Switch`) |
| §22 One `tv` on web         | lint+test     | `local/dependency-seam`: the helper is `tailwind-variants`' seam    |
| Token outputs generated     | script        | `verify:theme-sync` (and `:test`): each equals its regeneration     |
| §23 Packages in their seams | lint+script   | `local/dependency-seam`: every import, re-export, `import()`, `require()`, `import()` type and `vi.mock` of a package, type-only ones included, only inside its seam, and an unregistered package nowhere; `verify:dependency-seams` the same for the configs ESLint ignores; not a specifier that is not a literal, a triple-slash reference, `declare module`, CSS or JSON, or a vendor type a wrapper re-exports |
| §23 Every package registered | script       | `verify:dependency-seams`: every `package.json` dependency registered, no stale or malformed entry, every seam glob matching a file, the allowlist holding only the imports that still break the rule, each under a migration the registry declares open, and no open migration that no entry names; not a subpath entry no file imports any longer, a new allowlist entry for a new import under a migration still open, or whether a seam is the right one, which review reads |
| §23 The names a wrapper owns | lint         | `local/wrapped-import`: the `expo-router` hooks and `router`, only under `src/lib/routing/`; not a subpath of `react-native` or `expo-router`, a `vi.importActual` or an `import()` type, whose names it does not read, or a `ui/` block added while an editor's ESLint server runs |
| §24 One rule set, every app | test          | the fixture apps of `eslint-local-rules/__fixtures__/apps/` (`verify:lint-rules:test`) |

**Rows that read "none yet", "warn only" or "partial"** are not aspirations
hidden in prose — they are named gaps with a named mechanism, tracked as
harvest work in
`docs/GENERALIZATION_PLAN.md` phases 2 and 3. A row moves to a real method only
when the mechanism lands **and passes clean with no exemption file**; the
`verify:english`, styling and dependency-seam allowlists are the three
exceptions, and §20 says how they stay honest.

---

## 22. Styling Lives in the Components

The rule of the LAW of the same name in `AGENTS.md`, which quotes the owner's decisions of
2026-11-14 and 2026-11-15. Why a kit and each primitive have one wrapper, and what stays
direct: `docs/decisions/0002-every-library-behind-an-adapter.md`.

| Who                                                                   | Holds                                                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A block under `src/components/ui/`, or a screen's own `components/`  | Its look: colour, background, border, radius, typography, shadow, opacity, states and variants, in `*.style.ts` |
| A screen, a route entry, a container under `src/components/<Name>/`  | Positioning only: flex and grid, gap, order, alignment, position and inset, z-index, placing size, spacing      |
| `src/helpers/layout.style.ts`                                         | The positioning classes the screens share                                                                        |
| `packages/tokens/src/tokens.constant.ts`                              | Every value: colours, scales, widths, glyph sizes, insets, fonts, shadows, motion; the generated outputs follow |

- **A value is a token** (`bg-accent`, `max-w-content`, `px-pill-x`, `colors.accent`) **or a step of
  Tailwind's scale** (`px-2.75`, `duration-120`). Never a raw colour, a palette colour
  (`bg-white/…`) or an arbitrary value (`max-w-[28rem]`).
- **A new value goes in the token source**, `packages/tokens/src/tokens.constant.ts`; then
  `pnpm --filter @app/tokens generate` writes the web theme, the NativeWind preset, the mobile
  theme variables and the theme names the shared `tv` registers. A generated file is never edited by hand (`verify:theme-sync`), and
  `apps/web/src/app/globals.css` declares no value of its own.
- **The kit sits behind `ui/`.** A UI kit, its primitives and its class helpers are imported by a
  `ui/` block only, so the look and the kit are one replaceable layer. Each primitive has one
  wrapper, and only its component file imports it (§23): `ui/Image` draws `next/image` on web,
  `ui/Gradient` `expo-linear-gradient` and `ui/StatusBar` `expo-status-bar` on mobile, and
  `ui/AsyncBoundary` wraps `react-error-boundary` in both. Every other block renders the wrapper.
- **A `react-native` primitive a `ui/` block is named after** is imported only under that block's
  folder, and every other file renders the block, another `ui/` block included: on mobile
  `ui/Text` for `Text`, `ui/Modal` for `Modal`, and `ui/Button` and `ui/StatusBar`, which stand in
  for theirs. `local/wrapped-import` reads the blocks from each app's `src/components/ui/` on disk,
  so a block added later covers its primitive with no list to edit. `ui/Text` takes the classes
  (`className`) and the `accessibilityRole` a block sets, beside its variant, style and line limit.
  `View`, `ScrollView`, `Pressable`, `TextInput` and every primitive no block is named after stay
  direct.
- **A block's public type names no kit type.** Its props are its own: a web block types its
  variants with unions its `*.constant.ts` declares, one tuple of option names per variant and the
  union it derives (`BUTTON_SIZE_VARIANTS`, `ButtonSizeType`), as the mobile constants do, never
  with the kit's `VariantProps`; the async boundary's fallback takes `IAsyncBoundaryFallbackProps`
  and the status bar `StatusBarStyleType`. `VariantUnionsType` of the shared variants helper reads
  the variants a `tv` config takes, and each block's `__tests__/<Block>.constant.test.ts` compares
  its unions and tuples with it, so typecheck fails when they disagree.
- **A different look** is a variant or a prop of a `ui/` block, never a class in the screen.
- **A web `ui/` style file builds its variants with the shared `tv`**
  (`apps/web/src/components/ui/variants.helper.ts`), never the kit's own: the helper is the one
  seam of `tailwind-variants` and `tailwind-merge`, so `local/dependency-seam` refuses `tv` in any
  other file (§23). tailwind-merge,
  which `tailwind-variants` runs on every call, knows only Tailwind's own scales: it keeps both of
  two token paddings (`p-sm p-lg`), reads a token font size (`text-title`) as a colour and drops it
  next to a text colour, and drops a token shadow next to a shadow colour. The shared `tv`
  registers every name of `themeNames`, which the token generator writes from the web theme, under
  the tailwind-merge theme key of its namespace, so a new token needs no code change. `ui/Text`
  alone keeps `{ twMerge: false }`, so a tone or a weight set beside a variant keeps both
  classes.

```ts
// WRONG — a screen style holds a look
export const LOGIN = { SUBMIT: 'h-12 rounded-full bg-accent-gradient text-accent-ink' }

// RIGHT — the screen positions the block that owns the look
export const LOGIN = { DIVIDER: 'my-6', FORM: 'flex flex-col gap-4' }
// <Button fullWidth type="submit">…</Button> · <Divider className={LOGIN.DIVIDER} label={…} />
```

> Status: **lint + script.** `local/style-positions-only`, `local/style-token-values` and
> `local/ui-kit-boundary` (`eslint-local-rules/`, `error` over both apps), and
> `verify:allowlist-freshness`; `local/dependency-seam` keeps a kit type out of every file but its
> seam, `local/wrapped-import` a `react-native` primitive out of every file but the folder of the
> block named after it, and each web block's constant test holds its unions to its `tv` config.
> **Not covered:** a block that stands in for a primitive under another name (`ui/Toggle` for
> `Switch`), and a primitive no block wraps alone (`Pressable`, `TextInput`); a raw HTML element a
> web block wraps (`<button>`), which is no import; a
> number in a React Native style (`borderRadius: 18`); a class string in a `*.constant.ts`; a class
> a variable hides (`cn(STYLE.X, tone)`), judged where it is defined only if that file is a style
> file; a web block with variants whose constant test is missing, which review reads; and whether
> a `ui/` block's look is right, which is review.

---

## 23. Every Library Behind Its Seam

Decisions 51, 52 and 58 of `docs/INIT_AND_HARNESS_PLAN.md`, recorded with the registry, the two
rules, the gate and what stays out in `docs/decisions/0002-every-library-behind-an-adapter.md`.
The owner, 2026-11-15 (translated
from Spanish): "every package that is not core must be decoupled and have an adapter, in ui as a
wrapper for example", and "Not only the UI libraries, but all the libraries themselves."

**Every package is registered** in `.agents/contracts/dependencies.json`, the one answer to "where
may this be imported": one entry per package, or package subpath, that a `package.json` declares
or source imports.

| Category         | What it is                                                      | Imported from                         |
| ---------------- | --------------------------------------------------------------- | ------------------------------------- |
| `core`           | The language, the framework runtime, the workspace's own core packages | anywhere                       |
| `infra`          | An infrastructure library (i18n, query, state, validation, theme) | its `src/lib/<name>/` wrapper        |
| `ui`             | A UI kit, its primitives and class helpers                      | its `components/ui` block             |
| `vendor`         | A vendor SDK behind a port                                      | its `*.adapter.ts`, and the framework config files it needs |
| `vendor-package` | An `@app/*` package that wraps a vendor                         | the app's `src/lib/<name>/` adapter   |
| `build`          | Dev tooling, Node builtins (`node:*`) included                  | tests, configs and tooling scripts only |
| `peer`           | Installed for a framework, never imported                       | nowhere                               |

- **A seam is a list of repository globs**, written by pattern where a rule holds for every app
  (`apps/*/src/lib/query/**`). An empty seam means no file may import it yet: the import is frozen
  until its F.8 unit builds the wrapper.
- **Type-only imports are governed too** (decision 58). An entry may set `"types": "anywhere"` only
  where the plan allows a type outside the seam; none does today.
- **The most specific entry wins.** `next/navigation`, `next/cache` and `next/image` narrow the core
  `next`, each to one file of the web app (`lib/routing/useAppRouter.hook.ts`,
  `lib/cache/cachePolicy.adapter.ts` and `components/ui/Image/Image.component.tsx`); `next/server`
  takes `next`'s.
- **A name a wrapper owns stays in that wrapper**, though its package is core
  (`local/wrapped-import`, decision 58). A `react-native` primitive a `ui/` block is named after
  passes only under that block's folder (§22). An `expo-router` hook, every `use…` name, and its
  `router` object pass only under the app's `src/lib/routing/`; its layout components (`Stack`,
  `Tabs`, `Slot`, `Redirect`, `Link`) and its types pass anywhere. The rule reads the names a file
  imports or re-exports, type-only ones included and judged by the name the module exports, the
  keys a `vi.mock` factory returns and the names a dynamic `import()` or `require()` is read by; a
  reach of the whole module (a namespace import, `export *`, a factory-less `vi.mock`) is refused
  where one of those names would be.
- **A test inherits the seam of the unit it tests** (the unit its `__tests__/` stands beside, § 9),
  and `src/test/**` is the test-infrastructure seam: it may import any registered package. A test
  of anything else mocks the project module (`@/lib/*`, `@/components/ui/*`), not the vendor.
- **A new dependency is registered in the same change** that adds it, with its category and seam;
  an unregistered package fails at once, closed.
- **The `lib` skill wraps a library**, in one change: it registers the package and its seam,
  builds the wrapper under the project's own types, moves every caller and test onto it, and
  adds no allowlist entry.

```ts
// WRONG — a screen hook reaches the vendor (and so would its test, through vi.mock)
import { useQuery } from '@tanstack/react-query'

// RIGHT — it imports the project module that owns the seam, apps/*/src/lib/query/**
import { useAppQuery } from '@/lib/query/useAppQuery.hook'

// WRONG — a store reaches the state library
import { create } from 'zustand'

// RIGHT — every store is created through the app's factory, the one zustand import
import { createAppStore } from '@/lib/store/createAppStore.helper'

// WRONG — a web hook reaches Next's router, a cached service Next's cache
import { useRouter } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'

// RIGHT — the app's router and cache policy, each the one import of its subpath
import { useAppRouter } from '@/lib/routing'
import { applyCachePolicy, CacheLifeEnum } from '@/lib/cache'
```

**A wrapper owns its types.** `useAppQuery` and `useAppMutation` take and return the app's own
`IAppQueryOptions`, `IAppQueryResult`, `IAppMutationOptions` and `IAppMutationResult`, never the
library's, so a caller that reads them survives a swap of the library; an option a caller leaves
out keeps the client's default, and each hook returns the same result while no field changed.
`AppQueryProvider` gives a tree its client, `useInvalidateAppQuery` invalidates a `QueryKeys` prefix
and `useIsAppMutating` tells whether a keyed mutation runs; a test of a hook or
a screen that queries renders through `createQueryWrapper` of `src/test/query.helper.tsx`. A store
is `createAppStore({ initializer: ({ get, set }) => …, persist? })`, read through a named selector
or, for an object of several fields, through the store's `useShallow`. On mobile, every value kept
on the device, a persisted store's included, goes through `keyValueStorage` of `src/lib/storage/`.
On web, `useAppRouter` of `src/lib/routing/` returns `IAppRouter`, only `push(href)`,
`replace(href)` and `refresh()`, with an `href` the typed routes check, and a test mocks
`@/lib/routing` through `createRoutingDouble` of `src/test/routing.helper.ts`; a function under
`'use cache'` sets its life profile, one of the app's `CacheLifeEnum`, and its tags through
`applyCachePolicy({ life, tags })` of `src/lib/cache/`. On mobile, `src/lib/routing/` is where a
hook over `expo-router` goes, under the app's own types; the app calls none yet, so it holds no
module, and its first caller adds one with its test.

**A root imports project modules only.** The mobile root layout boots through
`src/lib/bootstrap/`: `holdSplashScreen` and `hideSplashScreen` of `splashScreen.adapter.ts` are
the one `expo-splash-screen` import, `useAppBootstrap` loads the faces `APP_FONTS` names and tells
the root when it may render, and `AppSafeAreaProvider` gives it the safe area. A theme is applied
through `applyTheme` of `src/lib/theme/colorScheme.adapter.ts`, by the theme config and by every
test outside `lib/theme` that switches it.

**A vendor client crosses no package boundary.** `@app/supabase` hands out its browser and server
clients as `BackendClientType`, a branded type that names no Supabase type, and the auth gateway
takes one; only `packages/supabase/src/backendClient.adapter.ts` turns it back into the SDK
client, so an adapter that reads data over the client is a `packages/supabase/src/*.adapter.ts`.
Each app's `src/lib/supabase/*.adapter.ts` is the one importer of `@app/supabase`: the client,
typed `BackendClientType`, and the auth gateway its auth provider receives.

**A migration freezes, then shrinks.** An import a migration has yet to move is listed, one entry
per file and package, in `eslint-dependency-seam-allowlist.json`, as
`{ path, package, migration, reason }`. `migration` is the id of a migration the registry declares
open in its `openMigrations`, each `{ id, note }`, and the entry counts, for `local/dependency-seam`
and the gate alike, only while that migration is open. The gate fails an entry whose import is
gone, an entry whose migration is not open, and an open migration no entry names, which is closed
by removing it, so the list cannot grow back by accident. F.8 units 2 to 7 drove it to empty, and
the template declares no open migration, so it refuses any entry: a new import is wrapped, never
listed. A project with a migration in flight declares it and lists its imports under it; only
review refuses a new import listed under a migration still open.

> Status: **lint + script.** `local/dependency-seam` (`eslint-local-rules/dependency-seam.detect.mjs`,
> `error` over `apps/*/**` and `packages/*/**` by pattern, so an app added later inherits it) reads
> imports, re-exports, `import()`, `require()`, `import()` types and the `vi.mock` family.
> `verify:dependency-seams` holds the registry to every `package.json` (no unregistered
> dependency, no stale entry), every seam glob to a file, the configs ESLint ignores to their
> seams, and the allowlist to the imports that still break the rule under an open migration.
> `local/wrapped-import`
> (`eslint-local-rules/wrapped-import.detect.mjs`, `error` over the same pattern, with the ui
> blocks of the workspace the config is built for) holds the names a wrapper owns. **Not
> covered:** a name no wrapper owns by the rule's detection (`Pressable`, `TextInput`, a block
> that stands in for a primitive under another name); a subpath of `react-native` or
> `expo-router`, a `vi.importActual` and an `import()` type, whose names are not read; a ui block
> added while an editor session runs, which its ESLint server reads only on restart; a
> specifier that is not a literal; triple-slash references and `declare module`; CSS and JSON
> (an Expo plugin); a vendor type a wrapper re-exports; and whether a seam is the right one,
> which is review.

---

## 24. One Rule Set for Every App and Package

Decision 52 of `docs/INIT_AND_HARNESS_PLAN.md`. The owner, 2026-11-15 (translated from Spanish):
"web and app have to be standardized, and any other project, that is, they have to always follow
the same rules and centralize it if possible, because if later plain React is added for example it
should follow the same rules".

**The rule sets live in `eslint.rules.mjs`; `eslint.config.mjs` only says where each applies.** A
rule set more than one workspace shares applies by pattern, never by naming a workspace. What a
framework forces applies to every app whose `package.json` declares that framework, in any
dependency field, and the React set to every app and package that declares `react`;
`scripts/eslint-config.detect.mjs` reads the `package.json` of every workspace under `apps/` and
`packages/` once, when the config loads, and a manifest it cannot parse fails the load, naming
the file. The gates that walk the apps (`verify:allowlist-freshness`, `verify:maps`,
`verify:tests`) read the same workspace list.

| Rule set                                                        | Applies to                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `BASE_RULES`, `FILENAME_RULES`                                  | every TypeScript file of `apps/*/**` and `packages/*/**`        |
| The Node globals of a package                                   | `packages/*/**`                                                 |
| `UI_FOLDER_CASING_RULES` (§12)                                  | every app: the block folders of its `src/components/ui/`        |
| The styling pillar (§22)                                        | every app: `apps/*/src/**`                                      |
| Logic-in-hook, suffix contract, adapter purity, test overrides  | every file of their suffix or folder (`**/*.component.tsx`, …)  |
| `local/dependency-seam` (§23)                                   | every JavaScript and TypeScript file of `apps/*/**` and `packages/*/**` |
| `REACT_RULES`, the JSX parser, the browser globals              | every app and package that declares `react`                     |
| The Next.js block: `@next/next` rules, Node globals, the App Router and middleware file names, async server screens, `next-env.d.ts` ignored | every app that declares `next` |
| The Expo block: `expo` rules, React Native globals, the jsx-a11y relaxations, the Expo Router file names | every app that declares `expo` |

**What stays scoped to one workspace**, because it is that workspace's own:

- `packages/core/src`: `local/core-import-boundary`, the domain layer importing nothing external.
- `packages/tokens/src`: literal values are allowed, since the tokens are their source.
- `packages/supabase/src/types.ts`: ignored, since its generator owns its key order.
- `packages/tooling`: the Node globals of its `.mjs` modules, shared with the root scripts.

**A new app inherits every rule with no config change.** Add its folder under `apps/` with a
`package.json`: the shared rule sets reach it by pattern, and declaring `react`, `next` or `expo`
brings that framework's block. Nothing in `eslint.config.mjs`, `eslint.rules.mjs` or the rules
under `eslint-local-rules/` names an app.

> Status: **test.** The fixture apps under `eslint-local-rules/__fixtures__/apps/` are linted
> through the config `eslint.config.mjs` builds for that folder (`createConfig`), as files of
> `apps/<fixture>/`: a plain React app is refused for a violation of each shared family (base,
> React, filename and folder, styling pillar, logic-in-hook, suffix contract, dependency seam),
> and one app declaring `next` and one declaring `expo` get their framework's block
> (`pnpm verify:lint-rules:test`). A case also fails when the config or a rule names a folder
> under `apps/`. **Not covered:** a package that declares `next` or `expo` gets no framework
> block, by design; and a React Native package gets the React set without the Expo block's
> jsx-a11y relaxations.

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

**Shared tooling lives in `@app/tooling`** (decision 46 of `docs/INIT_AND_HARNESS_PLAN.md`). A
script more than one workspace imports, such as the Vitest base and sequence or the process-tree
kill, is a module of `packages/tooling`, declared as a `workspace:*` devDependency and imported by
name. A root `scripts/` file is a repository gate, and no workspace imports it. Turborepo hashes
`@app/tooling` into the tasks of every workspace that declares it, and the root configs the tasks
read are `globalDependencies` in `turbo.json`, so editing them invalidates the cached results.

Pre-commit hook runs `lint-staged` (ESLint + Prettier on staged `.ts/.tsx`).
Commit-msg hook enforces conventional commits via commitlint.
