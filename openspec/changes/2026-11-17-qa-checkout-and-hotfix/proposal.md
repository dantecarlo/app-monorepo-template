# Proposal: QA checks out a held branch detached, and a hotfix ships only as its release

> **Status:** open

## Why

Two steps of the ticket flow fail as written.

- **QA cannot check a ticket out.** `qa-ticket` Step 2 runs `git worktree add … <branch>`
  (`.claude/skills/qa-ticket/SKILL.md:37`). The dev session's worktree holds that branch until
  the ticket is Done, and git refuses to check out one branch in two worktrees. QA stops there.
- **A hotfix deploys before its release is approved.** `release-ticket` § Hotfix step 2 merges
  the hotfix into `production` on the owner's word, before the architect creates its release
  ticket (`.claude/skills/release-ticket/SKILL.md:146`). Merging into `production` deploys, so
  the merge runs ahead of the release's approval and its migrations. `qa-ticket` Step 6 still
  lets QA merge a pull request into `production` under `manual`: only its `low-risk` branch
  excludes `production` (`.claude/skills/qa-ticket/SKILL.md:89`).

Fixing the hotfix uncovers a third problem. Once QA leaves the hotfix unmerged at Ready to merge,
the release that ships it cannot reach Ready for prod: `refine-ticket` § Group a release step 3,
`ticket-flow` § Release stage, its Ready for prod row, `release-ticket` Step 1 and
`release.template.md` all require every listed ticket to be Done
(`.claude/skills/refine-ticket/SKILL.md:106`, `.claude/skills/ticket-flow/SKILL.md:297`).

Certifipago's Arquitecto session found the first two while adopting the ticket flow on
2026-11-17, and fixed them on its side. Its findings, relayed to this session on 2026-11-17:

> **qa-ticket Step 2** runs `git worktree add … <type>/<id>-<slug>`. The dev worktree holds that
> branch until Done, and git refuses to check one branch out twice, so QA stops at that step.
> Here QA adds the worktree with `--detach` at `origin/<branch>` and pushes `HEAD:<branch>`,
> never forced.

> **release-ticket § Hotfix step 2** merges the hotfix into production before its release ticket
> exists. Since that merge deploys, it ran ahead of the release's approval and its migrations.
> Here QA leaves the hotfix at Ready to merge, and CI/CD ships it with Steps 1–4 once the owner
> approves the release.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"

The owner authorized the ticket flow and its corrections from adoption, as the parent session
relays. The parent session also decided how the release stage handles an unmerged hotfix, and the
new message the architect hears it by.

## What changes

- **QA's checkout (`qa-ticket` Step 2).**
  - QA runs `git fetch origin`, then
    `git worktree add --detach <repo-parent>/<repo>-worktrees/qa-<id> origin/<branch>`.
  - The step says why: the dev session's worktree still holds the branch, and git refuses to
    check out one branch in two worktrees.
- **QA's push (`qa-ticket` Step 5).**
  - QA brings the detached HEAD current with its base, as the project layer says, and pushes
    with `git push origin HEAD:<branch>`, never forced.
  - A push refused because the remote moved: fetch, and repeat.
  - Step 7 still removes QA's worktree.
- **The dev session pulls first (`dev-ticket` § Changes requested).** Before any later change in
  its own worktree, the dev session pulls the branch, because QA may have pushed to it.
- **A hotfix is never QA's to merge (`qa-ticket` Step 6).**
  - Under every policy, `manual` included, a pull request into `production` waits at Ready to
    merge for its release.
  - QA brings it current with `production`'s tip, leaves it there, and messages the architect
    with a new line, `<id> ready to merge, hotfix`.
- **The release ships it (`release-ticket` § Hotfix).**
  - The architect lists the hotfix in a release ticket of its own.
  - The CI/CD session ships it with Steps 1 to 4. The merge into `production` is that release's
    deploy step: on the owner's word for the release and for that step, after its migrations, in
    their order.
  - Once it merges, the CI/CD session moves the hotfix to Done and messages the architect
    `<id> merged`.
  - Once it is live, `production` merges back into the default branch through a pull request, on
    the owner's word.
- **The Done-only rule gets one exception, stated the same everywhere.**
  - The rule: every ticket a release lists is Done, except a hotfix. A hotfix is at Ready to
    merge into `production`, with every Ready to merge condition met against `production`'s
    current tip.
  - It lands in `refine-ticket` § Group a release (its intro and step 3), its description and
    that description's registry entry; `ticket-flow`'s Ready for prod row and § Release stage;
    `release-ticket` Step 1; and `release.template.md`.
- **The contract follows (`ticket-flow`).**
  - § Messages gains `<id> ready to merge, hotfix`, from QA to the architect, and names CI/CD as
    a sender of `<id> merged`.
  - The states table names CI/CD as the session that enters Done for a hotfix.
  - Rule 4, § The architect dispatches, the roles table and § Ready to merge say that QA merges
    no pull request into `production`.
- **The check (`scripts/verify-skills.mjs`).** It holds these sections to these names:
  - `qa-ticket` § Step 2: `--detach`;
  - `qa-ticket` § Step 5: `git push origin HEAD:<branch>`;
  - `qa-ticket` § Step 6, `refine-ticket` § Group a release and `ticket-flow` § Messages:
    `<id> ready to merge, hotfix`;
  - `release-ticket` § Hotfix: that QA leaves it at Ready to merge.

  Each one gets a case in `scripts/verify-skills.test.mjs`, written first and seen red.
- **The docs.** The `verify:skills:test` row of `docs/harness.md` names what it now judges.

## Out of scope

- **Whether a session follows the procedure.** The checkout, the push, the hotfix's hand-off and
  its merge are prose a session follows. Their scenarios stay `Not covered`, with the reason, and
  no gate reads the board, a worktree or a pull request.
- **Certifipago's own skills.** They already detach the QA worktree and hold the hotfix. The
  parent session relays the architect's side and the new message to them.
- **`process-intake`.** Its question of merge or rebase stands as it is, and so does the Bringing
  a branch current line of its template.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-11, TICKET-15 and TICKET-20 modified;
  TICKET-23 and TICKET-24 added.
  - TICKET-11 states that QA merges every ticket.
  - TICKET-15 states that every ticket of a release is Done before Ready for prod.
  - TICKET-20's hotfix scenario has QA merge the hotfix on the owner's word.
  - TICKET-23 holds QA's detached checkout and its unforced push.
  - TICKET-24 holds the hotfix to its release.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
