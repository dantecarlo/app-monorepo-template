# Tasks: 2026-11-16-ticket-flow

- [x] T1 — `scripts/verify-ticket-branch.mjs` with its test, `pnpm verify:ticket-branch` and `pnpm verify:ticket-branch:test` in `package.json`, the test wired into `validate`, and the manifest claims of both files · Requirements: TICKET-05, TICKET-06, TICKET-07, TICKET-08, TICKET-09 · Commit: 9f664ea
- [x] T2 — `scripts/verify-skills.mjs` with its synthetic cases in `scripts/verify-skills.test.mjs`, run by `pnpm verify:ticket-branch:test`, and the manifest claims of both files · Requirements: TICKET-01, TICKET-02, TICKET-03, TICKET-04, TICKET-14 · Commit: ac79232
- [x] T3 — the seven skills, `ticket.template.md`, `release.template.md` and `ticket-flow.template.md`, the target version and its two board operations, the check that the repository's seven skills pass, `.claude/skill-registry.md` and the manifest claims of the seven folders · Requirements: TICKET-01, TICKET-02, TICKET-03, TICKET-04, TICKET-10, TICKET-11, TICKET-12, TICKET-13, TICKET-14, TICKET-15, TICKET-16, TICKET-17, TICKET-18, TICKET-19 · Commit: 707114b
- [x] T4 — the `process` table of the `AGENTS.md` router, `docs/harness.md` and `docs/maps/global-map.md` · Requirements: none · Commit: 8156227
- [x] T5 — `verify-report.md`, then the archive: the living spec `openspec/specs/harness/ticket-flow/spec.md`, its manifest claim, its row in `openspec/README.md` § 2.1, and the folder moved to `openspec/changes/archive/2026-11-16-ticket-flow/` · Requirements: TICKET-01 to TICKET-19 · Commit: c2a0338, and the archive that moves this folder

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
