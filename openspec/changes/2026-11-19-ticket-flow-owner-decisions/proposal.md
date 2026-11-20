# Proposal: a Dropped state, and the architect records the closed ticket catalog

> **Status:** open

## Why

Two gaps of the ticket flow, rows F60 and F61 of `docs/INIT_AND_HARNESS_PLAN.md`
(`docs/INIT_AND_HARNESS_PLAN.md:536`, `docs/INIT_AND_HARNESS_PLAN.md:537`), and a third, F62,
that the second decision supersedes (`docs/INIT_AND_HARNESS_PLAN.md:538`).

- **F60 — no outcome for a ticket closed without delivery.** The flow's last state of a ticket is
  Closed, entered after Done or once its release is Released
  (`.claude/skills/ticket-flow/SKILL.md:98`), and the closed ticket catalog records every Closed
  ticket as a row with the pull request that closed it
  (`.claude/skills/po-ticket/SKILL.md:89`). A ticket another ticket superseded, or one the client
  withdrew, has no state to end in: Certifipago's PO closed TASK-i18n-seam as superseded, and the
  catalog then records it as delivered work.
- **F61 — the PO does repository work.** `po-ticket` § Step 6 — Record the closed tickets has the
  PO write the catalog rows in docs/GENERAL_PLAN.md, commit them on a branch and open a pull
  request (`.claude/skills/po-ticket/SKILL.md:83`), which its CONTRACT lists under `edits`
  (`.claude/skills/po-ticket/SKILL.md:116`). Nothing says who brings that pull request current
  when it conflicts with its base: the open question Q1 of `2026-11-18-catalog-merge-message`
  (`openspec/changes/archive/2026-11-18-catalog-merge-message/proposal.md:75`).
- **F62 — superseded.** `po-ticket` does not say what the PO does with a catalog pull request the
  architect sends back for a row that does not match the board
  (`openspec/changes/archive/2026-11-19-catalog-board-check/proposal.md`, its assumption A1).
  Once the architect writes the rows, nothing returns to the PO.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-19 (translated from Spanish), on F60, choosing the option "A state of its own", which
  read: "a new state, Dropped, apart from Closed. It is visible on the board, but it means
  changing the flow's 13 states, every board adapter and Certifipago's board."
- 2026-11-19 (translated from Spanish), on F61: "Better that the architect creates the PR and
  takes care of closing it; the PO should not do any code, or at least avoid it"

F62 needs no decision of its own: the plan records it as superseded by F61, "since the PO no
longer opens a catalog pull request".

## What changes

- **A Dropped state (F60).** `ticket-flow` gains a fourteenth state, Dropped, apart from Closed:
  a ticket closed without delivery, entered by the architect on the PO's word, with the GitHub
  label `ticket:dropped`. A new § Dropped says who decides and who moves it, from which states,
  the drop record the ticket carries, what the move does and how the catalog records it. The
  message `<id> dropped` goes from the PO to the architect, then from the architect to the
  ticket's dev and QA sessions.
  - `po-ticket` gains § Step 6 — Drop a ticket; `refine-ticket` gains § Drop a ticket;
    `dev-ticket` and `qa-ticket` stop on `<id> dropped` and remove their worktrees.
  - A dropped ticket keeps its target version as a record, and no release lists it:
    `ticket-flow` § Release stage, `refine-ticket` § Group a release, `release-ticket` Step 1 and
    `release.template.md` set it aside.
  - The template of the project layer gains a Dropped row in its States table.
  - The description of `ticket-flow` says "the fourteen states", and its living spec "the eleven
    of the build and the three of the release".
