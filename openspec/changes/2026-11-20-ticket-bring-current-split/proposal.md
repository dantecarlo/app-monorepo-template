# Proposal: QA brings a pull request current once, and the architect every later time

> **Status:** open

## Why

Today every bring-current of a pull request waiting in the merge queue goes back to its QA. After
each merge the architect messages the next pull request's QA `<id> bring current`
(`.claude/skills/refine-ticket/SKILL.md:209`, `.claude/skills/ticket-flow/SKILL.md:348`), so QA
keeps its worktree while the ticket waits at Ready to merge
(`.claude/skills/qa-ticket/SKILL.md:96`) and brings the branch current again once per merge ahead
of it (`.claude/skills/qa-ticket/SKILL.md:108`). The last pull request of a queue of five comes
back to its QA up to four times, and every round waits on a session that has moved on to other
tickets. A hotfix that falls behind the production branch goes back to its QA the same way
(`.claude/skills/refine-ticket/SKILL.md:285`).

Certifipago already splits it (its docs/process/ticket-flow.md, lines 113 to 117, at its
origin/master 4fd4f00): the area's QA brings a branch current once, before Ready to merge, and the
Arquitecto merges master into each pull request's branch before its merge, pushes it unforced and
waits for the merge gate. What it does not state is where the architect does it, which the owner
decided on 2026-11-20.

The owner's words, verbatim:

- 2026-11-20 (translated from Spanish), in Certifipago's Arquitecto session, at 08:14: "Go ahead,
  apply it this way, and tell the template to adopt it."
- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"

The rule the 2026-11-20 answer approves, as Certifipago's Arquitecto relayed it:

- **QA's bring-current.** The area's QA brings a pull request current with main once, before
  Ready to merge. This is unchanged.
- **Every later bring-current belongs to the architect.** That is any bring-current needed because
  the pull request fell behind main while it waited in the merge queue. The architect merges main
  into the branch from a spare worktree of its own, detached, and never QA's or the dev's; pushes
  unforced, in the background; and merges when the gate passes.
- **QA and the dev stay free.**
- **A merge that brings code conflicts goes back to the dev.**

## What changes

- **The architect brings a queued pull request current (`refine-ticket` § Merge queue).** A new
  step 6, Bring it current: from a spare worktree of its own, never QA's or the dev's, added once
  with `git worktree add --detach`, the architect checks the branch out detached, merges the base
  into it (never a rebase), pushes it with `git push origin HEAD:<branch>`, unforced, in the
  background, and takes it from step 2 once the gate passes. Steps 2 and 5 bring a ticket's pull
  request current there instead of messaging its QA. § Group a release does the same for a hotfix
  behind the production branch (A4). Step 6 — Dispatch passes on the architect's own
  `<id> changes requested`; the CONTRACT gains the move `Ready to merge → Changes requested` and
  loses the message `<id> bring current`.
- **A code conflict goes back to the dev session.** The architect aborts the merge, comments the
  conflict on the ticket, moves the ticket to Changes requested, takes it out of the queue and
  messages its dev session `<id> changes requested` (A2); a red check goes back the same way (A3).
  `dev-ticket` § Changes requested says who may have pushed to the branch and how the dev session
  resolves a conflict.
- **QA and the dev stay free (`qa-ticket`).** QA brings a pull request current once, in Step 5,
  and removes its worktree at hand-off (A8); Step 7 loses `<id> bring current`, and the CONTRACT
  loses the move `Ready to merge → Changes requested`.
- **The contract (`ticket-flow`).** § Messages loses `<id> bring current` (A1) and its
  `<id> changes requested` row names the architect's own line to the dev session; the states
  table names the architect among the sessions that enter Changes requested, from Ready to merge;
  § The architect dispatches, § Roles and § Ready to merge say who brings a pull request current
  when.
- **The checks.** `scripts/verify-skills.mjs` holds `refine-ticket` § Merge queue to name
  `a spare worktree of its own, never QA's or the dev's`, `--detach`,
  `git push origin HEAD:<branch>`, `in the background` and
  `a code conflict goes back to the dev session`, and forbids `<id> bring current` in
  `ticket-flow`, `refine-ticket` and `qa-ticket`, and `Ready to merge → Changes requested` in
  `qa-ticket`; each rule's case in `scripts/verify-skills.test.mjs` is written first and seen red.
- **The docs.** The `verify:skills:test` row of `docs/harness.md`, the descriptions of
  `refine-ticket` and `qa-ticket` (the trigger `<id> bring current` leaves `qa-ticket`), each
  within 1,024 characters, and their entries in `.claude/skill-registry.md`.

## Assumptions

The owner's rule names the outcome. Every detail below is decided by this change, with its
reason, for the owner to confirm or correct:

