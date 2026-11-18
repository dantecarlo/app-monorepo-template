# Delta: harness/ticket-flow

> **Change:** `2026-11-18-ticket-flow-defaults`

## ADDED Requirements

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
ticket is a `tech` one), SHALL carry a target version, so every ticket closes through a release.
`po-ticket` SHALL create no ticket without one, asking the client when nobody said. `refine-ticket`
SHALL move no ticket past Refinement without one: a ticket with none (under the GitHub Issues
adapter, an issue with no milestone) SHALL stop there while the architect proposes a version on
the ticket, messages the PO `<id> version change` and waits for `<id> version set`. A technical
ticket the architect files SHALL get its version the same way, the PO being the only session that
runs `set version`. `ticket-flow` § Target version SHALL say where the rule is checked, since no
gate reads the board. `ticket.template.md` SHALL mark the version required, and the structural
check SHALL hold its Target version section to name `**Version (required):**`.

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
  a pull request body only, and a board check comes with the board-is-the-source change

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
`- **Production branch:** `production``.

**Evidence:** written at apply time, when the code exists.

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

## MODIFIED Requirements

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

**Evidence:** written at apply time, when the code exists.

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

### Requirement: TICKET-14 — The release skill carries the release, and the architect groups it

`.claude/skills/release-ticket/SKILL.md` SHALL carry sections for the deploy targets, the
branching (the recommended default with a long-lived production branch, which the layer names and
which is `production` by default, and the tags-only alternative), the migrations and the hotfix,
and `.claude/skills/refine-ticket/SKILL.md` a section that groups Done tickets into a release
ticket.

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
every ticket whose target version is V and each one is Done, except a hotfix, which is at Ready to
merge into the production branch the layer names with every Ready to merge condition met against
that branch's current tip; the default branch's CI is green; and the QA of each area the batch
touches has checked it on staging or preview, with evidence on the release ticket. `ticket-flow`'s
Ready for prod row and § Release stage, `release-ticket` Step 1 and `release.template.md` SHALL
state the same rule and the same exception.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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
