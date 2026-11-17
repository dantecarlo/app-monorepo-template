# Verify report: 2026-11-17-ticket-identity-config

> **Verified:** 2026-11-17 at `fd7020c`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `fd7020c`: 50 of 50 in
`scripts/verify-ticket-branch.test.mjs` (29 new) inside `pnpm verify:ticket-branch:test`, and
48 of 48 in `scripts/verify-skills.test.mjs` (7 new) inside `pnpm verify:skills:test`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-05 | a GitHub issue | `scripts/verify-ticket-branch.test.mjs` › "a ticket branch whose pull request body names its issue passes" | green |
| TICKET-05 | a keyed id | `scripts/verify-ticket-branch.test.mjs` › "a branch with a keyed id and a body that names the key passes" | green |
| TICKET-05 | Certifipago's branch under its layer | `scripts/verify-ticket-branch.test.mjs` › "a Certifipago branch and body pass under its layer" | green |
| TICKET-05 | an optional slug left out | `scripts/verify-ticket-branch.test.mjs` › "an optional slug that is absent passes" | green |
| TICKET-05 | an optional slug given | `scripts/verify-ticket-branch.test.mjs` › "an optional slug that is present passes" | green |
| TICKET-06 | no id | `scripts/verify-ticket-branch.test.mjs` › "a branch with no id is refused" | green |
| TICKET-06 | an unknown type | `scripts/verify-ticket-branch.test.mjs` › "a branch with an unknown type is refused", "an unknown type is named with the four types" | green |
| TICKET-06 | no slug | `scripts/verify-ticket-branch.test.mjs` › "a branch missing the slug is refused" | green |
| TICKET-06 | a slug that is not kebab | `scripts/verify-ticket-branch.test.mjs` › "a slug that is not lower-case kebab is refused" | green |
| TICKET-06 | no type | `scripts/verify-ticket-branch.test.mjs` › "a branch with no type is refused" | green |
| TICKET-06 | what a finding says | `scripts/verify-ticket-branch.test.mjs` › "a finding names the branch and the shape it owes" | green |
| TICKET-06 | Certifipago's branch under the defaults | `scripts/verify-ticket-branch.test.mjs` › "a Certifipago branch is refused under the defaults" | green |
| TICKET-06 | a type the layer does not allow | `scripts/verify-ticket-branch.test.mjs` › "a branch type outside the layer's branchTypes is refused" | green |
| TICKET-06 | an id the layer's pattern does not match | `scripts/verify-ticket-branch.test.mjs` › "an id the layer's pattern does not match is refused" | green |
| TICKET-06 | a required slug left out under a layer | `scripts/verify-ticket-branch.test.mjs` › "a required slug missing under a layer is refused" | green |
| TICKET-07 | another id | `scripts/verify-ticket-branch.test.mjs` › "a body that names another id is refused" | green |
| TICKET-07 | a longer number | `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer id is refused" | green |
| TICKET-07 | a longer key | `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer key is refused" | green |
| TICKET-07 | a longer id under a layer | `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer id under the layer is refused" | green |
| TICKET-07 | an id with pattern characters | `scripts/verify-ticket-branch.test.mjs` › "an id is matched in the body literally, not as a pattern" | green |
| TICKET-08 | a refusal | `scripts/verify-ticket-branch.test.mjs` › "the check exits 1 and names the id the body owes" | green |
| TICKET-08 | a pass | `scripts/verify-ticket-branch.test.mjs` › "the check exits 0 and states what it judged" | green |
| TICKET-08 | the layer of the working directory | `scripts/verify-ticket-branch.test.mjs` › "the check reads the layer of its working directory" | green |
| TICKET-08 | a layer named by `--layer` | `scripts/verify-ticket-branch.test.mjs` › "the check reads the layer --layer names" | green |
| TICKET-08 | no layer in the working directory | `scripts/verify-ticket-branch.test.mjs` › "the check with no layer file judges under the defaults" | green |
| TICKET-08 | a flag as a process | `scripts/verify-ticket-branch.test.mjs` › "the check takes a flag over one field of the layer" | green |
| TICKET-21 | no layer file | `scripts/verify-ticket-branch.test.mjs` › "with no layer file, the defaults apply" | green |
| TICKET-21 | a layer with no block | `scripts/verify-ticket-branch.test.mjs` › "a layer with no ticket-identity block judges under the defaults" | green |
| TICKET-21 | a slug rule that is neither | `scripts/verify-ticket-branch.test.mjs` › "a block whose slug is neither required nor optional is refused" | green |
| TICKET-21 | what a finding says | `scripts/verify-ticket-branch.test.mjs` › "a malformed block is named with its file and field" | green |
| TICKET-21 | a block that is not JSON | `scripts/verify-ticket-branch.test.mjs` › "a block that is not JSON is refused" | green |
| TICKET-21 | a field left out | `scripts/verify-ticket-branch.test.mjs` › "a block missing a field is refused" | green |
| TICKET-21 | a field it does not know | `scripts/verify-ticket-branch.test.mjs` › "a block with an unknown field is refused" | green |
| TICKET-21 | a pattern that does not compile | `scripts/verify-ticket-branch.test.mjs` › "a block whose idPattern does not compile is refused" | green |
| TICKET-21 | a pattern that matches nothing at all | `scripts/verify-ticket-branch.test.mjs` › "a block whose idPattern matches the empty string is refused" | green |
| TICKET-21 | no branch types | `scripts/verify-ticket-branch.test.mjs` › "a block whose branchTypes is empty is refused" | green |
| TICKET-21 | two blocks | `scripts/verify-ticket-branch.test.mjs` › "a layer with two ticket-identity blocks is refused" | green |
| TICKET-21 | a layer that is not there | `scripts/verify-ticket-branch.test.mjs` › "a layer that --layer names and that is not there is refused" | green |
| TICKET-21 | a flag over one field | `scripts/verify-ticket-branch.test.mjs` › "a flag overrides a single field of the layer" | green |
| TICKET-21 | a type the flag replaced | `scripts/verify-ticket-branch.test.mjs` › "a type the flag replaced is refused" | green |
| TICKET-21 | a malformed flag | `scripts/verify-ticket-branch.test.mjs` › "a malformed flag is refused", "a malformed flag is named with the flag and its field" | green |
| TICKET-22 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-22 | the template holds no block | `scripts/verify-skills.test.mjs` › "a process template whose ticket identity holds no block is refused" | green |
| TICKET-22 | the template's block is off the defaults | `scripts/verify-skills.test.mjs` › "a process template whose ticket identity block is not the defaults is refused" | green |
| TICKET-22 | the template's block is malformed | `scripts/verify-skills.test.mjs` › "a process template whose ticket identity block is malformed is refused" | green |
| TICKET-22 | the contract drops `branchTypes` | `scripts/verify-skills.test.mjs` › "a ticket-flow whose ticket identity names no branchTypes is refused" | green |
| TICKET-22 | the contract drops the block | `scripts/verify-skills.test.mjs` › "a ticket-flow whose ticket identity names no ticket-identity block is refused" | green |
| TICKET-22 | the intake drops the block | `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no ticket-identity block is refused" | green |
| TICKET-22 | what a finding says | `scripts/verify-skills.test.mjs` › "a template block off the defaults is named with its file and field" | green |

