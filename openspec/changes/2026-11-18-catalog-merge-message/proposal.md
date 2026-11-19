# Proposal: the PO's closed ticket catalog pull request joins the architect's merge queue

> **Status:** open

## Why

On every close or release the PO records the closed tickets as rows of docs/GENERAL_PLAN.md
§ Closed Ticket Catalog, in one pull request per close or release, and comments its link on the
ticket (`.claude/skills/po-ticket/SKILL.md:88`, `.claude/skills/po-ticket/SKILL.md:91`). No line
of `ticket-flow` § Messages tells the architect about that pull request
(`.claude/skills/ticket-flow/SKILL.md:126`), and `refine-ticket` § Merge queue queues a pull
request only on QA's `<id> ready to merge, PR #<n>` (`.claude/skills/refine-ticket/SKILL.md:123`).
Nothing routes the catalog pull request to the one queue every merge into the default branch
waits in. `2026-11-18-board-is-the-source` found the gap, and the plan records it as F58
(`docs/INIT_AND_HARNESS_PLAN.md:530`); Certifipago has the same gap.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-18 (translated from Spanish), relayed by Certifipago's Arquitecto session: "Yes, I
  approve it"

The decision the owner approved, as relayed, verbatim:

> When the PO opens the closed-ticket catalog pull request for a close or a release, it sends the architect `<release-id> catalog ready to merge, PR #<n>` (for a single close outside a release, `<id> catalog ready to merge, PR #<n>`). That PR then joins the architect's merge queue like any other, merged on the owner's word.

## What changes

- **The messages.** `ticket-flow` § Messages gains two lines, PO to architect, in the table's
  own style: `<release-id> catalog ready to merge, PR #<n>` for the catalog pull request of a
  release, and `<id> catalog ready to merge, PR #<n>` for a single close outside a release. Its
  § Ready to merge says that the catalog pull request joins the queue and owes none of a
  ticket's three conditions.
- **The PO sends it.** `po-ticket` § Step 6 — Record the closed tickets messages the architect
  once the catalog pull request is open: the release form on `<release-id> released`, the id
  form on `<id> closed`. Its description and CONTRACT name both lines.
- **The architect queues it.** `refine-ticket` § Merge queue takes the catalog pull request into
  the queue like any other, in the merge order, merged on the owner's word, and its Step 6 sends
  both lines there. Its description gains both lines as triggers.
- **The checks.** `scripts/verify-skills.mjs` holds `ticket-flow` § Messages, `po-ticket`
  § Step 6 — Record the closed tickets and `refine-ticket` § Merge queue to name both lines, with
  one case per section in `scripts/verify-skills.test.mjs`, each written first and seen red.
- **The docs.** The `verify:skills:test` row of `docs/harness.md` names the three statements; the
  ticket skills check row of `docs/maps/global-map.md` and the `po-ticket` and `refine-ticket`
  entries of `.claude/skill-registry.md` follow.
- **The plan.** Row F58 of `docs/INIT_AND_HARNESS_PLAN.md` is marked done.

## Assumptions

The decision says that the PO sends the line, that the pull request joins the merge queue like
any other, and that it is merged on the owner's word. The procedure needs three more things the
decision does not say; each is marked here for the owner to confirm or correct:

- **A1 — the owner's word under every merge policy.** The catalog pull request is merged on the
  owner's word under `manual` and under `low-risk` alike, never without asking, although it
  changes only a prose document. The decision names the owner's word and no policy, and a
  `low-risk` merge is recorded on the ticket its pull request carries, which the catalog pull
  request does not have.
- **A2 — no ticket, so no ticket's conditions.** It carries no ticket of its own, so the Ready to
  merge conditions of a ticket (`ticket-flow` § Ready to merge) do not apply to it: no QA session
  holds it, none is told `<id> bring current` for it, and its merge moves no ticket to Done and
  sends no `<id> merged`. The project layer's merge gate, "the check the architect runs before
  each merge", still runs before it. An owner's no is commented on the ticket or release ticket
  that links it, where the PO commented its link (added at apply, with the step that needed it).
- **A3 — a merge that cannot run.** When the merge gate fails for it, or the host refuses its
  merge, the architect tells the owner in its own session, and the pull request waits in the
  queue. Who then brings it current is Q1.

## Open questions

- **Q1 — who brings a catalog pull request current.** Two closes in flight both add rows to one
  table, so the second catalog pull request can conflict once the first merges. QA brings a
  ticket's branch current; no session is named for the PO's branch. Until the owner decides, the
  architect tells the owner (A3).

## Out of scope

- **A check of the procedure.** No runner drives a session, so whether a PO sends the line or an
  architect merges the catalog pull request on the owner's word stays a procedure; those
  scenarios say `Not covered`.
- **Certifipago's own skills.** Certifipago has the same gap; carrying the change there is a
  parity hand-off, outside this change's edit surface.
- **`openspec/README.md`.** The units and the paths the spec governs do not change.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-31 added; TICKET-25 modified.
  - TICKET-31 has the PO send the catalog line once its pull request is open, `ticket-flow`
    § Messages carry both lines, and `refine-ticket` § Merge queue take the pull request into the
    queue, merged on the owner's word.
  - TICKET-25 keeps a queue of pull requests at Ready to merge and holds each to a ticket's
    conditions; it now also holds the catalog pull request, which owes none of them and is merged
    on the owner's word under every policy.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
