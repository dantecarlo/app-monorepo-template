# harness/ticket-flow — living spec

> **Governs:** `.claude/skills/ticket-flow`, `.claude/skills/po-ticket`, `.claude/skills/refine-ticket`, `.claude/skills/dev-ticket`, `.claude/skills/qa-ticket`, `.claude/skills/release-ticket`, `.claude/skills/process-intake`, `scripts/verify-skills.mjs`, `scripts/verify-ticket-branch.mjs`
> **ID prefix:** `TICKET`
> **Derived from:** `openspec/changes/archive/2026-11-16-ticket-flow/source-spec.md`, `docs/harness.md`
> **Verified against the code:** 2026-11-17 at `d08c097`

## Purpose

The ticket-flow unit of the harness lets several long-lived sessions (a PO, an architect, dev and
QA sessions per area, a CI/CD session) work one product with the ticket as the only carrier of
context. It owns the seven skills that hold the flow (the `ticket-flow` contract, the five role
procedures and `process-intake`), their three templates, the structural check that holds the
skills to their sections, and the pure branch check a project may add to its CI, which judges a
branch under the ticket identity the project's layer declares. Each project's
own layer, docs/process/ticket-flow.md, belongs to that project; the SDD lifecycle a ticket's
specs run through belongs to the sdd skill; the end-to-end harness QA runs belongs to the e2e
docs; and the gate helpers both checks use belong to the rest of the harness.

## Requirements

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

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:29`, `.claude/skills/ticket-flow/SKILL.md:43`,
`.claude/skills/ticket-flow/SKILL.md:77`, `.claude/skills/ticket-flow/SKILL.md:140`,
`.claude/skills/ticket-flow/SKILL.md:289`, `.claude/skills/ticket-flow/ticket.template.md:21`,
`.claude/skills/ticket-flow/release.template.md:11`, `scripts/verify-skills.mjs:176`

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

### Requirement: TICKET-02 — A role skill sends its reader to the contract and never restates it

`po-ticket`, `refine-ticket`, `dev-ticket`, `qa-ticket` and `release-ticket` SHALL each open, in
the first paragraph after their title, by sending the reader to `.claude/skills/ticket-flow/SKILL.md`, and hold
neither the contract's states table nor its board operations table.

**Evidence:** `.claude/skills/po-ticket/SKILL.md:18`, `.claude/skills/refine-ticket/SKILL.md:20`,
`.claude/skills/dev-ticket/SKILL.md:18`, `.claude/skills/qa-ticket/SKILL.md:18`,
`.claude/skills/release-ticket/SKILL.md:19`, `scripts/verify-skills.mjs:555`

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

**Evidence:** `scripts/verify-skills.mjs:501`, `scripts/verify-skills.mjs:589`,
`scripts/verify-skills.mjs:660`

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

#### Scenario: the check as a process, refusing

- **GIVEN** a scratch tree that lacks a ticket skill
- **WHEN** `node scripts/verify-skills.mjs --root <tree>` runs
- **THEN** it exits 1, naming the missing skill
- **Test:** `scripts/verify-skills.test.mjs` › "the check run over a tree that lacks a ticket skill exits 1 and names it"

#### Scenario: the check as a process, passing

- **GIVEN** the repository itself
- **WHEN** `node scripts/verify-skills.mjs` runs
- **THEN** it exits 0 with a line that states what it judged and what it does not cover
- **Test:** `scripts/verify-skills.test.mjs` › "the check exits 0 over the repository and states what it judged"

### Requirement: TICKET-04 — process-intake ships the template of the project layer

`.claude/skills/process-intake/` SHALL hold `ticket-flow.template.md`, the template of a
project's docs/process/ticket-flow.md, with sections for the board adapter (its kind and a row
for each of the seven operations: create, read, move, comment, link, read version and set
version), the states, the roles and
sessions, the approvals, the merge policy, the ticket identity, the branch check in CI, the deploy
targets (a table of each target's kind, trigger, order, check, rollback and secret store) and the
branching model.

**Evidence:** `.claude/skills/process-intake/ticket-flow.template.md:7`,
`.claude/skills/process-intake/ticket-flow.template.md:98`,
`.claude/skills/process-intake/ticket-flow.template.md:107`, `scripts/verify-skills.mjs:176`

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

`scripts/verify-ticket-branch.mjs` SHALL pass a branch `<type>/<id>-<slug>`, or `<type>/<id>`
when the ticket identity's slug is optional, whose type is one of the identity's `branchTypes`,
whose id the identity's `idPattern` matches whole, and whose slug, when it has one, is lower-case
kebab, when the pull request body names that id: `#<number>` for an id that is a number, the id
itself otherwise. Under the default identity (TICKET-21) the types are `feature`, `fix`, `tech`
and `chore`, the id is a number or an upper-case key, a hyphen and a number, and the slug is
required. When the slug is optional and the pattern matches everything after the type, the branch
has no slug.

