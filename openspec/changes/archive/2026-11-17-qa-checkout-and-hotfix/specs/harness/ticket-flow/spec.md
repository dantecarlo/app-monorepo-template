# Delta: harness/ticket-flow

> **Change:** `2026-11-17-qa-checkout-and-hotfix`

## ADDED Requirements

### Requirement: TICKET-23 — QA checks a ticket out detached and pushes it back unforced

`qa-ticket` § Step 2 SHALL run `git fetch origin` and add QA's worktree detached at the remote
branch, `git worktree add --detach <repo-parent>/<repo>-worktrees/qa-<id> origin/<branch>`, and
say why: the dev session's worktree holds the ticket's branch until the ticket is Done, and git
refuses to check out one branch in two worktrees. `qa-ticket` § Step 5 SHALL bring the detached
HEAD current with its base, as the project layer says, and push it with
`git push origin HEAD:<branch>`, never forced, fetching and repeating when the push is refused
because the remote moved; and QA SHALL remove its own worktree once it is done with the ticket.
`dev-ticket` SHALL pull the ticket's branch before any later change in its own worktree, since
QA may have pushed to it. The structural check SHALL hold `qa-ticket` § Step 2 to name
`--detach` and § Step 5 to name `git push origin HEAD:<branch>`.

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

### Requirement: TICKET-24 — A hotfix ships only as its release

`qa-ticket` § Step 6 SHALL merge no pull request into `production` under any merge policy,
`manual` included: QA brings a hotfix to Ready to merge against `production`'s current tip,
leaves it there, and messages the architect `<id> ready to merge, hotfix`. `refine-ticket`
§ Group a release SHALL list the hotfix in a release ticket of its own. `release-ticket` SHALL
ship that release with Steps 1 to 4, merging the hotfix's pull request into `production` as the
release's deploy step, on the owner's word for the release and for that step, after the release's
migrations, in their order; then move the hotfix to Done and message the architect
`<id> merged`; and, once it is live, merge `production` back into the default branch through a
pull request merged on the owner's word. `ticket-flow` § Messages SHALL carry the line
`<id> ready to merge, hotfix`, from QA to the architect, and its states table SHALL name CI/CD as
the session that enters Done for a hotfix. The structural check SHALL hold `qa-ticket` § Step 6,
`refine-ticket` § Group a release and `ticket-flow` § Messages to name
`<id> ready to merge, hotfix`, and `release-ticket` § Hotfix to say that QA leaves it at Ready to
merge.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: QA, the architect and the contract name the
  hotfix's message, and the hotfix section leaves it at Ready to merge
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: QA's merge step sends no hotfix message

- **GIVEN** a `qa-ticket` whose Step 6 never names `<id> ready to merge, hotfix`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose merge step sends no hotfix message is refused"

#### Scenario: the architect never groups a hotfix

- **GIVEN** a `refine-ticket` whose release step never names `<id> ready to merge, hotfix`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose release step names no hotfix message is refused"

#### Scenario: the contract has no hotfix message

- **GIVEN** a `ticket-flow` whose messages never name `<id> ready to merge, hotfix`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no hotfix line is refused"

#### Scenario: the hotfix section lets QA merge

- **GIVEN** a `release-ticket` whose Hotfix section never says that QA leaves it at Ready to
  merge
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a release-ticket whose hotfix section does not leave it at Ready to merge is refused"

#### Scenario: a hotfix under `manual`

- **GIVEN** a project whose layer records `manual`, and a green hotfix pull request into
  `production`, current with its tip
- **WHEN** QA reaches its merge step
- **THEN** QA asks the owner nothing and merges nothing: it leaves the ticket at Ready to merge
  and messages the architect `<id> ready to merge, hotfix`
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session, and the structural check only proves the step names the message

#### Scenario: a hotfix release with a migration

- **GIVEN** a release ticket of its own that lists a hotfix at Ready to merge into `production`
  and one migration
- **WHEN** the CI/CD session ships it on the owner's word
- **THEN** it pushes the migration first, then merges the hotfix's pull request into
  `production` on the owner's word for that step, moves the hotfix to Done, messages the
  architect `<id> merged`, and checks production before Released
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session or a deploy

## MODIFIED Requirements

### Requirement: TICKET-11 — Ready to merge means green, conflict-free and current, merged one at a time under the merge policy

`qa-ticket` SHALL move a ticket to Ready to merge only when its pull request's CI is green, it has
no conflict with its base branch (the default branch, or `production` for a hotfix) and its branch
contains that base's current tip, brought current and re-checked by QA, and merge one ticket at a
time, in the order the architect sets: on the owner's word, asked in QA's own session, under the
`manual` policy or when the project layer records none; and, under the `low-risk` policy, without
asking only a pull request into the default branch whose Risk line is `Risk: none` or that
changes only passive files, and whose merge sets off no irreversible step, recording on the ticket
that it merged under `low-risk` and the Risk line it relied on. A pull request that fails one
condition waits for the owner, as under `manual`. A pull request into `production` QA merges
under no policy: it waits at Ready to merge for its release (TICKET-24).

**Evidence:** written at apply time, when the code exists.

#### Scenario: a green branch behind its base

- **GIVEN** a ticket whose checks passed on a branch the default branch has moved past
- **WHEN** QA would ask the owner to merge it
- **THEN** QA brings the branch current, re-runs the checks, and asks only once they pass
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

