# Tasks: 2026-11-20-harness-config

- [x] T1 — The harness config, its schema and its gate: `scripts/verify-harness-config.mjs` holds `.agents/harness.config.json` to `.agents/contracts/harness-config.schema.json` (a missing or unparsable file or schema, an undeclared key, a value the schema does not allow, a missing setting, a database-test mode under a backend other than `supabase`, a schema keyword the gate does not read, a default outside its own values), each case of `scripts/verify-harness-config.test.mjs` seen red first against a gate that finds nothing; `verify:harness-config` and `:test` in `package.json` and `pnpm validate`; the four files in `core`, and the `sdd` and `supabase` prunes keeping the file true, in `template.manifest.json`; `docs/harness.md`, `docs/code-standards.md` § 21 and `docs/maps/global-map.md` · Requirements: TICKET-20 · Commit: 5e7b86d
- [x] T2 — The merge policy read from the harness config: `scripts/verify-skills.mjs` holds the four sections that name both policies to name `.agents/harness.config.json`, and the template's `Policy` line to name `delivery.mergePolicy` in it, each new case of `scripts/verify-skills.test.mjs` seen red first; `ticket-flow` rule 4 and its CONTRACT, `refine-ticket` § Merge queue and its CONTRACT, `process-intake` § Step 3, § Step 4 and its CONTRACT, and the template's Merge policy section name the setting where they named the project layer · Requirements: TICKET-20, TICKET-24, TICKET-25, TICKET-31 · Commit: 945d2a4
- [ ] T3 — `verify-report.md`, then the archive: the delta merged into `openspec/specs/harness/ticket-flow/spec.md`, the schema added to its `Governs` line, the evidence lines this change moved remapped, and the folder moved to `openspec/changes/archive/2026-11-20-harness-config/` · Requirements: TICKET-20, TICKET-24, TICKET-25, TICKET-31 · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
