# Verify report: 2026-11-19-catalog-board-check

> **Verified:** 2026-11-19 at `ab2f701`

## Scenarios

Every test ran green in `pnpm verify:skills:test` at `ab2f701`: 80 of 80, of which 1 is a new
check in `scripts/verify-skills.test.mjs`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-31 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-31 | the contract carries no catalog line | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no catalog line is refused" | green |
| TICKET-31 | the PO's close step sends no catalog line | `scripts/verify-skills.test.mjs` › "a po-ticket whose close step sends no catalog message is refused" | green |
| TICKET-31 | the merge queue takes no catalog pull request | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue takes no catalog pull request is refused" | green |
| TICKET-31 | the merge queue does not check the catalog against the board | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not check the catalog rows against the board is refused" | green |
| TICKET-31 | a release's catalog under `low-risk` | Not covered | not run |
| TICKET-31 | a catalog row that does not match its board page | Not covered | not run |
| TICKET-31 | a single close outside a release | Not covered | not run |

The new rule was seen red first, for its stated reason:

- With only the case written, it failed with `AssertionError: [] 0 !== 1`: the check held
  `refine-ticket` § Merge queue to no board check (80 tests, 79 passing).
- With the contract added to `scripts/verify-skills.mjs`, the case passed and the repository
  failed both "the seven ticket skills of the repository pass" and "the check exits 0 over the
  repository and states what it judged", with one finding: `refine-ticket` § Merge queue did not
  name `matches its board page in id, title, target version and closing pull request` (80 tests,
  78 passing). The skill edit turned both green.

The existing behaviour the change touches, the mentions `refine-ticket` § Merge queue already
owed, stays pinned by the cases that were there: "a refine-ticket whose merge queue takes no
catalog pull request is refused" still expects exactly two findings, and the merge policy cases
still expect theirs, over a healthy set that now names the board check too.

A differential run, over scratch copies of the base commit's tree (`510a6ed`) and this one: the
base check over the base tree and over this tree, and this check over this tree, each exit 0
with no stderr; the base check prints the same stdout over both trees, so the skill edits break
none of its rules. This check over the base tree exits 1 with the one finding above, the rule it
adds. Its stdout differs from the base check's only in its claims, which now name the board
check.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19, at `ab2f701`.

## Not verified

- The procedures: whether an architect reads every ticket the catalog pull request adds a row
  for, compares each row with its board page, comments the check on the pull request, asks the
  owner only once every row matches, and sends a mismatch back to the PO. No runner drives a
  session.
- The assumptions A1 and A2 of the proposal wait for the owner; the skills apply them as written.
- What the PO does with a catalog pull request that comes back: `po-ticket` § Step 6 — Record
  the closed tickets does not say, and this change did not edit `po-ticket`.
- Whether the prose around the statement says what the relay says: the check proves only that
  § Merge queue names it.
