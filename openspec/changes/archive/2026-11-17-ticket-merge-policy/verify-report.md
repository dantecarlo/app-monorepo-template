# Verify report: 2026-11-17-ticket-merge-policy

> **Verified:** 2026-11-17 at `c581d26`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `c581d26`, inside
`pnpm verify:skills:test`: 41 of 41 in `scripts/verify-skills.test.mjs`, of which 10 are new.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-11 | a green branch behind its base | Not covered | not run |
| TICKET-11 | `low-risk`, and a pull request that names a risk | Not covered | not run |
| TICKET-11 | `low-risk`, and a pull request that meets every condition | Not covered | not run |
| TICKET-20 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-20 | the contract drops `low-risk` | `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules name no low-risk merge policy is refused" | green |
| TICKET-20 | QA's merge step drops `manual` | `scripts/verify-skills.test.mjs` › "a qa-ticket whose merge step names no manual merge policy is refused" | green |
| TICKET-20 | QA's merge step drops `low-risk` | `scripts/verify-skills.test.mjs` › "a qa-ticket whose merge step names no low-risk merge policy is refused" | green |
| TICKET-20 | QA's merge step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its merge step is refused" | green |
| TICKET-20 | the intake never offers `low-risk` | `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no low-risk merge policy is refused" | green |
| TICKET-20 | the intake's mapping step is gone | `scripts/verify-skills.test.mjs` › "a process-intake without its mapping step is refused" | green |
| TICKET-20 | the template never names `low-risk` | `scripts/verify-skills.test.mjs` › "a process template whose merge policy names no low-risk policy is refused" | green |
| TICKET-20 | the template defaults to `low-risk` | `scripts/verify-skills.test.mjs` › "a process template whose merge policy does not default to manual is refused" | green |
| TICKET-20 | the template has no Policy line | `scripts/verify-skills.test.mjs` › "a process template whose merge policy has no Policy line is refused" | green |
| TICKET-20 | what a finding says | `scripts/verify-skills.test.mjs` › "a dropped merge policy is named with its file and section" | green |
| TICKET-20 | a hotfix under `low-risk` | Not covered | not run |

## Red first

- Before the check changed, the ten new tests failed for the reason each states: the eight cases
  found 0 findings where they expected 1, and the two checks found none (41 tests, 31 passed,
  10 failed).
- With the check extended and the skills not yet edited, the repository failed it with five
  findings: `ticket-flow` § Rules every role follows and `process-intake` § Step 3 named no
  `low-risk`, `qa-ticket` had no § Step 6 — One merge at a time, under the merge policy, the
  template's Merge policy section named no `low-risk`, and its Policy line gave "`manual`: an
  agent merges only on the owner's word", not the default `manual` alone.
- Differential run: the base check (`35db10c`) passes both the base skills and the new ones with
  identical output, so the new skills keep every section the old contract held; the new check
  refuses the base skills with the five findings above and passes the new ones.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-17, at `c581d26`.
- `pnpm report:spec-drift`, inside it, lists harness/ticket-flow behind its code (six governed
  files changed since `c2a0338`); it never blocks, and the archive moves the spec's verified
  line.

## Not verified

- TICKET-11's three scenarios and TICKET-20's hotfix scenario: each is a procedure a QA session
  follows, and no runner drives a session, reads the board or merges a pull request. The
  structural check proves only that the four files name both policies and that the template
  defaults to `manual`, not that a `low-risk` merge met its conditions.
