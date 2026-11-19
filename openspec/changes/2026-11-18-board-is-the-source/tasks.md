# Tasks: 2026-11-18-board-is-the-source

- [x] T1 — The board is the source of every open ticket: `scripts/verify-skills.mjs` holds `ticket-flow` § Board operations and the process template's § Board adapter to name `source of every open ticket`, with a case per section in `scripts/verify-skills.test.mjs`; `ticket-flow` § Board operations; the process template's § Board adapter; `process-intake` § Step 3 · Requirements: TICKET-28 · Commit: 6e70579
- [x] T2 — The PO records each closed ticket: `scripts/verify-skills.mjs` holds `po-ticket` to § Step 6 — Record the closed tickets, naming `§ Closed Ticket Catalog` and `one pull request per close or release`, with its cases; `po-ticket` description, title, Steps 5 and 6 and CONTRACT; `ticket-flow`'s Closed and Released rows, its PO role and § Target version; the `po-ticket` registry entry · Requirements: TICKET-18, TICKET-29 · Commit: fdac48c
- [x] T3 — The plan validator reads a CRLF checkout: `validate-general-plan.mjs` reads CRLF as LF, with its first tests in `.claude/skills/general-plan/validate-general-plan.test.mjs`, which `pnpm verify:skills:test` runs · Requirements: TICKET-30 · Commit: f5e3467
- [x] T4 — The general plan knows the catalog: with process/ticket-flow.md beside the plan, `validate-general-plan.mjs` requires § Closed Ticket Catalog, its table and a PENDING section that names process/ticket-flow.md, with a test per rule and two that pin the old behaviour; `general-plan`'s SKILL.md and `general-plan.template.md` · Requirements: TICKET-30 · Commit: 7d329c0
- [ ] T5 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/ticket-flow/spec.md`, TICKET-26's note on a board check corrected, the evidence lines this change moved remapped, and the folder moved to `openspec/changes/archive/2026-11-18-board-is-the-source/` · Requirements: TICKET-18, TICKET-26, TICKET-28, TICKET-29, TICKET-30 · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
