# harness/ticket-flow — living spec

> **Governs:** `.claude/skills/ticket-flow`, `.claude/skills/po-ticket`, `.claude/skills/refine-ticket`, `.claude/skills/dev-ticket`, `.claude/skills/qa-ticket`, `.claude/skills/release-ticket`, `.claude/skills/process-intake`, `.claude/skills/general-plan`, `scripts/verify-skills.mjs`, `scripts/verify-ticket-branch.mjs`, `.agents/contracts/harness-config.schema.json`
> **ID prefix:** `TICKET`
> **Derived from:** `openspec/changes/archive/2026-11-16-ticket-flow/source-spec.md`, `docs/harness.md`
> **Verified against the code:** 2026-11-20 at `b4b51e0`

## Purpose

The ticket-flow unit of the harness lets several long-lived sessions (a PO, an architect, dev and
QA sessions per area, a CI/CD session) work one product with the ticket as the only carrier of
context. It owns the seven skills that hold the flow (the `ticket-flow` contract, the five role
procedures and `process-intake`), their three templates, the structural check that holds the
skills to their sections, and the pure branch check a project may add to its CI, which judges a
branch under the ticket identity the project's layer declares. The board is the source of every
open ticket, so the unit also holds what the general plan of a project with a ticket flow records:
closed and dropped tickets only, in a catalog the architect writes and the general-plan skill and
its validator know (TICKET-29, TICKET-30). Each project's
own layer, docs/process/ticket-flow.md, belongs to that project; the SDD lifecycle a ticket's
specs run through belongs to the sdd skill; the end-to-end harness QA runs belongs to the e2e
docs; and the gate helpers both checks use belong to the rest of the harness.

## Requirements

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

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:28`, `.claude/skills/ticket-flow/SKILL.md:42`,
`.claude/skills/ticket-flow/SKILL.md:84`, `.claude/skills/ticket-flow/SKILL.md:110`,
`.claude/skills/ticket-flow/SKILL.md:191`, `.claude/skills/ticket-flow/SKILL.md:369`,
`.claude/skills/ticket-flow/ticket.template.md:21`,
`.claude/skills/ticket-flow/release.template.md:11`, `scripts/verify-skills.mjs:119`,
`scripts/verify-skills.mjs:130`, `scripts/verify-skills.mjs:332`

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

**Evidence:** `.claude/skills/po-ticket/SKILL.md:21`, `.claude/skills/refine-ticket/SKILL.md:21`,
`.claude/skills/dev-ticket/SKILL.md:18`, `.claude/skills/qa-ticket/SKILL.md:20`,
`.claude/skills/release-ticket/SKILL.md:19`, `scripts/verify-skills.mjs:807`

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

**Evidence:** `scripts/verify-skills.mjs:753`, `scripts/verify-skills.mjs:841`,
`scripts/verify-skills.mjs:941`

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
`.claude/skills/process-intake/ticket-flow.template.md:112`,
`.claude/skills/process-intake/ticket-flow.template.md:121`, `scripts/verify-skills.mjs:332`

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

#### Scenario: a TASK-slug branch under its layer

- **GIVEN** a TASK-slug layer (`idPattern` `TASK-[a-z0-9]+(?:-[a-z0-9]+)*`, the Conventional
  Commit types as `branchTypes`, an optional slug), the branch `feat/TASK-min-app-version-app`
  and a body that names `TASK-min-app-version-app`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a TASK-slug branch and body pass under its layer"

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

#### Scenario: a TASK-slug branch under the defaults

- **GIVEN** no layer, the branch `feat/TASK-min-app-version-app` and a body that names it
- **WHEN** the check runs
- **THEN** it reports two findings: the type `feat`, and no id the default pattern matches
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a TASK-slug branch is refused under the defaults"

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
`PROJ-42`, and under a TASK-slug layer `TASK-min-app-version` does not name `TASK-min-app`.

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

- **GIVEN** a TASK-slug layer, the branch `feat/TASK-min-app` and a body that names
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

- **GIVEN** a working directory whose docs/process/ticket-flow.md holds a TASK-slug block
- **WHEN** the check runs there as a process over `feat/TASK-min-app-version-app` and a body
  that names it
- **THEN** it exits 0, and its stdout names docs/process/ticket-flow.md
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check reads the layer of its working directory"

#### Scenario: a layer named by `--layer`

- **GIVEN** a TASK-slug block in a file that `--layer` names
- **WHEN** the check runs as a process over the same branch and body
- **THEN** it exits 0, and its stdout names that file
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check reads the layer --layer names"

#### Scenario: no layer in the working directory

- **GIVEN** a working directory with no docs/process/ticket-flow.md
- **WHEN** the check runs there as a process over `feature/123-add-sign-in` and `Refs #123`
- **THEN** it exits 0, and its stdout says it judged under the default ticket identity
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check with no layer file judges under the defaults"

#### Scenario: a flag as a process

- **GIVEN** a TASK-slug layer in the working directory and `--types feature`
- **WHEN** the check runs as a process over `feature/TASK-abc` and a body that names it
- **THEN** it exits 0, and its stdout names `--types`
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the check takes a flag over one field of the layer"

### Requirement: TICKET-09 — The template's gate runs the tests, not the check

The template's `pnpm validate` SHALL run `pnpm verify:ticket-branch:test` and never
`pnpm verify:ticket-branch`, as the template's own branches carry no ticket id.

