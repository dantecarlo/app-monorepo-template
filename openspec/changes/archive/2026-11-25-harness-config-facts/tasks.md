# Tasks: 2026-11-25-harness-config-facts

- [x] T1 — The facts in the schema and the gate: `.agents/contracts/harness-config.schema.json` declares `identity` (required), `vocabulary`, `stack`, `core` and `skills`; `scripts/verify-harness-config.mjs` reads the `array` type, `items` and `minLength`; the template's `.agents/harness.config.json` gains `identity` and two `stack` facts; each new case of `scripts/verify-harness-config.test.mjs` seen red first · Requirements: TICKET-34 · Commit: 3394b574
- [x] T2 — process-intake § Step 4 writes the project's own `identity`; `docs/harness.md` 3h, `docs/code-standards.md` § 21, `docs/maps/global-map.md`, and the F76 and parity rows of `docs/INIT_AND_HARNESS_PLAN.md` · Requirements: TICKET-34 · Commit: 2d28d762
- [x] T3 — `verify-report.md`, then the archive: the delta merged into `openspec/specs/harness/ticket-flow/spec.md`, the evidence lines of TICKET-20 remapped, and the folder moved to `openspec/changes/archive/2026-11-25-harness-config-facts/` · Requirements: TICKET-34 · Commit: bc372b48, and the archive that moves this folder

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
