# Delta: harness/ticket-flow

> **Change:** `2026-11-18-catalog-merge-message`

## ADDED Requirements

### Requirement: TICKET-31 — The PO's closed ticket catalog pull request joins the architect's merge queue

Once the pull request of `po-ticket` § Step 6 — Record the closed tickets is open, the PO SHALL
message the architect `<release-id> catalog ready to merge, PR #<n>` for the close of a release,
or `<id> catalog ready to merge, PR #<n>` for a single close outside a release. `ticket-flow`
§ Messages SHALL carry both lines, from the PO to the architect. `refine-ticket` § Merge queue
SHALL take that pull request into the merge queue like any other, in the merge order, and SHALL
merge it only on the owner's word, asked in the architect's session, under every merge policy. It
carries no ticket of its own, so the architect SHALL hold it to none of a ticket's Ready to merge
conditions: no QA session is told `<id> bring current` for it, and its merge moves no ticket and
sends no `<id> merged`. When the project layer's merge gate fails for it, or the host refuses its
merge, the architect SHALL tell the owner, and the pull request SHALL wait in the queue. The
structural check SHALL hold `ticket-flow` § Messages, `po-ticket` § Step 6 — Record the closed
tickets and `refine-ticket` § Merge queue each to name both lines.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the contract carries both catalog lines, the PO
  sends them and the architect's merge queue takes them
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the contract carries no catalog line

- **GIVEN** a `ticket-flow` whose § Messages names neither
  `<release-id> catalog ready to merge, PR #<n>` nor `<id> catalog ready to merge, PR #<n>`
- **WHEN** the structural check runs
- **THEN** it reports two findings, one per line
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no catalog line is refused"

#### Scenario: the PO's close step sends no catalog line

- **GIVEN** a `po-ticket` whose § Step 6 — Record the closed tickets names neither catalog line
- **WHEN** the structural check runs
- **THEN** it reports two findings, one per line
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket whose close step sends no catalog message is refused"

#### Scenario: the merge queue takes no catalog pull request

- **GIVEN** a `refine-ticket` whose § Merge queue names neither catalog line
- **WHEN** the structural check runs
- **THEN** it reports two findings, one per line
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue takes no catalog pull request is refused"

#### Scenario: a release's catalog under `low-risk`

- **GIVEN** a project whose layer records `low-risk`, and the PO's catalog pull request of a
  release, `PR #88`, that changes only docs/GENERAL_PLAN.md
- **WHEN** the PO opens it and the architect reaches it at the head of the queue
- **THEN** the PO messages the architect `<release-id> catalog ready to merge, PR #88`, the
  architect queues it in the merge order and asks the owner, merges it only on the owner's word,
  moves no ticket and sends no `<id> merged`
- **Test:** Not covered — the rule is a procedure the PO and architect sessions follow; no runner
  drives a session

#### Scenario: a single close outside a release

- **GIVEN** a project whose layer declares no deploy target, and the architect's `<id> closed`
- **WHEN** the PO opens the catalog pull request of that close
- **THEN** it messages the architect `<id> catalog ready to merge, PR #<n>`, and the pull request
  joins the merge queue
- **Test:** Not covered — the rule is a procedure the PO and architect sessions follow; no runner
  drives a session

## MODIFIED Requirements

### Requirement: TICKET-25 — The architect keeps the merge queue and merges one pull request at a time

`refine-ticket` § Merge queue SHALL keep one merge queue: every pull request at Ready to merge
into the default branch, each with its evidence link, and the PO's closed ticket catalog pull
request (TICKET-31), in the merge order the architect sets, shown to the owner in the architect's
session. The architect SHALL ask for or merge only the pull request at the head of the queue, and
only while the project layer's merge gate, when it names one, passes and, for a ticket's pull
request, every Ready to merge condition holds (CI green, no conflict, the branch holding the
default branch's current tip); a ticket's pull request that fails one SHALL go back to its QA as
`<id> bring current`. It SHALL merge on the owner's word, asked in the architect's own session,
under the `manual` policy or when the project layer records none, and the closed ticket catalog
pull request under every policy; and, under `low-risk`, without asking only a ticket's pull
request whose Risk line is `Risk: none` or that changes only passive files, and whose merge sets
off no irreversible step, recording on the ticket that it merged under `low-risk` and the Risk
line it relied on. A pull request that fails one condition SHALL wait for the owner, as under
`manual`. After each merge of a ticket's pull request the architect SHALL move the ticket to
Done and message the ticket's QA and dev sessions `<id> merged`, and after every merge it SHALL
message the QA of the next pull request in the queue `<id> bring current`, unless that one is the
closed ticket catalog pull request, which no QA holds.
`ticket-flow`'s states table SHALL name the architect as the session that enters Done, a hotfix
aside (TICKET-24), and its § Messages SHALL carry `<id> ready to merge, PR #<n>`, from QA to the
architect, and `<id> bring current`, from the architect to QA. The structural check SHALL hold
`refine-ticket` to have a § Merge queue.

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
  moves it to Done, messages its QA and dev sessions `<id> merged`, messages the second's QA
  `<id> bring current`, and asks for the second only once QA answers
  `<id> ready to merge, PR #<n>` again
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
