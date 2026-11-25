# Verify report: 2026-11-25-harness-config-facts

> **Verified:** 2026-11-25 at `2d28d762`

## Scenarios

Every test ran green at `2d28d762`: `node --test scripts/verify-harness-config.test.mjs` 78 of 78,
of which 28 are new (24 cases and 4 checks) and 3 rewritten: the template's case holds its new
`identity`, the unread-type case gives `integer` now that `array` is read, and the process check
expects the 18 settings the schema declares (50 before the change).

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-34 | the template's harness config | `scripts/verify-harness-config.test.mjs` › "the template's harness config passes" | green |
| TICKET-34 | every block of the project's facts | `scripts/verify-harness-config.test.mjs` › "a config holding every block of the project's facts passes" | green |
| TICKET-34 | a comment in every block | `scripts/verify-harness-config.test.mjs` › "a comment in every block of the project's facts is accepted" | green |
| TICKET-34 | no identity | `scripts/verify-harness-config.test.mjs` › "a missing identity is refused" | green |
| TICKET-34 | an identity with a field missing | `scripts/verify-harness-config.test.mjs` › "an identity with no package scope is refused" | green |
| TICKET-34 | a blank identity field | `scripts/verify-harness-config.test.mjs` › "a blank identity field is refused" | green |
| TICKET-34 | an identity field of another type | `scripts/verify-harness-config.test.mjs` › "an identity field that is not text is refused" | green |
| TICKET-34 | an identity key the schema does not declare | `scripts/verify-harness-config.test.mjs` › "an identity key the schema does not declare is refused" | green |
| TICKET-34 | a vocabulary key the schema does not declare | `scripts/verify-harness-config.test.mjs` › "a vocabulary key the schema does not declare is refused" | green |
| TICKET-34 | a vocabulary with no list | `scripts/verify-harness-config.test.mjs` › "a vocabulary with no forbidden terms list is refused" | green |
| TICKET-34 | forbidden terms that are not a list | `scripts/verify-harness-config.test.mjs` › "forbidden terms that are not a list are refused" | green |
| TICKET-34 | a forbidden term of another type | `scripts/verify-harness-config.test.mjs` › "a forbidden term that is not text is refused" | green |
| TICKET-34 | a finding about a list item | `scripts/verify-harness-config.test.mjs` › "a list item is named by its place in the list" | green |
| TICKET-34 | a blank forbidden term | `scripts/verify-harness-config.test.mjs` › "a blank forbidden term is refused" | green |
| TICKET-34 | a stack key the schema does not declare | `scripts/verify-harness-config.test.mjs` › "a stack key the schema does not declare is refused" | green |
| TICKET-34 | a stack fact of another type | `scripts/verify-harness-config.test.mjs` › "a stack fact that is not text is refused" | green |
| TICKET-34 | a stack with no facts | `scripts/verify-harness-config.test.mjs` › "a stack with no facts passes" | green |
| TICKET-34 | a core key the schema does not declare | `scripts/verify-harness-config.test.mjs` › "a core key the schema does not declare is refused" | green |
| TICKET-34 | a core with no directory | `scripts/verify-harness-config.test.mjs` › "a core with no directory is refused" | green |
| TICKET-34 | a core directory of another type | `scripts/verify-harness-config.test.mjs` › "a core directory that is not text is refused" | green |
| TICKET-34 | a skills key the schema does not declare | `scripts/verify-harness-config.test.mjs` › "a skills key the schema does not declare is refused" | green |
| TICKET-34 | a skills block with no lock | `scripts/verify-harness-config.test.mjs` › "a skills block with no lock is refused" | green |
| TICKET-34 | skill trees that are not a list | `scripts/verify-harness-config.test.mjs` › "skill trees that are not a list are refused" | green |
| TICKET-34 | a skill value source of another type | `scripts/verify-harness-config.test.mjs` › "a skill value source that is not text is refused" | green |
| TICKET-34 | an `items` the gate cannot read | `scripts/verify-harness-config.test.mjs` › "a schema items that is not a schema is refused" | green |
| TICKET-34 | a `minLength` the gate cannot read | `scripts/verify-harness-config.test.mjs` › "a schema minLength that is not a whole number is refused" | green |
| TICKET-34 | the intake in a project with no harness config writes the project's identity | Not covered | not covered |

Red first, twice. With the tests written and the code of `7442b265`, 52 of 78 failed, each new case
for its stated reason: the schema declared no block of facts (`identity` is no key the schema
declares, 4 or 5 findings where 1 was expected), and the two schema cases could not find the
blocks they edit. With the new schema and the base gate, 64 of 78 failed: the base gate refused
`items`, `minLength` and the `array` type, 13 findings.

Differential, base gate against head gate, over 13 trees of the base schema and config, each
with one defect the base gate already judged: the exit code is the same in all 13, and 9 print
the same bytes once the claims, which this change rewrites, are set aside. The 4 others differ
as intended: the list of keywords the gate reads names `items` and `minLength`, the list of
types names `array`, a schema whose `workflow` is typed `array` is now judged rather than
refused, and the missing-file finding names the identity.

## Gate

- `pnpm validate`: not run in this unit, on the parent's instruction; the parent runs it on the
  merged branch. Run instead, each exit 0: `node --test scripts/verify-harness-config.test.mjs`,
  `pnpm verify:harness-config`, `node --test scripts/validate.test.mjs`,
  `node scripts/validate.mjs --list`, `pnpm verify:skills:test`, `pnpm write-guard:test`,
  `pnpm verify:manifest:coverage`, `pnpm verify:specs`, `pnpm verify:english`,
  `pnpm verify:maps`, `pnpm verify:skill-neutrality`, `pnpm verify:skill-frontmatter`,
  `pnpm verify:router-coverage`, `pnpm codex-budget:test`, `pnpm verify:unicode-safety`, and
  eslint over the two changed scripts.

## Not verified

- The intake scenario: a procedure an intake session follows, which no runner drives, and
  `verify:harness-config` cannot tell a project's own name from the template's (F76).
- Certifipago's own config against this schema: it holds no `$schema`, `workflow` or `backend`,
  which the schema requires, so it passes only once it records them.