#### Scenario: `low-risk`, and a pull request that names a risk

- **GIVEN** a project whose layer records `low-risk`, and a ticket at the head of the merge order,
  Ready to merge, whose pull request changes code and says `Risk: item 3 (a public export)`
- **WHEN** QA reaches its merge step
- **THEN** QA asks the owner, as under `manual`, and merges only on the owner's word
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

#### Scenario: `low-risk`, and a pull request that meets every condition

- **GIVEN** a project whose layer records `low-risk`, and a ticket at the head of the merge order,
  Ready to merge into the default branch, whose pull request says `Risk: none` and whose merge
  sets off no irreversible step
- **WHEN** QA reaches its merge step
- **THEN** QA merges it without asking, comments on the ticket that it merged under `low-risk`
  with that Risk line, moves it to Done and messages the architect `<id> merged`
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

### Requirement: TICKET-15 — A release enters Ready for prod only when its batch is proven

`refine-ticket` SHALL move the release ticket of a version V to Ready for prod only when it lists
every ticket whose target version is V and each one is Done, except a hotfix, which is at Ready to
merge into `production` with every Ready to merge condition met against `production`'s current
tip; the default branch's CI is green; and the QA of each area the batch touches has checked it on
staging or preview, with evidence on the release ticket. `ticket-flow`'s Ready for prod row and
§ Release stage, `release-ticket` Step 1 and `release.template.md` SHALL state the same rule and
the same exception.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an area not checked on staging

- **GIVEN** a release ticket whose batch touches web and backend, with web evidence only
- **WHEN** the architect would move it to Ready for prod
- **THEN** it stays in Refinement, and the backend QA is asked to check it on staging
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: a hotfix release

- **GIVEN** a release ticket of its own that lists one hotfix at Ready to merge into
  `production`, green and current with `production`'s tip, with its staging evidence
- **WHEN** the architect would move it to Ready for prod
- **THEN** it moves it, although the hotfix is not Done
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: a hotfix behind `production`

- **GIVEN** a release that lists a hotfix whose branch no longer holds `production`'s current
  tip, because another release merged since
- **WHEN** the CI/CD session reads the release at Step 1
- **THEN** it comments that the hotfix is behind, messages the architect `<release-id> question`,
  and stops
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

### Requirement: TICKET-20 — The merge policy is the project's, `manual` unless it picks `low-risk`

The ticket skills SHALL name the two merge policies a project layer may record: `manual`, the
default, under which QA asks the owner before every merge, and `low-risk`, under which QA may
merge without asking a pull request that meets every condition of `ticket-flow` rule 4.
`ticket-flow` § Rules every role follows, `qa-ticket` § Step 6, `process-intake` § Step 3 and the
Merge policy section of `.claude/skills/process-intake/ticket-flow.template.md` SHALL each name
both policies, and that section's `Policy` line SHALL give `manual`, the default. A merge to
`production`, a deploy, a production migration, a store submission and every other irreversible
step SHALL stay the owner's word under every policy, as `ticket-flow` rule 4 and `release-ticket`
say; and under neither policy SHALL QA merge a pull request into `production` (TICKET-24).

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the four files name both policies, and the
  template gives `manual`
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the contract drops `low-risk`

- **GIVEN** a `ticket-flow` whose rules never name `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules name no low-risk merge policy is refused"

#### Scenario: QA's merge step drops `manual`

- **GIVEN** a `qa-ticket` whose Step 6 never names `manual`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose merge step names no manual merge policy is refused"

#### Scenario: QA's merge step drops `low-risk`

- **GIVEN** a `qa-ticket` whose Step 6 never names `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose merge step names no low-risk merge policy is refused"

#### Scenario: QA's merge step is gone

- **GIVEN** a `qa-ticket` with no Step 6
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging the policies it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket without its merge step is refused"

#### Scenario: the intake never offers `low-risk`

- **GIVEN** a `process-intake` whose Step 3 never names `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no low-risk merge policy is refused"

#### Scenario: the intake's mapping step is gone

- **GIVEN** a `process-intake` with no Step 3
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a process-intake without its mapping step is refused"

#### Scenario: the template never names `low-risk`

- **GIVEN** a process template whose Merge policy section never names `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose merge policy names no low-risk policy is refused"

#### Scenario: the template defaults to `low-risk`

- **GIVEN** a process template whose `Policy` line gives `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the line and the default it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose merge policy does not default to manual is refused"

#### Scenario: the template has no Policy line

- **GIVEN** a process template whose Merge policy section has no `Policy` line
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose merge policy has no Policy line is refused"

#### Scenario: what a finding says

- **GIVEN** a `ticket-flow` whose rules never name `low-risk`
- **WHEN** the structural check runs
- **THEN** its finding names the file, the section and the policy
- **Test:** `scripts/verify-skills.test.mjs` › "a dropped merge policy is named with its file and section"

#### Scenario: a hotfix under `low-risk`

- **GIVEN** a project whose layer records `low-risk`, and a green, current hotfix pull request
  into `production` whose Risk line is `none`
- **WHEN** QA reaches its merge step
- **THEN** QA merges nothing and asks the owner nothing: it leaves the ticket at Ready to merge
  and messages the architect `<id> ready to merge, hotfix`, and the CI/CD session merges it as
  its release's deploy step (TICKET-24)
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session, and the structural check only proves the skills name both policies and the hotfix's
  message