- **The architect records the closed ticket catalog (F61).** `refine-ticket` gains § Record the
  closed tickets: on a close, a drop or a release the architect writes each row from the ticket's
  board page, opens one pull request per close or release, queues it at once, brings it current
  itself when its base moves, checks every row against the board (TICKET-31's check stays) and
  merges it under the project's merge policy.
  - `po-ticket` loses § Step 6 — Record the closed tickets and the `edits` of its CONTRACT, and
    states that the PO does no repository work: it keeps the scope and the board.
  - The messages `<release-id> catalog ready to merge, PR #<n>` and
    `<id> catalog ready to merge, PR #<n>` go away (assumption A6).
  - `ticket-flow`'s states, roles and § Ready to merge, the process template's § Board adapter,
    `general-plan`'s SKILL.md and template and the validator's header comment name the architect
    as the writer of the catalog.
- **The catalog records a dropped ticket apart.** `general-plan`'s SKILL.md and its template add
  a `### Dropped tickets` table under § Closed Ticket Catalog.
- **The checks.** `scripts/verify-skills.mjs` holds the new statements, each with a case in
  `scripts/verify-skills.test.mjs` written first and seen red: the Dropped row of both states
  tables; `ticket-flow` § Dropped and its `Superseded by:` line; `<id> dropped` in `ticket-flow`
  § Messages, `po-ticket` § Step 6 — Drop a ticket, `refine-ticket` § Drop a ticket,
  `dev-ticket` § Changes requested and `qa-ticket` § Step 7 — When the architect writes back;
  `refine-ticket` § Record the closed tickets naming `§ Closed Ticket Catalog`,
  `one pull request per close or release` and `` `### Dropped tickets` ``; `refine-ticket`
  § Merge queue bringing the catalog pull request current itself; and no `edits:` in
  `po-ticket`. The cases of the PO's close step and of the two catalog lines go.
- **The docs.** The `verify:skills:test` row of `docs/harness.md`, the entries of the changed
  skills in `.claude/skill-registry.md`, and each changed description, within 1,024 characters
  with its `USE WHEN:` triggers updated.

## Assumptions

The decisions name the outcome. Every detail below is decided by this change, with its reason,
for the owner to confirm or correct:

- **A1 — the PO decides a drop, the architect moves it.** Scope is the PO's (`ticket-flow`
  rule 1), so only the PO decides that a ticket is dropped: a client's withdrawal reaches the
  flow through it, and a session that finds a ticket superseded proposes the drop on the ticket
  and asks the PO `<id> question`. The architect makes the move, as it makes Closed: it
  dispatches every state and keeps the merge queue a dropped ticket may sit in, and the PO,
  which keeps the scope and the board, moves no ticket past Backlog.
- **A2 — from which states.** Any state from Backlog to Ready to merge, while its pull request is
  unmerged. A hotfix only before Ready to merge, because from there a release ticket of its own
  lists it (`.claude/skills/refine-ticket/SKILL.md:218`). Never from Done or later, because a
  merged ticket is delivered and undoing it is a new ticket, and never a release ticket, whose
  tickets move version through the PO instead.
- **A3 — the message and what the move does.** One line, `<id> dropped`, in the shape of
  `<id> changes requested`: the PO to the architect, then the architect to the ticket's dev and
  QA sessions, when the ticket reached them; each removes its worktree, and the branch stays as a
  record. The architect closes the ticket's open pull request unmerged and takes it out of the
  merge queue, re-plans every ticket that depends on it, and, under the GitHub Issues adapter,
  closes the issue with `gh issue close <id> --reason "not planned"`, as it closes a Closed one
  with `gh issue close <id>`. The reserved files are free again, since Dropped is not in flight.
