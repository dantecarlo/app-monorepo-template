---
name: fix-test
description: >
  Migrate or repair an existing test file to current template conventions: mock-audit
  flow (vi.mock vs MSW), fix wrong import source (@testing-library/react → project
  test helper at @/test/test.helper), remove data-testid, migrate inline constants,
  fix describe-level destructuring, remove redundant clearAllMocks, add missing axe,
  merge multi-file-per-domain, migrate it() to test(). Reports findings before
  making changes. Aligned to docs/code-standards.md Rule 9.
  USE WHEN: "fix test", "migrate test", "update test to current patterns",
  "test uses wrong pattern", "repair test file", "test is broken after refactor".
---

# Fix Test

> Read the source file and the test file before making any change.
> Report all findings first, then fix in one pass.

---

## Pre-flight

1. Read the test file completely.
2. Read the source file being tested (component, hook, helper, or store).
3. Check the global setup file (`src/test/setup.ts`) for existing global mocks.
4. Check MSW handlers (`src/test/mocks/handlers.ts`) for API endpoints the source calls.
5. Check MSW mock data files (`src/test/mocks/*.mock.ts`) for available data objects.
6. Run the Mock Audit Flow (below).

---

## Mock Audit Flow

```
Does the test have vi.mock('@/services/...') or vi.mock('@/lib/...')?
├── YES → Does MSW already have a handler for this endpoint?
│   ├── YES → Does the test use QueryClientWrapper?
│   │   ├── YES → Is vi.mock needed for a specific override?
│   │   │   ├── YES (error state, forced loading, mutation, empty list) → KEEP vi.mock
│   │   │   └── NO (just returns data MSW would return anyway) → REMOVE vi.mock
│   │   └── NO → KEEP vi.mock (no MSW integration without QueryClientWrapper)
│   └── NO → KEEP vi.mock (no MSW handler exists)
└── NO → No action needed for this vi.mock
```

### Keep vi.mock when

- Mutation functions (create, update, delete) — MSW does not trigger `onSuccess` callbacks
- Forced loading or error state testing
- Endpoints that have no MSW handler
- Per-test response variations that `server.use()` cannot express

### Remove vi.mock when

- MSW handler exists AND `QueryClientWrapper` is used AND the mock just returns
  the same data MSW would return automatically

---

## 8 Issues to Fix

### Issue 1 — Wrong Testing Library Import

```typescript
// ❌ Direct import
import { render, screen } from '@testing-library/react'

// ✅ Via project test helper
import { render, screen } from '@/test/test.helper'
import type { RenderResult } from '@/test/test.helper'
```

---

### Issue 2 — data-testid in Source or Test

```typescript
// ❌ Source
<button data-testid="submit-btn">Submit</button>

// ❌ Test
getByTestId('submit-btn')

// ✅ Source — meaningful semantic element
<button type="submit">Submit</button>

// ✅ Test — semantic query
getByRole('button', { name: /submit/i })
```

---

### Issue 3 — Local Constants at Module Level

```typescript
// ❌ Declared at top of test file
const MOCK_ITEM_ID = 'item-123'
const MOCK_ITEMS = [{ id: '1', label: 'Item' }]

// ✅ Lookup priority:
// 1. Import from MSW mock data files (src/test/mocks/*.mock.ts)
// 2. Domain constant file — add under a // Test constants section
// 3. Inline literal ONLY for truly unique, one-off values
```

---

### Issue 4 — Query Destructuring at describe Level

```typescript
// ❌ Stale reference — captured before test-specific state is set
describe('<Component />', () => {
  let component: RenderResult
  beforeEach(() => { component = render(<Component />) })
  const { getByRole } = component // wrong — stale

  test('...', () => {
    expect(getByRole('button')).toBeVisible()
  })
})

// ✅ Destructure inside each test()
test('...', () => {
  const { getByRole } = component // fresh reference
  expect(getByRole('button')).toBeVisible()
})
```

`let component: RenderResult` at describe level is fine. Destructuring
query results at describe level is not.

---

### Issue 5 — Redundant vi.clearAllMocks() in beforeEach

```typescript
// ❌ Redundant — already in afterEach globally in src/test/setup.ts
beforeEach(() => {
  vi.clearAllMocks()
})

// ✅ Remove it entirely
// NOTE: testQueryClient.clear() IS required manually when using QueryClientWrapper
```

---

### Issue 6 — Missing testQueryClient.clear() for QueryClientWrapper

```typescript
// ❌ Missing — query cache bleeds between tests
describe('use{Name}', () => {
  test('...', () => {
    renderHook(() => use{Name}(), { wrapper: QueryClientWrapper })
  })
})

// ✅ Add it
beforeEach(() => {
  testQueryClient.clear()
})
```

---

### Issue 7 — Missing axe Accessibility Test

```typescript
// ❌ Component test missing a11y assertion
describe('<ItemCard />', () => {
  test('renders correctly', () => { expect(component).toMatchSnapshot() })
  test('given click, does X', () => { ... })
})

// ✅ axe as second test, right after snapshot
import { axe } from 'vitest-axe'

describe('<ItemCard />', () => {
  test('renders correctly', () => { expect(component).toMatchSnapshot() })

  test('has no accessibility violations', async () => {
    const { container } = component
    expect(await axe(container)).toHaveNoViolations()
  })

  test('given click, does X', () => { ... })
})
```

Scope: applies to component render describe blocks only, not hook/helper/store tests.

---

### Issue 8 — it() Instead of test()

```typescript
// ❌
it('renders', () => { ... })
it('should show error', () => { ... })

// ✅
test('renders the item label', () => { ... })
test('given API error, shows error state', () => { ... })
```

---

## Post-Fix Checklist

- [ ] No `@testing-library/react` imports (except in the test helper file itself)
- [ ] No `getByTestId`, `findByTestId`, or `queryByTestId`
- [ ] No `data-testid` attributes in source files
- [ ] No module-level `const` for test data (or `MOCK_*` arrays)
- [ ] No redundant `vi.clearAllMocks()` in `beforeEach`
- [ ] `testQueryClient.clear()` present when `QueryClientWrapper` is used
- [ ] All `vi.mock` calls are justified (not duplicating MSW)
- [ ] Component render tests have axe as second test
- [ ] Query results destructured inside `test()` blocks
- [ ] All uses of `it()` replaced with `test()`
- [ ] Snapshot updated if component changed: `pnpm test -- --update-snapshots {Name}`
- [ ] All tests pass: `pnpm test`