## Red first

- **The branch check.** With the 29 new tests written and the check unchanged, 25 failed for the
  reason each states (50 tests, 25 passed): the old check ignored the layer and the flags, so the
  Certifipago layer case got 2 findings (`feat`, no id) where it owed 0, the optional slug 1
  (missing slug) where it owed 0, the narrowed `branchTypes` and `idPattern` layers 0 where each
  owed 1, the required-slug and longer-id layers 2 where each owed 1, every malformed block, the
  missing `--layer` file and the malformed flag 0 where each owed its finding, the flag over
  `--types` 1 and 2 where they owed 0 and 1, the literal-id check found a `slug` finding where it
  owed a `body` one, and the four process checks exited 1 or printed no identity. The other
  four new cases are pins of existing behaviour, green before and after: the Certifipago branch
  refused under the defaults, an optional slug that is present, no layer, and a layer with no
  block.
- **The structural check.** With its 7 new tests written and the check unchanged, all 7 failed
  (48 tests, 41 passed): each case found 0 findings where it owed 1, and the finding check found
  none. With the check extended and the skills not yet edited, the repository failed it with
  four findings: `ticket-flow` § Ticket identity named neither `branchTypes` nor the block,
  `process-intake` § Step 3 named no block, and the template's Ticket identity section held no
  block.
- **Differential run** against the base check (`910fe58`), copied outside the worktree, over 31
  branch and body pairs under the defaults (every existing case, and edge cases: `123abc-x`, a
  trailing hyphen, a lower-case key, `PROJ-42a`, non-ASCII digits after an id, an empty type, no
  arguments): every exit code and every finding line is identical. The only difference is the
  summary line, which now ends with the identity judged under (", under the default ticket
  identity"), and the pass line's claims, which now describe the identity: both are this change.
  The base structural check passes the new skills, and the new check refuses the base skills with
  the four findings above.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-17, at `fd7020c` with this report.
- `pnpm report:spec-drift`, inside it, lists harness/ticket-flow behind its code (seven governed
  files changed since `416a38b`); it never blocks, and the archive moves the spec's verified
  line.

## Not verified

- Certifipago's own layer: the case is an example layer in the tests; whether Certifipago's
  docs/process/ticket-flow.md carries the block is Certifipago's, and the parent relays it.
- A project's CI run of the check: the template runs only its tests (TICKET-09), and no workflow
  here runs the check over a real pull request.