**Evidence:** `scripts/verify-ticket-branch.mjs:73`, `scripts/verify-ticket-branch.mjs:350`,
`scripts/verify-ticket-branch.mjs:368`, `scripts/verify-ticket-branch.mjs:419`

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

#### Scenario: Certifipago's branch under its layer

- **GIVEN** Certifipago's layer (`idPattern` `TASK-[a-z0-9]+(?:-[a-z0-9]+)*`, the Conventional
  Commit types as `branchTypes`, an optional slug), the branch `feat/TASK-min-app-version-app`
  and a body that names `TASK-min-app-version-app`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a Certifipago branch and body pass under its layer"

#### Scenario: an optional slug left out

- **GIVEN** a layer whose slug is optional, the branch `feature/123` and a body that says
  `Refs #123`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "an optional slug that is absent passes"

#### Scenario: an optional slug given

- **GIVEN** a layer whose slug is optional, the branch `feature/123-add-sign-in` and a body that
  says `Refs #123`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "an optional slug that is present passes"

### Requirement: TICKET-06 — A branch without the ticket shape is refused

`scripts/verify-ticket-branch.mjs` SHALL refuse, naming the branch and the shape it owes
(`<type>/<id>-<slug>`, or `<type>/<id>` as well when the slug is optional), a branch with no type
before a `/`, a type outside the identity's `branchTypes` (naming them), no id that the identity's
`idPattern` matches, no slug when the slug is required, or a slug that is not lower-case kebab.

**Evidence:** `scripts/verify-ticket-branch.mjs:326`, `scripts/verify-ticket-branch.mjs:451`,
`scripts/verify-ticket-branch.mjs:466`, `scripts/verify-ticket-branch.mjs:486`,
`scripts/verify-ticket-branch.mjs:419`

#### Scenario: no id

- **GIVEN** the branch `feature/add-sign-in`
- **WHEN** the check runs
- **THEN** it reports one finding: the branch has no id
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch with no id is refused"

#### Scenario: an unknown type

- **GIVEN** the branch `feat/123-add-sign-in` and a body that names `#123`, under the defaults
- **WHEN** the check runs
- **THEN** it reports one finding, naming the four types
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch with an unknown type is refused"
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "an unknown type is named with the four types"

#### Scenario: no slug

- **GIVEN** the branch `feature/123` and a body that names `#123`
- **WHEN** the check runs
- **THEN** it reports one finding: the slug is missing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch missing the slug is refused"

#### Scenario: a slug that is not kebab

- **GIVEN** the branch `feature/123-Add_Sign_In`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a slug that is not lower-case kebab is refused"

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

#### Scenario: Certifipago's branch under the defaults

- **GIVEN** no layer, the branch `feat/TASK-min-app-version-app` and a body that names it
- **WHEN** the check runs
- **THEN** it reports two findings: the type `feat`, and no id the default pattern matches
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a Certifipago branch is refused under the defaults"

