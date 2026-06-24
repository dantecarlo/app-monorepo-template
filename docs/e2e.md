# End-to-end testing

This template includes a zero-dependency Playwright harness. Tests live under
`e2e/` and are intentionally isolated from the monorepo's unit-test and
validation gates.

---

## Design decisions

| Decision | Rationale |
|---|---|
| `pnpm dlx playwright test` | Playwright runs as a zero-install peer. No `@playwright/test` in `devDependencies`. |
| `e2e/` excluded from tsconfig | `playwright.config.ts` imports `@playwright/test` via `dlx`; TS resolver must not try to resolve it during normal typecheck. |
| `e2e/` excluded from ESLint | The flat config covers `apps/` and `packages/` only; e2e files use Playwright globals not registered there. |
| E2E excluded from `pnpm validate` | `pnpm validate` is the unit/integration gate (lint + typecheck + test + build + verify scripts). E2E requires a running server and is a separate stage in CI. |

---

## Running e2e tests

```bash
# Start the dev server in a separate terminal first
pnpm --filter @app/web dev

# Run all e2e tests (Playwright downloads browsers on first run)
pnpm test:e2e

# Run with UI mode for interactive debugging
pnpm dlx playwright test --ui

# Run a single spec file
pnpm dlx playwright test e2e/home.e2e.ts
```

The `baseURL` defaults to `http://localhost:3000`. Override with `E2E_BASE_URL`
for staging or preview environments.

---

## CI integration

E2E must run as a separate job **after** the `validate` job passes. Suggested
GitHub Actions structure:

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: ATL_TEMPLATE_SELF=1 pnpm validate

  e2e:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm dlx playwright install --with-deps chromium
      - run: pnpm --filter @app/web build
      - run: pnpm dlx playwright test
        env:
          E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
```

---

## File naming convention

E2E spec files use the `.e2e.ts` suffix to distinguish them from unit tests
(`*.test.ts`) and the verify scripts. The suffix is not tracked by
`scripts/verify-tests.mjs`, so no sibling test is required for e2e specs.

---

## Playwright report dirs

`playwright-report/` and `test-results/` are gitignored. They are generated
locally and in CI but never committed.
