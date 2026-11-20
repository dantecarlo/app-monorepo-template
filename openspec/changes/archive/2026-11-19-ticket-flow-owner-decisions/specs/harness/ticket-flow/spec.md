# Delta: harness/ticket-flow

> **Change:** `2026-11-19-ticket-flow-owner-decisions`

## ADDED Requirements

### Requirement: TICKET-32 — A ticket closed without delivery ends in Dropped, on the PO's word

`ticket-flow` SHALL carry Dropped as a state of its own, apart from Closed, in its states table
with the GitHub label `ticket:dropped`, and a § Dropped section that says: the PO decides every
drop, scope being its own, and a session that finds a ticket superseded proposes the drop on the
ticket and asks the PO `<id> question`; the architect moves the ticket to Dropped on the PO's
`<id> dropped`; Dropped is entered from any state from Backlog to Ready to merge while the
ticket's pull request is unmerged, a hotfix only before Ready to merge, and never from Done or
later nor for a release ticket; the PO first comments the drop record, a `Dropped:` line with the
reason, the client's words verbatim and dated when the client withdrew it, and a
`Superseded by:` line with the id of the ticket that replaces it, or `none`; the architect closes
the ticket's open pull request unmerged and takes it out of the merge queue, re-plans every
ticket that depends on it, and messages the ticket's dev and QA sessions `<id> dropped`, which
remove their worktrees; the ticket keeps its target version as a record, and no release lists
it; and the architect records it in the general plan's catalog apart from the delivered tickets
(TICKET-29). `ticket-flow` § Messages SHALL carry `<id> dropped`, from the PO to the architect
and then from the architect to the dev and QA sessions. Under the GitHub Issues adapter the
architect SHALL close a dropped ticket's issue with `gh issue close <id> --reason "not planned"`.
`po-ticket` § Step 6 — Drop a ticket, `refine-ticket` § Drop a ticket, `dev-ticket` § Changes
requested and `qa-ticket` § Step 7 — When the architect writes back SHALL each name
`<id> dropped`, and the States table of `.claude/skills/process-intake/ticket-flow.template.md`
SHALL have a Dropped row. The structural check SHALL hold both states tables to a Dropped row,
`ticket-flow` to a § Dropped section that names `Superseded by:` and to name `<id> dropped` in
§ Messages, `po-ticket` and `refine-ticket` to their drop steps, each naming `<id> dropped`, and
`dev-ticket` and `qa-ticket` to name it where they handle the architect's lines.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: both states tables have Dropped, the contract has
  its § Dropped and its line, and every role that acts on a drop names `<id> dropped`
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the contract has no Dropped state

- **GIVEN** a `ticket-flow` whose states table has no Dropped row
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the state
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose states table has no Dropped row is refused"

#### Scenario: the project layer has no Dropped state

- **GIVEN** a process template whose States table has no Dropped row
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the state
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose states table has no Dropped row is refused"

#### Scenario: the contract has no § Dropped

- **GIVEN** a `ticket-flow` with no § Dropped
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging the text it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow without its Dropped section is refused"

#### Scenario: the drop record names no superseding ticket

- **GIVEN** a `ticket-flow` whose § Dropped never names `Superseded by:`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose Dropped section names no superseding ticket is refused"

#### Scenario: the contract carries no drop line

- **GIVEN** a `ticket-flow` whose § Messages never names `<id> dropped`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no dropped line is refused"

#### Scenario: the PO has no drop step

- **GIVEN** a `po-ticket` with no § Step 6 — Drop a ticket
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket without its drop step is refused"

#### Scenario: the PO's drop step sends no line

- **GIVEN** a `po-ticket` whose drop step never names `<id> dropped`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket whose drop step sends no dropped message is refused"

#### Scenario: the architect has no drop step

- **GIVEN** a `refine-ticket` with no § Drop a ticket
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket without its drop step is refused"

#### Scenario: the architect's drop step tells no session

- **GIVEN** a `refine-ticket` whose § Drop a ticket never names `<id> dropped`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose drop step tells no session the ticket was dropped is refused"

#### Scenario: the dev session does not stop

- **GIVEN** a `dev-ticket` whose § Changes requested never names `<id> dropped`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a dev-ticket that does not stop on a dropped ticket is refused"

#### Scenario: the QA session does not stop

- **GIVEN** a `qa-ticket` whose § Step 7 — When the architect writes back never names
  `<id> dropped`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket that does not stop on a dropped ticket is refused"

