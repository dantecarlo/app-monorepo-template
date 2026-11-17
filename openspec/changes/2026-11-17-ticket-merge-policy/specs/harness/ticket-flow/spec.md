# Delta: harness/ticket-flow

> **Change:** `2026-11-17-ticket-merge-policy`

## ADDED Requirements

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

#### Scenario: the intake never offers `low-risk`

- **GIVEN** a `process-intake` whose Step 3 never names `low-risk`
- **WHEN** the structural check runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no low-risk merge policy is refused"

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

## MODIFIED Requirements

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

**Evidence:** written at apply time, when the code exists.

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