#### Scenario: a type the layer does not allow

- **GIVEN** a layer whose `branchTypes` are `feat` and `fix`, and the branch
  `feature/123-add-sign-in`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a branch type outside the layer's branchTypes is refused"

#### Scenario: an id the layer's pattern does not match

- **GIVEN** a layer whose `idPattern` is `TASK-\d+`, and the branch `feature/123-add-sign-in`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "an id the layer's pattern does not match is refused"

#### Scenario: a required slug left out under a layer

- **GIVEN** a layer whose `idPattern` is `TASK-[a-z0-9]+`, whose `branchTypes` are `feat` and
  whose slug is required, and the branch `feat/TASK-abc`
- **WHEN** the check runs
- **THEN** it reports one finding: the slug is missing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a required slug missing under a layer is refused"

### Requirement: TICKET-07 — A body that does not name the branch's id is refused

`scripts/verify-ticket-branch.mjs` SHALL refuse a pull request body that does not name the
branch's id, naming the id it owes and the ids it names instead. The body SHALL be searched for
the id literally, never as a pattern, and an id SHALL count as named only where no longer id the
identity's pattern accepts starts with it: `#1234` does not name `#123`, `PROJ-421` does not name
`PROJ-42`, and under Certifipago's layer `TASK-min-app-version` does not name `TASK-min-app`.

**Evidence:** `scripts/verify-ticket-branch.mjs:334`, `scripts/verify-ticket-branch.mjs:368`,
`scripts/verify-ticket-branch.mjs:387`, `scripts/verify-ticket-branch.mjs:407`

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

#### Scenario: a longer id under a layer

- **GIVEN** Certifipago's layer, the branch `feat/TASK-min-app` and a body that names
  `TASK-min-app-version`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer id under the layer is refused"

#### Scenario: an id with pattern characters

- **GIVEN** a layer whose `idPattern` is `REL-\d+\.\d+`, the branch `feature/REL-1.2-notes` and a
  body that names `REL-1x2`
- **WHEN** the check runs
- **THEN** it reports one finding, about the body: the `.` of the id is not a wildcard
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "an id is matched in the body literally, not as a pattern"

### Requirement: TICKET-08 — The branch check runs as a process

`node scripts/verify-ticket-branch.mjs --branch <name> --body <text>`, with the optional
`--layer <path>`, `--id-pattern <source>`, `--types <a,b,...>` and `--slug <required|optional>`,
SHALL read the project layer from docs/process/ticket-flow.md under its working directory when
no `--layer` is given, and SHALL exit 1 with each finding on stderr, or exit 0 with a line that
states what it judged, the ticket identity it judged under (the layer's path or the defaults, and
each flag that replaced a field) and what it does not cover.

**Evidence:** `scripts/verify-ticket-branch.mjs:509`, `scripts/verify-ticket-branch.mjs:548`,
`scripts/verify-ticket-branch.mjs:560`, `scripts/verify-ticket-branch.mjs:579`

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

#### Scenario: the layer of the working directory

- **GIVEN** a working directory whose docs/process/ticket-flow.md holds Certifipago's block
- **WHEN** the check runs there as a process over `feat/TASK-min-app-version-app` and a body
  that names it
- **THEN** it exits 0, and its stdout names docs/process/ticket-flow.md
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check reads the layer of its working directory"

#### Scenario: a layer named by `--layer`

- **GIVEN** Certifipago's block in a file that `--layer` names
- **WHEN** the check runs as a process over the same branch and body
- **THEN** it exits 0, and its stdout names that file
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check reads the layer --layer names"

#### Scenario: no layer in the working directory

- **GIVEN** a working directory with no docs/process/ticket-flow.md
- **WHEN** the check runs there as a process over `feature/123-add-sign-in` and `Refs #123`
- **THEN** it exits 0, and its stdout says it judged under the default ticket identity
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check with no layer file judges under the defaults"