**Evidence:** `package.json:47`, `.agents/contracts/gates.json:400`, `package.json:79`

#### Scenario: the steps validate runs

- **GIVEN** the root `package.json`, whose `validate` script runs the gate registry `.agents/contracts/gates.json`
- **WHEN** the steps the registry runs are read, under the default profile and under every profile
- **THEN** they run `verify:ticket-branch:test` and never `verify:ticket-branch` alone
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "the template's validate runs the tests and not the check"

### Requirement: TICKET-10 — A ticket enters Ready for dev only when nothing blocks it

`refine-ticket` SHALL move a ticket to Ready for dev only when every ticket it depends on is Done
and no ticket in flight reserves a file it reserves, the architect sequencing two such tickets by
making the second depend on the first or re-planning one.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:62`, `.claude/skills/ticket-flow/SKILL.md:84`

#### Scenario: a dependency still in dev

- **GIVEN** a refined ticket that depends on a ticket In dev
- **WHEN** the architect finishes its plan
- **THEN** the ticket stays in Refinement, and a comment names the dependency
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and the structural check only proves the contract names the state

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

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:66`, `.claude/skills/qa-ticket/SKILL.md:85`,
`.claude/skills/qa-ticket/SKILL.md:89`, `.claude/skills/qa-ticket/SKILL.md:96`,
`.claude/skills/qa-ticket/SKILL.md:134`, `.claude/skills/ticket-flow/SKILL.md:97`,
`.claude/skills/ticket-flow/SKILL.md:342`, `scripts/verify-skills.mjs:218`,
`scripts/verify-skills.mjs:219`, `scripts/verify-skills.mjs:269`, `scripts/verify-skills.mjs:454`,
`scripts/verify-skills.mjs:649`

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

### Requirement: TICKET-12 — QA evidence lives in a pull request comment

`qa-ticket` SHALL post its evidence as a comment on the ticket's pull request, screenshots for a
UI area and query or test output as text for a backend area, link that comment from the ticket,
and add nothing to the repository.

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:56`

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
branching (the recommended default with a long-lived production branch, which the layer names and
which is `production` by default, and the tags-only alternative), the migrations and the hotfix,
and `.claude/skills/refine-ticket/SKILL.md` a section that groups Done tickets into a release
ticket.

**Evidence:** `.claude/skills/release-ticket/SKILL.md:89`,
`.claude/skills/release-ticket/SKILL.md:118`, `.claude/skills/release-ticket/SKILL.md:123`,
`.claude/skills/release-ticket/SKILL.md:146`, `.claude/skills/release-ticket/SKILL.md:158`,
`.claude/skills/refine-ticket/SKILL.md:293`

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
every ticket whose target version is V, a dropped one aside (TICKET-32), and each one is Done,
except a hotfix, which is at Ready to merge into the production branch the layer names with every
Ready to merge condition met against that branch's current tip; the default branch's CI is green;
and the QA of each area the batch touches has checked it on staging or preview, with evidence on
the release ticket. `ticket-flow`'s Ready for prod row and § Release stage, `release-ticket`
Step 1 and `release.template.md` SHALL state the same rule and the same exception.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:309`,
`.claude/skills/ticket-flow/SKILL.md:101`, `.claude/skills/ticket-flow/SKILL.md:376`,
`.claude/skills/ticket-flow/SKILL.md:377`, `.claude/skills/release-ticket/SKILL.md:35`,
`.claude/skills/release-ticket/SKILL.md:39`, `.claude/skills/ticket-flow/release.template.md:14`

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

### Requirement: TICKET-16 — Each deploy target runs on the owner's word, in order, checked

`release-ticket` SHALL run the deploy targets a release touches in the order the project layer
declares, only on the owner's word for the release and for each irreversible step, recorded on
the release ticket, check each target, run a failed target's declared rollback and stop the
release, and read every deploy secret from the store the target names, never from a ticket.

**Evidence:** `.claude/skills/release-ticket/SKILL.md:52`, `.claude/skills/release-ticket/SKILL.md:63`

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

**Evidence:** `.claude/skills/release-ticket/SKILL.md:146`

#### Scenario: a column the live app still reads

- **GIVEN** a release whose migration drops a column the store version of the app reads
- **WHEN** the CI/CD role reads the release ticket
- **THEN** it stops, comments that the drop needs its own later release, and messages the
  architect
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

### Requirement: TICKET-18 — A target version moves only through the PO

`po-ticket` SHALL set a ticket's target version when it creates the ticket, and move it only once
the PO confirms the architect's proposal on the ticket. A move SHALL change the board only: the
general plan names no open ticket (TICKET-29), so neither `po-ticket` § Step 5 nor `ticket-flow`
§ Target version edits it.

**Evidence:** `.claude/skills/po-ticket/SKILL.md:65`, `.claude/skills/po-ticket/SKILL.md:82`,
`.claude/skills/po-ticket/SKILL.md:88`, `.claude/skills/refine-ticket/SKILL.md:32`,
`.claude/skills/ticket-flow/SKILL.md:294`, `.claude/skills/ticket-flow/SKILL.md:310`

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

### Requirement: TICKET-19 — A merged ticket aimed at a later version is settled before a release

`release-ticket` SHALL flag, before a release enters In release, every ticket merged since the
last release whose target version is later than the release's, and go on only once each one sits
behind a feature flag the architect names or its target version has moved to the release's.

**Evidence:** `.claude/skills/release-ticket/SKILL.md:43`