#### Scenario: a ticket superseded while in dev

- **GIVEN** a ticket In dev, with an open pull request, that a new ticket `#130` supersedes
- **WHEN** the PO drops it
- **THEN** the PO comments `Dropped:` with the reason and `Superseded by: #130` and messages the
  architect `<id> dropped`; the architect closes the pull request unmerged, moves the ticket to
  Dropped, closes its issue as not planned, messages its dev session `<id> dropped`, re-plans the
  tickets that depend on it, and records it in the catalog's dropped tickets; the dev session
  removes its worktree
- **Test:** Not covered — the rule is a procedure the PO, architect and dev sessions follow; no
  runner drives a session

#### Scenario: a merged ticket the client withdraws

- **GIVEN** a ticket at Done whose requirement the client withdraws
- **WHEN** the PO reads it
- **THEN** it is not dropped: it is delivered, and undoing it is a new ticket
- **Test:** Not covered — the rule is a procedure a PO session follows; no runner drives a session

#### Scenario: a dropped ticket aimed at the release's version

- **GIVEN** a dropped ticket whose target version is 1.4, and the release ticket of 1.4
- **WHEN** the architect lists the release's tickets
- **THEN** it leaves the dropped ticket out, and the release does not wait for it
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and no gate reads the board

## MODIFIED Requirements

### Requirement: TICKET-01 — The contract skill carries the whole flow

`.claude/skills/ticket-flow/SKILL.md` SHALL carry the contract every role reads first, as its
sections: a pre-flight that reads docs/process/ticket-flow.md and sends a team with no board
adapter to `process-intake`, the board operations with their GitHub Issues mapping, the states and
transitions naming each of the fourteen states (the eleven of the build, Dropped among them, and
the three of the release), § Dropped (TICKET-32), the seven board operations (`read version` and
`set version` among them), the architect as dispatcher, the messages, the roles naming each of
the six (the CI/CD role included), the rules every role follows, the ticket identity, what a
ticket carries, the Ready to merge conditions and the release stage, beside two templates in its
folder: `ticket.template.md`, the body a ticket is written from, with its target version, and
`release.template.md`, the body of a release ticket, with the one version it ships.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the contract of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: a state is dropped

- **GIVEN** a `ticket-flow` whose states table has no Ready to merge row
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the state
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow that drops a state is refused"

#### Scenario: the board operations are gone

- **GIVEN** a `ticket-flow` with no board operations section
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow without its board operations is refused"

#### Scenario: the pre-flight does not stop a team with no board

- **GIVEN** a `ticket-flow` whose pre-flight never names `process-intake`
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the section and what it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose pre-flight does not send the team to process-intake is refused"

#### Scenario: the ticket template is gone

- **GIVEN** a `ticket-flow` folder with no `ticket.template.md`
- **WHEN** the structural check runs
- **THEN** it reports the missing file
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow without its ticket template is refused"

#### Scenario: the ticket has no target version

- **GIVEN** a `ticket.template.md` with no target version section
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket template without its target version is refused"

#### Scenario: the board cannot set a target version

- **GIVEN** a `ticket-flow` whose board operations table has no `set version` row
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the operation
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose board operations cannot set the target version is refused"

#### Scenario: the CI/CD role is dropped

- **GIVEN** a `ticket-flow` whose roles table has no CI/CD row
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the role
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose roles table has no CI/CD row is refused"

#### Scenario: the release template is gone

- **GIVEN** a `ticket-flow` folder with no `release.template.md`
- **WHEN** the structural check runs
- **THEN** it reports the missing file
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow without its release template is refused"

### Requirement: TICKET-15 — A release enters Ready for prod only when its batch is proven

`refine-ticket` SHALL move the release ticket of a version V to Ready for prod only when it lists
every ticket whose target version is V, a dropped one aside (TICKET-32), and each one is Done,
except a hotfix, which is at Ready to merge into the production branch the layer names with every
Ready to merge condition met against that branch's current tip; the default branch's CI is green;
and the QA of each area the batch touches has checked it on staging or preview, with evidence on
the release ticket. `ticket-flow`'s Ready for prod row and § Release stage, `release-ticket`
Step 1 and `release.template.md` SHALL state the same rule and the same exception.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an area not checked on staging

- **GIVEN** a release ticket whose batch touches web and backend, with web evidence only
- **WHEN** the architect would move it to Ready for prod
- **THEN** it stays in Refinement, and the backend QA is asked to check it on staging
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: a hotfix release