#### Scenario: a flag as a process

- **GIVEN** Certifipago's layer in the working directory and `--types feature`
- **WHEN** the check runs as a process over `feature/TASK-abc` and a body that names it
- **THEN** it exits 0, and its stdout names `--types`
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check takes a flag over one field of the layer"

### Requirement: TICKET-09 — The template's gate runs the tests, not the check

The template's `pnpm validate` SHALL run `pnpm verify:ticket-branch:test` and never
`pnpm verify:ticket-branch`, as the template's own branches carry no ticket id.

**Evidence:** `package.json:42`, `package.json:66`

#### Scenario: the validate script

- **GIVEN** the root `package.json`
- **WHEN** its `validate` script is read
- **THEN** it runs `verify:ticket-branch:test` and does not run `verify:ticket-branch` alone
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the template's validate runs the tests and not the check"

### Requirement: TICKET-10 — A ticket enters Ready for dev only when nothing blocks it

`refine-ticket` SHALL move a ticket to Ready for dev only when every ticket it depends on is Done
and no ticket in flight reserves a file it reserves, the architect sequencing two such tickets by
making the second depend on the first or re-planning one.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:56`, `.claude/skills/ticket-flow/SKILL.md:77`

#### Scenario: a dependency still in dev

- **GIVEN** a refined ticket that depends on a ticket In dev
- **WHEN** the architect finishes its plan
- **THEN** the ticket stays in Refinement, and a comment names the dependency
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and the structural check only proves the contract names the state

### Requirement: TICKET-11 — Ready to merge means green, conflict-free and current, merged one at a time under the merge policy

`qa-ticket` SHALL move a ticket to Ready to merge only when its pull request's CI is green, it has
no conflict with the default branch and its branch contains the default branch's current tip,
brought current and re-checked by QA, and merge one ticket at a time, in the order the architect
sets: on the owner's word, asked in QA's own session, under the `manual` policy or when the
project layer records none; and, under the `low-risk` policy, without asking only a pull request
into the default branch whose Risk line is `Risk: none` or that changes only passive files, and
whose merge sets off no irreversible step, recording on the ticket that it merged under
`low-risk` and the Risk line it relied on. A pull request that fails one condition waits for the
owner, as under `manual`.

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:59`, `.claude/skills/qa-ticket/SKILL.md:76`,
`.claude/skills/qa-ticket/SKILL.md:102`, `.claude/skills/ticket-flow/SKILL.md:168`,
`.claude/skills/ticket-flow/SKILL.md:268`

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

### Requirement: TICKET-12 — QA evidence lives in a pull request comment

`qa-ticket` SHALL post its evidence as a comment on the ticket's pull request, screenshots for a
UI area and query or test output as text for a backend area, link that comment from the ticket,
and add nothing to the repository.

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:49`

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

**Evidence:** `.claude/skills/process-intake/SKILL.md:33`

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

**Evidence:** `.claude/skills/release-ticket/SKILL.md:84`, `.claude/skills/release-ticket/SKILL.md:105`,
`.claude/skills/release-ticket/SKILL.md:130`, `.claude/skills/release-ticket/SKILL.md:142`,
`.claude/skills/refine-ticket/SKILL.md:93`

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

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:93`, `.claude/skills/ticket-flow/SKILL.md:289`

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

**Evidence:** `.claude/skills/release-ticket/SKILL.md:48`, `.claude/skills/release-ticket/SKILL.md:59`

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

**Evidence:** `.claude/skills/release-ticket/SKILL.md:130`

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

**Evidence:** `.claude/skills/po-ticket/SKILL.md:54`, `.claude/skills/po-ticket/SKILL.md:68`,
`.claude/skills/refine-ticket/SKILL.md:31`, `.claude/skills/ticket-flow/SKILL.md:237`

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

**Evidence:** `.claude/skills/release-ticket/SKILL.md:39`

#### Scenario: a 1.5 feature merged before the 1.4 release

