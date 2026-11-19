# harness/ticket-flow — living spec

> **Governs:** `.claude/skills/ticket-flow`, `.claude/skills/po-ticket`, `.claude/skills/refine-ticket`, `.claude/skills/dev-ticket`, `.claude/skills/qa-ticket`, `.claude/skills/release-ticket`, `.claude/skills/process-intake`, `.claude/skills/general-plan`, `scripts/verify-skills.mjs`, `scripts/verify-ticket-branch.mjs`
> **ID prefix:** `TICKET`
> **Derived from:** `openspec/changes/archive/2026-11-16-ticket-flow/source-spec.md`, `docs/harness.md`
> **Verified against the code:** 2026-11-18 at `5d64e9d`

## Purpose

The ticket-flow unit of the harness lets several long-lived sessions (a PO, an architect, dev and
QA sessions per area, a CI/CD session) work one product with the ticket as the only carrier of
context. It owns the seven skills that hold the flow (the `ticket-flow` contract, the five role
procedures and `process-intake`), their three templates, the structural check that holds the
skills to their sections, and the pure branch check a project may add to its CI, which judges a
branch under the ticket identity the project's layer declares. The board is the source of every
open ticket, so the unit also holds what the general plan of a project with a ticket flow records:
closed tickets only, in a catalog the general-plan skill and its validator know (TICKET-30), which
this spec cites but does not govern. Each project's
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
`.claude/skills/ticket-flow/SKILL.md:83`, `.claude/skills/ticket-flow/SKILL.md:152`,
`.claude/skills/ticket-flow/SKILL.md:317`, `.claude/skills/ticket-flow/ticket.template.md:21`,
`.claude/skills/ticket-flow/release.template.md:11`, `scripts/verify-skills.mjs:244`

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

**Evidence:** `.claude/skills/po-ticket/SKILL.md:20`, `.claude/skills/refine-ticket/SKILL.md:26`,
`.claude/skills/dev-ticket/SKILL.md:18`, `.claude/skills/qa-ticket/SKILL.md:20`,
`.claude/skills/release-ticket/SKILL.md:19`, `scripts/verify-skills.mjs:680`

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

**Evidence:** `scripts/verify-skills.mjs:626`, `scripts/verify-skills.mjs:714`,
`scripts/verify-skills.mjs:799`

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
`.claude/skills/process-intake/ticket-flow.template.md:110`,
`.claude/skills/process-intake/ticket-flow.template.md:119`, `scripts/verify-skills.mjs:244`

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

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:67`, `.claude/skills/ticket-flow/SKILL.md:83`

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
with its evidence on the pull request. QA SHALL stop there: it SHALL neither ask the owner nor
merge, and SHALL message the architect `<id> ready to merge, PR #<n>`, or
`<id> ready to merge, hotfix` for a hotfix (TICKET-24). On the architect's `<id> bring current`,
QA SHALL bring the branch current and re-check it again the same way, then answer
`<id> ready to merge, PR #<n>` again, or move the ticket to Changes requested on a conflict or a
red check. The architect merges it (TICKET-25). The structural check SHALL hold `qa-ticket`
§ Step 6 to name `ready to merge, PR #`, and `qa-ticket` to hold no `Ready to merge → Done`.

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:66`, `.claude/skills/qa-ticket/SKILL.md:85`,
`.claude/skills/qa-ticket/SKILL.md:89`, `.claude/skills/qa-ticket/SKILL.md:105`,
`.claude/skills/ticket-flow/SKILL.md:96`, `.claude/skills/ticket-flow/SKILL.md:292`,
`scripts/verify-skills.mjs:191`, `scripts/verify-skills.mjs:336`, `scripts/verify-skills.mjs:522`

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: QA hands a ticket to the architect and moves none
  to Done
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

#### Scenario: a green branch behind its base

- **GIVEN** a ticket whose checks passed on a branch the default branch has moved past
- **WHEN** QA would hand it to the architect
- **THEN** QA brings the branch current, re-runs the checks, and messages the architect
  `<id> ready to merge, PR #<n>` only once they pass
