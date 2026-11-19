# Delta: harness/ticket-flow

> **Change:** `2026-11-18-board-is-the-source`

## ADDED Requirements

### Requirement: TICKET-28 — The board is the source of every open ticket

`ticket-flow` § Board operations SHALL state that the board is the source of every open ticket,
its content included, and that nothing in the repository writes or mirrors one: the general plan
records a ticket only once it is closed (TICKET-29). The template of the project layer,
`.claude/skills/process-intake/ticket-flow.template.md`, SHALL state the same in its § Board
adapter, and `process-intake` § Step 3 SHALL tell the team so. The structural check SHALL hold
both sections to name `source of every open ticket`.

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

### Requirement: TICKET-29 — The PO records each closed ticket in the plan's closed ticket catalog

`po-ticket` § Step 6 — Record the closed tickets SHALL, on `<id> closed` or
`<release-id> released`, `read` each ticket that closed and record it as one row of
docs/GENERAL_PLAN.md § Closed Ticket Catalog, through `general-plan`, in one pull request per
close or release, and SHALL copy no open ticket into the plan. No other step of `po-ticket` SHALL
edit the plan. `ticket-flow`'s Closed and Released rows and its PO role SHALL say that the PO
records the closed tickets in that catalog. The structural check SHALL hold `po-ticket` to have
§ Step 6 — Record the closed tickets, naming `§ Closed Ticket Catalog` and
`one pull request per close or release`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the PO records closed tickets, one pull request
  per close or release
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the PO's close step is gone

- **GIVEN** a `po-ticket` with no § Step 6 — Record the closed tickets
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging the text it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket without its close step is refused"

#### Scenario: the close step names no catalog

- **GIVEN** a `po-ticket` whose close step never names `§ Closed Ticket Catalog`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket whose close step names no closed ticket catalog is refused"

#### Scenario: the close step opens no pull request per close

- **GIVEN** a `po-ticket` whose close step never names `one pull request per close or release`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a po-ticket whose close step does not open one pull request per close or release is refused"

#### Scenario: a release of three tickets

- **GIVEN** a release that lists three tickets, and the PO's `<release-id> released`
- **WHEN** the PO records the close
- **THEN** it reads the three tickets on the board, adds three rows to § Closed Ticket Catalog in
  one pull request, and changes no other part of the plan for them
- **Test:** Not covered — the rule is a procedure a PO session follows; no runner drives a
  session, and no gate reads the board to compare its closed tickets with the catalog

### Requirement: TICKET-30 — The general plan of a project with a ticket flow names no open ticket

`.claude/skills/general-plan/validate-general-plan.mjs` SHALL judge that a project has a ticket
flow when process/ticket-flow.md sits beside the plan, in its `docs/` folder. With a ticket
flow it SHALL fail, naming the check, a plan whose text outside HTML comments has no
`## Closed Ticket Catalog` section, whose catalog section holds no
`| Ticket | Title | Type | Version | Closed | Pull request |` table, or whose What's PENDING
section does not name process/ticket-flow.md, its pointer to the board. Without a ticket flow
it SHALL require none of the three, and judge the plan as it did before. It SHALL judge a plan
checked out with CRLF line endings as it judges one with LF. `general-plan`'s SKILL.md SHALL say
that the plan of a project with a ticket flow names no open ticket: What's PENDING points at the
board, the Path to Launch names target versions, and § Closed Ticket Catalog holds one row per
closed ticket, required with a ticket flow and dropped without one. `general-plan.template.md`
SHALL carry that section with its table and the PENDING pointer, so the template passes the
validator with a ticket flow and without one.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a plan that records closed tickets only

- **GIVEN** a project with docs/process/ticket-flow.md, and a plan with § Closed Ticket Catalog,
  its table, and a PENDING section that points at the board through docs/process/ticket-flow.md
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

- **GIVEN** `general-plan.template.md`, copied as a project's plan once beside a ticket flow and
  once with none
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

## MODIFIED Requirements

### Requirement: TICKET-18 — A target version moves only through the PO

`po-ticket` SHALL set a ticket's target version when it creates the ticket, and move it only once
the PO confirms the architect's proposal on the ticket. A move SHALL change the board only: the
general plan names no open ticket (TICKET-29), so neither `po-ticket` § Step 5 nor `ticket-flow`
§ Target version edits it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the plan cannot meet the version

- **GIVEN** a ticket aimed at 1.4 whose plan needs two more weeks
- **WHEN** the architect refines it
- **THEN** the architect proposes 1.5 on the ticket and messages the PO, and the version stays
  1.4 until the PO sets it
- **Test:** Not covered — the rule is a procedure the architect and PO sessions follow; no runner
  drives a session

#### Scenario: a confirmed move

- **GIVEN** the architect's proposal to move a ticket from 1.4 to 1.5, and the PO's confirmation
- **WHEN** the PO sets the version
- **THEN** it runs `set version`, comments the confirmation and messages the architect
  `<id> version set`, and edits no file of the repository
- **Test:** Not covered — the rule is a procedure a PO session follows; no runner drives a session

### Requirement: TICKET-26 — Every ticket carries a target version

Every ticket of the flow, whatever its type (`feature`, `fix`, `tech` or `chore`; a test or docs
ticket is a `tech` one), SHALL carry a target version, so every ticket closes through a release.
`po-ticket` SHALL create no ticket without one, asking the client when nobody said. `refine-ticket`
SHALL move no ticket past Refinement without one: a ticket with none (under the GitHub Issues
adapter, an issue with no milestone) SHALL stop there while the architect proposes a version on
the ticket, messages the PO `<id> version change` and waits for `<id> version set`. A technical
ticket the architect files SHALL get its version the same way, the PO being the only session that
runs `set version`. `ticket-flow` § Target version SHALL say where the rule is checked, since no
gate reads the board. `ticket.template.md` SHALL mark the version required, and the structural
check SHALL hold its Target version section to name `**Version (required):**`.

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:86`, `.claude/skills/ticket-flow/SKILL.md:249`,
`.claude/skills/ticket-flow/SKILL.md:251`, `.claude/skills/po-ticket/SKILL.md:47`,
`.claude/skills/po-ticket/SKILL.md:57`, `.claude/skills/refine-ticket/SKILL.md:37`,
`.claude/skills/refine-ticket/SKILL.md:39`, `.claude/skills/refine-ticket/SKILL.md:70`,
`.claude/skills/refine-ticket/SKILL.md:109`, `.claude/skills/ticket-flow/ticket.template.md:23`,
`scripts/verify-skills.mjs:203`, `scripts/verify-skills.mjs:242`

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
