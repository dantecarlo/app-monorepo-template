# End-to-end testing

This template includes a zero-dependency Playwright harness. Tests live under
`e2e/` and are intentionally isolated from the monorepo's unit-test and
validation gates.

---

## Design decisions

| Decision                          | Rationale                                                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec playwright test`       | `@playwright/test` lives in the root `devDependencies`; all workspace packages share it via pnpm hoisting. `pnpm exec` resolves from the root `node_modules/.bin/` so any workspace cwd works. |
| `e2e/` excluded from tsconfig     | `playwright.config.ts` imports `@playwright/test`; TS resolver must not try to resolve it during normal typecheck.                                                                             |
| `e2e/` excluded from ESLint       | The flat config covers `apps/` and `packages/` only; e2e files use Playwright globals not registered there.                                                                                    |
| E2E excluded from `pnpm validate` | `pnpm validate` is the unit/integration gate (lint + typecheck + test + build + verify scripts). E2E requires a running server and is a separate stage in CI.                                  |

---

## Running e2e tests

```bash
# Build web first (webServer boots `next start`, not the dev server)
pnpm --filter @app/web build

# Run all e2e tests (Playwright downloads browsers on first run)
pnpm test:e2e

# Run with UI mode for interactive debugging
pnpm exec playwright test --ui

# Run a single spec file
pnpm exec playwright test e2e/home.e2e.ts
```

The `baseURL` defaults to `http://localhost:3000`. Override with `E2E_BASE_URL`
for staging or preview environments.

---

## Deterministic visual + a11y gates (Tier C/D)

Three tool-based checks replace the previous AI-judged "does the glass look
right / is it accessible" review. They run inside the `test:e2e` harness, never
inside `pnpm validate`.

### Glass computed-style (`e2e/glass.e2e.ts`)

Navigates to a page rendering `.glass-card`, reads `getComputedStyle`, and
asserts the exact recipe (locked in `e2e/glass.constant.ts`): standard
`backdrop-filter: blur(26px)`, fill `rgba(24, 27, 34, 0.42)`, `1px solid`
stroke `rgba(255, 255, 255, 0.1)`, and the three composed box-shadow layers.
The `-webkit-backdrop-filter` fallback is asserted from the RAW served
stylesheet bytes, because Chromium collapses the prefix into the standard
property at computed-style time. Fully deterministic — no baseline image.

> Note: `.glass-card` is authored with only the unprefixed `backdrop-filter`;
> Lightning CSS emits the `-webkit-` fallback automatically from the web app's
> `browserslist` (Safari floor). Hand-writing both makes the minifier collapse
> them to one declaration.

### Page-level axe (`e2e/axe.e2e.ts`)

Runs `@axe-core/playwright` against each key page (`e2e/axe.constant.ts`) and
asserts zero violations, with `color-contrast` and `aria-roles` called out as
load-bearing. This complements the component-level `vitest-axe` checks.

### Visual regression — opt-in (`e2e/visual.e2e.ts`)

Snapshots each key screen across breakpoints via `toHaveScreenshot`. It is
**opt-in** so font-render portability never blocks the always-on glass + axe
gates: the `visual` project is only included when `E2E_VISUAL=1`.

```bash
# Run visual regression against committed baselines
pnpm test:e2e:visual

# Regenerate baselines (after an intentional UI change)
pnpm test:e2e:visual:update
```

Baselines live in `e2e/visual.e2e.ts-snapshots/` and are OS-suffixed (e.g.
`-darwin.png`). They are committed. CI runs on a different OS/font stack, so a
container-matched baseline must be generated there (run the suite once with
`--update-snapshots` on the CI image and commit the resulting `-linux.png`
files), or the visual project stays advisory until baselines are matched.
`maxDiffPixelRatio` (1%) absorbs subpixel font hinting.

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
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm --filter @app/web build
      - run: pnpm exec playwright test
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