- **Test:** Not covered — the rule is a procedure a QA session follows; no runner drives a
  session

#### Scenario: another merge landed first

- **GIVEN** a ticket at Ready to merge, second in the merge queue, after the architect merged the
  first
- **WHEN** QA receives `<id> bring current`
- **THEN** QA merges the base into the branch, pushes it unforced, re-runs the checks and answers
  `<id> ready to merge, PR #<n>`, or moves the ticket to Changes requested on a conflict
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
`.claude/skills/refine-ticket/SKILL.md:171`

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
every ticket whose target version is V and each one is Done, except a hotfix, which is at Ready to
merge into the production branch the layer names with every Ready to merge condition met against
that branch's current tip; the default branch's CI is green; and the QA of each area the batch
touches has checked it on staging or preview, with evidence on the release ticket. `ticket-flow`'s
Ready for prod row and § Release stage, `release-ticket` Step 1 and `release.template.md` SHALL
state the same rule and the same exception.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:187`, `.claude/skills/ticket-flow/SKILL.md:99`,
`.claude/skills/ticket-flow/SKILL.md:325`, `.claude/skills/release-ticket/SKILL.md:35`,
`.claude/skills/ticket-flow/release.template.md:14`

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

**Evidence:** `.claude/skills/po-ticket/SKILL.md:56`, `.claude/skills/po-ticket/SKILL.md:71`,
`.claude/skills/po-ticket/SKILL.md:77`, `.claude/skills/refine-ticket/SKILL.md:37`,
`.claude/skills/ticket-flow/SKILL.md:254`, `.claude/skills/ticket-flow/SKILL.md:268`

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

The ticket skills SHALL name the two merge policies a project layer may record: `manual`, the
default, under which the architect asks the owner before every merge, and `low-risk`, under which
the architect may merge without asking a pull request that meets every condition of `ticket-flow`
rule 4. `ticket-flow` § Rules every role follows, `refine-ticket` § Merge queue, `process-intake`
§ Step 3 and the Merge policy section of `.claude/skills/process-intake/ticket-flow.template.md`
SHALL each name both policies, and that section's `Policy` line SHALL give `manual`, the default.
A merge into the production branch the layer names, a deploy, a production migration, a store
submission and every other irreversible step SHALL stay the owner's word under every policy, as
`ticket-flow` rule 4 and `release-ticket` say; and under neither policy SHALL the architect or QA
merge a pull request into the production branch (TICKET-24).

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:180`,
`.claude/skills/refine-ticket/SKILL.md:115`, `.claude/skills/refine-ticket/SKILL.md:138`,
`.claude/skills/process-intake/SKILL.md:69`,
`.claude/skills/process-intake/ticket-flow.template.md:66`,
`.claude/skills/process-intake/ticket-flow.template.md:68`,
`.claude/skills/release-ticket/SKILL.md:24`, `scripts/verify-skills.mjs:135`,
`scripts/verify-skills.mjs:230`, `scripts/verify-skills.mjs:328`, `scripts/verify-skills.mjs:536`

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

#### Scenario: the architect's merge queue drops `manual`

- **GIVEN** a `refine-ticket` whose § Merge queue never names `manual`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no manual merge policy is refused"

#### Scenario: the architect's merge queue drops `low-risk`

