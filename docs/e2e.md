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
# Build web first (webServer boots `next start`, not the dev server)
pnpm --filter @app/web build

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

E2E runs as a separate job after the `validate` job passes. The job builds the
web app, then runs Playwright against the local production server — `webServer`
in `playwright.config.ts` boots `next start` so the built output is always used.

```yaml
jobs:
  e2e:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.9
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install --with-deps chromium
      - run: pnpm --filter @app/web build
      - run: pnpm dlx playwright test
        env:
          E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

For the responsive multi-viewport job, see [docs/responsive.md](./responsive.md).

---

## Runtime smokes

Two additional CI jobs run independently of `pnpm validate` and are never part
of the offline gate:

**mobile-export** — runs `expo export --platform all` and asserts that Hermes
bundles exist for both iOS and Android platforms. A missing bundle fails the
job. This is the primary check that Metro bundling works end-to-end for both
platforms.

**web-render** — builds the Next.js web app and boots `next start` on port 3000,
then probes `http://localhost:3000/` and asserts HTTP 200 plus a known
server-rendered marker in the response body. Tears down the server afterwards.

Both jobs run in parallel with the `validate` job (no `needs` dependency) so
bundle failures surface immediately without waiting for the full validation run.
Run them locally with:

```bash
pnpm smoke:mobile   # expo export + bundle assertion
pnpm smoke:web      # next build + next start probe
```

---

## Promotion to blocking

All four runtime jobs (mobile-export, web-render, e2e, responsive) ship as
advisory initially — `continue-on-error: true` in CI. A job is promoted to
blocking in branch protection after it has been green on the main branch for
three consecutive runs. This is a behavior-based criterion, not a calendar date.
See [docs/responsive.md](./responsive.md) for the `RESPONSIVE_BLOCKING` variable
that controls the responsive job independently.

---

## File naming convention

E2E spec files use the `.e2e.ts` suffix to distinguish them from unit tests
(`*.test.ts`) and the verify scripts. The suffix is not tracked by
`scripts/verify-tests.mjs`, so no sibling test is required for e2e specs.

---

## Playwright report dirs

`playwright-report/` and `test-results/` are gitignored. They are generated
locally and in CI but never committed.
