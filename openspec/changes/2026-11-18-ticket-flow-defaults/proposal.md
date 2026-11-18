# Proposal: the ticket flow's defaults from adoption: the architect's merge queue, a target version on every ticket, the production branch the layer names

> **Status:** open

## Why

Certifipago's adoption of the ticket flow found three defaults that do not fit a team.

- **Merge approvals are scattered.** QA asks the owner for every merge, in its own session
  (`.claude/skills/qa-ticket/SKILL.md:86`, `.claude/skills/ticket-flow/SKILL.md:170`). A project
  runs one QA session per area, so the owner approves merges in as many sessions, and no one place
  shows what waits to merge.
- **A ticket can have no end point.** The PO asks the client for a version "when nobody said"
  (`.claude/skills/po-ticket/SKILL.md:46`), but no step stops a ticket that has none. A technical
  ticket the architect files gets none at all (`.claude/skills/refine-ticket/SKILL.md:88`). A
  release lists the tickets of its version, so a ticket with no version never closes through one.
- **Every skill names the production branch `production`** (for example
  `.claude/skills/release-ticket/SKILL.md:113` and `.claude/skills/dev-ticket/SKILL.md:49`).
  Certifipago names its production branch `prod`.

The Certifipago - Arquitecto session relayed the owner's words on 2026-11-18.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-18 (translated from Spanish), on the merge approval: "yes, centralize it here and pass
  it to the template"
- 2026-11-18 (translated from Spanish), on a mandatory version: "something that makes it mandatory
  that every ticket has a version, so every ticket has an end point"
- 2026-11-18 (translated from Spanish), on the production branch, which Certifipago names `prod`:
  "that it literally be called "prod""

The relay gives the intent of the first: the owner wants one place that shows what waits to
merge, instead of approvals scattered across QA sessions. "Here" is the Arquitecto session. The
template reads the third as a choice for each project: the production branch's name belongs to
the project's layer, and `production` stays the default. The parent session relayed the decisions
below on 2026-11-18.

## What changes

- **The architect owns merge approval and the merge.**
  - **QA stops at Ready to merge.** The branch is current, every check is green and the evidence
    is on the pull request. QA messages the architect `<id> ready to merge, PR #<n>`, and neither
    asks the owner nor merges (`qa-ticket` Steps 6 and 7).
  - **The architect keeps one merge queue** (`refine-ticket` § Merge queue). It holds every
    pull request at Ready to merge into the default branch, with its evidence link, in merge
    order, and the owner approves each merge in the architect's session.
  - **One merge at a time.** The architect merges the head of the queue only, through the
    project's merge gate and the Ready to merge conditions (current, green, conflict-free). It
    moves the ticket to Done and messages QA and dev `<id> merged`.
  - **After each merge, QA brings the next pull request current.** The architect messages its QA
    `<id> bring current`, and asks or merges it only once QA answers `<id> ready to merge, PR #<n>`
    again. Bringing a branch current is the procedure of `qa-ticket` Step 5: the detached QA
    worktree, the merges, the unforced push, the area's end-to-end checks re-run on the current
    branch, and the move to Changes requested on a conflict or a red check. QA holds every part
    of it. The architect doing it would duplicate that procedure in `refine-ticket` and run the
    area's checks, which are QA's.
  - **`low-risk` still applies, now to the architect.** It may merge a qualifying pull request
    without asking. The policy names stay `manual` and `low-risk`; only who asks and who merges
    change.
  - **Unchanged:** a hotfix still waits at Ready to merge into the production branch and ships as
    its release, and the merge into the production branch stays the CI/CD session's, on the
    owner's word.
  - **Where it lands:** `ticket-flow`'s states table (Done is entered by the architect), its
    rule 4, § The architect dispatches, the roles, the messages and § Ready to merge; the
    `qa-ticket` and `refine-ticket` steps, descriptions and contracts; `release-ticket`'s
    tags-only alternative, whose hotfix the architect merges; `process-intake` § Step 3 and the
    Approvals and Merge policy sections of the process template; and the `qa-ticket` and
    `refine-ticket` rows of the `AGENTS.md` process router.