- **GIVEN** a release ticket of its own that lists one hotfix at Ready to merge into the
  production branch, green and current with that branch's tip, with its staging evidence
- **WHEN** the architect would move it to Ready for prod
- **THEN** it moves it, although the hotfix is not Done
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: a hotfix behind the production branch

- **GIVEN** a release that lists a hotfix whose branch no longer holds the production branch's
  current tip, because another release merged since
- **WHEN** the CI/CD session reads the release at Step 1
- **THEN** it comments that the hotfix is behind, messages the architect `<release-id> question`,
  and stops
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

#### Scenario: a dropped ticket of the version

- **GIVEN** a release of 1.4, every ticket of 1.4 Done but one that is Dropped
- **WHEN** the CI/CD session reads the release at Step 1
- **THEN** it finds nothing missing: the dropped ticket is not listed, and the release goes on
- **Test:** Not covered — the rule is a procedure the architect and CI/CD sessions follow; no
  runner drives a session

### Requirement: TICKET-25 — The architect keeps the merge queue and merges one pull request at a time

`refine-ticket` § Merge queue SHALL keep one merge queue: every pull request at Ready to merge
into the default branch, each with its evidence link, and the architect's own closed ticket
catalog pull request (TICKET-31), in the merge order the architect sets, shown to the owner in the
architect's session. The architect SHALL ask for or merge only the pull request at the head of the
queue, and only while the project layer's merge gate, when it names one, passes and every Ready
to merge condition holds (CI green, no conflict, the branch holding the default branch's current
tip); a ticket's pull request that fails one SHALL go back to its QA as `<id> bring current`, and
the closed ticket catalog pull request SHALL be brought current by the architect itself. It SHALL
merge on the owner's word, asked in the architect's own session, under the `manual` policy or
when the project layer records none; and, under `low-risk`, without asking only a pull request
whose Risk line is `Risk: none` or that changes only passive files, and whose merge sets off no
irreversible step, recording on the ticket, or on the ticket or release ticket the closed ticket
catalog pull request records, that it merged under `low-risk` and what it relied on. A pull
request that fails one condition SHALL wait for the owner, as under `manual`. After each merge of
a ticket's pull request the architect SHALL move the ticket to Done and message the ticket's QA
and dev sessions `<id> merged`, and after every merge it SHALL message the QA of the next pull
request in the queue `<id> bring current`, or bring that one current itself when it is the closed
ticket catalog pull request, which no QA holds. `ticket-flow`'s states table SHALL name the
architect as the session that enters Done, a hotfix aside (TICKET-24), and its § Messages SHALL
carry `<id> ready to merge, PR #<n>`, from QA to the architect, and `<id> bring current`, from
the architect to QA. The structural check SHALL hold `refine-ticket` to have a § Merge queue.

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

### Requirement: TICKET-26 — Every ticket carries a target version

Every ticket of the flow, whatever its type (`feature`, `fix`, `tech` or `chore`; a test or docs
ticket is a `tech` one), SHALL carry a target version, so every ticket the flow delivers closes
through a release; a dropped ticket keeps its target version as a record, and no release lists
it (TICKET-32). `po-ticket` SHALL create no ticket without one, asking the client when nobody
said. `refine-ticket` SHALL move no ticket past Refinement without one: a ticket with none (under
the GitHub Issues adapter, an issue with no milestone) SHALL stop there while the architect
proposes a version on the ticket, messages the PO `<id> version change` and waits for
`<id> version set`. A technical ticket the architect files SHALL get its version the same way,
the PO being the only session that runs `set version`. `ticket-flow` § Target version SHALL say
where the rule is checked, since no gate reads the board. `ticket.template.md` SHALL mark the
version required, and the structural check SHALL hold its Target version section to name
`**Version (required):**`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the ticket template marks its version required
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the ticket template does not mark the version required

- **GIVEN** a `ticket.template.md` whose Target version section never names
  `**Version (required):**`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket template that does not mark its version required is refused"

#### Scenario: an issue with no milestone

- **GIVEN** a project on the GitHub Issues adapter, and a ticket in Refinement whose issue has no
  milestone
- **WHEN** the architect would move it to Ready for dev
- **THEN** it stays in Refinement; the architect proposes a version on the ticket, messages the
  PO `<id> version change`, and dispatches it only after `<id> version set`
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and no gate reads the board: `scripts/verify-ticket-branch.mjs` judges a branch and
  a pull request body only, and the template ships no board check, its board operations being
  the commands the project layer's adapter declares

