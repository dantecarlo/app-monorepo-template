# Proposal: the ticket branch check reads the project's ticket identity

> **Status:** archived — 2026-11-17

## Why

`scripts/verify-ticket-branch.mjs` hardcodes the ticket identity. It accepts only an id that is
a number or an upper-case key and a number, only the branch types `feature`, `fix`, `tech` and
`chore`, and only a branch that carries a slug (`scripts/verify-ticket-branch.mjs:35`,
`scripts/verify-ticket-branch.mjs:48`). A project whose board writes another id, or whose
branches start with the Conventional Commit type, is refused on every branch. The contract
disagrees with the check, too: `ticket-flow` § Ticket identity maps each ticket type to a
Conventional Commit type, but the branch must still start with the ticket type.

Certifipago's Arquitecto session found it while adopting the ticket flow. Its finding, relayed
to this session on 2026-11-17:

> `verify-ticket-branch` refuses every Certifipago ticket branch, because it hardcodes the
> shapes. It accepts only an id that is a number or a key like `PROJ-42`, and only the types
> feature/fix/tech/chore. Our ids are `TASK-<slug>` and our branches use the Conventional Commit
> type (`feat/TASK-min-app-version-app`). That matches your own type-to-commit-type mapping, so
> the check and the mapping disagree.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-16 at 12:23, relayed by the Certifipago - Arquitecto session (translated from Spanish):
  "all of this ... needs its own skill or subagent, and it can be decoupled, and send it to the
  template so it also evaluates and executes it and sees whether it needs any change, and if it
  does, tells you, so both stay on par and the template is used as the base"

A flow that can be decoupled from one team's board cannot hardcode one board's ids. The owner
has authorized the ticket flow's build and its adaptability, as the parent session relays.

## What changes

- **The project layer declares the ticket identity in one block.** docs/process/ticket-flow.md
  § Ticket identity holds a fenced block with the info string `json ticket-identity`, a JSON
  object of exactly three fields:
  - `idPattern`: a regular-expression source for one ticket id, matched whole;
  - `branchTypes`: the prefixes a ticket branch may start with;
  - `slug`: `required` or `optional`.
- **The defaults are today's behaviour**, so the template and a project with no block are
  unchanged: `idPattern` `\d+|[A-Z][A-Z0-9]*-\d+` (a number, or a key like `PROJ-42`),
  `branchTypes` `feature`, `fix`, `tech` and `chore`, and a required slug.
- **The branch check reads it.** `scripts/verify-ticket-branch.mjs` reads the block from
  docs/process/ticket-flow.md under its working directory when that file exists; `--layer <path>`
  names another file, and `--id-pattern`, `--types` and `--slug` each replace one field. A
  malformed block, a second block, a layer `--layer` names that is not there, or a malformed flag
  is a finding that names the file or the flag and the field: the check never falls back to the
  defaults silently, and judges no branch under a broken identity.
- **The branch shape** is `<type>/<id>-<slug>`, or `<type>/<id>` when the slug is optional. The
  type is one of `branchTypes`; the id is what `idPattern` matches whole, anchored; the slug is
  lower-case kebab. When the slug is optional and the pattern matches everything after the type,
  the branch has no slug. The body names the id as `#<number>` for a number and as the id itself
  otherwise, matched literally, and an id counts as named only where no longer id the pattern
  accepts starts with it.
- **Certifipago's layer**, as an example and never a template default:
  `{"idPattern": "TASK-[a-z0-9]+(?:-[a-z0-9]+)*", "branchTypes": ["feat", "fix", "chore", "refactor", "perf", "test", "build", "ci", "docs"], "slug": "optional"}`.
  Its branch `feat/TASK-min-app-version-app`, with a body naming `TASK-min-app-version-app`,
  passes under it and is refused under the defaults.
- **The mapping is reconciled.** `ticket-flow` § Ticket identity says the branch prefix is
  whatever the layer's `branchTypes` allow: the ticket type by default, or the Conventional
  Commit type when the layer says so, as Certifipago's does. The commits always take the
  Conventional Commit type.
- **The skills and the template.**
  - `ticket-flow`: § Ticket identity describes the block, its fields and defaults, and the
    reconciled prefix; rule 2 points at it.
  - `ticket.template.md`: its branch line follows the layer's identity.
  - `process-intake`: Step 3 asks for the id shape, the branch prefix and the slug rule, and
    writes the block; `ticket-flow.template.md` ships it with the defaults.
  - `dev-ticket`: cuts the branch the layer's identity allows.
- **The structural check.** `scripts/verify-skills.mjs` holds the template's Ticket identity
  section to one `json ticket-identity` block that the branch check reads with no finding and
  whose fields are the branch check's defaults, `ticket-flow` § Ticket identity to name
  `branchTypes` and the block, and `process-intake` § Step 3 to name the block. The check, the
  mapping and the template then agree by a gate, not by review.
- **The docs.** The `verify:ticket-branch:test` and `verify:skills:test` rows of
  `docs/harness.md`, and its paragraph on `pnpm verify:ticket-branch`, say what they now judge.
- **Release branches** stay as they are: the release pull request, from the default branch to
  `production`, skips the check in the project's CI, as the template's Branch check in CI section
  says.

## Out of scope

- Writing Certifipago's own layer: the parent relays the block to Certifipago, which writes it
  through `process-intake`.
- Whether the type of a branch matches the ticket's type on the board: the check never reads the
  board, as before.
- `qa-ticket`'s checkout line and the `.claude/skill-registry.md` entry of `dev-ticket`, which
  show `<type>/<id>-<slug>`: they stay true under the defaults, and lie outside this change's
  edit surfaces.
- TICKET-09: the template's `validate` still runs the tests and never the check, and the
  requirement states no id or type shape.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-05, TICKET-06, TICKET-07 and TICKET-08
  modified; TICKET-21 and TICKET-22 added.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
