# Tasks: 2026-11-14-tooling-package

- [ ] T1 — `packages/tooling`: `@app/tooling` with `vitest-sequence`, `vitest-package-base` and `process-tree`, their type declarations and tests, owned by the manifest and read by lint and knip · Requirements: none · Commit: —
- [ ] T2 — the five package configs build on `packageTestBase` and the two app configs take `testSequence`, each workspace declaring `@app/tooling`; Turborepo passes `VITEST_SEQUENCE_SEED` through · Requirements: none · Commit: —
- [ ] T3 — `scripts/smoke-web-render.mjs` stops its server through `signalProcessTree`; the root declares `@app/tooling`, and knip's `taskkill` exemption moves to the tooling workspace · Requirements: none · Commit: —
- [ ] T4 — `turbo.json` `globalDependencies` names the root files cached tasks read · Requirements: none · Commit: —
- [ ] T5 — `scripts/init-project.mjs` rewrites `@app/` under `scripts/` except `init-project.mjs` and `check-identity.mjs`, and its header names the extensions it rewrites · Requirements: none · Commit: —
- [ ] T6 — `docs/code-standards.md`, `docs/architecture/shared.md` and the plan (T1d, the parity row, K9, K10) · Requirements: none · Commit: —
- [ ] T7 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-tooling-package/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