- **A1 — `<id> bring current` goes away.** QA's one bring-current runs inside its own check
  (`qa-ticket` Step 5), before its first `<id> ready to merge, PR #<n>`, so no message asks for
  it; every later one is the architect's own work, and a line from the architect to itself is no
  message, as A6 of `2026-11-19-ticket-flow-owner-decisions` said of the catalog lines. The line's
  second use, a pull request whose CI must only run again, becomes the architect's re-run through
  the host.
- **A2 — a conflict reaches the dev as `<id> changes requested`.** The architect aborts the merge
  (`git merge --abort`) and pushes nothing, comments the conflict on the ticket (the files in
  conflict and the base commit), moves the ticket from Ready to merge to Changes requested, takes
  it out of the queue and messages the dev session `<id> changes requested` directly: a message
  carries no file list (`ticket-flow` § Messages), and the dev session already acts on this line.
  QA hears of the ticket again when the dev's `<id> ready for QA, branch <b>` comes back through
  the architect, and checks it again from Step 1.
- **A3 — a red check goes back the same way.** A check that turns red on the brought-current
  branch sends the ticket to the dev session as a conflict does, the failing check named: the old
  rule sent both back together (QA moved the ticket to Changes requested on either), and the
  owner's rule merges only when the gate passes.
- **A4 — a hotfix behind the production branch is the architect's too.** A hotfix waits at Ready
  to merge for its release, outside the merge queue; when another release merges into the
  production branch first, the architect brings it current against that branch from the same
  spare worktree, where § Group a release sent its QA `<id> bring current`. The owner's rule names
  the merge queue; the hotfix is the one other later bring-current, and leaving it with QA would
  keep QA tied to a ticket it handed over.
- **A5 — one spare worktree.** `<repo-parent>/<repo>-worktrees/architect-spare`, added once with
  `git worktree add --detach` and checked out detached at each branch it brings current
  (`git checkout --detach origin/<branch>`), since the dev session's worktree holds the branch and
  git refuses one branch in two worktrees, the reason QA's checkout is detached (TICKET-23). It
  builds and checks nothing. One is enough: merges are serialized, and only the head of the queue
  is brought current.
- **A6 — "in the background".** The architect runs the push and the wait for the pull request's
  CI as a background job, so its session goes on dispatching, and takes the pull request from
  § Merge queue step 2 once the result is in. A push refused because the remote moved is fetched
  and repeated, as QA's is.
- **A7 — "merges when the gate passes" does not replace the owner's word.** The gate passing
  sends the pull request back to step 2; under `manual` the architect still asks the owner for the
  pull request at the head of the queue (`ticket-flow` rule 4, unchanged), and under `low-risk` it
  merges without asking one that meets every condition.
- **A8 — QA removes its worktree at hand-off.** QA kept it while the ticket waited only for the
  architect's `<id> bring current`; it now removes it at Step 6 for every ticket, as it already did
  for a hotfix, and holds nothing while the ticket waits.
- **A9 — the closed ticket catalog pull request keeps its path.** The architect already brought it
  current itself (TICKET-31) and keeps every row of both sides when its table conflicts, since no
  dev session holds it. The spare worktree and the conflict rule are for a ticket's pull request.
- **A10 — the dev resolves a conflict by a merge.** `dev-ticket` § Changes requested merges the
  base into the branch in the dev's worktree, never a rebase, since QA and the architect push to
  that branch unforced.

## Out of scope

- **A check of the procedures.** No runner drives a session, so whether the architect brings a
  pull request current in its spare worktree, aborts a conflicting merge or waits for the gate
  stays a procedure; those scenarios say `Not covered`. The structural check proves only that
  each section states it.
- **`process-intake`.** `.claude/skills/process-intake/SKILL.md:83` and
  `.claude/skills/process-intake/ticket-flow.template.md:79` name QA as the session that merges
  the base and pushes it unforced. That stays true of QA's one bring-current, and both files are
  outside this change's edit surface: a follow-up can name the architect's later ones.
- **`AGENTS.md`.** Its router rows stay true: QA still brings a ticket current once, and the
  architect keeps the merge queue.
- **Certifipago.** It already states the split; the spare worktree reaches it through parity.
- **`openspec/README.md`.** The units and the paths the spec governs do not change.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-33 added; TICKET-11, TICKET-23 and
  TICKET-25 modified.
  - TICKET-33: every bring-current after QA's is the architect's, from a spare worktree of its
    own, detached, pushed unforced in the background and merged once the gate passes; a code
    conflict goes back to the dev session; no session is asked to bring a branch current.
  - TICKET-11: QA brings a pull request current once, before Ready to merge, and makes no move
    from Ready to merge.
  - TICKET-23: the dev session pulls before a later change because QA or the architect may have
    pushed; QA removes its worktree at hand-off.
  - TICKET-25: a queued pull request that fails a condition, and the next one after a merge, are
    brought current by the architect; § Messages carries no `<id> bring current`.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
