---
name: pre-commit
description: >
  Semantic staged-diff audit beyond lint/tsc: BLOCKER/WARNING/INFO verdict over
  service+adapter pairing, sync-prop-to-state useEffect, inline components, naming
  (I-prefix, arrow-only, suffixes), magic values, aria-label, && with numbers in JSX,
  test conventions, silent prop drop, JSX prop spreading. Uses bat/rg for diff collection.
  DO NOT USE for post-generation full harness — use `validate-all` for that. `pre-commit`
  is the lighter pre-commit-time gate; `validate-all` is the comprehensive post-generation
  harness. For single-block structural audits use `fractal-verify`.
  USE WHEN: "pre-commit review", "audit staged changes", "check my diff before commit",
  "validate changes", "review before commit", "check staged files".
---

# Pre-Commit Review

> The mechanical formatter/linter runs in your commit hook (Prettier + ESLint +
> TypeScript). This skill adds the AI semantic judgment layer on top. Run it before
> `git commit`.
>
> This is a lighter pre-commit gate. For post-generation comprehensive validation,
> run `validate-all`. For single-block structure, use `fractal-verify`.

---

## Step 0 — Collect the Diff

```bash
# Prefer staged; fall back to working tree
git diff --cached --name-only | rg '\.(ts|tsx|md|json)$'
# OR if nothing staged:
git diff --name-only | rg '\.(ts|tsx|md|json)$'
```

Read each changed file with `bat {file}` (not `cat`). If no relevant files
changed, stop — nothing to review.

---

## Step 1 — Categorize Files by Dimension

| File pattern                       | Dimensions triggered                             |
| ---------------------------------- | ------------------------------------------------ |
| `**/components/**/*.component.tsx` | a11y, React patterns, naming, magic values       |
| `**/hooks/*.hook.tsx`              | React patterns, naming                           |
| `**/services/*.service.ts`         | service+adapter pairing, naming                  |
| `**/services/*.adapter.ts`         | service+adapter pairing, naming                  |
| `**/*.test.tsx`                    | test conventions                                 |
| `**/*.constant.ts`                 | naming, magic values                             |
| `**/*.type.ts`                     | naming (I-prefix, Type suffix, Enum suffix)      |
| `**/stores/*.store.ts`             | naming, selector export                          |

A file may trigger multiple dimensions.

---

## Step 2 — Check Each Active Dimension

### Dimension: service+adapter

- Every new service function → is there a corresponding adapter update?
- Every new adapter → is there a corresponding service?
- Service functions return DTOs only — no ViewModels, no formatted strings

### Dimension: React patterns

- No `useEffect` whose body is only `setX(propY)` — sync-prop-to-state anti-pattern
- No `useEffect` with empty deps that could be `useState(initial)`
- No inline component definitions inside render bodies
- No `function` keyword — arrow const only

### Dimension: naming

- Interface names must have `I` prefix: `interface IFoo` not `interface Foo`
- Type aliases must have `Type` suffix: `type StatusType`
- Enums must have `Enum` suffix: `enum ItemStatusEnum`
- Constants named by purpose, not value: `MAX_RETRIES` not `NUMBER_THREE`
- File names follow mandatory suffixes (`.component.tsx`, `.hook.tsx`, etc.)

### Dimension: magic values

- No hardcoded numbers in logic (outside `0`, `1`, `-1`)
- No hardcoded string literals that should be constants or i18n keys
- No inline Tailwind class strings in JSX

### Dimension: a11y

- Icon-only interactive elements must have `aria-label`
- `{count && <Component />}` where count is numeric renders "0"
- Interactive non-button elements must have `role` and keyboard handlers
- No JSX prop spreading (`{...props}` is banned, Rule 11)

### Dimension: test conventions

- No `getByTestId` or `data-testid`
- No direct `@testing-library/react` imports
- No module-level `const MOCK_*` in test files
- Component render describe blocks must have axe as second test
- No `vi.mock` duplicating an existing MSW handler
- No `it()` — use `test()` (Rule 9)

### Dimension: silent prop drop

- Wrapper components that accept loose props (e.g. `React.ComponentProps<'div'>`)
  without listing each prop explicitly risk silently dropping required behavior.
  Any wrapper updated in this diff — does its interface still list all supported props?

---

## Blocker vs Warning vs Info

**BLOCKER** — hard rule violation, must fix before commit:

- `data-testid` in source files
- `getByTestId` in test files
- `: any` or `as any`
- `from '@testing-library/react'` outside the test helper file
- New service function with no adapter (or no adapter usage at call site)
- `useEffect` whose body is only `setX(propY)` — sync-prop-to-state
- Interface without `I` prefix: `interface Foo` → `interface IFoo`
- Relative `'../'` import outside `index.ts`
- Component test file missing axe as second test
- `function` keyword for a component, hook, service, or adapter
- JSX prop spreading `{...props}`
- `it()` instead of `test()` in test files

**WARNING** — convention drift, should fix:

- Icon-only interactive element without `aria-label`
- `{count && <Component>}` where count is numeric
- Value-named constant (`NUMBER_FIVE`, `LENGTH_TEN`)
- New `*.constant.ts` with test fixtures that belong in the domain constant file
- `useEffect` with empty deps that initializes state (lazy `useState` is better)
- Inline Tailwind class string in JSX `className`

**INFO** — heads-up:

- New wrapper component added — remember to update the skill registry if it
  documents wrappers
- Large file approaching 500 lines — consider splitting

---

## Output Format

```
# Pre-commit review — {N} files reviewed

## Blockers (must fix before commit) — {count}
- [BLOCKER] src/screens/Foo/hooks/useFoo.hook.tsx:42
  useEffect whose only body is setCount(propCount) — sync-prop-to-state anti-pattern.
  Fix: Remove useEffect; derive the value or lift state.

## Warnings (should fix) — {count}
- [WARNING] src/components/Bar/Bar.component.tsx:88
  <button onClick={onDelete}> without aria-label — icon-only button.
  Fix: Add aria-label="Delete item".

## Info — {count}
- [INFO] New wrapper BazButton added — update skill registry if it documents wrappers.

## Verdict
BLOCKER — {count} blocker(s) above must be fixed before committing.
— OR —
WARNING — {count} warning(s) — address before merging, safe to commit if urgent.
— OR —
PASS — No blockers or warnings. Ready to commit.
```

---

## Note on Mechanical Checks

This skill does NOT replace the commit hook. The hook handles:
- Prettier formatting
- ESLint auto-fixable rules
- TypeScript compilation

This skill handles what the hook cannot:
- Semantic naming violations (I-prefix, arrow-only, suffix conventions)
- Architectural pairing rules (service+adapter)
- React anti-patterns (sync-prop-to-state, inline components)
- Accessibility labeling (aria-label on icon-only elements)
- Test convention compliance (axe, vi.mock audit, `test()` not `it()`)
