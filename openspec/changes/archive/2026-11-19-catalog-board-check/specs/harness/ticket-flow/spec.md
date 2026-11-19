# Delta: harness/ticket-flow

> **Change:** `2026-11-19-catalog-board-check`

## MODIFIED Requirements

### Requirement: TICKET-31 — The PO's closed ticket catalog pull request joins the architect's merge queue

Once the pull request of `po-ticket` § Step 6 — Record the closed tickets is open, the PO SHALL
message the architect `<release-id> catalog ready to merge, PR #<n>` for the close of a release,
or `<id> catalog ready to merge, PR #<n>` for a single close outside a release. `ticket-flow`
§ Messages SHALL carry both lines, from the PO to the architect. `refine-ticket` § Merge queue
SHALL take that pull request into the merge queue like any other, in the merge order, and SHALL
merge it only on the owner's word, asked in the architect's session, under every merge policy. It
carries no ticket of its own, so the architect SHALL hold it to none of a ticket's Ready to merge
conditions: no QA session checks it or is told `<id> bring current` for it, and its merge moves
no ticket and sends no `<id> merged`. Before the architect asks the owner for it, the architect
SHALL `read`, on the board through the project layer's adapter, every ticket the pull request
adds a catalog row for, SHALL check that each row its branch adds matches its board page in id,
title, target version and closing pull request, and SHALL comment that check on the pull
request, each row with match or mismatch; the ask SHALL name that comment. A pull request with a
row that does not match SHALL go back to the PO instead of to the owner: the architect SHALL
comment the mismatch on the ticket or release ticket that links the pull request and message the
PO `<id> question`, and the pull request SHALL wait in the queue until the PO sends its catalog
line again, when the check runs again. When the project layer's merge gate fails for it, or the
host refuses its merge, the architect SHALL tell the owner, and the pull request SHALL wait in
the queue. The structural check SHALL hold `ticket-flow` § Messages, `po-ticket` § Step 6 —
Record the closed tickets and `refine-ticket` § Merge queue each to name both lines, and
`refine-ticket` § Merge queue to state that each added row matches its board page in id, title,
target version and closing pull request.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the contract carries both catalog lines, the PO
  sends them, the architect's merge queue takes them and checks each added row against the board
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

#### Scenario: the merge queue does not check the catalog against the board

- **GIVEN** a `refine-ticket` whose § Merge queue names both catalog lines but does not state
  that each added row matches its board page in id, title, target version and closing pull
  request
- **WHEN** the structural check runs
- **THEN** it reports one finding, of the mention kind, for `refine-ticket`, naming its
  SKILL.md, the section § Merge queue and the statement it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not check the catalog rows against the board is refused"

#### Scenario: a release's catalog under `low-risk`

- **GIVEN** a project whose layer records `low-risk`, and the PO's catalog pull request of a
  release, `PR #88`, that changes only docs/GENERAL_PLAN.md and whose every row matches its board
  page
- **WHEN** the PO opens it and the architect reaches it at the head of the queue
- **THEN** the PO messages the architect `<release-id> catalog ready to merge, PR #88`, the
  architect queues it in the merge order, reads each ticket it adds a row for on the board,
  comments the check on `PR #88`, every row a match, asks the owner naming that comment, merges
  it only on the owner's word, moves no ticket and sends no `<id> merged`
- **Test:** Not covered — the rule is a procedure the PO and architect sessions follow; no runner
  drives a session

#### Scenario: a catalog row that does not match its board page

- **GIVEN** the PO's catalog pull request of a single close, whose row gives the ticket's target
  version as `1.2.0` while its board page gives `1.3.0`
- **WHEN** the architect checks it before asking the owner
- **THEN** it comments the check on the pull request, that row a mismatch of its target version,
  does not ask the owner, comments the mismatch on the ticket that links the pull request,
  messages the PO `<id> question`, and the pull request waits in the queue until the PO sends
  `<id> catalog ready to merge, PR #<n>` again
- **Test:** Not covered — the rule is a procedure the PO and architect sessions follow; no runner
  drives a session

#### Scenario: a single close outside a release

- **GIVEN** a project whose layer declares no deploy target, and the architect's `<id> closed`
- **WHEN** the PO opens the catalog pull request of that close
- **THEN** it messages the architect `<id> catalog ready to merge, PR #<n>`, and the pull request
  joins the merge queue
- **Test:** Not covered — the rule is a procedure the PO and architect sessions follow; no runner
  drives a session
