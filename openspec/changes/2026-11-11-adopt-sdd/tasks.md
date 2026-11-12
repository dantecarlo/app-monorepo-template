# Tasks: 2026-11-11-adopt-sdd

- [x] T1 — `openspec/README.md`, `openspec/config.yaml` and the six templates, harvested from Certifipago `cda657025` without product text · Requirements: none · Commit: c4ab3d9
- [x] T2 — `verify:specs` with its cases and the helpers it imports (`scripts/gate/gate.mjs`), run first among the doc gates of `validate`; RED on a planted malformed spec · Requirements: none · Commit: bfa24ec
- [x] T3 — `report:spec-drift` with `scripts/git-free-env.mjs`, inside `validate` and never blocking; its cases prove a spec whose governed code moved is listed · Requirements: none · Commit: 985b8c4
- [ ] T4 — the `sdd` skill and its evals in `.claude/skills/sdd/`, with product names removed and its paths checked against this tree · Requirements: none · Commit: —
- [ ] T5 — `template.manifest.json`: the `sdd` capability in every preset, `openspec/changes/**` claimed by `template-maintainer`; `verify:manifest`, `:coverage` and `:test` green · Requirements: none · Commit: —
- [ ] T6 — docs: `docs/maps/global-map.md` rows for the new files, the plan's step T1a marked done, the parity ledger row closed · Requirements: none · Commit: —
- [ ] T7 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-11-adopt-sdd/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CONN-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