#### Scenario: a 1.5 feature merged before the 1.4 release

- **GIVEN** a release of 1.4 and a merged ticket aimed at 1.5 with no feature flag
- **WHEN** the CI/CD session reads the release
- **THEN** it flags the ticket on the release ticket, messages the architect, and asks the owner
  nothing until the ticket is settled
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

### Requirement: TICKET-20 — The merge policy is the project's, `manual` unless it picks `low-risk`

The ticket skills SHALL name the two merge policies a project may record in `delivery.mergePolicy`
of `.agents/harness.config.json`: `manual`, the default, under which the architect asks the owner
before every merge, and `low-risk`, under which the architect may merge without asking a pull
request that meets every condition of `ticket-flow` rule 4. `ticket-flow` § Rules every role
follows, `refine-ticket` § Merge queue, `process-intake` § Step 3 and the Merge policy section of
`.claude/skills/process-intake/ticket-flow.template.md` SHALL each name both policies and
`.agents/harness.config.json`, and that section's `Policy` line SHALL name `delivery.mergePolicy`
in `.agents/harness.config.json`, so the project layer records no policy of its own. The schema
`.agents/contracts/harness-config.schema.json` SHALL allow exactly the two policies the ticket
skills name, `manual` its default, and `pnpm verify:harness-config` SHALL refuse any other value,
a key given twice in one object of either file, an `additionalProperties` other than `true` or
`false`, and an object of the schema, outside an `if`, `then` or `else`, that does not set
`additionalProperties` to `false`. `ticket-flow` § Rules every role follows and `refine-ticket`
§ Merge queue, the two sections that read the policy, SHALL each say that a missing setting, any
value other than `low-risk`, a missing file, or a file that does not parse means `manual`, and
that the policy is read from the default branch's copy, never from the pull request's own branch,
which could otherwise change its own policy; the structural check SHALL hold both to say so. When
`.agents/harness.config.json` is absent, `process-intake` § Step 4 SHALL write the whole template
file, every section and setting the schema requires, with the chosen policy, then run
`pnpm verify:harness-config`.
A merge into the production branch the layer names, a deploy, a production migration, a store
submission and every other irreversible step SHALL stay the owner's word under every policy, as
`ticket-flow` rule 4 and `release-ticket` say; and under neither policy SHALL the architect or QA
merge a pull request into the production branch (TICKET-24).

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:219`,
`.claude/skills/ticket-flow/SKILL.md:220`, `.claude/skills/ticket-flow/SKILL.md:221`,
`.claude/skills/ticket-flow/SKILL.md:223`, `.claude/skills/refine-ticket/SKILL.md:117`,
`.claude/skills/refine-ticket/SKILL.md:150`, `.claude/skills/refine-ticket/SKILL.md:176`,
`.claude/skills/refine-ticket/SKILL.md:177`, `.claude/skills/refine-ticket/SKILL.md:179`,
`.claude/skills/refine-ticket/SKILL.md:185`, `.claude/skills/process-intake/SKILL.md:70`,
`.claude/skills/process-intake/SKILL.md:118`, `.claude/skills/process-intake/SKILL.md:119`,
`.claude/skills/process-intake/SKILL.md:122`,
`.claude/skills/process-intake/ticket-flow.template.md:68`,
`.claude/skills/process-intake/ticket-flow.template.md:70`,
`.claude/skills/release-ticket/SKILL.md:24`, `.agents/contracts/harness-config.schema.json:47`,
`.agents/contracts/harness-config.schema.json:48`, `scripts/verify-skills.mjs:165`,
`scripts/verify-skills.mjs:312`, `scripts/verify-skills.mjs:324`, `scripts/verify-skills.mjs:326`,
`scripts/verify-skills.mjs:335`, `scripts/verify-skills.mjs:409`, `scripts/verify-skills.mjs:449`,
`scripts/verify-skills.mjs:450`, `scripts/verify-skills.mjs:683`,
`scripts/verify-harness-config.mjs:156`, `scripts/verify-harness-config.mjs:175`,
`scripts/verify-harness-config.mjs:297`, `scripts/verify-harness-config.mjs:406`,
`scripts/verify-harness-config.mjs:503`

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the four files name both policies and
  `.agents/harness.config.json`, and the template's `Policy` line names `delivery.mergePolicy`
  in it
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the contract drops `low-risk`

- **GIVEN** a `ticket-flow` whose rules never name `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports two findings: the policy, and the fail-closed clause, which names it
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules name no low-risk merge policy is refused"

#### Scenario: the architect's merge queue drops `manual`

- **GIVEN** a `refine-ticket` whose § Merge queue never names `manual`
- **WHEN** the structural check runs
- **THEN** it reports two findings: the policy, and the fail-closed clause, which names it
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no manual merge policy is refused"

#### Scenario: the architect's merge queue drops `low-risk`

