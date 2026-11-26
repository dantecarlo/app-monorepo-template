# Delta: harness/ticket-flow

> **Change:** `2026-11-26-ticket-flow-relayed-approval`

## ADDED Requirements

### Requirement: TICKET-36 — An approval counts where it was asked, or relayed by the architect word for word

`ticket-flow` rule 6 SHALL say that an approval counts in the session that asked for it, and that
an approval the owner gives in the architect's session counts in another session too when the
architect relays it word for word, with its time and the question it answered. It SHALL say that
a relay never widens an approval: it covers what that question named and nothing more, and every
irreversible production step still gets its own yes. It SHALL say that a relay from any other
session does not count. The structural check SHALL hold `ticket-flow` § Rules every role follows
to name the architect's relay.

**Evidence:** `.claude/skills/ticket-flow/SKILL.md:243`, `.claude/skills/ticket-flow/SKILL.md:244`,
`.claude/skills/ticket-flow/SKILL.md:245`, `.claude/skills/ticket-flow/SKILL.md:246`,
`.claude/skills/ticket-flow/SKILL.md:247`, `scripts/verify-skills.mjs:241`,
`scripts/verify-skills.mjs:420`

#### Scenario: the skills of the repository

- **GIVEN** the repository's seven ticket skills
- **WHEN** `pnpm verify:skills:test` runs
- **THEN** the structural check finds nothing: rule 6 names the architect's relay
- **Test:** `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"

#### Scenario: rule 6 drops the relay

- **GIVEN** a `ticket-flow` whose rule 6 never names the architect's relay
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the file, the section and the relay it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a ticket-flow whose approval rule names no architect relay is refused"

#### Scenario: a relay that carries the owner's word, its time and its question

- **GIVEN** an owner who answered "Release 1.4?" in the architect's session
- **WHEN** the architect relays "yes, 14:05, to: Release 1.4?" to the CI/CD session
- **THEN** the CI/CD session takes it as the owner's word for that release
- **Test:** Not covered — the rule is a procedure the architect and CI/CD sessions follow; no
  runner drives a session

#### Scenario: a relay that goes beyond its question

- **GIVEN** the relayed answer to "Release 1.4?" and a production migration in that release
- **WHEN** the CI/CD session reaches the migration
- **THEN** it asks the owner for that step, as the relay did not name it
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

#### Scenario: a relay from another session

- **GIVEN** a QA or dev session that says the owner approved a step
- **WHEN** the CI/CD session reads it
- **THEN** it does not count: the session asks the owner itself, or waits for the architect's relay
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

## MODIFIED Requirements

### Requirement: TICKET-16 — Each deploy target runs on the owner's word, in order, checked

`release-ticket` SHALL run the deploy targets a release touches in the order the project layer
declares, only on the owner's word for the release and for each irreversible step, recorded on
the release ticket, check each target, run a failed target's declared rollback and stop the
release, and read every deploy secret from the store the target names, never from a ticket. Its
Step 2 SHALL wait for the owner's word in the CI/CD session, or for the architect's relay of it
(TICKET-36), which covers that one release; the relay covers no irreversible step, each of which
gets its own yes in Step 3. The structural check SHALL hold `release-ticket` Step 2 to name
`ticket-flow` rule 6.

**Evidence:** `.claude/skills/release-ticket/SKILL.md:52`, `.claude/skills/release-ticket/SKILL.md:54`,
`.claude/skills/release-ticket/SKILL.md:55`, `.claude/skills/release-ticket/SKILL.md:56`,
`.claude/skills/release-ticket/SKILL.md:70`, `.claude/skills/release-ticket/SKILL.md:73`,
`.claude/skills/release-ticket/SKILL.md:76`, `scripts/verify-skills.mjs:522`,
`scripts/verify-skills.mjs:526`

#### Scenario: a target fails its check

- **GIVEN** a release whose migration target passed and whose web target fails its check
- **WHEN** the CI/CD role reads the check
- **THEN** it runs the web target's rollback, runs no later target, comments on the release
  ticket and messages the architect that the target failed
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session or a deploy

#### Scenario: Step 2 drops the relay

- **GIVEN** a `release-ticket` whose Step 2 never names the architect's relay
- **WHEN** the structural check runs
- **THEN** it reports one finding, naming the file, the step and the relay it owes
- **Test:** `scripts/verify-skills.test.mjs` › "a release-ticket whose owner's word step names no architect relay is refused"

#### Scenario: a relayed go covers the release and no irreversible step

- **GIVEN** a release the architect relays the owner's yes for, with a production migration
- **WHEN** the CI/CD session reaches the migration in Step 3
- **THEN** it asks the owner for the migration in its own session and records that go on the
  release ticket
- **Test:** Not covered — the rule is a procedure a CI/CD session follows; no runner drives a
  session

### Requirement: TICKET-25 — The architect keeps the merge queue and merges one pull request at a time

`refine-ticket` § Merge queue SHALL keep one merge queue: every pull request at Ready to merge
into the default branch, each with its evidence link, and the architect's own closed ticket
catalog pull request (TICKET-31), in the merge order the architect sets, shown to the owner in the
architect's session. The architect SHALL ask for or merge only the pull request at the head of the
queue, and only while the project layer's merge gate, when it names one, passes and every Ready
to merge condition holds (CI green, no conflict, the branch holding the default branch's current
tip); a pull request that fails one SHALL be brought current by the architect itself, a ticket's
from its spare worktree (TICKET-33) and the closed ticket catalog pull request as TICKET-31 says.
It SHALL merge on the owner's word, asked in the architect's own session, where a relay from any
other session does not count (TICKET-36), under the `manual`
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
policy from the default branch's copy and fails closed to `manual` (TICKET-20), and says that a
relay from any other session does not count.

**Evidence:** `.claude/skills/refine-ticket/SKILL.md:84`,
`.claude/skills/refine-ticket/SKILL.md:93`, `.claude/skills/refine-ticket/SKILL.md:114`,
`.claude/skills/refine-ticket/SKILL.md:116`, `.claude/skills/refine-ticket/SKILL.md:122`,
`.claude/skills/refine-ticket/SKILL.md:124`, `.claude/skills/refine-ticket/SKILL.md:135`,
`.claude/skills/refine-ticket/SKILL.md:138`, `.claude/skills/refine-ticket/SKILL.md:143`,
`.claude/skills/refine-ticket/SKILL.md:146`, `.claude/skills/refine-ticket/SKILL.md:150`,
`.claude/skills/refine-ticket/SKILL.md:176`, `.claude/skills/refine-ticket/SKILL.md:177`,
`.claude/skills/refine-ticket/SKILL.md:179`, `.claude/skills/refine-ticket/SKILL.md:181`, `.claude/skills/refine-ticket/SKILL.md:202`,
`.claude/skills/refine-ticket/SKILL.md:204`, `.claude/skills/refine-ticket/SKILL.md:205`,
`.claude/skills/refine-ticket/SKILL.md:213`, `.claude/skills/refine-ticket/SKILL.md:217`,
`.claude/skills/refine-ticket/SKILL.md:218`, `.claude/skills/ticket-flow/SKILL.md:98`,
`.claude/skills/ticket-flow/SKILL.md:142`, `.claude/skills/ticket-flow/SKILL.md:171`,
`.claude/skills/ticket-flow/SKILL.md:354`, `.claude/skills/ticket-flow/SKILL.md:357`,
`.claude/skills/ticket-flow/SKILL.md:363`, `scripts/verify-skills.mjs:204`,
`scripts/verify-skills.mjs:450`, `scripts/verify-skills.mjs:453`, `scripts/verify-skills.mjs:461`,
`scripts/verify-skills.mjs:462`

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

#### Scenario: the merge queue says nothing about a relay

- **GIVEN** a `refine-ticket` whose § Merge queue never says that a relay from any other session
  does not count
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no rule on a relay from another session is refused"
