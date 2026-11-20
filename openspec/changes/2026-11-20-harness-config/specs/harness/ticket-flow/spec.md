# Delta: harness/ticket-flow

> **Change:** `2026-11-20-harness-config`

## MODIFIED Requirements

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
skills name, `manual` its default, and `pnpm verify:harness-config` SHALL refuse any other value.
A merge into the production branch the layer names, a deploy, a production migration, a store
submission and every other irreversible step SHALL stay the owner's word under every policy, as
`ticket-flow` rule 4 and `release-ticket` say; and under neither policy SHALL the architect or QA
merge a pull request into the production branch (TICKET-24).

**Evidence:** written at apply time, when the code exists.

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
- **THEN** its finding names the file, the section and the policy
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

**Evidence:** `.claude/skills/qa-ticket/SKILL.md:99`, `.claude/skills/refine-ticket/SKILL.md:96`,
`.claude/skills/refine-ticket/SKILL.md:266`, `.claude/skills/release-ticket/SKILL.md:158`,
`.claude/skills/ticket-flow/SKILL.md:98`, `.claude/skills/ticket-flow/SKILL.md:169`,
`scripts/verify-skills.mjs:210`, `scripts/verify-skills.mjs:418`

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
tip); a ticket's pull request that fails one SHALL go back to its QA as `<id> bring current`, and
the closed ticket catalog pull request SHALL be brought current by the architect itself. It SHALL
merge on the owner's word, asked in the architect's own session, under the `manual` policy or
when `.agents/harness.config.json` records none; and, under `low-risk`, without asking only a pull request
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

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:84`,
`.claude/skills/refine-ticket/SKILL.md:91`, `.claude/skills/refine-ticket/SKILL.md:112`,
`.claude/skills/refine-ticket/SKILL.md:118`, `.claude/skills/refine-ticket/SKILL.md:120`,
`.claude/skills/refine-ticket/SKILL.md:131`, `.claude/skills/refine-ticket/SKILL.md:134`,
`.claude/skills/refine-ticket/SKILL.md:139`, `.claude/skills/refine-ticket/SKILL.md:145`,
`.claude/skills/refine-ticket/SKILL.md:147`, `.claude/skills/refine-ticket/SKILL.md:173`,
`.claude/skills/refine-ticket/SKILL.md:196`, `.claude/skills/refine-ticket/SKILL.md:197`,
`.claude/skills/refine-ticket/SKILL.md:209`, `.claude/skills/refine-ticket/SKILL.md:212`,
`.claude/skills/ticket-flow/SKILL.md:98`, `.claude/skills/ticket-flow/SKILL.md:142`,
`.claude/skills/ticket-flow/SKILL.md:168`, `.claude/skills/ticket-flow/SKILL.md:170`,
`.claude/skills/ticket-flow/SKILL.md:345`, `.claude/skills/ticket-flow/SKILL.md:352`,
`scripts/verify-skills.mjs:182`, `scripts/verify-skills.mjs:373`, `scripts/verify-skills.mjs:383`

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

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:118`,
`.claude/skills/refine-ticket/SKILL.md:131`, `.claude/skills/refine-ticket/SKILL.md:134`,
`.claude/skills/refine-ticket/SKILL.md:145`, `.claude/skills/refine-ticket/SKILL.md:147`,
`.claude/skills/refine-ticket/SKILL.md:152`, `.claude/skills/refine-ticket/SKILL.md:155`,
`.claude/skills/refine-ticket/SKILL.md:156`, `.claude/skills/refine-ticket/SKILL.md:159`,
`.claude/skills/refine-ticket/SKILL.md:168`, `.claude/skills/refine-ticket/SKILL.md:169`,
`.claude/skills/refine-ticket/SKILL.md:173`, `.claude/skills/refine-ticket/SKILL.md:190`,
`.claude/skills/refine-ticket/SKILL.md:197`, `.claude/skills/refine-ticket/SKILL.md:209`,
`.claude/skills/refine-ticket/SKILL.md:212`, `.claude/skills/refine-ticket/SKILL.md:259`,
`.claude/skills/ticket-flow/SKILL.md:157`, `.claude/skills/ticket-flow/SKILL.md:352`,
`scripts/verify-skills.mjs:239`, `scripts/verify-skills.mjs:240`, `scripts/verify-skills.mjs:383`,
`scripts/verify-skills.mjs:384`

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