- **GIVEN** a `refine-ticket` whose § Merge queue never names `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports two findings: the policy, and the fail-closed clause, which names it
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no low-risk merge policy is refused"

#### Scenario: the architect's merge queue is gone

- **GIVEN** a `refine-ticket` with no § Merge queue
- **WHEN** the structural check runs
- **THEN** it reports the missing section, rather than judging the policies it would name
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused"

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

#### Scenario: the template records a policy of its own

- **GIVEN** a process template whose `Policy` line gives `manual`, the value it held before
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the file, the line and the setting it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose merge policy records a policy, not the harness config, is refused"

#### Scenario: the contract does not say where the policy is read

- **GIVEN** a `ticket-flow` whose rules never name `.agents/harness.config.json`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules never name the harness config is refused"

#### Scenario: the merge queue does not say where the policy is read

- **GIVEN** a `refine-ticket` whose § Merge queue never names `.agents/harness.config.json`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue never names the harness config is refused"

#### Scenario: the intake does not say where it writes the policy

- **GIVEN** a `process-intake` whose Step 3 never names `.agents/harness.config.json`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step never names the harness config is refused"

#### Scenario: the schema and the skills agree on the policies

- **GIVEN** the repository's `.agents/contracts/harness-config.schema.json`
- **WHEN** `pnpm verify:harness-config:test` runs
- **THEN** its `delivery.mergePolicy` allows exactly the policies the ticket skills name, and
  defaults to `manual`
- **Test:** `scripts/verify-harness-config.test.mjs` › "the schema's merge policies are the ones the ticket skills name, manual the default"

#### Scenario: a merge policy the schema does not allow

- **GIVEN** a harness config whose `delivery.mergePolicy` is `auto`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding, naming the setting and the two values it allows
- **Test:** `scripts/verify-harness-config.test.mjs` › "a merge policy the schema does not allow is refused"

#### Scenario: the template has no Policy line

- **GIVEN** a process template whose Merge policy section has no `Policy` line
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose merge policy has no Policy line is refused"

#### Scenario: what a finding says

- **GIVEN** a `ticket-flow` whose rules never name `low-risk`
- **WHEN** the structural check runs
- **THEN** the finding for the policy names the file, the section and the policy, beside the
  fail-closed clause's
- **Test:** `scripts/verify-skills.test.mjs` › "a dropped merge policy is named with its file and section"

#### Scenario: a hotfix under `low-risk`

- **GIVEN** a project whose harness config records `low-risk`, and a green, current hotfix
  pull request into the production branch whose Risk line is `none`
- **WHEN** QA brings it to Ready to merge
- **THEN** QA merges nothing and asks the owner nothing: it leaves the ticket at Ready to merge
  and messages the architect `<id> ready to merge, hotfix`; the architect keeps it out of its
  merge queue, and the CI/CD session merges it as its release's deploy step (TICKET-24)
- **Test:** Not covered — the rule is a procedure the QA and architect sessions follow; no runner
  drives a session, and the structural check only proves the skills name both policies and the
  hotfix's message

#### Scenario: the contract does not fail closed

- **GIVEN** a `ticket-flow` whose rules never say that a value other than `low-risk`, a missing
  file, or a file that does not parse means `manual`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules do not fail closed to manual is refused"

#### Scenario: the contract does not say which copy is read

- **GIVEN** a `ticket-flow` whose rules never say that the policy is read from the default
  branch's copy, never from the pull request's own branch
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules do not read the policy from the default branch's copy is refused"

#### Scenario: the merge queue does not fail closed

- **GIVEN** a `refine-ticket` whose § Merge queue never says that a value other than
  `low-risk`, a missing file, or a file that does not parse means `manual`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not fail closed to manual is refused"

#### Scenario: the merge queue does not say which copy is read

- **GIVEN** a `refine-ticket` whose § Merge queue never says that the policy is read from the
  default branch's copy, never from the pull request's own branch
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not read the policy from the default branch's copy is refused"

#### Scenario: a merge policy given twice

- **GIVEN** a harness config whose `delivery` gives `mergePolicy` twice, `low-risk` then
  `manual`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding, naming the setting, rather than reading `manual`, the last
  value, as `JSON.parse` does
- **Test:** `scripts/verify-harness-config.test.mjs` › "a merge policy given twice is refused, not read as its last value"

#### Scenario: a schema object open to undeclared keys

- **GIVEN** a schema whose `delivery` object does not set `additionalProperties`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding: every object of the schema sets
  `"additionalProperties": false`
- **Test:** `scripts/verify-harness-config.test.mjs` › "an object the schema leaves open to undeclared keys is refused"

#### Scenario: an `additionalProperties` the gate does not apply

- **GIVEN** a schema whose `delivery` sets `additionalProperties` to a schema,
  `{ "enum": ["manual"] }`, and a config whose `delivery` holds an undeclared key `x`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding, a keyword value the gate cannot read, rather than a rule it
  skips in silence
- **Test:** `scripts/verify-harness-config.test.mjs` › "an additionalProperties schema the gate does not apply is refused"

#### Scenario: the intake in a project with no harness config

- **GIVEN** a project with no `.agents/harness.config.json`, and a team that picks `low-risk`
- **WHEN** `process-intake` writes on the team's yes
- **THEN** it writes the whole template file, every section and setting the schema requires, with
  `low-risk` as `delivery.mergePolicy`, then runs `pnpm verify:harness-config`, which finds
  nothing
- **Test:** Not covered — the rule is a procedure a `process-intake` session follows; no runner
  drives a session, and no check reads its Step 4
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

- **GIVEN** a TASK-slug layer, the flag `--types feature`, the branch `feature/TASK-abc` and a
  body that names `TASK-abc`
- **WHEN** the check runs
- **THEN** it finds nothing: the types come from the flag, the pattern and the slug rule from the
  layer
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a flag overrides a single field of the layer"

#### Scenario: a type the flag replaced

- **GIVEN** a TASK-slug layer, the flag `--types feature` and the branch `feat/TASK-abc`
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

**Evidence:** `scripts/verify-skills.mjs:323`, `scripts/verify-skills.mjs:391`,
`scripts/verify-skills.mjs:526`, `scripts/verify-skills.mjs:555`, `scripts/verify-skills.mjs:696`,
`.claude/skills/ticket-flow/SKILL.md:250`, `.claude/skills/ticket-flow/SKILL.md:256`,
`.claude/skills/process-intake/SKILL.md:88`,
`.claude/skills/process-intake/ticket-flow.template.md:96`

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

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:39`, `.claude/skills/qa-ticket/SKILL.md:79`,
`.claude/skills/qa-ticket/SKILL.md:96`, `.claude/skills/qa-ticket/SKILL.md:110`,
`.claude/skills/dev-ticket/SKILL.md:95`, `scripts/verify-skills.mjs:212`,
`scripts/verify-skills.mjs:213`, `scripts/verify-skills.mjs:475`, `scripts/verify-skills.mjs:476`

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

