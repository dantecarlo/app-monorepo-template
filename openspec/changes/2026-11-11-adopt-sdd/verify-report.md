# Verify report: 2026-11-11-adopt-sdd

> **Verified:** 2026-11-12 at `e73ff32`

## Scenarios

This change adds no delta: the template has no living spec yet, and the harness it adds stays
unspecified (`openspec/README.md` § 2.1). Its proof is the tests and gates each task ran.

| Task | Commit    | Checks run                                                                                                                          | Result                                                                                                       |
| ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| T1   | `c4ab3d9` | manifest gates; `prettier --check`; a scan for product names                                                                        | green; no product text                                                                                       |
| T2   | `bfa24ec` | `verify:specs:test` before the gate existed, then after; a malformed spec planted in a scratch copy; `verify:specs`; manifest gates | red (module not found), then 41 of 41; the planted spec gave exit 1 with 4 findings, exit 0 once removed     |
| T3   | `985b8c4` | `git-free-env:test` and `report:spec-drift:test` before the modules existed, then after; `report:spec-drift` over a scratch repo    | red (module not found), then 4 of 4 and 9 of 9; the stale spec was listed and the report exited 0            |
| T4   | `2f1d4e7` | the skill's link and the paths and skills it names resolved; `evals.json` parsed; scans for product names and Spanish               | green; nine evals                                                                                            |
| T5   | `72301ed` | `verify:manifest`, `verify:manifest:coverage`, `verify:manifest:test`; an `openspec/specs/**` claim probed                          | green, 913 files owned once, 24 of 24; the empty claim fails as stale, so it waits for the first living spec |
| T6   | `e73ff32` | `verify:maps`; `prettier --check` on the map and the plan                                                                           | green; 235 map references resolve                                                                            |

The owner's quotes in the proposal were translated to English in `7e1b0a2`, under the rule of
2026-11-12 that the template is written in English, the i18n catalogs aside.

## Adaptations

What differs from Certifipago `cda657025`, each on purpose:

- Single-object params in the harvested scripts (`toPosix`, `renderFinding`, `git`), per this
  template's code standards.
- Output text names the `sdd` skill's `sync` mode instead of `sdd-steward`, and the pull request
  review instead of `verify:docs-freshness`; the skill drops `sdd-steward`, `verify:docs-freshness`,
  CodeGraph and `AGENTS.md § scaffold`, none of which this template has yet.
- Owner quotes are in English, translated and marked (owner rule of 2026-11-12, translated from
  Spanish: everything in the template is English; only the translation catalogs are Spanish).
- Tests only gain cases: a check that the cases fail against a blinded gate, and a run of the drift
  report over a scratch repository.
- The cases of `verify-specs.test.mjs` live in three modules (`verify-specs.fixtures.mjs`,
  `verify-specs.spec.cases.mjs`, `verify-specs.change.cases.mjs`) to keep every file under the
  500-line cap.

## Independent verification

One independent verifier (risk item 5: `validate` gains five steps): every task passes on behaviour;
malformed changes, malformed specs, a missing test file, a drifted spec and a decoy `GIT_DIR` were
all probed. One blocker: `verify-specs.test.mjs` held 535 lines against the cap of 500. Fixed in
`736a820` with four advisories: `engines.node` raised to `>=24.2.0`, the `sdd` capability's
`onAbsent` steps, `docs/harness.md` listing the spec gates, and `AGENTS.md` stating when a change
runs the SDD lifecycle. Left open: `.claude/skill-registry.md`, already stale before this change,
does not list `sdd`.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-12, at `9081ed9`, after the correction.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-12, at `e73ff32`. A first run at the same
  commit exited 1 in `knip` alone, because this checkout still held `.husky/pre-commit` with CRLF
  endings from before `.gitattributes` pinned it to LF; restoring the hooks from the index made
  `knip` green, and the second run passed every step.

## Not verified

- The `sdd` evals: no eval runner exists in this template yet, so the nine evals state what each
  mode must do and nothing grades them.
- That the skill and the gates behave on a real living spec: none exists until plan step T1b.
- The `sdd-steward` agent, which waits on the agent projector of plan step T2.
