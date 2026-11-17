# Delta: harness/ticket-flow

> **Change:** `2026-11-17-ticket-identity-config`

## ADDED Requirements

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

## MODIFIED Requirements

### Requirement: TICKET-05 — A ticket branch whose body names its id passes

`scripts/verify-ticket-branch.mjs` SHALL pass a branch `<type>/<id>-<slug>`, or `<type>/<id>`
when the ticket identity's slug is optional, whose type is one of the identity's `branchTypes`,
whose id the identity's `idPattern` matches whole, and whose slug, when it has one, is lower-case
kebab, when the pull request body names that id: `#<number>` for an id that is a number, the id
itself otherwise. Under the default identity (TICKET-21) the types are `feature`, `fix`, `tech`
and `chore`, the id is a number or an upper-case key, a hyphen and a number, and the slug is
required. When the slug is optional and the pattern matches everything after the type, the branch
has no slug.

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

#### Scenario: Certifipago's branch under its layer

- **GIVEN** Certifipago's layer (`idPattern` `TASK-[a-z0-9]+(?:-[a-z0-9]+)*`, the Conventional
  Commit types as `branchTypes`, an optional slug), the branch `feat/TASK-min-app-version-app`
  and a body that names `TASK-min-app-version-app`
- **WHEN** the check runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-ticket-branch.test.mjs` › "a Certifipago branch and body pass under its layer"

#### Scenario: an optional slug left out

- **GIVEN** a layer whose slug is optional, the branch `feature/123` and a body that says `Refs #123`
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

**Evidence:** written at apply time, when the code exists.

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

- **GIVEN** a layer whose `branchTypes` are `feat` and `fix`, and the branch `feature/123-add-sign-in`
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
