---
name: mock
description: >
  Create an MSW v2 handler and corresponding mock data file for an HTTP endpoint.
  Three-step process: typed mock data as DTOs (never ViewModels, no real PII,
  reinforce scrubPII/PII_KEYS posture) → URL constant → handler registration in
  src/test/mocks/. Arrow-only handlers where applicable, alias imports.
  USE WHEN: "create MSW handler", "mock API endpoint", "add mock for [endpoint]",
  "MSW handler for [domain]", "new mock data for [resource]", "add test fixture for [name]".
---

# Create MSW Mock

> MSW v2 (`msw@2`). Handlers intercept fetch/XHR in tests and optionally in the browser.
> Three files, always in this order: mock data → URL constant → handler.
>
> Mock data files: typed as DTOs (raw API shape), never ViewModels. No real PII —
> use fake but plausible values. This aligns with the `scrubPII`/`PII_KEYS` posture
> in `@app/core`: sensitive fields should never appear in test fixtures or query keys.

---

## Do You Need a New Mock?

```
Does an MSW handler already exist for this endpoint?
├── YES → add new scenarios to the existing handler file
└── NO  → Does mock data for this domain already exist?
    ├── YES → add to the existing mock data file, then create the handler
    └── NO  → create both mock data file and handler (full 3-step)
```

---

## File Locations

```
src/test/
├── mocks/
│   ├── {domain}.mock.ts      # Step 1: Static mock data objects (DTOs)
│   ├── handlers.ts           # Step 3: All MSW handlers registered here
│   └── server.ts             # MSW server setup — do NOT modify unless adding a new domain
├── setup.ts                  # Global test setup
└── test.helper.ts            # Re-exports from @testing-library/react
```

---

## Step 1 — Mock Data (`mocks/{domain}.mock.ts`)

```typescript
import type { I{Domain}Dto } from '@/services/{Domain}/{domain}.type'

export const {Domain}MockA: I{Domain}Dto = {
  id: '{domain}-001',
  context_id: 'ctx-001',
  created_at: '2024-01-15T10:30:00.000Z',
  // All required fields — realistic but obviously fake values
  // No real emails, names, phone numbers, or identifiers
}

export const {Domain}MockB: I{Domain}Dto = {
  id: '{domain}-002',
  context_id: 'ctx-001',
  created_at: '2024-02-20T14:00:00.000Z',
}

// List for bulk test scenarios
export const {Domain}MockList: I{Domain}Dto[] = [
  {Domain}MockA,
  {Domain}MockB
]
```

Rules:
- Typed as the DTO interface (`I{Domain}Dto`) — the raw API shape MSW intercepts
- Named `{Domain}Mock{A|B|C}` for variants, `{Domain}MockList` for arrays
- No real personal data — no real emails, full names, phone numbers, or secret tokens
- Fields that appear in `PII_KEYS` (from `@app/core`) must be fake: use
  `'test@example.com'`, `'fake-token-xxx'`, not copied real values

---

## Step 2 — URL Constant

Add to the shared URL constant (create `src/test/mocks/msw.constant.ts` if absent):

```typescript
export const MOCK_URL = {
  // ...existing
  {DOMAIN}_LIST: '/api/{domain}',
  {DOMAIN}_DETAIL: '/api/{domain}/:id'
} as const
```

The path must match exactly what the service function calls.

---

## Step 3 — Handler (`mocks/handlers.ts` — add to the existing handlers array)

```typescript
import { http, HttpResponse } from 'msw'
import { MOCK_URL } from './msw.constant'
import { {Domain}MockList, {Domain}MockA } from './{domain}.mock'
import type { I{Domain}Dto } from '@/services/{Domain}/{domain}.type'

export const {domain}Handlers = [
  // GET list
  http.get(MOCK_URL.{DOMAIN}_LIST, () =>
    HttpResponse.json({Domain}MockList)
  ),

  // GET single
  http.get(MOCK_URL.{DOMAIN}_DETAIL, ({ params }) => {
    const mock = {Domain}MockList.find((m) => m.id === params.id)
    if (!mock) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(mock)
  }),

  // POST create
  http.post(MOCK_URL.{DOMAIN}_LIST, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const created: I{Domain}Dto = {
      id: '{domain}-new',
      ...body
    } as I{Domain}Dto
    return HttpResponse.json(created, { status: 201 })
  })

  // Error scenario override — use server.use(...) in individual tests for this
]

// Add to the handlers array in handlers.ts:
// export const handlers = [...existingHandlers, ...{domain}Handlers]
```

---

## Override Handlers in Individual Tests

For error states or per-test variations:

```typescript
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { MOCK_URL } from '@/test/mocks/msw.constant'

test('given API error, shows error state', async () => {
  server.use(
    http.get(MOCK_URL.{DOMAIN}_LIST, () =>
      new HttpResponse(null, { status: 500 })
    )
  )
  // render and assert the error state
})
```

MSW v2 automatically restores default handlers after each test when
`server.resetHandlers()` is in `afterEach` in the global setup.

---

## DO vs DON'T

| DO                                            | DON'T                                          |
| --------------------------------------------- | ---------------------------------------------- |
| Type mock data as DTOs (`I{Domain}Dto`)       | Type mock data as ViewModels                   |
| Use `HttpResponse.json()` (MSW v2 API)        | Use `res(ctx.json(...))` (MSW v1 — deprecated) |
| Register handlers in a central `handlers.ts`  | Import handlers individually in each test file |
| Use `server.use(...)` for per-test overrides  | Mutate the global handler for edge cases       |
| Realistic-looking but obviously fake data     | Real names, emails, tokens, or PII             |
| Fake values for fields in `PII_KEYS`          | Copy real sensitive values into test fixtures  |
| One mock data file per domain                 | One giant mock file for all domains            |