#### Scenario: a technical ticket

- **GIVEN** a finding the architect files as a `tech` ticket
- **WHEN** the architect creates it
- **THEN** it proposes the ticket's version on it and messages the PO `<id> version change`; the
  PO sets it and answers `<id> version set`
- **Test:** Not covered — the rule is a procedure the architect and PO sessions follow; no runner
  drives a session

#### Scenario: a requirement with no version

- **GIVEN** a client requirement that names no version
- **WHEN** the PO writes its ticket
- **THEN** the PO asks the client, and creates the ticket only with a version
- **Test:** Not covered — the rule is a procedure a PO session follows; no runner drives a session

### Requirement: TICKET-28 — The board is the source of every open ticket

`ticket-flow` § Board operations SHALL state that the board is the source of every open ticket,
its content included, and that nothing in the repository writes or mirrors one: the general plan
records a ticket only once it is closed or dropped (TICKET-29). The template of the project
layer, `.claude/skills/process-intake/ticket-flow.template.md`, SHALL state the same in its
§ Board adapter, and `process-intake` § Step 3 SHALL tell the team so. The structural check SHALL
hold both sections to name `source of every open ticket`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the contract and the process template make the
  board the source of every open ticket
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the contract does not make the board the source

- **GIVEN** a `ticket-flow` whose § Board operations never names `source of every open ticket`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose board operations do not make the board the source of open tickets is refused"

#### Scenario: the process template does not make the board the source

- **GIVEN** a process template whose § Board adapter never names `source of every open ticket`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose board adapter does not make the board the source of open tickets is refused"

#### Scenario: a plan asked to list the backlog

- **GIVEN** a project with a ticket flow, and a request to list the open tickets in the general
  plan
- **WHEN** a session of the flow reads the request
- **THEN** it points at the board, through the layer's § Board adapter, and copies no open ticket
  into the repository
- **Test:** Not covered — the rule is a procedure a session follows; no runner drives a session,
  and no gate reads the board

### Requirement: TICKET-29 — The architect records each closed or dropped ticket in the plan's catalog, and the PO does no repository work

`refine-ticket` § Record the closed tickets SHALL, on a close outside a release, on
`<release-id> released` and on a drop, `read` and `read version` on the board each ticket that
closed or was dropped, and record it as one row of docs/GENERAL_PLAN.md § Closed Ticket Catalog,
through `general-plan`, copied from its board page: a closed ticket in the delivered tickets'
table, a dropped one in its `### Dropped tickets` table (TICKET-32), in one pull request per close
or release, a drop counting as a close; and it SHALL copy no open ticket into the plan. The PO
SHALL do no repository work: `po-ticket` SHALL say so, and its CONTRACT SHALL list no `edits`; it
keeps the scope and the board, copies the ticket template to a scratch file outside the
repository, and on `<id> closed` or `<release-id> released` records nothing. `ticket-flow`'s
Closed and Released rows, its § Board operations and its PO and Architect roles, and the process
template's § Board adapter, SHALL say that the architect records the closed tickets in that
catalog. The structural check SHALL hold `refine-ticket` to have § Record the closed tickets,
naming `§ Closed Ticket Catalog`, `one pull request per close or release` and
`` `### Dropped tickets` ``, and `po-ticket` to name no `edits:`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the architect records the closed and dropped
  tickets, one pull request per close or release, and the PO edits no file
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the architect's close step is gone

- **GIVEN** a `refine-ticket` with no § Record the closed tickets
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging the text it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket without its close step is refused"

#### Scenario: the close step names no catalog

- **GIVEN** a `refine-ticket` whose close step never names `§ Closed Ticket Catalog`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose close step names no closed ticket catalog is refused"

#### Scenario: the close step opens no pull request per close

- **GIVEN** a `refine-ticket` whose close step never names `one pull request per close or release`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose close step does not open one pull request per close or release is refused"

#### Scenario: the close step does not record a drop apart

- **GIVEN** a `refine-ticket` whose close step never names `` `### Dropped tickets` ``
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose close step does not record a dropped ticket apart is refused"

#### Scenario: the PO edits the repository

- **GIVEN** a `po-ticket` whose CONTRACT lists `edits:` with docs/GENERAL_PLAN.md
- **WHEN** the structural check runs
- **THEN** it reports one finding, of the forbidden kind, naming the file and `edits:`
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket that edits a repository file is refused"

