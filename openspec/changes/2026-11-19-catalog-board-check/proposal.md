# Proposal: the architect checks the catalog pull request against the board before the owner merges it

> **Status:** open

## Why

`2026-11-18-catalog-merge-message` sent the PO's closed ticket catalog pull request to the
architect's merge queue, merged on the owner's word, and its assumption A2 held it to none of a
ticket's Ready to merge conditions: no QA session checks it
(`openspec/changes/archive/2026-11-18-catalog-merge-message/proposal.md`). So nothing compares
the rows it adds with the board before the owner is asked: `refine-ticket` § Merge queue asks the
owner as soon as the pull request reaches the head of the queue
(`.claude/skills/refine-ticket/SKILL.md:150`). A row whose title, target version or closing pull
request differs from its board page would reach the default branch on the owner's word alone,
and the catalog is the only record a closed ticket keeps in the repository.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-19 (translated from Spanish), relayed by Certifipago's Arquitecto session, confirming
  A1 and A3 of `2026-11-18-catalog-merge-message` as written and A2 with one addition: "I approve
  under your control"

The addition to A2, as relayed, verbatim:

> The catalog PR needs no QA session, but before the architect asks the owner to merge it, the architect runs board:check against the PR's branch and checks that each added catalog row matches its board page (id, title, version and closing PR), and comments that check on the PR.

`board:check` is a script of Certifipago's own board adapter. The template ships no board
script: its board operations are the commands the project layer's adapter declares
(`.claude/skills/ticket-flow/SKILL.md:43`). The template's counterpart is those operations,
`read` and `read version`, run on every ticket the pull request adds a row for.

## What changes

- **The architect checks the catalog against the board.** `refine-ticket` § Merge queue, before
  it asks the owner for the closed ticket catalog pull request: `read` every ticket the pull
  request adds a catalog row for, from its branch, on the board through the adapter; check that
  each added row matches its board page in id, title, target version and closing pull request;
  and comment the check on the pull request, each row and match or mismatch. The owner's ask
  names that comment. The catalog pull request still needs no QA session.
- **A mismatch goes back to the PO** instead of to the owner (assumption A1 below).
- **The check.** `scripts/verify-skills.mjs` holds `refine-ticket` § Merge queue to state the
  board check, with one case in `scripts/verify-skills.test.mjs`, written first and seen red.
- **The docs.** The `verify:skills:test` row of `docs/harness.md` names the statement; the
  `refine-ticket` description and its entry in `.claude/skill-registry.md` follow.

## Assumptions

- **A1 — a mismatch goes back to the PO.** The relay says that the architect checks and comments
  the check; it does not say what follows a mismatch. A pull request with a row that does not
  match its board page is not asked for: the architect `comment`s the mismatch on the ticket or
  release ticket that links the pull request, where the PO commented its link, messages the PO
  `<id> question` (the release ticket's id for a release), and the pull request waits in the
  queue until the PO sends its catalog line again, when the check runs again. The change adds no
  message line: `<id> question` already goes from any session to the owner of the answer, and the
  PO owns the rows.
- **A2 — the fields checked.** The relay names id, title, version and closing PR. The check
  compares those four; a catalog row also carries the ticket's type and the day it closed
  (`.claude/skills/po-ticket/SKILL.md:90`), which it does not compare.

## Out of scope

- **A check of the procedure.** No runner drives a session, so whether an architect reads each
  ticket, compares its row and comments the result stays a procedure; those scenarios say
  `Not covered`. The structural check proves only that § Merge queue states it.
- **What the PO does with a returned catalog pull request.** `po-ticket` § Step 6 — Record the
  closed tickets says nothing of a correction, and `po-ticket` is outside this change's edit
  surface; it is a follow-up.
- **Certifipago's own skills.** Carrying the change there is a parity hand-off.
- **The open question Q1 of `2026-11-18-catalog-merge-message`**, who brings a catalog pull
  request current (F61), stays open.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-31 modified.
  - TICKET-31 now also has the architect check each row the catalog pull request adds against its
    board page before it asks the owner, comment the check on the pull request, and send a
    mismatch back to the PO; the structural check holds `refine-ticket` § Merge queue to state it.
  - TICKET-25 is unchanged: it already holds the catalog pull request to the owner's word, and
    TICKET-31 owns what the catalog pull request owes.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
