# Tasks: 2026-11-18-dependency-seams

- [x] T1 — `local/dependency-seam` and its detection (`eslint-local-rules/dependency-seam.detect.mjs`), the registry `.agents/contracts/dependencies.json` from the inventory at `6b1d1fc`, the frozen `eslint-dependency-seam-allowlist.json`, and the rule wired at `error` over `apps/*/**` and `packages/*/**` in place of the `no-restricted-imports` vendor patterns, with a differential run against them · Requirements: SEAM-02, SEAM-03, SEAM-04, SEAM-05, SEAM-06, SEAM-07 · Commit: 9f10e98
- [x] T2 — the fixture app `eslint-local-rules/__fixtures__/apps/fixture/`, linted through the real config as `apps/fixture/` · Requirements: SEAM-09 · Commit: 9f10e98
- [x] T3 — `pnpm verify:dependency-seams` (`scripts/verify-dependency-seams.mjs`, `scripts/dependency-seams.detect.mjs`) with its test, both run by `validate`; the manifest claims · Requirements: SEAM-01, SEAM-07, SEAM-08 · Commit: 552a1dd
- [ ] T4 — `docs/code-standards.md` § 23 and its § 21 rows, `docs/harness.md`, `docs/maps/global-map.md`, the `lib` skill and `AGENTS.md` § Conventions · Requirements: none · Commit: —
- [ ] T5 — `verify-report.md`, then the archive: the living spec `openspec/specs/harness/dependency-seams/spec.md`, its row in `openspec/README.md` § 2.1, and the folder moved to `openspec/changes/archive/2026-11-18-dependency-seams/` · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
