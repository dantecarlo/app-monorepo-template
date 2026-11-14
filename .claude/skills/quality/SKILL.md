---
name: quality
description: >
  Code-quality audit (report-only) mapped to docs/code-standards.md rule numbers.
  Checks: arrow-only (flag function keyword), alias-only imports, I-prefix/{Name}Type/
  {Name}Enum naming, no-any, no magic values, single-object params, service+adapter
  pairing, barrel exports, file suffixes, no inline components, no && with numbers in
  JSX, aria-label on icon-only elements, English-only, max 500 lines. Cites rule numbers
  from docs/code-standards.md. Reports violations with file:line references. Does NOT fix.
  DO NOT USE for single-block structural audits — use `fractal-verify` for that.
  For post-generation harness use `validate-all` (this skill feeds its G-standards group).
  USE WHEN: "audit code", "check quality", "validate patterns", "check conventions",
  "code review for [file/dir]", "quality check [scope]".
---

# Code Quality Audit

> Reports violations. Does NOT fix. Use the appropriate skill to apply each fix.
>
> This skill audits repo-wide convention compliance mapped to `docs/code-standards.md`.
> For single-block structural audits (folder structure, service+adapter pairing within
> one block), use `fractal-verify` instead. For the full post-generation harness,
> run `validate-all` — this skill feeds its G-standards group.

---

## Audit Scope

- Single file: audit that file
- Directory: audit all `.ts` and `.tsx` files in the directory
- `all`: audit the full `src/` tree across both apps

---

## 13 Audit Rules

### Rule 1 — Arrow Only (docs/code-standards.md Rule 1)

```typescript
// ❌ function keyword
function formatDate(iso: string): string { ... }
export function ItemCard({ label }: IItemCard) { ... }

// ✅ Arrow const
const formatDate = (iso: string): string => { ... }
export const ItemCard = ({ label }: IItemCard) => { ... }
```

Flag: any `function` keyword outside configuration files or third-party callbacks.

---

### Rule 2 — Alias-Only Imports (Rule 2)

```typescript
// ❌ Relative imports (banned outside barrel index.ts)
import { helper } from '../helpers/app.helper'

// ✅ Alias imports
import { helper } from '@/helpers/app.helper'
```

Exception: `index.ts` barrel files may use `'./{Name}'` for local re-exports.

---

### Rule 3 — I-prefix / {Name}Type / {Name}Enum Naming (Rule 4)

```typescript
// ❌
interface ItemProps { ... }          // missing I prefix
type Status = 'active' | 'archived'  // missing Type suffix
enum ItemStatus { ... }              // missing Enum suffix

// ✅
interface IItemCard { ... }
type StatusType = 'active' | 'archived'
enum ItemStatusEnum { ... }
```

---

### Rule 4 — No `any` Type

```typescript
// ❌
const data: any = response
function process(input: any): void { ... }

// ✅
const data: unknown = response
const data: IItemDto = response as IItemDto
```

Flag: `: any` annotations, `as any` casts.

---

### Rule 5 — No Magic Values (Rule 7)

```typescript
// ❌ Hardcoded numbers / strings in logic
if (items.length > 50) { ... }
fetch('/api/items?limit=20')

// ✅ Named constants
if (items.length > QueryLimitsEnum.DEFAULT_PAGE_SIZE) { ... }
```

Exceptions: `0`, `1`, `-1`, empty string `''` in comparisons. `vi.fn()` in test files.

---

### Rule 6 — Single-Object Parameters (Rule 5)

```typescript
// ❌
const useItems = (limit: number, search: string) => { ... }

// ✅
const useItems = ({ limit, search }: IUseItems) => { ... }
```

Exceptions: React event handlers, array callbacks, third-party callbacks.

---

### Rule 7 — Service + Adapter Pairing (Rule 6)

Every `*.service.ts` in `src/services/<Domain>/` must have a corresponding
`<Domain>.adapter.ts`. Every `*.adapter.ts` must have a corresponding service.

```
Items/items.service.ts → Items/Items.adapter.ts  ✅
Orders/orders.service.ts → (no adapter found)    ❌
```

---

### Rule 8 — Barrel Exports (Rule 6 + Rule 12)

- Every component in `components/*/` should be re-exported from its `index.ts`.
- Every screen in `screens/*/` should have an `index.ts` barrel.
- Every service domain in `services/<Domain>/` must have an `index.ts` barrel
  that exports service + adapter only (never constants, types, or test utilities).

---

### Rule 9 — File Naming Conventions (Rule 3)

