# Delta: harness/ticket-flow

> **Change:** `2026-11-16-ticket-flow`
> **ID prefix:** `TICKET`

## ADDED Requirements

### Requirement: TICKET-01 — The contract skill carries the whole flow

`.claude/skills/ticket-flow/SKILL.md` SHALL carry the contract every role reads first, as its
sections: a pre-flight that reads docs/process/ticket-flow.md and sends a team with no board
adapter to `process-intake`, the board operations with their GitHub Issues mapping, the states and
transitions naming each of the ten states, the architect as dispatcher, the messages, the rules
every role follows, the ticket identity, what a ticket carries and the Ready to merge conditions,
beside `ticket.template.md`, the body a ticket is written from, in its folder.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the contract of the repository

- **GIVEN** the repository's six ticket skills
- **WHEN** `pnpm verify:ticket-branch:test` runs
- **THEN** the structural check finds nothing
- **Test:** `scripts/verify-skills.test.mjs` › "the six ticket skills of the repository pass"

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

### Requirement: TICKET-02 — A role skill sends its reader to the contract and never restates it

`po-ticket`, `refine-ticket`, `dev-ticket` and `qa-ticket` SHALL each open, in the first paragraph
after their title, by sending the reader to `.claude/skills/ticket-flow/SKILL.md`, and hold
neither the contract's states table nor its board operations table.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a role skill that does not open with the contract

- **GIVEN** a `dev-ticket` whose first paragraph names no `ticket-flow`
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the skill
- **Test:** `scripts/verify-skills.test.mjs` › "a role skill that does not open with ticket-flow is refused"

#### Scenario: a role skill that copies the states table

- **GIVEN** a `qa-ticket` that holds the contract's states table header
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the skill and the copied table
- **Test:** `scripts/verify-skills.test.mjs` › "a role skill that copies the states table is refused"

#### Scenario: a role skill that copies the board operations table

- **GIVEN** a `po-ticket` that holds the contract's board operations table header
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a role skill that copies the board operations table is refused"

### Requirement: TICKET-03 — Every ticket skill has the shape of a template skill

Each of the six ticket skills SHALL have a `SKILL.md` whose frontmatter `name` is its folder,
whose description holds `USE WHEN:` and `DO NOT USE:`, and which has a `## CONTRACT` and an
`## Output` section.

**Evidence:** written at apply time, when the code exists.

#### Scenario: healthy skills

- **GIVEN** six synthetic ticket skills with every section
- **WHEN** the structural check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-skills.test.mjs` › "healthy ticket skills pass"

#### Scenario: a Windows checkout

- **GIVEN** the same skills with CRLF line endings
- **WHEN** the structural check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-skills.test.mjs` › "a skill checked out with CRLF line endings passes"

#### Scenario: a name that is not its folder

- **GIVEN** a `refine-ticket` whose frontmatter says `name: refine`
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the folder and the name
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket skill whose name is not its folder is refused"

#### Scenario: no DO NOT USE

- **GIVEN** a `po-ticket` whose description has no `DO NOT USE:`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket skill without DO NOT USE is refused"

#### Scenario: no CONTRACT

- **GIVEN** a `qa-ticket` with no `## CONTRACT` section
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket skill without its CONTRACT section is refused"

#### Scenario: a skill that is gone

- **GIVEN** a tree with no `dev-ticket` folder
- **WHEN** the structural check runs
- **THEN** it reports the missing `SKILL.md`, rather than judging five skills green
- **Test:** `scripts/verify-skills.test.mjs` › "a missing ticket skill is caught, not skipped"

#### Scenario: the check as a process

- **GIVEN** a scratch tree that lacks a ticket skill, then the repository itself
- **WHEN** `node scripts/verify-skills.mjs --root <tree>` runs
- **THEN** it exits 1 naming the missing skill, and over the repository exits 0 with a line that
  states what it judged and what it does not cover
- **Test:** `scripts/verify-skills.test.mjs` › "the check run over a tree that lacks a ticket skill exits 1 and names it", "the check exits 0 over the repository and states what it judged"

### Requirement: TICKET-04 — process-intake ships the template of the project layer

`.claude/skills/process-intake/` SHALL hold `ticket-flow.template.md`, the template of a
project's docs/process/ticket-flow.md, with sections for the board adapter (its kind and a row
for each of the five operations: create, read, move, comment and link), the states, the roles and
sessions, the approvals, the merge policy, the ticket identity and the branch check in CI.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no board adapter section

- **GIVEN** a process template with no board adapter section
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a process template without the board adapter section is refused"

#### Scenario: an operation left out

- **GIVEN** a process template whose adapter table has no `link` row
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the operation
- **Test:** `scripts/verify-skills.test.mjs` › "a process template that leaves out a board operation is refused"

#### Scenario: the template is gone

- **GIVEN** a `process-intake` folder with no `ticket-flow.template.md`
- **WHEN** the structural check runs
- **THEN** it reports the missing file
- **Test:** `scripts/verify-skills.test.mjs` › "a missing process template is caught, not skipped"

### Requirement: TICKET-05 — A ticket branch whose body names its id passes

`scripts/verify-ticket-branch.mjs` SHALL pass a branch `<type>/<id>-<slug>`, whose type is
`feature`, `fix`, `tech` or `chore`, whose id is a number or an upper-case key, a hyphen and a
number, and whose slug is lower-case kebab, when the pull request body names that id: `#<number>`
for a number, the key itself for a keyed id.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a GitHub issue

- **GIVEN** the branch `feature/123-add-sign-in` and a body that says `Refs #123`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a ticket branch whose pull request body names its issue passes"

#### Scenario: a keyed id

