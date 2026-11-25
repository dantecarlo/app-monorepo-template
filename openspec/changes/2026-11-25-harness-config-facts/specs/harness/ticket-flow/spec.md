# Delta: harness/ticket-flow

> **Change:** `2026-11-25-harness-config-facts`

## ADDED Requirements

### Requirement: TICKET-34 — The harness config names the project, in the blocks a derived repository rewrites

`.agents/contracts/harness-config.schema.json` SHALL declare, beside `workflow`, `delivery` and
`backend`, the project's facts in the blocks a derived project's product-name gate reads:
`identity` (`product`, `repository`, `packageScope`), which every
config SHALL hold, and `vocabulary` (`forbiddenInCore`), `stack` (`monorepo`, `mobile`, `web`,
`backend`, `architecture`), `core` (`directory`) and `skills` (`trees`, `lock`, `valueSources`,
`valueTerms`), which a config MAY hold. Every field of `identity`, `vocabulary`, `core` and
`skills` SHALL be required in its block and non-blank: `product`, `repository`, `packageScope`,
`directory` and `lock` text, and `forbiddenInCore`, `trees`, `valueSources` and `valueTerms`
lists of text. Every field of `stack` SHALL be optional text. Each block SHALL accept its own
`$comment` and refuse a key it does not declare. `pnpm verify:harness-config` SHALL read the
`array` type, `items` and `minLength`, judging every item of a list, and SHALL refuse a missing
`identity`, a missing field of a block, a key a block does not declare, a value or a list item of
another type, and a blank value; a finding about a list item SHALL name its place in the list.
The template's `.agents/harness.config.json` SHALL name the template in `identity` and record
only `stack` facts that hold under every prune. When `.agents/harness.config.json` is absent,
`process-intake` § Step 4 SHALL write `identity` with the project's own names, never the
template's.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the template's harness config

- **GIVEN** a config holding the template's values, its `identity` included
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-harness-config.test.mjs` › "the template's harness config passes"

#### Scenario: every block of the project's facts

- **GIVEN** a config holding `identity`, `vocabulary`, `stack`, `core` and `skills` with every
  field each declares
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-harness-config.test.mjs` › "a config holding every block of the project's facts passes"

#### Scenario: a comment in every block

- **GIVEN** a config whose five blocks of facts each carry a `$comment`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-harness-config.test.mjs` › "a comment in every block of the project's facts is accepted"

#### Scenario: no identity

- **GIVEN** a config with no `identity`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a missing identity is refused"

#### Scenario: an identity with a field missing

- **GIVEN** a config whose `identity` has no `packageScope`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "an identity with no package scope is refused"

#### Scenario: a blank identity field

- **GIVEN** a config whose `identity.product` is `""`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding, naming the setting and the length it owes
- **Test:** `scripts/verify-harness-config.test.mjs` › "a blank identity field is refused"

#### Scenario: an identity field of another type

- **GIVEN** a config whose `identity.repository` is a number
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "an identity field that is not text is refused"

#### Scenario: an identity key the schema does not declare

- **GIVEN** a config whose `identity` holds `slug`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "an identity key the schema does not declare is refused"

#### Scenario: a vocabulary key the schema does not declare

- **GIVEN** a config whose `vocabulary` holds `allowedInCore`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a vocabulary key the schema does not declare is refused"

#### Scenario: a vocabulary with no list

- **GIVEN** a config whose `vocabulary` holds no `forbiddenInCore`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a vocabulary with no forbidden terms list is refused"

#### Scenario: forbidden terms that are not a list

- **GIVEN** a config whose `vocabulary.forbiddenInCore` is one text
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "forbidden terms that are not a list are refused"

#### Scenario: a forbidden term of another type

- **GIVEN** a config whose `vocabulary.forbiddenInCore` holds a number
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a forbidden term that is not text is refused"

#### Scenario: a finding about a list item

- **GIVEN** a config whose `vocabulary.forbiddenInCore` holds a number second
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** its one finding names `vocabulary.forbiddenInCore.1`
- **Test:** `scripts/verify-harness-config.test.mjs` › "a list item is named by its place in the list"

#### Scenario: a blank forbidden term

- **GIVEN** a config whose `vocabulary.forbiddenInCore` holds `""`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a blank forbidden term is refused"

#### Scenario: a stack key the schema does not declare

- **GIVEN** a config whose `stack` holds `database`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a stack key the schema does not declare is refused"

#### Scenario: a stack fact of another type

- **GIVEN** a config whose `stack.web` is a list
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a stack fact that is not text is refused"

#### Scenario: a stack with no facts

- **GIVEN** a config whose `stack` holds no field
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it finds nothing
- **Test:** `scripts/verify-harness-config.test.mjs` › "a stack with no facts passes"

#### Scenario: a core key the schema does not declare

- **GIVEN** a config whose `core` holds `include`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a core key the schema does not declare is refused"

#### Scenario: a core with no directory

- **GIVEN** a config whose `core` holds no `directory`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a core with no directory is refused"

#### Scenario: a core directory of another type

- **GIVEN** a config whose `core.directory` is a list
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a core directory that is not text is refused"

#### Scenario: a skills key the schema does not declare

- **GIVEN** a config whose `skills` holds `vendored`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a skills key the schema does not declare is refused"

#### Scenario: a skills block with no lock

- **GIVEN** a config whose `skills` holds no `lock`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a skills block with no lock is refused"

#### Scenario: skill trees that are not a list

- **GIVEN** a config whose `skills.trees` is one text
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "skill trees that are not a list are refused"

#### Scenario: a skill value source of another type

- **GIVEN** a config whose `skills.valueSources` holds an object
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding
- **Test:** `scripts/verify-harness-config.test.mjs` › "a skill value source that is not text is refused"

#### Scenario: an `items` the gate cannot read

- **GIVEN** a schema whose `vocabulary.forbiddenInCore` gives `items` as a text
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding, a keyword value the gate cannot read
- **Test:** `scripts/verify-harness-config.test.mjs` › "a schema items that is not a schema is refused"

#### Scenario: a `minLength` the gate cannot read

- **GIVEN** a schema whose `identity.product` gives `minLength` as `1.5`
- **WHEN** `pnpm verify:harness-config` runs
- **THEN** it reports one finding, a keyword value the gate cannot read
- **Test:** `scripts/verify-harness-config.test.mjs` › "a schema minLength that is not a whole number is refused"

#### Scenario: the intake in a project with no harness config writes the project's identity

- **GIVEN** a project with no `.agents/harness.config.json`
- **WHEN** `process-intake` writes on the team's yes
- **THEN** the file's `identity` holds the project's product, repository and package scope,
  never the template's
- **Test:** Not covered — the rule is a procedure an intake session follows; no runner drives a
  session, and `verify:harness-config` cannot tell a project's own name from the template's