- **GIVEN** a release of 1.4 and a merged ticket aimed at 1.5 with no feature flag
- **WHEN** the CI/CD session reads the release
- **THEN** it flags the ticket on the release ticket, messages the architect, and asks the owner
  nothing until the ticket is settled
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
say.

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:168`, `.claude/skills/qa-ticket/SKILL.md:76`,
`.claude/skills/process-intake/SKILL.md:65`,
`.claude/skills/process-intake/ticket-flow.template.md:57`,
`.claude/skills/process-intake/ticket-flow.template.md:59`,
`.claude/skills/release-ticket/SKILL.md:24`, `scripts/verify-skills.mjs:121`,
`scripts/verify-skills.mjs:162`, `scripts/verify-skills.mjs:412`

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
- **THEN** QA asks the owner, and merges only on the owner's word
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session, and the structural check only proves the skills name both policies

### Requirement: TICKET-21 — The branch check judges under the project's ticket identity

`scripts/verify-ticket-branch.mjs` SHALL take its ticket identity from the one fenced block with
the info string `json ticket-identity` in the project layer: a JSON object holding exactly
`idPattern` (a regular-expression source for one id, matched whole, that compiles with the `u`
flag and does not match the empty string), `branchTypes` (a non-empty list of branch prefixes,
each with no `/` and no space) and `slug` (`required` or `optional`). A layer that is absent, or
that holds no such block, SHALL give the default identity: `idPattern`
`\d+|[A-Z][A-Z0-9]*-\d+`, `branchTypes` `feature`, `fix`, `tech` and `chore`, and a `required`
slug. The flags `--id-pattern`, `--types` and `--slug` SHALL each replace one field, the others
kept. A malformed block, a second block, a layer that `--layer` names and that is not there, or a
malformed flag SHALL be a finding that names the file or the flag and the field, and the check
SHALL then judge no branch under any other identity.

**Evidence:** `scripts/verify-ticket-branch.mjs:64`, `scripts/verify-ticket-branch.mjs:73`,
`scripts/verify-ticket-branch.mjs:109`, `scripts/verify-ticket-branch.mjs:228`,
`scripts/verify-ticket-branch.mjs:252`, `scripts/verify-ticket-branch.mjs:286`,
`scripts/verify-ticket-branch.mjs:528`

#### Scenario: no layer file

- **GIVEN** no project layer, the branch `feature/123-add-sign-in` and a body that says `Refs #123`
- **WHEN** the check runs
- **THEN** it finds nothing: the default identity applies
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "with no layer file, the defaults apply"

#### Scenario: a layer with no block

- **GIVEN** a project layer with no `json ticket-identity` block, and that branch and body
- **WHEN** the check runs
- **THEN** it finds nothing: the default identity applies
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a layer with no ticket-identity block judges under the defaults"

#### Scenario: a slug rule that is neither

- **GIVEN** a block whose `slug` is `sometimes`
- **WHEN** the check runs over a branch the defaults pass
- **THEN** it reports one finding, and judges no branch
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block whose slug is neither required nor optional is refused"

#### Scenario: what a finding says

- **GIVEN** a block whose `slug` is `sometimes`
- **WHEN** the check runs
- **THEN** its finding names the layer's path and the field `slug`
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a malformed block is named with its file and field"

#### Scenario: a block that is not JSON

- **GIVEN** a block whose text does not parse as JSON
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block that is not JSON is refused"

#### Scenario: a field left out

- **GIVEN** a block with no `branchTypes`
- **WHEN** the check runs
- **THEN** it reports one finding, rather than taking the default for that field
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block missing a field is refused"

#### Scenario: a field it does not know

- **GIVEN** a block with a misspelled field, `idPatern`
- **WHEN** the check runs
- **THEN** it reports one finding for it, and one for the `idPattern` it lacks
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block with an unknown field is refused"

#### Scenario: a pattern that does not compile

