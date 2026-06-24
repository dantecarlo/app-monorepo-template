# Responsive layout checks

The template ships four Playwright viewport projects that verify the web app
renders without horizontal overflow and keeps interactive controls within the
viewport at every supported breakpoint.

---

## Viewport projects

| Project name | Width × Height | Represents |
|---|---|---|
| `mobile-390` | 390 × 844 | iPhone 14 / typical narrow phone |
| `tablet-768` | 768 × 1024 | iPad / landscape phone |
| `desktop-1280` | 1280 × 800 | Standard laptop |
| `desktop-1920` | 1920 × 1080 | Full HD monitor |

All four projects run only the `responsive.e2e.ts` spec (scoped via `testMatch`
in `playwright.config.ts`). The existing `chromium` project runs `home.e2e.ts`
and is not affected.

---

## Assertion approach

The responsive spec uses DOM-measurement assertions — no pixel-diff baselines
and no committed screenshot files. Assertions per viewport:

- **Horizontal overflow (hard-fail):** `document.documentElement.scrollWidth`
  and `document.body.scrollWidth` must both be at or below
  `document.documentElement.clientWidth` plus a 1-pixel tolerance.
  `clientWidth` excludes the OS scrollbar, so non-overlay scrollbars on
  desktop do not produce false failures.

- **Interactive controls within viewport:** every visible button and link
  (excluding `position: fixed` and `position: sticky` controls such as
  `FloatingNav`) must have a bounding rect where `right <= clientWidth + 1`
  and `left >= -1`.

- **Main landmark present:** the `<main>` element exists and has non-zero width
  and height at every viewport width.

No baselines are committed. The job catches real layout regressions through
structural measurements rather than visual diffs.

---

## Running locally

```bash
# Install Playwright browser (one-time)
pnpm exec playwright install chromium

# Build the web app first (webServer boots `next start`)
pnpm --filter @app/web build

# Run all four viewport projects
pnpm exec playwright test --project=mobile-390 --project=tablet-768 --project=desktop-1280 --project=desktop-1920

# Run a single viewport
pnpm exec playwright test --project=desktop-1280

# Open the HTML report after a run
pnpm exec playwright show-report
```

---

## CI job

The `responsive` job runs after `validate` passes. It builds the web app, then
runs all four viewport projects:

```yaml
responsive:
  needs: validate
  runs-on: ubuntu-latest
  continue-on-error: ${{ vars.RESPONSIVE_BLOCKING != 'true' }}
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
    - run: pnpm exec playwright test --project=mobile-390 --project=tablet-768 --project=desktop-1280 --project=desktop-1920
      env:
        E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report-responsive
        path: playwright-report/
```

---

## Advisory-to-blocking promotion

The `responsive` job ships as advisory: layout failures appear in the checks UI
and in the uploaded report but do not block the PR while `RESPONSIVE_BLOCKING`
is unset or `false`.

To promote to blocking, set the repository (or organization) variable
`RESPONSIVE_BLOCKING=true`. No code change or workflow edit is required — the
`continue-on-error` expression reads the variable at runtime.

A job is ready to promote after it has been green on the main branch for three
consecutive runs with no false positives. See
[docs/e2e.md](./e2e.md#promotion-to-blocking) for the shared promotion
criterion that applies to all four runtime jobs.
