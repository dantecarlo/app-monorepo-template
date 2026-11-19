# Tasks: 2026-11-19-harness-follow-ups

- [x] T1 — F53: the rule cases of the import forms no case reached (`export *`, `import x = require()`, `import()` types, a template-literal specifier) and of a project path, and the gate cases of the registry and allowlist shape checks no case reached, each seen failing against the detection with its branch removed · Requirements: SEAM-04 · Commit: 6f1fcd7
- [x] T2 — F53: `verify:dependency-seams` names a `package.json` it cannot read or that is not an object, and then calls no entry stale; a source it cannot parse has its case; against a registry it refuses, it counts no file-package pair and never crashes · Requirements: SEAM-08 · Commit: 602953b
- [x] T3 — F55: `scripts/eslint-config.detect.mjs` reads every app and package; the React rule set reaches every workspace that declares `react`; `packages/tokens` loses its own block and runs with the Node globals; the fixture package `fixture-react`; the identical-findings proof against the base · Requirements: SEAM-10 · Commit: c110264
- [x] T4 — F55: `verify:allowlist-freshness` and `verify:maps` walk the apps of the workspace list, `verify:maps` takes `--root`, and `verify:tests` exempts the components and hooks of every app that declares `expo`; their cases, and a case that no gate walking the apps names one · Requirements: none · Commit: 5a88207
- [x] T5 — `docs/harness.md` and `docs/maps/global-map.md` where they name the config, the fixtures and the gates · Requirements: none · Commit: 9b1fef4
- [ ] T6 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/dependency-seams/spec.md` and the folder moved to `openspec/changes/archive/2026-11-19-harness-follow-ups/` · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
