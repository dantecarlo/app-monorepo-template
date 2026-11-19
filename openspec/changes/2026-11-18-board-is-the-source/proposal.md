# Proposal: the board is the source of every open ticket, and the general plan records closed tickets only

> **Status:** open

## Why

The ticket flow keeps a second copy of every open ticket in the repository. On every close the
PO refreshes the general plan "so the plan's done and pending lists match the board"
(`.claude/skills/po-ticket/SKILL.md:83`), and on every move of a target version it refreshes the
plan again (`.claude/skills/po-ticket/SKILL.md:75`, `.claude/skills/ticket-flow/SKILL.md:263`).
The general plan's PENDING section is a backlog of rows by phase or area
(`.claude/skills/general-plan/SKILL.md:117`), which in a project with a ticket flow restates the
open tickets the board already holds. Two copies of one ticket diverge, and nothing says which one
wins.

Certifipago merged #879 (`9de1f6d91`) on 2026-11-18, which makes the board the source of every
open ticket and records only closed tickets in its plan. Its Certifipago - Arquitecto session
relayed it in these words, verbatim but for the board field's Spanish name, translated as
Version:

> the board is the source of open tickets. board:create/move/comment/set-version/read take
> --apply; board:push is gone; the plan's catalog records only closed tickets
> (board:record-closed); every ticket carries a mandatory Version. The layer names the production
> branch "prod" and a single merge queue owned by the Architect session.

Its docs/process/ticket-flow.md now says "The board is the source of every open ticket, its
content included; nothing in the repository writes one", and that the PO records "the closed
tickets in docs/GENERAL_PLAN.md § Closed Ticket Catalog", in "one pull request per close or
release".

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-18 (translated from Spanish), as Certifipago's docs/GENERAL_PLAN.md § Sources and
  owners records it at `9de1f6d91`: "yes, let the board be the source, apply it, but when the
  ticket is closed it has to be updated"

Of the relay's other points, three are in the template already, from
`2026-11-18-ticket-flow-defaults`: the mandatory target version (TICKET-26), the production
branch the layer names (TICKET-27) and the single merge queue the architect owns (TICKET-25). The
`board:*` commands are Certifipago's own script adapter, kind (c) of `ticket-flow` § Board
operations; the template's board operations are the commands its layer's adapter declares, `gh`
by default. What carries over is the process.

## What changes

- **The board is the source of every open ticket**, its content included: the requirement, the
  acceptance criteria, the state, the target version, the plan and every comment. Nothing in the
  repository writes or mirrors an open ticket. `ticket-flow` § Board operations says so, and so
  does the process template's § Board adapter, which `process-intake` § Step 3 tells the team.
- **The PO records each closed ticket, and only then.** `po-ticket` § Step 6 becomes "Record the
  closed tickets": on `<id> closed` or `<release-id> released`, the PO reads each ticket that
  closed and adds one row per ticket to docs/GENERAL_PLAN.md § Closed Ticket Catalog, through
  `general-plan`, in one pull request per close or release. It never copies an open ticket into
  the plan.
  - A move of a target version changes the board only: `po-ticket` § Step 5 and `ticket-flow`
    § Target version no longer refresh the plan.
  - `ticket-flow`'s Closed and Released rows and its PO role say the PO records the closed
    tickets, where they now say it updates the plan.
- **The general plan knows the catalog when the project has a ticket flow**, which it has when
  docs/process/ticket-flow.md exists:
  - the `general-plan` skill and its template gain § Closed Ticket Catalog, one table row per
    closed ticket (`| Ticket | Title | Type | Version | Closed | Pull request |`), required with a
    ticket flow and dropped without one;
  - What's PENDING names no open ticket: it points at the board through
    docs/process/ticket-flow.md; the Path to Launch names target versions, never open tickets;
  - `validate-general-plan.mjs` reads process/ticket-flow.md beside the plan, and with it fails
    a plan that has no § Closed Ticket Catalog, a catalog with no table, or a PENDING section that
    does not name process/ticket-flow.md;
  - a project without a ticket flow keeps today's done and pending lists, and the validator judges
    it as it does today.
- **The checks**, each rule with a case written first and seen red:
  - `scripts/verify-skills.mjs` holds `ticket-flow` § Board operations and the process template's
    § Board adapter to name `source of every open ticket`, and `po-ticket` to have
    § Step 6 — Record the closed tickets, naming `§ Closed Ticket Catalog` and
    `one pull request per close or release`, with cases in `scripts/verify-skills.test.mjs`;
  - `validate-general-plan.mjs` gets its first tests, in
    `.claude/skills/general-plan/validate-general-plan.test.mjs`, which run it as a process over a
    scratch plan. `pnpm verify:skills:test` runs them with its own, since no script of
    `package.json` runs a test of `.claude/skills/`.
- **The registry.** The `po-ticket` entry of `.claude/skill-registry.md` follows its new
  description.

## Out of scope

- **A board check.** The template ships no script adapter (`ticket-flow` § Board operations,
  kind (c)), so no gate reads the board, and nothing checks that the plan names no open ticket or
  that the catalog lists every closed one. Both stay procedures; their scenarios say
  `Not covered`. This corrects the note of TICKET-26 that a board check would come with this
  change.
- **Certifipago's scripts**: `board:create`, `board:move`, `board:comment`, `board:set-version`,
  `board:read`, `--apply`, `board:record-closed` and the removal of `board:push`. They belong to
  its own adapter.
- **The mandatory version, the production branch and the merge queue.** They are in the template
  already (TICKET-25, TICKET-26, TICKET-27).
- **docs/process/.** The template has no layer of its own; `process-intake` writes one per
  project from its template.
- **`docs/harness.md`, `docs/maps/global-map.md` and `openspec/README.md`.** They describe what
  `verify:skills:test` judges and what each spec governs, and lie outside this change's edit
  surface; the parent session updates them.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-18 and TICKET-26 modified; TICKET-28,
  TICKET-29 and TICKET-30 added.
  - TICKET-18 refreshes the general plan on every move of a target version; a move changes the
    board only.
  - TICKET-26 says a board check comes with this change; none does.
  - TICKET-28 makes the board the source of every open ticket, TICKET-29 has the PO record each
    closed ticket in the plan's catalog, and TICKET-30 has the general plan of a project with a
    ticket flow carry that catalog and name no open ticket.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
