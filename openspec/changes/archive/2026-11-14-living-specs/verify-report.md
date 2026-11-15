# Verify report: 2026-11-14-living-specs

> **Verified:** 2026-11-14 at `138078d`; the code the specs describe is `main` at `9afce2d`, which
> this change does not edit

## Scenarios

The deltas add 174 requirements in eight new specs. Each states behaviour the code on `9afce2d`
already has, so no test was written red: a scenario's proof is the test it names, run below. A
scenario no test proves says `Not covered` and why.

| Spec                | Requirements | Test citations `validate` runs | e2e citations | pgTAP citations | Not covered |
| ------------------- | ------------ | ------------------------------ | ------------- | --------------- | ----------- |
| packages/core       | 25           | 60                             | 0             | 0               | 16          |
| packages/cloudflare | 19           | 24                             | 0             | 0               | 7           |
| packages/i18n       | 10           | 1                              | 0             | 0               | 9           |
| packages/supabase   | 22           | 21                             | 0             | 13              | 15          |
| packages/tokens     | 13           | 4                              | 0             | 0               | 10          |
| packages/tooling    | 14           | 16                             | 0             | 0               | 7           |
| apps/web            | 36           | 87                             | 1             | 0               | 17          |
| apps/mobile         | 35           | 36                             | 1             | 0               | 30          |

How each delta was checked:

- A checker opened every backticked path and `path:line` the deltas cite and found each one, and
  found every test title byte for byte in the file it names: `OK` on all eight.
- With this report present, `verify-specs` checks every cited test file and title of the deltas
  itself (see the gate).
- Each writer re-opened the evidence of its requirements against the line that enforces it; where
  a document and the code disagree, the requirement states the code and the spec records an open
  question, and the plan lists the defects behind them as follow-ups F1 to F16.

## Gate

- `node scripts/verify-specs.mjs` with this report: exit 0, every cited test file and title of the eight deltas found (78 files).
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, at `138078d` (turbo 24 of 24 tasks; every Vitest and node:test suite the citations name ran green inside it).

## Not verified

- The two e2e citations (one in apps/web, one in apps/mobile): Playwright needs a running server,
  so they run in CI's `e2e` job, not in `validate`.
- The thirteen pgTAP citations of packages/supabase: the suite needs a live database, and this
  repository targets Supabase Cloud with no local stack, so none ran here. Follow-up F4 expects one
  of them to fail when it runs.
- Whether each requirement says all the code does: no gate reads that. It stays with the pull
  request review and with the `sync` mode of the `sdd` skill.
