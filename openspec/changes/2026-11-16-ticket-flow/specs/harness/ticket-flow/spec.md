# Delta: harness/ticket-flow

> **Change:** `2026-11-16-ticket-flow`
> **ID prefix:** `TICKET`

## ADDED Requirements

### Requirement: TICKET-01 — The contract skill carries the whole flow

`.claude/skills/ticket-flow/SKILL.md` SHALL carry the contract every role reads first, as its
sections: a pre-flight that reads docs/process/ticket-flow.md and sends a team with no board
adapter to `process-intake`, the board operations with their GitHub Issues mapping, the states and
transitions naming each of the thirteen states (the ten of the build and the three of the
release), the seven board operations (`read version` and `set version` among them), the
architect as dispatcher, the messages, the roles naming each of the six (the CI/CD
role included), the rules every role follows, the ticket identity, what a ticket carries, the
Ready to merge conditions and the release stage, beside two templates in its folder:
`ticket.template.md`, the body a ticket is written from, with its target version, and
`release.template.md`, the body of a release ticket, with the one version it ships.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the contract of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:ticket-branch:test` runs
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

### Requirement: TICKET-02 — A role skill sends its reader to the contract and never restates it

`po-ticket`, `refine-ticket`, `dev-ticket`, `qa-ticket` and `release-ticket` SHALL each open, in
the first paragraph after their title, by sending the reader to `.claude/skills/ticket-flow/SKILL.md`, and hold
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

Each of the seven ticket skills SHALL have a `SKILL.md` whose frontmatter `name` is its folder,
whose description holds `USE WHEN:` and `DO NOT USE:`, and which has a `## CONTRACT` and an
`## Output` section.

**Evidence:** written at apply time, when the code exists.

#### Scenario: healthy skills

- **GIVEN** seven synthetic ticket skills with every section
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
- **THEN** it reports the missing `SKILL.md`, rather than judging six skills green
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
for each of the seven operations: create, read, move, comment, link, read version and set
version), the states, the roles and
sessions, the approvals, the merge policy, the ticket identity, the branch check in CI, the deploy
targets (a table of each target's kind, trigger, order, check, rollback and secret store) and the
branching model.

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

#### Scenario: no deploy targets section

- **GIVEN** a process template with no deploy targets section
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a process template without the deploy targets section is refused"

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

### Requirement: TICKET-14 — The release skill carries the release, and the architect groups it

`.claude/skills/release-ticket/SKILL.md` SHALL carry sections for the deploy targets, the
branching (the recommended default with a `production` branch, and the tags-only alternative),
the migrations and the hotfix, and `.claude/skills/refine-ticket/SKILL.md` a section that groups
Done tickets into a release ticket.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the branching is gone

- **GIVEN** a `release-ticket` with no branching section
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a release-ticket without its branching section is refused"

#### Scenario: the alternative is gone

- **GIVEN** a `release-ticket` whose branching section never names the tags-only alternative
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the section and what it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a release-ticket whose branching names no tags-only alternative is refused"

#### Scenario: the architect cannot group a release

- **GIVEN** a `refine-ticket` with no section that groups a release
- **WHEN** the structural check runs
- **THEN** it reports the missing section
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket without its release step is refused"

### Requirement: TICKET-15 — A release enters Ready for prod only when its batch is proven

`refine-ticket` SHALL move the release ticket of a version V to Ready for prod only when it lists
every ticket whose target version is V and each one is Done, the default branch's CI is green, and the QA of each area the batch touches has checked it
on staging or preview, with evidence on the release ticket.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an area not checked on staging

- **GIVEN** a release ticket whose batch touches web and backend, with web evidence only
- **WHEN** the architect would move it to Ready for prod
- **THEN** it stays in Refinement, and the backend QA is asked to check it on staging
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

### Requirement: TICKET-16 — Each deploy target runs on the owner's word, in order, checked

`release-ticket` SHALL run the deploy targets a release touches in the order the project layer
declares, only on the owner's word for the release and for each irreversible step, recorded on
the release ticket, check each target, run a failed target's declared rollback and stop the
release, and read every deploy secret from the store the target names, never from a ticket.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a target fails its check

- **GIVEN** a release whose migration target passed and whose web target fails its check
- **WHEN** the CI/CD role reads the check
- **THEN** it runs the web target's rollback, runs no later target, comments on the release
  ticket and messages the architect that the target failed
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session or a deploy

### Requirement: TICKET-17 — A migration in a release keeps the live app running

`release-ticket` SHALL ship only backward-compatible migrations, expanding the schema in one
release and contracting it in a later one, so a mobile app version already in the store keeps
running against the new schema, and declare a migration's rollback as a forward fix.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a column the live app still reads

- **GIVEN** a release whose migration drops a column the store version of the app reads
- **WHEN** the CI/CD role reads the release ticket
- **THEN** it stops, comments that the drop needs its own later release, and messages the
  architect
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

### Requirement: TICKET-18 — A target version moves only through the PO

`po-ticket` SHALL set a ticket's target version when it creates the ticket, and move it only once
the PO confirms the architect's proposal on the ticket, refreshing the general plan.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the plan cannot meet the version

- **GIVEN** a ticket aimed at 1.4 whose plan needs two more weeks
- **WHEN** the architect refines it
- **THEN** the architect proposes 1.5 on the ticket and messages the PO, and the version stays
  1.4 until the PO sets it
- **Test:** Not covered — the rule is a procedure the architect and PO sessions follow; no runner
  drives a session

### Requirement: TICKET-19 — A merged ticket aimed at a later version is settled before a release

`release-ticket` SHALL flag, before a release enters In release, every ticket merged since the
last release whose target version is later than the release's, and go on only once each one sits
behind a feature flag the architect names or its target version has moved to the release's.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a 1.5 feature merged before the 1.4 release

- **GIVEN** a release of 1.4 and a merged ticket aimed at 1.5 with no feature flag
- **WHEN** the CI/CD session reads the release
- **THEN** it flags the ticket on the release ticket, messages the architect, and asks the owner
  nothing until the ticket is settled
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session