- **GIVEN** a block whose `idPattern` is `TASK-(`
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block whose idPattern does not compile is refused"

#### Scenario: a pattern that matches nothing at all

- **GIVEN** a block whose `idPattern` matches the empty string
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block whose idPattern matches the empty string is refused"

#### Scenario: no branch types

- **GIVEN** a block whose `branchTypes` is an empty list
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a block whose branchTypes is empty is refused"

#### Scenario: two blocks

- **GIVEN** a layer that holds two `json ticket-identity` blocks
- **WHEN** the check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a layer with two ticket-identity blocks is refused"

#### Scenario: a layer that is not there

- **GIVEN** a `--layer` that names a file that does not exist
- **WHEN** the check runs
- **THEN** it reports one finding, rather than judging under the defaults
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a layer that --layer names and that is not there is refused"

#### Scenario: a flag over one field

- **GIVEN** Certifipago's layer, the flag `--types feature`, the branch `feature/TASK-abc` and a
  body that names `TASK-abc`
- **WHEN** the check runs
- **THEN** it finds nothing: the types come from the flag, the pattern and the slug rule from the
  layer
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a flag overrides a single field of the layer"

#### Scenario: a type the flag replaced

- **GIVEN** Certifipago's layer, the flag `--types feature` and the branch `feat/TASK-abc`
- **WHEN** the check runs
- **THEN** it reports one finding: `feat` is no longer allowed
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a type the flag replaced is refused"

#### Scenario: a malformed flag

- **GIVEN** the flag `--slug sometimes`
- **WHEN** the check runs
- **THEN** it reports one finding, naming the flag and the field
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a malformed flag is refused"
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a malformed flag is named with the flag and its field"

### Requirement: TICKET-22 — The contract, the intake and the template agree on the ticket identity

`scripts/verify-skills.mjs` SHALL hold `ticket-flow` § Ticket identity to name `branchTypes` and
the `json ticket-identity` block, `process-intake` § Step 3 to name the `json ticket-identity`
block, and the Ticket identity section of `.claude/skills/process-intake/ticket-flow.template.md`
to hold one `json ticket-identity` block that the branch check reads with no finding and whose
fields are the branch check's defaults.

**Evidence:** `scripts/verify-skills.mjs:167`, `scripts/verify-skills.mjs:226`,
`scripts/verify-skills.mjs:292`, `scripts/verify-skills.mjs:318`, `scripts/verify-skills.mjs:445`,
`.claude/skills/ticket-flow/SKILL.md:194`, `.claude/skills/ticket-flow/SKILL.md:200`,
`.claude/skills/process-intake/SKILL.md:77`,
`.claude/skills/process-intake/ticket-flow.template.md:82`

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the contract and the intake name the block, and
  the template ships it with the defaults
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the template holds no block

- **GIVEN** a process template whose Ticket identity section holds no `json ticket-identity` block
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose ticket identity holds no block is refused"

#### Scenario: the template's block is off the defaults

- **GIVEN** a process template whose block gives the slug `optional`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose ticket identity block is not the defaults is refused"

#### Scenario: the template's block is malformed

- **GIVEN** a process template whose block is not JSON
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose ticket identity block is malformed is refused"

#### Scenario: the contract drops `branchTypes`

- **GIVEN** a `ticket-flow` whose § Ticket identity never names `branchTypes`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose ticket identity names no branchTypes is refused"

#### Scenario: the contract drops the block

- **GIVEN** a `ticket-flow` whose § Ticket identity never names `json ticket-identity`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose ticket identity names no ticket-identity block is refused"

#### Scenario: the intake drops the block

- **GIVEN** a `process-intake` whose Step 3 never names `json ticket-identity`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no ticket-identity block is refused"

#### Scenario: what a finding says

- **GIVEN** a process template whose block gives the slug `optional`
- **WHEN** the structural check runs
- **THEN** its finding names the file, the section, the field and the default it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a template block off the defaults is named with its file and field"
