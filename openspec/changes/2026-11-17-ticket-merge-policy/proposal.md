# Proposal: the ticket flow follows the project's merge policy

> **Status:** open

## Why

The ticket flow keeps every merge on the owner's word: `ticket-flow` rule 4 says QA asks the
owner before merging, and `qa-ticket` Step 6 asks for each one
(`.claude/skills/ticket-flow/SKILL.md:167`, `.claude/skills/qa-ticket/SKILL.md:75`). Decision 38
of `docs/INIT_AND_HARNESS_PLAN.md` makes the merge policy a setting with two values, `manual` and
`low-risk`, and `/init` section 7 asks which one a project takes. A project that picks `low-risk`
gets a flow that ignores it: that is F41, and the open question Q1 of the living spec
harness/ticket-flow. The owner decided it on 2026-11-17: `manual` stays the default, with a human
in the loop, and `low-risk` exists for the project that chooses it.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-17 (translated from Spanish): "Let the init decide it; by default there is a human in
  the loop, but the option you mention, of merging directly, should exist"

## What changes

- **The policy lives in the project layer.** docs/process/ticket-flow.md, written by
  `process-intake`, records it; with none recorded, it is `manual`.
  - **`manual`, the default (a human in the loop).** QA asks the owner for each merge, as the
    skills say today.
  - **`low-risk`.** QA may merge without asking a pull request that is Ready to merge when every
    condition holds; a pull request that fails one waits for the owner, as under `manual`:
    - CI is green, there is no conflict, and the branch holds the default branch's current tip
      (TICKET-11);
    - its Risk line is `none`, or it changes only passive files;
    - it carries no irreversible step;
    - merges stay serialized, in the architect's order;
    - QA records on the ticket that it merged under `low-risk`, with the Risk line it relied on.
- **What never changes with the policy.** A merge to `production`, a deploy, a production
  migration, a store submission and every other irreversible step stay the owner's word under
  every policy (§ 5 rule 4 of `openspec/changes/archive/2026-11-16-ticket-flow/source-spec.md`).
- **The skills.**
  - `ticket-flow`: rule 4 states both policies, what `low-risk` allows and what no policy covers,
    and defines a passive file; the states table's Ready to merge and Done rows, the roles table's
    QA row, the architect's one exception and § Ready to merge say "on the owner's word, or under
    the `low-risk` policy".
  - `qa-ticket`: Step 6 reads the policy and merges without asking only when every `low-risk`
    condition holds; Step 7 records a `low-risk` merge on the ticket; its CONTRACT, `done_when`
    and description follow.
  - `process-intake`: its merge-policy question offers both policies, `manual` the default, and
    says what `low-risk` allows; the Merge policy section of `ticket-flow.template.md` ships
    `manual` and says what each policy allows and what neither covers.
  - `release-ticket`: says that no merge policy covers its steps, the hotfix's merges included.
- **The check.** `scripts/verify-skills.mjs` holds `ticket-flow` rule 4, `qa-ticket` Step 6,
  `process-intake` Step 3 and the template's Merge policy section to name both policies, and the
  template's Policy line to default to `manual`; `scripts/verify-skills.test.mjs` gains a case for
  each, built test first.
- **The docs.** The `verify:skills:test` row of `docs/harness.md` names what it now judges.

## Out of scope

- Whether a `low-risk` merge met its conditions: the procedure is prose a QA session follows, so
  its scenarios stay `Not covered`, with the reason, and no gate reads the board or a pull
  request.
- A merge gate or a harness config key (`delivery.mergePolicy`, items 4.1 and C3 of the plan): the
  ticket flow reads the policy from its project layer; the setting itself is Stage 4 and `/init`.
- The `AGENTS.md` router row and the `.claude/skill-registry.md` entry of `qa-ticket`, which say
  "on the owner's word": they stay true under the default, and lie outside this change's edit
  surfaces; the parent decides whether to reword them.
- Certifipago's own layer, which stays `manual` (decision 38); the parent relays rule 4 and the
  `qa-ticket` merge step to it.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-11 modified; TICKET-20 added; Q1 closed.
  TICKET-11 is the only requirement that states every merge is the owner's word; TICKET-16, the
  release on the owner's word, stays as it is and TICKET-20 states that no policy covers it.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
