# Delta: harness/ticket-flow

> **Change:** `2026-11-20-ticket-bring-current-split`

## ADDED Requirements

### Requirement: TICKET-33 — Every bring-current after QA's is the architect's, from a spare worktree of its own

QA SHALL bring a ticket's pull request current once, before Ready to merge (TICKET-11); every later
bring-current SHALL be the architect's. When a ticket's pull request in the merge queue is behind
its base, after a merge ahead of it or when it reaches the head of the queue, the architect SHALL
bring it current itself, from a spare worktree of its own, never QA's or the dev's, added once
detached at the remote branch with `git worktree add --detach`, because the dev session's worktree
holds the branch: it SHALL fetch, check the branch out detached, merge the base into it, never by a
rebase, and push it with `git push origin HEAD:<branch>`, never forced, in the background, so its
session goes on dispatching while the pull request's CI runs, fetching and repeating when the push
is refused because the remote moved; and it SHALL take the pull request back to the head of the
queue once the gate passes, and merge it under the project's merge policy (TICKET-25). A merge
that conflicts SHALL be aborted, never resolved by the architect: a code conflict goes back to the
dev session, so the architect SHALL comment the conflict on the ticket, move the ticket from Ready
to merge to Changes requested, take it out of the queue and message the ticket's dev session
`<id> changes requested`; a check that turns red on the brought-current branch SHALL go back the
same way, the failing check named. A pull request whose branch already holds its base's tip and
whose CI must only run again SHALL have its CI re-run through the host. A hotfix that waits at
Ready to merge for its release and falls behind the production branch the layer names SHALL be
brought current the same way, against that branch (`refine-ticket` § Group a release). No session
SHALL be asked to bring a branch current: `ticket-flow`, `refine-ticket` and `qa-ticket` SHALL
name no `<id> bring current`, and `ticket-flow`'s states table SHALL name the architect among the
sessions that enter Changes requested, from Ready to merge, and its § Messages the architect's own
`<id> changes requested` to the dev session. `dev-ticket` § Changes requested SHALL resolve a
conflict by merging the base into the branch, never by a rebase. The structural check SHALL hold
`refine-ticket` § Merge queue to name `a spare worktree of its own, never QA's or the dev's`,
`--detach`, `git push origin HEAD:<branch>`, `in the background` and
`a code conflict goes back to the dev session`, and `ticket-flow`, `refine-ticket` and
`qa-ticket` to name no `<id> bring current`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the architect's merge queue brings a pull request
  current from a spare worktree of its own and sends a conflict to the dev session, and no skill
  asks a session to bring a branch current
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the merge queue brings nothing current from a worktree of its own

- **GIVEN** a `refine-ticket` whose § Merge queue never names
  `a spare worktree of its own, never QA's or the dev's`
- **WHEN** the structural check runs
- **THEN** it reports one finding, of the mention kind, for `refine-ticket`, naming its SKILL.md,
  the section § Merge queue and the statement it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue brings no pull request current from a spare worktree of its own is refused"

#### Scenario: the architect's worktree is not detached

- **GIVEN** a `refine-ticket` whose § Merge queue never names `--detach`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue adds no detached worktree is refused"

#### Scenario: the architect's push does not name the ticket branch

- **GIVEN** a `refine-ticket` whose § Merge queue never names `git push origin HEAD:<branch>`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not push HEAD to the ticket branch is refused"

#### Scenario: the architect's push holds its session

- **GIVEN** a `refine-ticket` whose § Merge queue never names `in the background`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not push in the background is refused"

#### Scenario: a conflict stays with the architect

- **GIVEN** a `refine-ticket` whose § Merge queue never names
  `a code conflict goes back to the dev session`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not send a code conflict back to the dev session is refused"

#### Scenario: the architect asks QA to bring a branch current

- **GIVEN** a `refine-ticket` that names `<id> bring current`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket that asks QA to bring a pull request current is refused"

#### Scenario: the contract carries the old line

- **GIVEN** a `ticket-flow` whose § Messages holds a row for `<id> bring current`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages carry a bring current line is refused"

#### Scenario: QA waits for a later bring-current

- **GIVEN** a `qa-ticket` that names `<id> bring current`
- **WHEN** the structural check runs
- **THEN** it reports one finding, of the forbidden kind, for `qa-ticket`, naming its SKILL.md and
  `<id> bring current`
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket that waits for a later bring current is refused"

#### Scenario: another merge landed first

- **GIVEN** a ticket at Ready to merge, second in the merge queue, after the architect merged the
  first
- **WHEN** the architect takes it from the head of the queue
- **THEN** the architect checks its branch out detached in its spare worktree, merges the default
  branch into it, pushes it unforced in the background and asks for it or merges it once its gate
  passes; its QA and dev sessions receive nothing
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: a merge that brings a code conflict