#### Scenario: a release of three tickets

- **GIVEN** a release that lists three tickets, and the CI/CD session's `<release-id> released`
- **WHEN** the architect closes them
- **THEN** it reads the three tickets on the board, adds three rows to § Closed Ticket Catalog in
  one pull request, changes no other part of the plan for them, and messages the PO
  `<release-id> released`; the PO records nothing
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and no gate reads the board to compare its closed tickets with the catalog

### Requirement: TICKET-30 — The general plan of a project with a ticket flow names no open ticket

`.claude/skills/general-plan/validate-general-plan.mjs` SHALL judge that a project has a ticket
flow when process/ticket-flow.md sits beside the plan, in its `docs/` folder. With a ticket
flow it SHALL fail, naming the check, a plan whose text outside HTML comments has no
`## Closed Ticket Catalog` section, whose catalog section holds no
`| Ticket | Title | Type | Version | Closed | Pull request |` table, or whose What's PENDING
section does not name process/ticket-flow.md, its pointer to the board; it SHALL not require the
catalog's `### Dropped tickets` table. Without a ticket flow it SHALL require none of the three,
and judge the plan as it did before. It SHALL judge a plan checked out with CRLF line endings as
it judges one with LF. `general-plan`'s SKILL.md SHALL say that the plan of a project with a
ticket flow names no open ticket: What's PENDING points at the board, the Path to Launch names
target versions, and § Closed Ticket Catalog holds one row per closed ticket, and one row per
dropped ticket in its `### Dropped tickets` table, never among the delivered ones, required with
a ticket flow and left out without one. `general-plan.template.md` SHALL carry that section with
both tables and the PENDING pointer, so the template passes the validator with a ticket flow and
without one.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a plan that records closed tickets only

- **GIVEN** a project with docs/process/ticket-flow.md, and a plan with § Closed Ticket Catalog,
  its table, and a PENDING section that points at the board through docs/process/ticket-flow.md,
  and no `### Dropped tickets` table
- **WHEN** `node .claude/skills/general-plan/validate-general-plan.mjs docs/GENERAL_PLAN.md` runs
- **THEN** it exits 0, with a PASS line for each of the three checks
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow, its closed ticket catalog and a pending section that points at the board passes"

#### Scenario: no catalog

- **GIVEN** a project with a ticket flow, and a plan with no § Closed Ticket Catalog
- **WHEN** the validator runs
- **THEN** it exits 1, with a FAIL line naming the section
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow and no closed ticket catalog fails"

#### Scenario: a catalog with no table

- **GIVEN** a project with a ticket flow, and a § Closed Ticket Catalog that holds no catalog
  table
- **WHEN** the validator runs
- **THEN** it exits 1, with a FAIL line naming the table it owes
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow whose closed ticket catalog holds no table fails"

#### Scenario: pending work that does not point at the board

- **GIVEN** a project with a ticket flow, and a PENDING section of backlog rows that never names
  process/ticket-flow.md
- **WHEN** the validator runs
- **THEN** it exits 1, with a FAIL line naming the pointer it owes
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow whose pending section does not point at the board fails"

#### Scenario: a project with no ticket flow

- **GIVEN** a plan with no § Closed Ticket Catalog and a PENDING section of backlog rows, and no
  docs/process/ticket-flow.md
- **WHEN** the validator runs
- **THEN** it exits 0, and prints no check of the catalog or the pointer
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with no ticket flow passes without a closed ticket catalog"

#### Scenario: an empty PENDING section with no ticket flow

- **GIVEN** a project with no ticket flow, and a plan whose PENDING section is empty
- **WHEN** the validator runs
- **THEN** it exits 1, as it did before this change
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with no ticket flow and an empty pending section still fails"

#### Scenario: a Windows checkout

- **GIVEN** a well-formed plan whose lines end in CRLF
- **WHEN** the validator runs
- **THEN** it exits 0, as it does for the same plan with LF
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan checked out with CRLF line endings passes"

#### Scenario: the template

- **GIVEN** `general-plan.template.md`, its `### Dropped tickets` table included, copied as a
  project's plan once beside a ticket flow and once with none
- **WHEN** the validator runs over each
- **THEN** it exits 0 both times
- **Test:** `.claude/skills/general-plan/validate-general-plan.test.mjs` › "the plan template passes with a ticket flow and without one"

#### Scenario: a plan that names an open ticket

