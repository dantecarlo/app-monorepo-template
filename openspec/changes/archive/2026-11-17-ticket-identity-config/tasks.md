# Tasks: 2026-11-17-ticket-identity-config

- [x] T1 — `scripts/verify-ticket-branch.mjs` reads the ticket identity: the one `json ticket-identity` block of docs/process/ticket-flow.md under the working directory, or the file `--layer` names, with `--id-pattern`, `--types` and `--slug` over single fields and the defaults when there is no layer or no block; a malformed block, a second block, a missing `--layer` file or a malformed flag is a finding naming the file or the flag and the field; the branch and the body are judged under that identity, the id matched literally in the body; a case or a check per scenario in `scripts/verify-ticket-branch.test.mjs`, each seen red first · Requirements: TICKET-05, TICKET-06, TICKET-07, TICKET-08, TICKET-21 · Commit: 82f6a81
- [x] T2 — `scripts/verify-skills.mjs` holds the process template's Ticket identity section to one block equal to the branch check's defaults, `ticket-flow` § Ticket identity to name `branchTypes` and the block, and `process-intake` § Step 3 to name the block, with a case per rule in `scripts/verify-skills.test.mjs`; the skills follow: `ticket-flow` § Ticket identity and rule 2, `ticket.template.md`'s branch line, `process-intake` Step 3, the template's Ticket identity and Branch check in CI sections, and `dev-ticket`; and `docs/harness.md` · Requirements: TICKET-22 · Commit: fd7020c
- [x] T3 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/ticket-flow/spec.md`, and the folder moved to `openspec/changes/archive/2026-11-17-ticket-identity-config/` · Requirements: TICKET-05, TICKET-06, TICKET-07, TICKET-08, TICKET-21, TICKET-22 · Commit: d08c097, and the archive that moves this folder

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
