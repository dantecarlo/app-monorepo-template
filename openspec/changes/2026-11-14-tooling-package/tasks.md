# Tasks: 2026-11-14-tooling-package

- [x] T1 — `packages/tooling`: `@app/tooling` with `vitest-sequence`, `vitest-package-base` and `process-tree`, their type declarations and tests, owned by the manifest and read by lint and knip · Requirements: none · Commit: 2ad057c
- [x] T2 — the five package configs build on `packageTestBase` and the two app configs take `testSequence`, each workspace declaring `@app/tooling`; Turborepo passes `VITEST_SEQUENCE_SEED` through · Requirements: none · Commit: 0bbe2b6
- [x] T3 — `scripts/smoke-web-render.mjs` stops its server through `signalProcessTree`; the root declares `@app/tooling`, and knip's root `taskkill` exemption goes, as knip finds the binary nowhere now · Requirements: none · Commit: 0b4385b
- [x] T4 — `turbo.json` `globalDependencies` names the root files cached tasks read · Requirements: none · Commit: 39705ec
- [x] T5 — `scripts/init-project.mjs` rewrites `@app/` under `scripts/` except `init-project.mjs` and `check-identity.mjs`, and its header names the extensions it rewrites · Requirements: none · Commit: 3c3a8c7
- [x] T6 — `docs/code-standards.md`, `docs/architecture/shared.md` and the plan (T1d, the parity row, K9, K10) · Requirements: none · Commit: 020e327
- [x] T8 — `turbo.json` runs the root `format:check` that `validate` names, which turbo never ran, and the two files it catches are formatted · Requirements: none · Commit: 6233979
- [x] T9 — correction after the independent verification: `init-project` keeps the tokens of its own test and renames inside the root `package.json` · Requirements: none · Commit: a325ffa
- [x] T10 — correction after the independent verification: the docs on the shuffle, the tree kill and the README tree · Requirements: none · Commit: 3f06f12
- [ ] T7 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-tooling-package/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