- **A4 — the drop record.** Before its message the PO comments on the ticket two lines,
  `Dropped:` with the reason (the client's words verbatim and dated when the client withdrew it)
  and `Superseded by:` with the id of the ticket that replaces it, or `none`. A comment, not a
  section of the ticket template: a decision on a ticket is a comment, never an edit of its body
  (`.claude/skills/ticket-flow/ticket.template.md:7`). The ticket keeps its target version as a
  record; no release lists it.
- **A5 — the catalog records it apart.** A dropped ticket is a row of a `### Dropped tickets`
  table under § Closed Ticket Catalog, `Ticket | Title | Type | Version | Dropped | Reason |
  Superseded by`, never a row of the delivered tickets' table. The board check compares a
  dropped row with its board page in id, title and target version, and with its drop record in
  reason and superseding ticket. A drop counts as a close: one pull request per close or release.
  `validate-general-plan.mjs` does not require the new table, so a plan written before this
  change, Certifipago's among them, keeps passing.
- **A6 — the two catalog lines go away, rather than change sender.** A message carries an event
  from one session to another. The architect now opens the catalog pull request and keeps the
  merge queue, so no other session needs the event: a line from the architect to the PO would
  announce repository work the PO no longer does and nothing in its procedure acts on, and a
  line from the architect to itself is no message.
- **A7 — the catalog pull request follows the merge policy.** The decision gives the architect
  its closing, so the catalog pull request is merged like a ticket's: on the owner's word under
  `manual`, and without asking under `low-risk`, where it qualifies by changing only a passive
  file, docs/GENERAL_PLAN.md, once its board check passes. This replaces A1 of
  `2026-11-18-catalog-merge-message`, which merged it on the owner's word under every policy; a
  `low-risk` merge is recorded on the ticket or release ticket it records.
- **A8 — the architect meets the Ready to merge conditions itself.** `low-risk` asks for CI
  green, no conflict and the default branch's current tip, and A2 of
  `2026-11-18-catalog-merge-message` held the catalog pull request to none of them. Now the
  architect brings it current itself, which answers that change's Q1: it merges the default
  branch into the catalog branch, never a rebase, keeps every row of both sides when the table
  conflicts, pushes unforced, and checks it against the board again. No QA session holds it, and
  its merge moves no ticket.
- **A9 — a mismatch is corrected by the architect.** A row that does not match its board page is
  rewritten from that page on the catalog branch and checked again; nothing goes back to the PO.
  This replaces A1 of `2026-11-19-catalog-board-check` and closes F62.
- **A10 — the PO is still told of a close and a release.** The architect still messages the PO
  `<id> closed` and `<release-id> released`: the PO owns the client's commitments, and the board
  shows them met. `po-ticket` § Step 7 — A close or a release reads the ticket on the board,
  records nothing in the repository, and answers the client's questions about the delivery from
  the board.
- **A11 — the ticket body is a scratch file.** `po-ticket` § Step 2 copies the ticket template
  to a file for `create`; it now says that the copy is a scratch file outside the repository, the
  one other place a PO could leave a file in the working tree.

## Out of scope

- **A check of the procedures.** No runner drives a session, so whether the PO decides a drop,
  the architect moves it and records the catalog, or a dev session removes its worktree stays a
  procedure; those scenarios say `Not covered`. The structural check proves only that each
  section states it.
- **A dropped release, and a hotfix at Ready to merge.** No release ticket is dropped (A2). A
  hotfix that should not ship once QA brought it to Ready to merge has no path to Dropped here.
- **A check of the dropped table by the plan's validator** (A5).
- **Certifipago's skills and board.** Its board gains the Dropped state and its skills the
  change through a parity hand-off, outside this change's edit surface.
- **`AGENTS.md` and `docs/maps/global-map.md`.** Their rows that name the PO's catalog work are
  outside this change's edit surface; the hand-off names them.
- **`openspec/README.md`.** The units and the paths the spec governs do not change.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-32 added; TICKET-01, TICKET-15,
  TICKET-25, TICKET-26, TICKET-28, TICKET-29, TICKET-30 and TICKET-31 modified.
  - TICKET-32: a ticket closed without delivery ends in Dropped, decided by the PO and moved by
    the architect, with its record, its message and its row apart in the catalog.
  - TICKET-01: fourteen states, the eleven of the build and the three of the release, and the
    § Dropped section.
  - TICKET-15 and TICKET-26: a dropped ticket keeps its version and no release lists it.
  - TICKET-25: the catalog pull request follows the merge policy, and the architect brings it
    current itself.
  - TICKET-28: the plan records a ticket once it is closed or dropped.
  - TICKET-29: the architect records each closed or dropped ticket, and the PO does no repository
    work.
  - TICKET-30: the plan's SKILL.md and template carry the dropped tickets' table.
  - TICKET-31: the architect opens the catalog pull request, queues it with no message, keeps it
    current and corrects a mismatched row itself.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