### Requirement: TICKET-24 — A hotfix ships only as its release

`qa-ticket` § Step 6 SHALL bring a hotfix to Ready to merge against the current tip of the
production branch the layer names, leave it there under every merge policy, `manual` included,
and message the architect `<id> ready to merge, hotfix`. `refine-ticket` SHALL keep the hotfix
out of its merge queue and list it in a release ticket of its own (§ Group a release).
`release-ticket` SHALL ship that release with Steps 1 to 4, merging the hotfix's pull request into
the production branch as the release's deploy step, on the owner's word for the release and for
that step, after the release's migrations, in their order; then move the hotfix to Done and
message the architect `<id> merged`, which the architect passes to the hotfix's QA and dev
sessions; and, once it is live, merge the production branch back into the default branch through
a pull request merged on the owner's word. `ticket-flow` § Messages SHALL carry the line
`<id> ready to merge, hotfix`, from QA to the architect, and its states table SHALL name CI/CD as
the session that enters Done for a hotfix. The structural check SHALL hold `qa-ticket` § Step 6,
`refine-ticket` § Group a release and `ticket-flow` § Messages to name
`<id> ready to merge, hotfix`, and `release-ticket` § Hotfix to say that QA leaves it at Ready to
merge.

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:100`, `.claude/skills/refine-ticket/SKILL.md:98`,
`.claude/skills/refine-ticket/SKILL.md:295`, `.claude/skills/release-ticket/SKILL.md:158`,
`.claude/skills/ticket-flow/SKILL.md:98`, `.claude/skills/ticket-flow/SKILL.md:172`,
`scripts/verify-skills.mjs:225`, `scripts/verify-skills.mjs:478`

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: QA, the architect and the contract name the
  hotfix's message, and the hotfix section leaves it at Ready to merge
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: QA's hand-off sends no hotfix message

- **GIVEN** a `qa-ticket` whose Step 6 never names `<id> ready to merge, hotfix`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a qa-ticket whose hand-off step sends no hotfix message is refused"

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

- **GIVEN** a project whose harness config records `manual`, and a green hotfix pull request
  into the production branch, current with its tip
- **WHEN** QA brings it to Ready to merge
- **THEN** QA asks the owner nothing and merges nothing: it leaves the ticket at Ready to merge
  and messages the architect `<id> ready to merge, hotfix`
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session, and the structural check only proves the step names the message

#### Scenario: a hotfix release with a migration

- **GIVEN** a release ticket of its own that lists a hotfix at Ready to merge into the production
  branch and one migration
- **WHEN** the CI/CD session ships it on the owner's word
- **THEN** it pushes the migration first, then merges the hotfix's pull request into the
  production branch on the owner's word for that step, moves the hotfix to Done, messages the
  architect `<id> merged`, which the architect passes to the hotfix's QA and dev sessions, and
  checks production before Released
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session or a deploy

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
policy, or when the default branch's copy of `.agents/harness.config.json` records no `low-risk`
(TICKET-20); and, under `low-risk`, without asking only a pull
request whose Risk line is `Risk: none` or that changes only passive files, and whose merge sets
off no irreversible step, recording on the ticket, or on the ticket or release ticket the closed
ticket catalog pull request records, that it merged under `low-risk` and what it relied on. A pull
request that fails one condition SHALL wait for the owner, as under `manual`. After each merge of
a ticket's pull request the architect SHALL move the ticket to Done and message the ticket's QA
and dev sessions `<id> merged`, and after every merge it SHALL bring the next pull request in the
queue current itself. `ticket-flow`'s states table SHALL name the architect as the session that
enters Done, a hotfix aside (TICKET-24), and its § Messages SHALL carry
`<id> ready to merge, PR #<n>`, from QA to the architect, and no line that asks a session to
bring a branch current. The structural check SHALL hold `refine-ticket` to have a § Merge queue, which reads the
policy from the default branch's copy and fails closed to `manual` (TICKET-20).

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:84`,
`.claude/skills/refine-ticket/SKILL.md:93`, `.claude/skills/refine-ticket/SKILL.md:114`,
`.claude/skills/refine-ticket/SKILL.md:116`, `.claude/skills/refine-ticket/SKILL.md:122`,
`.claude/skills/refine-ticket/SKILL.md:124`, `.claude/skills/refine-ticket/SKILL.md:135`,
`.claude/skills/refine-ticket/SKILL.md:138`, `.claude/skills/refine-ticket/SKILL.md:143`,
`.claude/skills/refine-ticket/SKILL.md:146`, `.claude/skills/refine-ticket/SKILL.md:150`,
`.claude/skills/refine-ticket/SKILL.md:176`, `.claude/skills/refine-ticket/SKILL.md:177`,
`.claude/skills/refine-ticket/SKILL.md:179`, `.claude/skills/refine-ticket/SKILL.md:181`,
`.claude/skills/refine-ticket/SKILL.md:204`, `.claude/skills/refine-ticket/SKILL.md:205`,
`.claude/skills/refine-ticket/SKILL.md:213`, `.claude/skills/refine-ticket/SKILL.md:217`,
`.claude/skills/refine-ticket/SKILL.md:218`, `.claude/skills/ticket-flow/SKILL.md:98`,
`.claude/skills/ticket-flow/SKILL.md:142`, `.claude/skills/ticket-flow/SKILL.md:171`,
`.claude/skills/ticket-flow/SKILL.md:351`, `.claude/skills/ticket-flow/SKILL.md:354`,
`.claude/skills/ticket-flow/SKILL.md:360`, `scripts/verify-skills.mjs:202`,
`scripts/verify-skills.mjs:439`, `scripts/verify-skills.mjs:442`, `scripts/verify-skills.mjs:450`

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

- **GIVEN** a project whose harness config records `low-risk`, and a pull request at the head
  of the queue, Ready to merge, that changes code and says `Risk: item 3 (a public export)`
- **WHEN** the architect reaches its merge
- **THEN** the architect asks the owner, as under `manual`, and merges only on the owner's word
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: `low-risk`, and a pull request that meets every condition

- **GIVEN** a project whose harness config records `low-risk`, and a pull request at the head
  of the queue, Ready to merge into the default branch, that says `Risk: none` and whose merge
  sets off no irreversible step
- **WHEN** the architect reaches its merge
- **THEN** the architect merges it without asking, comments on the ticket that it merged under
  `low-risk` with that Risk line, moves it to Done and messages its QA and dev sessions
  `<id> merged`
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session

#### Scenario: the merge queue does not say which copy is read

- **GIVEN** a `refine-ticket` whose § Merge queue never says that the policy is read from the
  default branch's copy, never from the pull request's own branch
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not read the policy from the default branch's copy is refused"

#### Scenario: a pull request that sets its own policy to `low-risk`

- **GIVEN** a default branch whose `.agents/harness.config.json` records `manual`, and a pull
  request at the head of the queue, Ready to merge, that says `Risk: none` and whose own branch
  sets `delivery.mergePolicy` to `low-risk`
- **WHEN** the architect reaches its merge
- **THEN** it reads `manual` from the default branch's copy and asks the owner, as under `manual`
- **Test:** Not covered — the rule is a procedure an architect session follows; no runner drives
  a session, and the structural check only proves the merge queue says which copy it reads

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

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:92`, `.claude/skills/ticket-flow/SKILL.md:294`,
`.claude/skills/ticket-flow/SKILL.md:296`, `.claude/skills/ticket-flow/SKILL.md:298`,
`.claude/skills/po-ticket/SKILL.md:57`, `.claude/skills/po-ticket/SKILL.md:67`,
`.claude/skills/refine-ticket/SKILL.md:32`, `.claude/skills/refine-ticket/SKILL.md:34`,
`.claude/skills/refine-ticket/SKILL.md:65`, `.claude/skills/refine-ticket/SKILL.md:108`,
`.claude/skills/ticket-flow/ticket.template.md:23`,
`.claude/skills/ticket-flow/ticket.template.md:28`, `scripts/verify-skills.mjs:297`,
`scripts/verify-skills.mjs:348`

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

