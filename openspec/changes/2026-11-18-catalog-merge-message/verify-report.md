# Verify report: 2026-11-18-catalog-merge-message

> **Verified:** 2026-11-18 at `bfdcb74`

## Scenarios

Every test ran green in `pnpm verify:skills:test` at `bfdcb74`: 79 of 79, of which 3 are new
cases in `scripts/verify-skills.test.mjs`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-31 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-31 | the contract carries no catalog line | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no catalog line is refused" | green |
| TICKET-31 | the PO's close step sends no catalog line | `scripts/verify-skills.test.mjs` › "a po-ticket whose close step sends no catalog message is refused" | green |
| TICKET-31 | the merge queue takes no catalog pull request | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue takes no catalog pull request is refused" | green |
| TICKET-31 | a release's catalog under `low-risk` | Not covered | not run |
| TICKET-31 | a single close outside a release | Not covered | not run |
| TICKET-25 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-25 | the architect has no merge queue | `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused" | green |
| TICKET-25 | two pull requests ready | Not covered | not run |
| TICKET-25 | `low-risk`, and a pull request that names a risk | Not covered | not run |
| TICKET-25 | `low-risk`, and a pull request that meets every condition | Not covered | not run |

Each new rule was seen red first, for its stated reason:

- The three cases failed with "expected 2 finding(s), got 0": the check held no section to the
  catalog lines (79 tests, 76 passing).
- With the contract added to `scripts/verify-skills.mjs`, the cases passed and the repository
  failed both "the seven ticket skills of the repository pass" and "the check exits 0 over the
  repository and states what it judged", with six findings: `ticket-flow` § Messages,
  `po-ticket` § Step 6 — Record the closed tickets and `refine-ticket` § Merge queue each named
  neither line. The skill edits turned both green.

A differential run, over scratch copies of the base commit's tree (`58a9dca`) and this one: the
base check over the base tree and over this tree, and this check over this tree, each exit 0
with no stderr; the base check prints the same stdout over both trees, so the skill edits break
none of its rules. This check over the base tree exits 1 with the six findings above, the rule
it adds. Its stdout differs from the base check's only in its claims, which now name both lines.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `bfdcb74`.

## Not verified

- The procedures: whether a PO sends the line once its pull request is open, whether an
  architect queues the catalog pull request in the merge order, asks the owner for it under every
  policy, and moves no ticket after its merge. No runner drives a session.
- The assumptions A1 to A3 and the open question Q1 of the proposal wait for the owner; the
  skills apply A1 to A3 as written.
- Whether the prose around the two lines says what the decision says: the check proves only that
  each section names both lines.