- **GIVEN** a `refine-ticket` whose § Merge queue never names `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding
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
  into the production branch whose Risk line is `none`
- **WHEN** QA brings it to Ready to merge
- **THEN** QA merges nothing and asks the owner nothing: it leaves the ticket at Ready to merge
  and messages the architect `<id> ready to merge, hotfix`; the architect keeps it out of its
  merge queue, and the CI/CD session merges it as its release's deploy step (TICKET-24)
- **Test:** Not covered — the rule is a procedure the QA and architect sessions follow; no runner
  drives a session, and the structural check only proves the skills name both policies and the
  hotfix's message
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

**Evidence:** `scripts/verify-skills.mjs:235`, `scripts/verify-skills.mjs:299`,
`scripts/verify-skills.mjs:399`, `scripts/verify-skills.mjs:428`, `scripts/verify-skills.mjs:569`,
`.claude/skills/ticket-flow/SKILL.md:210`, `.claude/skills/ticket-flow/SKILL.md:216`,
`.claude/skills/process-intake/SKILL.md:85`,
`.claude/skills/process-intake/ticket-flow.template.md:94`

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
because the remote moved; and QA SHALL remove its own worktree once it is done with the ticket.
`dev-ticket` SHALL pull the ticket's branch before any later change in its own worktree, since
QA may have pushed to it. The structural check SHALL hold `qa-ticket` § Step 2 to name
`--detach` and § Step 5 to name `git push origin HEAD:<branch>`.

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:39`, `.claude/skills/qa-ticket/SKILL.md:79`,
`.claude/skills/qa-ticket/SKILL.md:114`, `.claude/skills/dev-ticket/SKILL.md:94`,
`scripts/verify-skills.mjs:185`, `scripts/verify-skills.mjs:349`

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

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:98`, `.claude/skills/refine-ticket/SKILL.md:100`,
`.claude/skills/refine-ticket/SKILL.md:173`, `.claude/skills/release-ticket/SKILL.md:158`,
`.claude/skills/ticket-flow/SKILL.md:97`, `.claude/skills/ticket-flow/SKILL.md:133`,
`scripts/verify-skills.mjs:198`, `scripts/verify-skills.mjs:352`

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

- **GIVEN** a project whose layer records `manual`, and a green hotfix pull request into the
  production branch, current with its tip
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
into the default branch, each with its evidence link, in the merge order the architect sets,
shown to the owner in the architect's session. The architect SHALL ask for or merge only the pull
request at the head of the queue, and only while every Ready to merge condition holds (CI green,
no conflict, the branch holding the default branch's current tip) and the project layer's merge
gate, when it names one, passes; a pull request that fails one SHALL go back to its QA as
`<id> bring current`. It SHALL merge on the owner's word, asked in the architect's own session,
under the `manual` policy or when the project layer records none; and, under `low-risk`, without
asking only a pull request whose Risk line is `Risk: none` or that changes only passive files, and
whose merge sets off no irreversible step, recording on the ticket that it merged under
`low-risk` and the Risk line it relied on. A pull request that fails one condition SHALL wait for
the owner, as under `manual`. After each merge the architect SHALL move the ticket to Done,
message the ticket's QA and dev sessions `<id> merged`, and message the QA of the next pull
request in the queue `<id> bring current`. `ticket-flow`'s states table SHALL name the architect
as the session that enters Done, a hotfix aside (TICKET-24), and its § Messages SHALL carry
`<id> ready to merge, PR #<n>`, from QA to the architect, and `<id> bring current`, from the
architect to QA. The structural check SHALL hold `refine-ticket` to have a § Merge queue.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:88`,
`.claude/skills/refine-ticket/SKILL.md:115`, `.claude/skills/refine-ticket/SKILL.md:123`,
`.claude/skills/refine-ticket/SKILL.md:133`, `.claude/skills/refine-ticket/SKILL.md:138`,
`.claude/skills/refine-ticket/SKILL.md:158`, `.claude/skills/refine-ticket/SKILL.md:165`,
`.claude/skills/ticket-flow/SKILL.md:97`, `.claude/skills/ticket-flow/SKILL.md:108`,
`.claude/skills/ticket-flow/SKILL.md:132`, `.claude/skills/ticket-flow/SKILL.md:134`,
`.claude/skills/ticket-flow/SKILL.md:305`, `scripts/verify-skills.mjs:170`,
`scripts/verify-skills.mjs:326`

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
ticket is a `tech` one), SHALL carry a target version, so every ticket closes through a release.
`po-ticket` SHALL create no ticket without one, asking the client when nobody said. `refine-ticket`
SHALL move no ticket past Refinement without one: a ticket with none (under the GitHub Issues
adapter, an issue with no milestone) SHALL stop there while the architect proposes a version on
the ticket, messages the PO `<id> version change` and waits for `<id> version set`. A technical
ticket the architect files SHALL get its version the same way, the PO being the only session that
runs `set version`. `ticket-flow` § Target version SHALL say where the rule is checked, since no
gate reads the board. `ticket.template.md` SHALL mark the version required, and the structural
check SHALL hold its Target version section to name `**Version (required):**`.

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:91`, `.claude/skills/ticket-flow/SKILL.md:254`,
`.claude/skills/ticket-flow/SKILL.md:256`, `.claude/skills/po-ticket/SKILL.md:48`,
`.claude/skills/po-ticket/SKILL.md:58`, `.claude/skills/refine-ticket/SKILL.md:37`,
`.claude/skills/refine-ticket/SKILL.md:39`, `.claude/skills/refine-ticket/SKILL.md:70`,
`.claude/skills/refine-ticket/SKILL.md:109`, `.claude/skills/ticket-flow/ticket.template.md:23`,
`scripts/verify-skills.mjs:221`, `scripts/verify-skills.mjs:260`

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