### Requirement: TICKET-27 — The production branch is the one the layer names

The Branching model section of `.claude/skills/process-intake/ticket-flow.template.md` SHALL name
the production branch on its `Production branch` line, which SHALL give `production`, the
default; `process-intake` § Step 3 SHALL ask the team its name; and the ticket skills and their
templates SHALL call it "the production branch the layer names", or "the production branch" once
named, wherever a step cuts from, merges into, checks against or deploys that branch, naming
`production` only as its default. `release-ticket` § Deploy targets SHALL say what a host branch
target declares about the host's production branch, with two facts of Vercel as examples, naming
no project: its production branch is set only in its dashboard (Environments → Production →
Branch Tracking), the API's `link.productionBranch` being read-only; and once it is switched the
default branch deploys as a Preview, so the Preview environment variables must exist before it
serves as staging. The structural check SHALL hold the template's Branching model to give the line
``- **Production branch:** `production` ``.

**Evidence:** `.claude/skills/process-intake/ticket-flow.template.md:121`,
`.claude/skills/process-intake/ticket-flow.template.md:125`,
`.claude/skills/process-intake/SKILL.md:108`, `.claude/skills/ticket-flow/SKILL.md:389`,
`.claude/skills/release-ticket/SKILL.md:108`, `.claude/skills/release-ticket/SKILL.md:123`,
`.claude/skills/dev-ticket/SKILL.md:50`, `.claude/skills/qa-ticket/SKILL.md:85`,
`.claude/skills/ticket-flow/release.template.md:15`, `scripts/verify-skills.mjs:206`,
`scripts/verify-skills.mjs:509`

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: the template names the production branch, with
  `production` as its default
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: the template names no production branch

- **GIVEN** a process template whose Branching model has no `Production branch` line
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the line and the default it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose branching model names no production branch is refused"

