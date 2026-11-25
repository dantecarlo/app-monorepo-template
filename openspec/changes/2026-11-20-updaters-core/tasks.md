# Tasks: 2026-11-20-updaters-core

- [x] T1 — pin the update mode of `pnpm mcp:docs` (its lines and exit codes), then `--check` (exit 0 current, 2 out of date, 1 failed, nothing written) and `--json`, with a differential run against the base, then adapted to main's updater in the merge 47355ed · Requirements: MCP-13, MCP-14 · Commit: cd36ee8
- [x] T2 — the registry `.agents/contracts/updaters.json` with its `mcp-docs` entry, and `pnpm verify:updaters` (`scripts/verify-updaters.mjs`) with its companion, both steps of `.agents/contracts/gates.json` · Requirements: UPDATERS-01, UPDATERS-02, UPDATERS-03 · Commit: 611c5cc
- [x] T3 — `pnpm updaters:run` (`scripts/updaters/run.mjs`) with git, gh and the shell injected, its suite against fakes (the runner in 0bf2604), as a step of the gate registry · Requirements: UPDATERS-04, UPDATERS-05, UPDATERS-06, UPDATERS-07, UPDATERS-08, UPDATERS-09 · Commit: 6321432
- [x] T4 — `docs/harness.md` § 3i, `docs/mcp.md`, the manifest claims, the `docs/code-standards.md` § 21 rows, the global map rows, and the plan: F73, F33 folded into it, and the parity row · Requirements: none · Commit: 120b871
- [ ] T5 — `verify-report.md`, then the archive: the new living spec `openspec/specs/harness/updaters/spec.md`, MCP-13 and MCP-14 in `openspec/specs/harness/mcp/spec.md`, and the folder moved to `openspec/changes/archive/2026-11-20-updaters-core/` · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
