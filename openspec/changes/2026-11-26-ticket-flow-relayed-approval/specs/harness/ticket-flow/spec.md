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

**Evidence:** written at apply time, when the code exists.

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
`.claude/skills/release-ticket/SKILL.md:55`, `.claude/skills/release-ticket/SKILL.md:68`,
`.claude/skills/release-ticket/SKILL.md:71`, `.claude/skills/release-ticket/SKILL.md:74`. The
relay clause of Step 2 is written at apply time.

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