| Pattern    | Convention              |
| ---------- | ----------------------- |
| Component  | `Name.component.tsx`    |
| Screen     | `Name.screen.tsx`       |
| Hook       | `useName.hook.ts`       |
| Service    | `name.service.ts`       |
| Adapter    | `Name.adapter.ts`       |
| Types      | `Name.type.ts`          |
| Constants  | `Name.constant.ts`      |
| Styles     | `Name.style.ts`         |
| Helpers    | `name.helper.ts`        |
| Store      | `name.store.ts`         |
| Test       | `Name.test.tsx`         |

---

### Rule 10 — No Inline Component Definitions

```typescript
// ❌ Component defined inside another component's render body
export const ParentComponent = () => {
  const ChildRow = ({ item }: { item: IItem }) => <div>{item.label}</div>
  return <ChildRow item={items[0]} />
}

// ✅ Defined at module scope
const ChildRow = ({ item }: { item: IItem }) => <div>{item.label}</div>
export const ParentComponent = () => <ChildRow item={items[0]} />
```

Detection: PascalCase function/const inside another component's body.
Not a violation: inline arrow functions passed as props.

---

### Rule 11 — No `&&` with Numbers in JSX

```typescript
// ❌ Renders "0" when count is 0
{count && <Badge count={count} />}
{items.length && <List items={items} />}

// ✅ Explicit boolean
{count > 0 ? <Badge count={count} /> : null}
{items.length > 0 && <List items={items} />}
```

---

### Rule 12 — Missing `aria-label` on Icon-Only Interactive Elements

```typescript
// ❌ No accessible name
<button onClick={onDelete}><TrashIcon /></button>

// ✅
<button aria-label="Delete item" onClick={onDelete}><TrashIcon /></button>
```

---

### Rule 13 — English-Only Code (Rule 15)

Flag: non-English identifiers, function names, comments, or non-i18n string
literals in source files. Exception: translation JSON files.

---

## Audit Report Format

```markdown
# Code Quality Audit — {scope}

**Scope**: {file or directory}

## Summary

| Rule                          | Status | Violations |
| ----------------------------- | ------ | ---------- |
| 1. Arrow Only                 | ✅/❌  | {n}        |
| 2. Alias Imports              | ✅/❌  | {n}        |
| 3. Naming Conventions         | ✅/❌  | {n}        |
| 4. No any                     | ✅/❌  | {n}        |
| 5. No Magic Values            | ✅/❌  | {n}        |
| 6. Single-Object Params       | ✅/❌  | {n}        |
| 7. Service+Adapter Pairing    | ✅/❌  | {n}        |
| 8. Barrel Exports             | ✅/❌  | {n}        |
| 9. File Naming                | ✅/❌  | {n}        |
| 10. No Inline Components      | ✅/❌  | {n}        |
| 11. No && with Numbers        | ✅/❌  | {n}        |
| 12. aria-label                | ✅/❌  | {n}        |
| 13. English Only              | ✅/❌  | {n}        |

## Violations Detail

### Rule {N}: {Name} (docs/code-standards.md Rule {ref})

- `{file}:{line}` — {description}

## Recommendations

- Rule 1 violations → replace with arrow const
- Rule 2 violations → use `@/` or `@app/` alias
```

---

## Rule Applicability by File Type

| Rule                   | `.component.tsx` | `.hook.ts`  | `.test.tsx` | `.service.ts` | `.adapter.ts` | `.store.ts` |
| ---------------------- | :--------------: | :---------: | :---------: | :-----------: | :-----------: | :---------: |
| 1. Arrow Only          | ✅               | ✅          | ✅          | ✅            | ✅            | ✅          |
| 2. Alias Imports       | ✅               | ✅          | ✅          | ✅            | ✅            | ✅          |
| 3. Naming              | ✅               | ✅          | ✅          | ✅            | ✅            | ✅          |
| 4. No any              | ✅               | ✅          | ✅          | ✅            | ✅            | ✅          |
| 5. Magic Values        | ✅               | ✅          | ✅          | ✅            | ✅            | —           |
| 6. Single-Object Param | ✅               | ✅          | —           | ✅            | —             | ✅          |
| 7. Svc+Adapter         | —                | —           | —           | ✅            | —             | —           |
| 8. Barrels             | ✅               | —           | —           | —             | —             | ✅          |
| 9. File Naming         | ✅               | ✅          | ✅          | ✅            | ✅            | ✅          |
| 10. Inline Comps       | ✅               | ✅          | —           | —             | —             | —           |
| 11. && Numbers         | ✅               | ✅          | —           | —             | —             | —           |
| 12. aria-label         | ✅               | —           | —           | —             | —             | —           |
| 13. English            | ✅               | ✅          | ✅          | ✅            | ✅            | ✅          |