**Evidence:** `.claude/skills/process-intake/ticket-flow.template.md:119`,
`.claude/skills/process-intake/ticket-flow.template.md:123`,
`.claude/skills/process-intake/SKILL.md:105`, `.claude/skills/ticket-flow/SKILL.md:337`,
`.claude/skills/release-ticket/SKILL.md:108`, `.claude/skills/release-ticket/SKILL.md:123`,
`.claude/skills/dev-ticket/SKILL.md:50`, `.claude/skills/qa-ticket/SKILL.md:85`,
`.claude/skills/ticket-flow/release.template.md:15`, `scripts/verify-skills.mjs:179`,
`scripts/verify-skills.mjs:382`

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
records a ticket only once it is closed (TICKET-29). The template of the project layer,
`.claude/skills/process-intake/ticket-flow.template.md`, SHALL state the same in its § Board
adapter, and `process-intake` § Step 3 SHALL tell the team so. The structural check SHALL hold
both sections to name `source of every open ticket`.

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:48`,
`.claude/skills/process-intake/ticket-flow.template.md:11`,
`.claude/skills/process-intake/SKILL.md:58`, `scripts/verify-skills.mjs:208`,
`scripts/verify-skills.mjs:296`, `scripts/verify-skills.mjs:401`

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

**Evidence:** `.claude/skills/po-ticket/SKILL.md:82`, `.claude/skills/po-ticket/SKILL.md:88`,
`.claude/skills/po-ticket/SKILL.md:91`, `.claude/skills/ticket-flow/SKILL.md:98`,
`.claude/skills/ticket-flow/SKILL.md:101`, `.claude/skills/ticket-flow/SKILL.md:159`,
`scripts/verify-skills.mjs:214`, `scripts/verify-skills.mjs:317`

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

**Evidence:** `.claude/skills/general-plan/validate-general-plan.mjs:49`,
`.claude/skills/general-plan/validate-general-plan.mjs:154`,
`.claude/skills/general-plan/validate-general-plan.mjs:157`,
`.claude/skills/general-plan/validate-general-plan.mjs:193`,
`.claude/skills/general-plan/validate-general-plan.mjs:216`,
`.claude/skills/general-plan/SKILL.md:72`, `.claude/skills/general-plan/SKILL.md:133`,
`.claude/skills/general-plan/general-plan.template.md:163`,
`.claude/skills/general-plan/general-plan.template.md:175`

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
