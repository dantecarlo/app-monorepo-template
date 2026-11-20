# Proposal: the harness config, and the merge policy read from it

> **Status:** open

## Why

Decision 38 makes the merge policy "a setting, not a sentence" (`docs/INIT_AND_HARNESS_PLAN.md:589`),
and its parity row asks for `delivery.mergePolicy` in the harness config
(`docs/INIT_AND_HARNESS_PLAN.md:417`, Certifipago #759). Decision 40 makes the workflow a setting
too, `workflow.mode` in `.agents/harness.config.json` (`docs/INIT_AND_HARNESS_PLAN.md:456`,
`docs/INIT_AND_HARNESS_PLAN.md:591`), and phase P4 asks for the project's facts in one config file
with a contract schema (`docs/INIT_AND_HARNESS_PLAN.md:1414`); Stage 4 lists the merge-policy
setting in step 4.1 (`docs/INIT_AND_HARNESS_PLAN.md:298`).

Today no such file exists. The merge policy is a line of the project layer:
`ticket-flow` rule 4 says "The project layer records the merge policy"
(`.claude/skills/ticket-flow/SKILL.md:217`), the architect's merge queue asks "Which merge policy
does the project layer record?" (`.claude/skills/refine-ticket/SKILL.md:177`), and
`process-intake` writes it as the `Policy` line of the layer's Merge policy section
(`.claude/skills/process-intake/ticket-flow.template.md:70`). Nothing reads a value: an agent reads
a sentence.

The project's backend is not recorded anywhere either, and the database tests run one way only:
`test:db` is `supabase test db --linked` (`packages/supabase/package.json:22`).

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-20 (translated from Spanish): "Finish making all the changes … Finish what's missing"
- 2026-11-20 (translated from Spanish): "advance in parallel"
- 2026-11-20 (translated from Spanish), on the backend: the project "may or may not use Supabase;
  it can also have its own separate backend, and there we no longer put our hands"
- 2026-11-20 (translated from Spanish), on the database-test setup: "must be configurable"

## What changes

- **The harness config.** `.agents/harness.config.json` holds three sections: `workflow.mode`
  (`sdd` or `odd`, decision 40), `delivery.mergePolicy` (`manual` or `low-risk`, decision 38) and
  `backend` (`kind`: `supabase`, `own` or `none`; `databaseTests`: `linked`, `local` or `off`, for
  `supabase` only). The template ships `sdd`, `manual`, `supabase` and `linked`.
- **Its contract.** `.agents/contracts/harness-config.schema.json`, a JSON Schema, declares every
  section, setting, allowed value and default.
- **Its gate.** `pnpm verify:harness-config` holds the file to the schema: a missing or unparsable
  file or schema, a key the schema does not declare, a value it does not allow, a missing setting,
  a database-test mode under a backend other than `supabase`, a schema keyword the gate does not
  read, and a default outside its own values are each a finding. `verify:harness-config:test` is
  its companion, and both run in `pnpm validate`, after `verify:agent-context`.
- **The merge policy is read from it.** `ticket-flow` rule 4, `refine-ticket` § Merge queue and
  `process-intake` § Step 3 and § Step 4 name `delivery.mergePolicy` in
  `.agents/harness.config.json` where they named the project layer; the template's Merge policy
  section keeps its text, and its `Policy` line names the setting instead of recording a value.
  What each policy allows does not change.
- **The structural check follows.** `verify-skills` holds the four sections that name both
  policies to name `.agents/harness.config.json` too, and the template's `Policy` line to name the
  setting; the test of the schema holds its policies to the ones the ticket skills name, `manual`
  the default.
- **The prunes keep the file true.** The `sdd` prune sets `workflow.mode` to `odd`, and the
  `supabase` prune sets `backend.kind` to `none` and unsets `backend.databaseTests`, both through
  `patch-json` in `template.manifest.json`. The four new files belong to `core`.
- **Docs.** `docs/harness.md` gains the gate's row and a section on the file, which records that
  F57's database-test setting moves here once both have merged; `docs/code-standards.md` § 21 and
  `docs/maps/global-map.md` gain their rows.

## Out of scope

- The rest of the project facts of decision 13 and phase P4 (identity, vocabulary, stack, skill
  trees): Stage 4.2.
- Wiring the database-test mode: F57 (branch `fix/test-db-branch-migrations`) keeps its own
  setting in `packages/supabase/package.json`; it moves to `backend.databaseTests` once both have
  merged.
- A reader of `workflow.mode`: `/init` section 8 asks it (Stage 6, decision 40); the template runs
  SDD as `AGENTS.md` says.
- `/init` sections 7 and 8, which ask the merge policy, the workflow and the backend (Stage 6).
- Checking that the tree agrees with the file (a `supabase` backend with no `packages/supabase`,
  an `sdd` workflow with no `openspec/`).
- Moving a downstream project's `Policy` value from its layer into the file: by hand, when it
  adopts this change.

## Assumptions

- **A1.** The file is `.agents/harness.config.json`, as the brief, the parity row and decision
  40's row name it, not decision 13's `.agents/project.config.json`; the identity and vocabulary
  that decision gives it are Stage 4.2's.
- **A2.** The gate requires every section and setting the schema marks required, so the file
  states each one, while the skills keep "with none recorded, it is `manual`" for a project that
  has no file yet.
- **A3.** The names are `workflow.mode`, `delivery.mergePolicy`, `backend.kind` and
  `backend.databaseTests`; `databaseTests` takes F57's values, `linked` the default.
- **A4.** `databaseTests` is required under `supabase` and refused under `own` and `none`: the
  harness does not manage an own backend's tests ("there we no longer put our hands").
- **A5.** The `supabase` prune sets `backend.kind` to `none`; `/init` asks `own` or `none` later.
- **A6.** The `sdd` prune sets `workflow.mode` to `odd`, the only other workflow decision 40
  names.
- **A7.** The project layer keeps its Merge policy section, so a reader of the layer still finds
  the policy's rules, and its `Policy` line points at the setting; the layer never records a
  value of its own, so the two cannot disagree.
- **A8.** No check every project runs holds the template's own value, `manual`, since a project
  may pick `low-risk`; the schema's default and review hold it.
- **A9.** The schema is JSON Schema 2020-12 restricted to the keywords the gate reads, so the gate
  validates by the schema instead of restating its rules, and a keyword it does not read is a
  finding rather than a rule skipped in silence.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: modified TICKET-20, TICKET-24, TICKET-25,
  TICKET-31