- **Every ticket carries a target version**, technical, test and docs tickets included, so every
  ticket closes through a release.
  - `po-ticket` creates no ticket without one.
  - The architect dispatches none past Refinement without one. Under the GitHub Issues default,
    an issue with no milestone is a stop: the architect proposes a version on the ticket, messages
    the PO `<id> version change`, and waits for `<id> version set`.
  - A technical ticket the architect files gets one the same way: only the PO runs
    `set version`.
  - `ticket.template.md` marks the field required.
  - No gate reads the board: `scripts/verify-ticket-branch.mjs` judges a branch name and a pull
    request body only. The PO's Step 3 and the architect's Steps 1 and 4 are where the rule is
    checked; `ticket-flow` § Target version says so.
- **The production branch is the layer's.**
  - The process template's § Branching model names it on a `Production branch` line, with
    `production` as the default.
  - `process-intake` asks the team its name.
  - Every ticket skill and template says "the production branch the layer names" (or "the
    production branch" after it) where it now says `production`: `ticket-flow`,
    `release-ticket`, `qa-ticket`'s Ready to merge and hotfix base, the hotfix steps,
    `release.template.md`, the process template and `dev-ticket`'s hotfix branch.
- **The host-branch target notes** in `release-ticket` § Deploy targets record two facts
  Certifipago learned, as examples of what a host branch target declares, naming no project:
  - Vercel's production branch is set only in the dashboard (Environments → Production → Branch
    Tracking); the API's `link.productionBranch` is read-only;
  - after the switch, the default branch deploys as a Preview, so the Preview environment
    variables must exist before it serves as staging.
- **The check** (`scripts/verify-skills.mjs`), each rule with a case in
  `scripts/verify-skills.test.mjs`, written first and seen red:
  - `qa-ticket` § Step 6 names `ready to merge, PR #`, and `qa-ticket` holds no
    `Ready to merge → Done`;
  - `refine-ticket` has a § Merge queue, which names both merge policies in place of
    `qa-ticket`'s merge step;
  - the process template's Branching model gives the line `- **Production branch:** `production``;
  - the ticket template's Target version section marks the version required.
- **The docs and the registry.** The `verify:skills:test` row of `docs/harness.md` names what it
  now judges, and the registry entries whose descriptions change are regenerated.

## Out of scope

- **A board check of the target version.** No gate reads the board, and
  `scripts/verify-ticket-branch.mjs` stays as it is. The rule is a procedure the PO and the
  architect follow until the board-is-the-source change that follows this one brings a check.
- **Whether a session follows the procedures.** The hand-off, the queue, the merge, the version
  stop and the production branch's name are prose a session follows. Their scenarios stay
  `Not covered`, with the reason.
- **Certifipago's own skills and layer.** The parent session relays the new texts to them.
- **The merge policy setting.** The names `manual` and `low-risk` stay, and so does the default;
  `delivery.mergePolicy` and `/init` lie outside this change.
- **The other rows of `AGENTS.md`.** Only the `qa-ticket` and `refine-ticket` rows of the process
  router change.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: TICKET-11, TICKET-14, TICKET-15, TICKET-20 and
  TICKET-24 modified; TICKET-25, TICKET-26 and TICKET-27 added.
  - TICKET-11 states that QA merges each ticket; it becomes QA's stop at Ready to merge.
  - TICKET-20 holds `qa-ticket`'s merge step to both policies; the architect's merge queue holds
    them now.
  - TICKET-14, TICKET-15 and TICKET-24 name the `production` branch; they name the production
    branch the layer names. TICKET-24 also routes the hotfix's `<id> merged` to QA and dev.
  - TICKET-25 holds the architect's merge queue, TICKET-26 the target version on every ticket,
    and TICKET-27 the production branch the layer names.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