- **GIVEN** a ticket at the head of the merge queue whose branch conflicts with the default
  branch's new tip in a file the ticket changed
- **WHEN** the architect merges the default branch into it in its spare worktree
- **THEN** it aborts the merge, pushes nothing, comments the conflict on the ticket, moves it to
  Changes requested, takes it out of the queue and messages its dev session
  `<id> changes requested`; the dev session merges the default branch into its branch, resolves
  the conflict and sends the ticket back through Ready for QA
- **Test:** Not covered — the rule is a procedure the architect and dev sessions follow; no
  runner drives a session

#### Scenario: a hotfix behind the production branch at its release

- **GIVEN** a hotfix at Ready to merge into the production branch, listed in a release of its
  own, whose branch no longer holds that branch's tip because another release merged since
- **WHEN** the architect would move the release to Ready for prod
- **THEN** it brings the hotfix current against the production branch from its spare worktree,
  and moves the release only once the hotfix's gate passes; its QA is asked nothing
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

## MODIFIED Requirements

### Requirement: TICKET-11 — Ready to merge means green, conflict-free and current, and QA stops there

`qa-ticket` SHALL move a ticket to Ready to merge only when its pull request's CI is green, it has
no conflict with its base branch (the default branch, or the production branch the layer names for
a hotfix) and its branch contains that base's current tip, brought current and re-checked by QA,
with its evidence on the pull request. That is QA's one bring-current of the pull request: every
later one is the architect's (TICKET-33). QA SHALL stop there: it SHALL neither ask the owner nor
merge, SHALL message the architect `<id> ready to merge, PR #<n>`, or
`<id> ready to merge, hotfix` for a hotfix (TICKET-24), and SHALL make no move from Ready to
merge. The architect merges it (TICKET-25). The structural check SHALL hold `qa-ticket` § Step 6
to name `ready to merge, PR #`, and `qa-ticket` to hold no `Ready to merge → Done` and no
`Ready to merge → Changes requested`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: QA hands a ticket to the architect and moves none
  from Ready to merge
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: QA's hand-off sends no message

- **GIVEN** a `qa-ticket` whose Step 6 never names `ready to merge, PR #`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose hand-off step names no ready to merge message is refused"

#### Scenario: QA's hand-off step is gone

- **GIVEN** a `qa-ticket` with no Step 6
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging what it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket without its hand-off step is refused"

#### Scenario: QA moves a ticket to Done

- **GIVEN** a `qa-ticket` that holds the move `Ready to merge → Done`
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the file and the move
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket that moves a ticket to Done is refused"

#### Scenario: QA moves a ticket back from Ready to merge

- **GIVEN** a `qa-ticket` that holds the move `Ready to merge → Changes requested`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket that moves a ticket back from Ready to merge is refused"

#### Scenario: a green branch behind its base

- **GIVEN** a ticket whose checks passed on a branch the default branch has moved past
- **WHEN** QA would hand it to the architect
- **THEN** QA brings the branch current, re-runs the checks, and messages the architect
  `<id> ready to merge, PR #<n>` only once they pass
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

### Requirement: TICKET-23 — QA checks a ticket out detached and pushes it back unforced

`qa-ticket` § Step 2 SHALL run `git fetch origin` and add QA's worktree detached at the remote
branch, `git worktree add --detach <repo-parent>/<repo>-worktrees/qa-<id> origin/<branch>`, and
say why: the dev session's worktree holds the ticket's branch until the ticket is Done, and git
refuses to check out one branch in two worktrees. `qa-ticket` § Step 5 SHALL bring the detached
HEAD current with its base, as the project layer says, and push it with
`git push origin HEAD:<branch>`, never forced, fetching and repeating when the push is refused
because the remote moved; and QA SHALL remove its own worktree once it hands the ticket to the
architect at Ready to merge (`qa-ticket` § Step 6), since every later bring-current is the
architect's (TICKET-33). `dev-ticket` SHALL pull the ticket's branch before any later change in
its own worktree, since QA or the architect may have pushed to it. The structural check SHALL
hold `qa-ticket` § Step 2 to name `--detach` and § Step 5 to name `git push origin HEAD:<branch>`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: QA's checkout is detached and its push names the
  ticket branch
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: QA's checkout is not detached

- **GIVEN** a `qa-ticket` whose Step 2 never names `--detach`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose checkout step adds no detached worktree is refused"

#### Scenario: QA's checkout step is gone

- **GIVEN** a `qa-ticket` with no Step 2
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging what it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket without its checkout step is refused"

#### Scenario: QA's push does not name the ticket branch

