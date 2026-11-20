# Tasks: 2026-11-20-process-reaper

- [ ] T1 — the contract `.agents/contracts/process-reaper.json` and its reader, and the pure core that plans which trees to end, with their tests and the manifest claim · Requirements: REAP-01, REAP-02, REAP-03, REAP-04, REAP-05 · Commit: —
- [ ] T2 — `runBounded`, the platform adapter that lists and ends processes, and the CLI `pnpm reap`, `pnpm reap:kill` and `pnpm reap:test`, the last in `pnpm validate` · Requirements: REAP-06, REAP-07, REAP-08, REAP-10 · Commit: —
- [ ] T3 — the `SessionStart` hook: the projection learns the event, `.agents/hooks.json` gains the reaper and `.claude/settings.json` is regenerated, with the session-start script and its tests · Requirements: REAP-09 · Commit: —
- [ ] T4 — the worktree pruner's bounded fetch runs through `runBounded`, so a fetch stopped at its bound ends its tree on Windows · Requirements: REAP-10 · Commit: —
- [ ] T5 — `docs/harness.md`, `docs/code-standards.md` § 21, `docs/maps/global-map.md`, and the F74 follow-up and parity rows of `docs/INIT_AND_HARNESS_PLAN.md` · Requirements: none · Commit: —
- [ ] T6 — `verify-report.md`, then the archive: the living spec `openspec/specs/harness/process-reaper/spec.md`, its row in `openspec/README.md` § 2.1 and its manifest claim, and the folder moved to `openspec/changes/archive/2026-11-20-process-reaper/` · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