#### Scenario: the template's default is another name

- **GIVEN** a process template whose `Production branch` line gives `prod`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process template whose production branch does not default to production is refused"

#### Scenario: a project that names `prod`

- **GIVEN** a project layer whose Branching model names the production branch `prod`
- **WHEN** a dev session cuts a hotfix and its QA brings it to Ready to merge
- **THEN** the branch is cut from `origin/prod`, and QA brings it current with `prod`'s tip
- **Test:** Not covered — the rule is a procedure dev and QA sessions follow; no runner drives a
  session, and the structural check only proves the template's line

### Requirement: TICKET-28 — The board is the source of every open ticket

`ticket-flow` § Board operations SHALL state that the board is the source of every open ticket,
its content included, and that nothing in the repository writes or mirrors one: the general plan
records a ticket only once it is closed or dropped (TICKET-29). The template of the project
layer, `.claude/skills/process-intake/ticket-flow.template.md`, SHALL state the same in its
§ Board adapter, and `process-intake` § Step 3 SHALL tell the team so. The structural check SHALL
hold both sections to name `source of every open ticket`.

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:47`, `.claude/skills/ticket-flow/SKILL.md:50`,
`.claude/skills/process-intake/ticket-flow.template.md:11`,
`.claude/skills/process-intake/SKILL.md:58`, `.claude/skills/process-intake/SKILL.md:60`,
`scripts/verify-skills.mjs:235`, `scripts/verify-skills.mjs:386`, `scripts/verify-skills.mjs:528`

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

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:96`,
`.claude/skills/refine-ticket/SKILL.md:268`, `.claude/skills/refine-ticket/SKILL.md:270`,
`.claude/skills/refine-ticket/SKILL.md:274`, `.claude/skills/refine-ticket/SKILL.md:277`,
`.claude/skills/refine-ticket/SKILL.md:278`, `.claude/skills/refine-ticket/SKILL.md:281`,
`.claude/skills/refine-ticket/SKILL.md:285`, `.claude/skills/refine-ticket/SKILL.md:323`,
`.claude/skills/po-ticket/SKILL.md:24`, `.claude/skills/po-ticket/SKILL.md:50`,
`.claude/skills/po-ticket/SKILL.md:110`, `.claude/skills/po-ticket/SKILL.md:113`,
`.claude/skills/po-ticket/SKILL.md:130`, `.claude/skills/ticket-flow/SKILL.md:50`,
`.claude/skills/ticket-flow/SKILL.md:99`, `.claude/skills/ticket-flow/SKILL.md:103`,
`.claude/skills/ticket-flow/SKILL.md:198`, `.claude/skills/ticket-flow/SKILL.md:199`,
`.claude/skills/process-intake/ticket-flow.template.md:11`, `scripts/verify-skills.mjs:243`,
`scripts/verify-skills.mjs:246`, `scripts/verify-skills.mjs:408`, `scripts/verify-skills.mjs:411`,
`scripts/verify-skills.mjs:439`, `scripts/verify-skills.mjs:440`, `scripts/verify-skills.mjs:441`

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