- **GIVEN** a `qa-ticket` whose Step 5 never names `git push origin HEAD:<branch>`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose decide step does not push HEAD to the ticket branch is refused"

#### Scenario: QA's decide step is gone

- **GIVEN** a `qa-ticket` with no Step 5
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket without its decide step is refused"

#### Scenario: what a finding says

- **GIVEN** a `qa-ticket` whose Step 2 never names `--detach`
- **WHEN** the structural check runs
- **THEN** its finding names the file, the section and `--detach`
- **Test:** `scripts/verify-skills.test.mjs` › "a checkout that is not detached is named with its file and section"

#### Scenario: the dev worktree holds the branch

- **GIVEN** a ticket in Ready for QA whose dev worktree still holds `fix/123-null-total`
- **WHEN** QA checks it out
- **THEN** QA adds its worktree detached at `origin/fix/123-null-total`, and git refuses nothing
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session, and the structural check only proves the step names `--detach`

#### Scenario: the remote moved before QA's push

- **GIVEN** a QA worktree brought current with its base, and a ticket branch the dev session
  pushed to after QA fetched
- **WHEN** QA pushes `HEAD:<branch>` and the push is refused
- **THEN** QA fetches and repeats, and never forces the push
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session or a remote

#### Scenario: QA hands a ticket over

- **GIVEN** a ticket QA brought current and to Ready to merge into the default branch
- **WHEN** QA messages the architect `<id> ready to merge, PR #<n>`
- **THEN** QA removes its worktree and keeps nothing for the ticket while it waits in the queue
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

### Requirement: TICKET-25 — The architect keeps the merge queue and merges one pull request at a time

`refine-ticket` § Merge queue SHALL keep one merge queue: every pull request at Ready to merge
into the default branch, each with its evidence link, and the architect's own closed ticket
catalog pull request (TICKET-31), in the merge order the architect sets, shown to the owner in the
architect's session. The architect SHALL ask for or merge only the pull request at the head of the
queue, and only while the project layer's merge gate, when it names one, passes and every Ready
to merge condition holds (CI green, no conflict, the branch holding the default branch's current
tip); a pull request that fails one SHALL be brought current by the architect itself, a ticket's
from its spare worktree (TICKET-33) and the closed ticket catalog pull request as TICKET-31 says.
It SHALL merge on the owner's word, asked in the architect's own session, under the `manual`
policy or when the project layer records none; and, under `low-risk`, without asking only a pull
request whose Risk line is `Risk: none` or that changes only passive files, and whose merge sets
off no irreversible step, recording on the ticket, or on the ticket or release ticket the closed
ticket catalog pull request records, that it merged under `low-risk` and what it relied on. A pull
request that fails one condition SHALL wait for the owner, as under `manual`. After each merge of
a ticket's pull request the architect SHALL move the ticket to Done and message the ticket's QA
and dev sessions `<id> merged`, and after every merge it SHALL bring the next pull request in the
queue current itself. `ticket-flow`'s states table SHALL name the architect as the session that
enters Done, a hotfix aside (TICKET-24), and its § Messages SHALL carry
`<id> ready to merge, PR #<n>`, from QA to the architect, and no line that asks a session to
bring a branch current. The structural check SHALL hold `refine-ticket` to have a § Merge queue.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the architect has its merge queue
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the architect has no merge queue

- **GIVEN** a `refine-ticket` with no § Merge queue
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging the policies it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused"

#### Scenario: two pull requests ready

- **GIVEN** two tickets at Ready to merge into the default branch, the second depending on the
  first, under `manual`
- **WHEN** the architect asks the owner
- **THEN** it shows both in the queue and asks for the first only; once it merges the first, it
  moves it to Done, messages its QA and dev sessions `<id> merged`, brings the second current
  itself from its spare worktree, and asks for the second only once its gate passes; the second's
  QA is asked nothing
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and the structural check only proves the section exists

#### Scenario: `low-risk`, and a pull request that names a risk

- **GIVEN** a project whose layer records `low-risk`, and a pull request at the head of the
  queue, Ready to merge, that changes code and says `Risk: item 3 (a public export)`
- **WHEN** the architect reaches its merge
- **THEN** the architect asks the owner, as under `manual`, and merges only on the owner's word
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: `low-risk`, and a pull request that meets every condition

- **GIVEN** a project whose layer records `low-risk`, and a pull request at the head of the
  queue, Ready to merge into the default branch, that says `Risk: none` and whose merge sets off
  no irreversible step
- **WHEN** the architect reaches its merge
- **THEN** the architect merges it without asking, comments on the ticket that it merged under
  `low-risk` with that Risk line, moves it to Done and messages its QA and dev sessions
  `<id> merged`
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session