- **GIVEN** the branch `fix/PROJ-42-null-total` and a body that names `PROJ-42`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch with a keyed id and a body that names the key passes"

### Requirement: TICKET-06 — A branch without the ticket shape is refused

`scripts/verify-ticket-branch.mjs` SHALL refuse, naming the branch and the shape
`<type>/<id>-<slug>`, a branch with no type before a `/`, an unknown type, no id, or no slug.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no id

- **GIVEN** the branch `feature/add-sign-in`
- **WHEN** the check runs
- **THEN** it reports one finding: the branch has no id
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch with no id is refused"

#### Scenario: an unknown type

- **GIVEN** the branch `feat/123-add-sign-in` and a body that names `#123`
- **WHEN** the check runs
- **THEN** it reports one finding, naming the four types
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch with an unknown type is refused"

#### Scenario: no slug

- **GIVEN** the branch `feature/123` and a body that names `#123`
- **WHEN** the check runs
- **THEN** it reports one finding: the slug is missing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch missing the slug is refused"

#### Scenario: no type

- **GIVEN** the branch `123-add-sign-in`
- **WHEN** the check runs
- **THEN** it reports one finding, naming the shape
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch with no type is refused"

#### Scenario: what a finding says

- **GIVEN** a refused branch
- **WHEN** the check runs
- **THEN** the finding names the branch and the shape it owes
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a finding names the branch and the shape it owes"

### Requirement: TICKET-07 — A body that does not name the branch's id is refused

`scripts/verify-ticket-branch.mjs` SHALL refuse a pull request body that does not name the
branch's id, naming the id it owes and the ids it names instead, a longer id that only starts with
it included.

**Evidence:** written at apply time, when the code exists.

#### Scenario: another id

- **GIVEN** the branch `feature/123-add-sign-in` and a body that says `Refs #124`
- **WHEN** the check runs
- **THEN** it reports one finding, naming `#123` and `#124`
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a body that names another id is refused"

#### Scenario: a longer number

- **GIVEN** the branch `feature/123-add-sign-in` and a body that says `Refs #1234`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer id is refused"

#### Scenario: a longer key

- **GIVEN** the branch `fix/PROJ-42-null-total` and a body that names `PROJ-421`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer key is refused"

### Requirement: TICKET-08 — The branch check runs as a process

`node scripts/verify-ticket-branch.mjs --branch <name> --body <text>` SHALL exit 1 with each
finding on stderr, or exit 0 with a line that states what it judged and what it does not cover.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a refusal

- **GIVEN** the branch `feature/123-add-sign-in` and a body that says `Refs #124`
- **WHEN** the check runs as a process
- **THEN** it exits 1 and its stderr names `#123`
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check exits 1 and names the id the body owes"

#### Scenario: a pass

- **GIVEN** the branch `feature/123-add-sign-in` and a body that says `Refs #123`
- **WHEN** the check runs as a process
- **THEN** it exits 0, and its stdout says PASS, what it judged and what it does not cover
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check exits 0 and states what it judged"

### Requirement: TICKET-09 — The template's gate runs the tests, not the check

The template's `pnpm validate` SHALL run `pnpm verify:ticket-branch:test` and never
`pnpm verify:ticket-branch`, as the template's own branches carry no ticket id.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the validate script

- **GIVEN** the root `package.json`
- **WHEN** its `validate` script is read
- **THEN** it runs `verify:ticket-branch:test` and does not run `verify:ticket-branch` alone
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the template's validate runs the tests and not the check"

### Requirement: TICKET-10 — A ticket enters Ready for dev only when nothing blocks it

`refine-ticket` SHALL move a ticket to Ready for dev only when every ticket it depends on is Done
and no ticket in flight reserves a file it reserves, the architect sequencing two such tickets by
making the second depend on the first or re-planning one.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a dependency still in dev

- **GIVEN** a refined ticket that depends on a ticket In dev
- **WHEN** the architect finishes its plan
- **THEN** the ticket stays in Refinement, and a comment names the dependency
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and the structural check only proves the contract names the state

### Requirement: TICKET-11 — Ready to merge means green, conflict-free and current, merged one at a time

`qa-ticket` SHALL move a ticket to Ready to merge only when its pull request's CI is green, it has
no conflict with the default branch and its branch contains the default branch's current tip,
brought current and re-checked by QA, and ask the owner for one merge at a time, in the
order the architect sets.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a green branch behind its base

- **GIVEN** a ticket whose checks passed on a branch the default branch has moved past
- **WHEN** QA would ask the owner to merge it
- **THEN** QA brings the branch current, re-runs the checks, and asks only once they pass
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

### Requirement: TICKET-12 — QA evidence lives in a pull request comment

`qa-ticket` SHALL post its evidence as a comment on the ticket's pull request, screenshots for a
UI area and query or test output as text for a backend area, link that comment from the ticket,
and add nothing to the repository.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a UI area

- **GIVEN** a web ticket whose end-to-end checks passed
- **WHEN** QA records the evidence
- **THEN** the pull request carries a comment with the screenshots and the ticket links it
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

### Requirement: TICKET-13 — process-intake reads only what it may, and asks for the rest

`process-intake` SHALL read a process document's link through a configured MCP connector, or
through a plain fetch only when the page is public, ask the team to paste the document otherwise,
never scrape a page that needs a login, and with nothing to read propose the core states and ask
the team to confirm them.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a link behind a login

- **GIVEN** a Confluence link and no Atlassian connector configured
- **WHEN** `process-intake` runs
- **THEN** it asks the team to paste the document and fetches nothing
- **Test:** Not covered — the rule is a procedure an agent follows; no runner drives a session
