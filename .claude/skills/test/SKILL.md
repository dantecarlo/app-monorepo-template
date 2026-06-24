---
name: test
description: >
  Write Vitest test files for React components, hooks, helpers, and Zustand stores.
  Aligned to docs/code-standards.md Rule 9 and the apps/*/src/test helper. Enforces:
  import from project test helper (never @testing-library/react directly), semantic
  queries only (getByRole, getByText — never data-testid), test() not it(), Given/
  pattern naming, constants from MSW mocks/domain not inline, MSW-first for HTTP,
  axe as 2nd test in every component describe block, one file per unit.
  DO NOT USE for auditing existing tests — use `fix-test` for that. For block-structure
  audits use `fractal-verify`. For post-generation harness use `validate-all`.
  USE WHEN: "write tests", "add tests", "create test file", "test this component/hook",
  "improve coverage", "test [name]".
---

# Create Test

> One test file per domain unit. Import testing utilities from the project test
> helper (`@/test/test.helper`), NOT directly from `@testing-library/react`.

---

## Pre-flight Checklist

Before writing ANY test:

1. Read the source file (component, hook, helper, or store).
2. Check if an MSW handler exists for any API the source calls
   (`src/test/mocks/handlers.ts`).
3. Check the global setup file (`src/test/setup.ts`) — never recreate global mocks.
4. Check existing tests in the same domain for established patterns.
5. Determine the test file type (A/B/C/D below).

---

## 9 Golden Rules (Rule 9 of `docs/code-standards.md`)

| #   | Rule                            | Wrong                                    | Right                                                          |
| --- | ------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| 1   | Import from project test helper | `from '@testing-library/react'`          | `from '@/test/test.helper'`                                    |
| 2   | Semantic queries only           | `getByTestId('btn')`                     | `getByRole('button', { name: /submit/i })`                     |
| 3   | `test()` not `it()`             | `it('should work')`                      | `test('given empty list, shows empty state')`                  |
| 4   | Descriptive naming              | `test('renders')`                        | `test('given disabled prop, button is not clickable')`         |
| 5   | Constants in domain files       | `const NAME = 'Item'` at top of test    | Import from MSW mocks → test constant → domain constant        |
| 6   | Destructure inside test()       | `const { getByRole } = component` at describe level | Destructure inside each `test()` block            |
| 7   | Global cleanup is global        | `vi.clearAllMocks()` in `beforeEach`     | Already in `afterEach` globally — do NOT add manually          |
| 8   | One test file per domain        | `Button.render.test.tsx` + `Button.hook.test.tsx` | `Button.test.tsx`                                |
| 9   | axe as 2nd test                 | Component test with no a11y check        | `expect(await axe(container)).toHaveNoViolations()` 2nd test  |

---

## Type A — Component Test

```typescript
import { describe, expect, test, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import { render, screen, fireEvent } from '@/test/test.helper'
import type { RenderResult } from '@/test/test.helper'
import { {ComponentName} } from '@/components/{ComponentName}'

describe('<{ComponentName} />', () => {
  let component: RenderResult

  beforeEach(() => {
    component = render(<{ComponentName} label="Test label" />)
  })

  test('renders the label correctly', () => {
    expect(component).toMatchSnapshot()
  })

  test('has no accessibility violations', async () => {
    const { container } = component
    expect(await axe(container)).toHaveNoViolations()
  })

  test('given click on button, calls onPress handler', () => {
    const { getByRole } = component
    const button = getByRole('button', { name: /test label/i })
    fireEvent.click(button)
    // assert handler called
  })

  test('given disabled prop, button is not clickable', () => {
    const { getByRole } = render(<{ComponentName} disabled label="Test" />)
    expect(getByRole('button', { name: /test/i })).toBeDisabled()
  })
})
```

- Snapshot first, axe second, behavior tests after
- `container` may ONLY be passed to `axe()`. Never `container.querySelector`

---

## Type B — Hook Test

```typescript
import { describe, expect, test, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@/test/test.helper'
import { use{Name} } from '@/{path}/use{Name}.hook'
// import QueryClientWrapper if the hook uses TanStack Query

describe('use{Name}', () => {
  beforeEach(() => {
    // testQueryClient.clear() — only when using QueryClientWrapper
  })

  test('given initial state, returns empty list', () => {
    const { result } = renderHook(() => use{Name}({ contextId: 'ctx-1' }), {
      // wrapper: QueryClientWrapper  // omit if no TanStack Query
    })
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  test('given successful fetch, returns adapted data', async () => {
    const { result } = renderHook(() => use{Name}({ contextId: 'ctx-1' }), {
      // wrapper: QueryClientWrapper
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // MSW intercepts the HTTP call — assert on MSW mock data values
  })

  test('given action called, updates state', () => {
    const { result } = renderHook(() => use{Name}({}))
    act(() => {
      result.current.add('new-item')
    })
    expect(result.current.items).toContain('new-item')
  })
})
```

MSW rule: if MSW has a handler for the endpoint, do NOT `vi.mock` the service —
let `QueryClientWrapper` + MSW handle it. Use `vi.mock` only for mutations,
forced error/loading states, or endpoints without MSW handlers.

---

## Type C — Zustand Store Test

```typescript
import { describe, expect, test, beforeEach } from 'vitest'
import { act } from '@/test/test.helper'
import { use{Name}Store } from '@/stores/{name}.store'

describe('use{Name}Store', () => {
  beforeEach(() => {
    use{Name}Store.setState(
      use{Name}Store.getInitialState?.() ?? { items: [] }
    )
  })

  test('given initial state, items is empty', () => {
    const { items } = use{Name}Store.getState()
    expect(items).toHaveLength(0)
  })

  test('given add(), appends item to list', () => {
    act(() => {
      use{Name}Store.getState().add({ item: { id: '1', label: 'Test' } })
    })
    expect(use{Name}Store.getState().items).toHaveLength(1)
  })

  test('given clear(), empties the list', () => {
    use{Name}Store.setState({ items: [{ id: '1', label: 'Test' }] })
    act(() => {
      use{Name}Store.getState().clear()
    })
    expect(use{Name}Store.getState().items).toHaveLength(0)
  })
})
```

---

## Type D — Adapter / Pure Function Test

```typescript
import { describe, expect, test } from 'vitest'
import { adapt{Domain} } from '@/services/{Domain}'
import { {Domain}MockA } from '@/test/mocks/{domain}.mock'

describe('adapt{Domain}', () => {
  test('given valid DTO, returns formatted ViewModel', () => {
    const result = adapt{Domain}({Domain}MockA)
    expect(result.id).toBe({Domain}MockA.id)
    expect(result.createdAtDisplay).toMatch(/\w+/)
  })

  test('given null optional field, field is empty string', () => {
    const dto = { ...{Domain}MockA, optional_field: null }
    expect(adapt{Domain}(dto).optionalField).toBe('')
  })
})

// Parameterized edge cases
test.each([
  ['2024-01-01T00:00:00.000Z', 'Jan 1, 2024'],
  ['2024-12-31T00:00:00.000Z', 'Dec 31, 2024']
])(
  'given created_at %s, createdAtDisplay is %s',
  (created_at, expected) => {
    expect(
      adapt{Domain}({ ...{Domain}MockA, created_at }).createdAtDisplay
    ).toBe(expected)
  }
)
```

---

## Semantic Query Priority

Use in this order:

1. `getByRole` — buttons, links, headings, checkboxes, textboxes, lists
2. `getByText` — visible text content
3. `getByLabelText` — form inputs with visible labels
4. `getByPlaceholderText` — input placeholder
5. `getByDisplayValue` — input current value

**NEVER**: `getByTestId`, `container.querySelector`, `document.querySelector`

---

## Constants Lookup Priority

When tests need data values:

1. MSW mock data files (`src/test/mocks/*.mock.ts`) — reuse existing mock objects
2. Domain constant file under a `// Test constants` section
3. Inline literal — LAST RESORT only for truly unique, one-off values

**NEVER** declare `const MOCK_*` arrays or objects at the top of a `.test.tsx` file.

---

## Common Mistakes

1. Importing directly from `@testing-library/react`
2. Using `getByTestId` or `data-testid`
3. Declaring module-level `const MOCK_*` constants in test files
4. Using `vi.mock` for a service that MSW already handles
5. Adding `vi.clearAllMocks()` in `beforeEach` (it's already global)
6. Destructuring `getByRole` at the `describe` level instead of inside `test()`
7. Multiple test files for one domain unit
8. Missing axe accessibility assertion as second test in component describe blocks
9. Using `it()` instead of `test()`
