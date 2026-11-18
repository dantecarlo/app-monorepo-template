# Tasks: 2026-11-18-eslint-by-pattern

- [ ] T1 — `scripts/eslint-config.detect.mjs`: the apps and the frameworks each declares, read from their `package.json`, with `verify:dependency-seams` reading the workspace folders and the dependency fields from it; its cases in `eslint-local-rules/eslint-config.cases.mjs`, a pin of the gate's dependency fields, and the turbo and manifest entries · Requirements: SEAM-10 · Commit: —
- [ ] T2 — `eslint.config.mjs` and `eslint.rules.mjs`: every shared block by pattern, the framework blocks by declaration, the styling scopes over every app; the fixture apps `fixture`, `fixture-next` and `fixture-expo` with their cases, seen red against today's config; the identical-output proof against the base · Requirements: SEAM-09, SEAM-10 · Commit: —
- [ ] T3 — `docs/code-standards.md` § 24 and its § 21 row, `docs/harness.md`, `docs/maps/global-map.md` and `docs/architecture/shared.md` · Requirements: none · Commit: —
- [ ] T4 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/dependency-seams/spec.md` and the folder moved to `openspec/changes/archive/2026-11-18-eslint-by-pattern/` · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
