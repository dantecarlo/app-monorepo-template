# Tasks: 2026-11-15-tests-in-blocks

- [x] T1 — `verify:tests` requires each test in its own unit's folder's `__tests__/` with the unit's stem (a route test, `<route>.route`), keeps the presence check and its exemptions, and refuses a frozen exception without a reason or one that exempts nothing; `scripts/verify-tests.test.mjs` plants each violation, RED first · Requirements: none · Commit: 5aa035c
- [x] T2 — `scripts/move-tests-into-blocks.mjs` and `pnpm tests:into-blocks`: `git mv` into the own `__tests__/`, the Expo route rename, the relative specifiers of a moved test and the citations of its old path rewritten, the unplaceable listed, a second run moving nothing; `scripts/move-tests-into-blocks.test.mjs`, RED first · Requirements: none · Commit: 0f9af9e
- [x] T3 — the codemod run over the template; the tests it cannot place moved or frozen by hand; the Vitest, ESLint, knip and package configs follow; every suite runs the same tests before and after · Requirements: none · Commit: 2c2c185
- [x] T4 — the rule taught: `docs/code-standards.md` § 6 and § 9, the skills, `docs/architecture/web.md`, `docs/architecture/mobile.md`, `docs/maps/global-map.md`, `docs/harness.md`, `docs/e2e.md` and `AGENTS.md` · Requirements: none · Commit: 34c562a
- [ ] T5 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-15-tests-in-blocks/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CONN-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