- **GIVEN** a project with a ticket flow, and a plan whose PENDING section lists an open ticket
  beside its pointer to the board
- **WHEN** the validator runs
- **THEN** it exits 0: nothing tells an open ticket from a closed one without the board
- **Test:** Not covered — only the review of the plan's pull request reads which tickets it names;
  no gate reads the board

#### Scenario: a dropped ticket among the delivered ones

- **GIVEN** a project with a ticket flow, and a plan whose delivered tickets' table holds a row of
  a dropped ticket
- **WHEN** the validator runs
- **THEN** it exits 0: nothing tells a dropped ticket from a delivered one without the board
- **Test:** Not covered — only the architect's board check (TICKET-31) and the review of the
  plan's pull request read it; no gate reads the board

### Requirement: TICKET-31 — The architect's closed ticket catalog pull request joins its merge queue, checked against the board

Once the pull request of `refine-ticket` § Record the closed tickets is open, the architect SHALL
queue it at once in its merge queue, in the merge order, with no message: `ticket-flow`
§ Messages SHALL carry no catalog line, since the session that opens it also merges it. It
carries no ticket of its own and no QA session holds it, so the architect SHALL meet the three
Ready to merge conditions itself, bringing it current by merging the default branch into the
catalog branch, never by a rebase, keeping every row of both sides when the table conflicts,
pushing unforced and checking it against the board again; its merge SHALL move no ticket and send
no `<id> merged`. Before the architect asks the owner for it or merges it, the architect SHALL
`read`, on the board through the project layer's adapter, every ticket the pull request adds a
catalog row for, SHALL check that each row its branch adds matches its board page in id, title,
target version and closing pull request, a dropped ticket's row in id, title and target version
and its drop record in reason and superseding ticket, and SHALL comment that check on the pull
request, each row with match or mismatch; the ask SHALL name that comment. A row that does not
match SHALL be corrected by the architect from its board page on the catalog branch and checked
again, and the pull request SHALL be asked for or merged only once every row matches. It SHALL
then follow the project layer's merge policy: on the owner's word under `manual`, and under
`low-risk` without asking, as a pull request that changes only a passive file, recorded on the
ticket or release ticket it records. When the project layer's merge gate fails for it, or the
host refuses its merge, the architect SHALL tell the owner, and the pull request SHALL wait in
the queue. The structural check SHALL hold `refine-ticket` § Merge queue to state that the
architect brings it current itself and that each added row matches its board page in id, title,
target version and closing pull request.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the architect's merge queue brings the catalog pull
  request current itself and checks each added row against the board
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the merge queue does not check the catalog against the board

- **GIVEN** a `refine-ticket` whose § Merge queue does not state that each added row matches its
  board page in id, title, target version and closing pull request
- **WHEN** the structural check runs
- **THEN** it reports one finding, of the mention kind, for `refine-ticket`, naming its
  SKILL.md, the section § Merge queue and the statement it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not check the catalog rows against the board is refused"

#### Scenario: the merge queue does not bring the catalog current

- **GIVEN** a `refine-ticket` whose § Merge queue never states that the architect brings the
  catalog pull request current itself
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not bring the catalog pull request current is refused"

#### Scenario: a release's catalog under `low-risk`

- **GIVEN** a project whose layer records `low-risk`, and the architect's catalog pull request of
  a release, `PR #88`, that changes only docs/GENERAL_PLAN.md and whose every row matches its
  board page
- **WHEN** the architect reaches it at the head of the queue, current with the default branch and
  its CI green
- **THEN** the architect comments the check on `PR #88`, every row a match, merges it without
  asking, comments on the release ticket that it merged under `low-risk` by changing only a
  passive file, moves no ticket and sends no `<id> merged`
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: a catalog row that does not match its board page

- **GIVEN** the architect's catalog pull request of a single close, whose row gives the ticket's
  target version as `1.2.0` while its board page gives `1.3.0`
- **WHEN** the architect checks it before asking the owner
- **THEN** it comments the check on the pull request, that row a mismatch of its target version,
  does not ask the owner, rewrites the row from the board page on the catalog branch, pushes it
  and checks it again from the first row; no message goes to the PO
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: two catalog pull requests in flight

- **GIVEN** two catalog pull requests that each add a row at the end of the catalog's table, the
  first merged
- **WHEN** the second reaches the head of the queue with a conflict
- **THEN** the architect merges the default branch into its branch, keeps both rows, pushes
  unforced, checks it against the board again, and only then asks for it or merges it
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session