**Evidence:** `.claude/skills/general-plan/validate-general-plan.mjs:18`,
`.claude/skills/general-plan/validate-general-plan.mjs:50`,
`.claude/skills/general-plan/validate-general-plan.mjs:155`,
`.claude/skills/general-plan/validate-general-plan.mjs:158`,
`.claude/skills/general-plan/validate-general-plan.mjs:194`,
`.claude/skills/general-plan/validate-general-plan.mjs:217`,
`.claude/skills/general-plan/SKILL.md:72`, `.claude/skills/general-plan/SKILL.md:80`,
`.claude/skills/general-plan/SKILL.md:135`, `.claude/skills/general-plan/SKILL.md:138`,
`.claude/skills/general-plan/general-plan.template.md:163`,
`.claude/skills/general-plan/general-plan.template.md:175`,
`.claude/skills/general-plan/general-plan.template.md:190`,
`.claude/skills/general-plan/general-plan.template.md:199`

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
then follow the merge policy of `.agents/harness.config.json`: on the owner's word under `manual`, and under
`low-risk` without asking, as a pull request that changes only a passive file, recorded on the
ticket or release ticket it records. When the project layer's merge gate fails for it, or the
host refuses its merge, the architect SHALL tell the owner, and the pull request SHALL wait in
the queue. The structural check SHALL hold `refine-ticket` § Merge queue to state that the
architect brings it current itself and that each added row matches its board page in id, title,
target version and closing pull request.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:122`,
`.claude/skills/refine-ticket/SKILL.md:135`, `.claude/skills/refine-ticket/SKILL.md:138`,
`.claude/skills/refine-ticket/SKILL.md:148`, `.claude/skills/refine-ticket/SKILL.md:150`,
`.claude/skills/refine-ticket/SKILL.md:155`, `.claude/skills/refine-ticket/SKILL.md:158`,
`.claude/skills/refine-ticket/SKILL.md:159`, `.claude/skills/refine-ticket/SKILL.md:162`,
`.claude/skills/refine-ticket/SKILL.md:171`, `.claude/skills/refine-ticket/SKILL.md:172`,
`.claude/skills/refine-ticket/SKILL.md:176`, `.claude/skills/refine-ticket/SKILL.md:193`,
`.claude/skills/refine-ticket/SKILL.md:200`, `.claude/skills/refine-ticket/SKILL.md:212`,
`.claude/skills/refine-ticket/SKILL.md:214`, `.claude/skills/refine-ticket/SKILL.md:288`,
`.claude/skills/ticket-flow/SKILL.md:160`, `.claude/skills/ticket-flow/SKILL.md:357`,
`scripts/verify-skills.mjs:254`, `scripts/verify-skills.mjs:255`, `scripts/verify-skills.mjs:431`,
`scripts/verify-skills.mjs:432`

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

- **GIVEN** a project whose harness config records `low-risk`, and the architect's catalog
  pull request of a release, `PR #88`, that changes only docs/GENERAL_PLAN.md and whose every
  row matches its board page
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

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:72`, `.claude/skills/ticket-flow/SKILL.md:100`,
`.claude/skills/ticket-flow/SKILL.md:110`, `.claude/skills/ticket-flow/SKILL.md:115`,
`.claude/skills/ticket-flow/SKILL.md:120`, `.claude/skills/ticket-flow/SKILL.md:124`,
`.claude/skills/ticket-flow/SKILL.md:127`, `.claude/skills/ticket-flow/SKILL.md:128`,
`.claude/skills/ticket-flow/SKILL.md:131`, `.claude/skills/ticket-flow/SKILL.md:135`,
`.claude/skills/ticket-flow/SKILL.md:136`, `.claude/skills/ticket-flow/SKILL.md:175`,
`.claude/skills/ticket-flow/SKILL.md:198`, `.claude/skills/ticket-flow/SKILL.md:313`,
`.claude/skills/ticket-flow/SKILL.md:331`, `.claude/skills/ticket-flow/SKILL.md:376`,
`.claude/skills/po-ticket/SKILL.md:35`, `.claude/skills/po-ticket/SKILL.md:93`,
`.claude/skills/po-ticket/SKILL.md:105`, `.claude/skills/refine-ticket/SKILL.md:100`,
`.claude/skills/refine-ticket/SKILL.md:245`, `.claude/skills/refine-ticket/SKILL.md:254`,
`.claude/skills/refine-ticket/SKILL.md:255`, `.claude/skills/refine-ticket/SKILL.md:257`,
`.claude/skills/refine-ticket/SKILL.md:259`, `.claude/skills/refine-ticket/SKILL.md:261`,
`.claude/skills/refine-ticket/SKILL.md:262`, `.claude/skills/refine-ticket/SKILL.md:347`,
`.claude/skills/dev-ticket/SKILL.md:105`, `.claude/skills/qa-ticket/SKILL.md:111`,
`.claude/skills/process-intake/ticket-flow.template.md:40`,
`.claude/skills/release-ticket/SKILL.md:39`, `.claude/skills/ticket-flow/release.template.md:14`,
`scripts/verify-skills.mjs:130`, `scripts/verify-skills.mjs:283`, `scripts/verify-skills.mjs:284`,
`scripts/verify-skills.mjs:285`, `scripts/verify-skills.mjs:287`, `scripts/verify-skills.mjs:288`,
`scripts/verify-skills.mjs:387`, `scripts/verify-skills.mjs:389`, `scripts/verify-skills.mjs:416`,
`scripts/verify-skills.mjs:438`, `scripts/verify-skills.mjs:449`, `scripts/verify-skills.mjs:479`

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

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:87`,
`.claude/skills/refine-ticket/SKILL.md:119`, `.claude/skills/refine-ticket/SKILL.md:120`,
`.claude/skills/refine-ticket/SKILL.md:146`, `.claude/skills/refine-ticket/SKILL.md:213`,
`.claude/skills/refine-ticket/SKILL.md:215`, `.claude/skills/refine-ticket/SKILL.md:216`,
`.claude/skills/refine-ticket/SKILL.md:223`, `.claude/skills/refine-ticket/SKILL.md:224`,
`.claude/skills/refine-ticket/SKILL.md:225`, `.claude/skills/refine-ticket/SKILL.md:226`,
`.claude/skills/refine-ticket/SKILL.md:229`, `.claude/skills/refine-ticket/SKILL.md:230`,
`.claude/skills/refine-ticket/SKILL.md:233`, `.claude/skills/refine-ticket/SKILL.md:235`,
`.claude/skills/refine-ticket/SKILL.md:237`, `.claude/skills/refine-ticket/SKILL.md:240`,
`.claude/skills/refine-ticket/SKILL.md:315`, `.claude/skills/refine-ticket/SKILL.md:343`,
`.claude/skills/ticket-flow/SKILL.md:96`, `.claude/skills/ticket-flow/SKILL.md:148`,
`.claude/skills/ticket-flow/SKILL.md:170`, `.claude/skills/ticket-flow/SKILL.md:351`,
`.claude/skills/ticket-flow/SKILL.md:364`, `.claude/skills/qa-ticket/SKILL.md:96`,
`.claude/skills/dev-ticket/SKILL.md:93`, `.claude/skills/dev-ticket/SKILL.md:96`,
`scripts/verify-skills.mjs:265`, `scripts/verify-skills.mjs:266`, `scripts/verify-skills.mjs:267`,
`scripts/verify-skills.mjs:268`, `scripts/verify-skills.mjs:269`, `scripts/verify-skills.mjs:270`,
`scripts/verify-skills.mjs:367`, `scripts/verify-skills.mjs:421`, `scripts/verify-skills.mjs:433`,
`scripts/verify-skills.mjs:437`, `scripts/verify-skills.mjs:465`

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
