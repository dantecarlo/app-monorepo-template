# Tasks: 2026-11-14-agents-router

- [x] T1 — `verify:instruction-entry` with its test and `scripts/gate/scratch.mjs`, RED first on a planted CLAUDE.md; the gate and its test inside `validate`; owned by `core`; `docs/harness.md` § 3c, `docs/code-standards.md` § 21, `docs/maps/global-map.md` and the "Validation gate" prose of `AGENTS.md` name it · Requirements: none · Commit: 7668b33
- [x] T2 — `.codex/config.toml` with `project_doc_max_bytes = 65536` and `scripts/codex-budget.test.mjs`, RED first on an oversized `AGENTS.md` fixture; `codex-budget:test` inside `validate`; owned by `core`; the same four docs name it · Requirements: none · Commit: 8f8ce71
- [x] T3 — `AGENTS.md`: the LAWs, de-branded, and the Router, one table per phase routing every shipped skill, in place of "Agent skills"; `verify:english` and `codex-budget:test` green on it · Requirements: none · Commit: 48ddfc0
- [x] T4 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-agents-router/` as the last commit · Requirements: none · Commit: 7ded5e3

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
