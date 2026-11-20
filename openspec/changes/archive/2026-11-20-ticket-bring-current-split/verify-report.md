# Verify report: 2026-11-20-ticket-bring-current-split

> **Verified:** 2026-11-20 at `2bf8a03`

## Scenarios

Every test ran green in `pnpm verify:skills:test` at `2bf8a03`: 100 of 100, of which 9 are new
cases or checks in `scripts/verify-skills.test.mjs` (91 before the change).

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-33 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-33 | the merge queue brings nothing current from a worktree of its own | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue brings no pull request current from a spare worktree of its own is refused" | green |
| TICKET-33 | the architect's worktree is not detached | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue adds no detached worktree is refused" | green |
| TICKET-33 | the architect's push does not name the ticket branch | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not push HEAD to the ticket branch is refused" | green |
| TICKET-33 | the architect's push holds its session | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not push in the background is refused" | green |
| TICKET-33 | a conflict stays with the architect | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not send a code conflict back to the dev session is refused" | green |
| TICKET-33 | the architect asks QA to bring a branch current | `scripts/verify-skills.test.mjs` › "a refine-ticket that asks QA to bring a pull request current is refused" | green |
| TICKET-33 | the contract carries the old line | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages carry a bring current line is refused" | green |
| TICKET-33 | QA waits for a later bring-current | `scripts/verify-skills.test.mjs` › "a qa-ticket that waits for a later bring current is refused" | green |
| TICKET-33 | another merge landed first | Not covered | not run |
| TICKET-33 | a merge that brings a code conflict | Not covered | not run |
| TICKET-33 | a hotfix behind the production branch at its release | Not covered | not run |
| TICKET-11 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-11 | QA's hand-off sends no message | `scripts/verify-skills.test.mjs` › "a qa-ticket whose hand-off step names no ready to merge message is refused" | green |
| TICKET-11 | QA's hand-off step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its hand-off step is refused" | green |
| TICKET-11 | QA moves a ticket to Done | `scripts/verify-skills.test.mjs` › "a qa-ticket that moves a ticket to Done is refused" | green |
| TICKET-11 | QA moves a ticket back from Ready to merge | `scripts/verify-skills.test.mjs` › "a qa-ticket that moves a ticket back from Ready to merge is refused" | green |
| TICKET-11 | a green branch behind its base | Not covered | not run |
| TICKET-23 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-23 | QA's checkout is not detached | `scripts/verify-skills.test.mjs` › "a qa-ticket whose checkout step adds no detached worktree is refused" | green |
| TICKET-23 | QA's checkout step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its checkout step is refused" | green |
| TICKET-23 | QA's push does not name the ticket branch | `scripts/verify-skills.test.mjs` › "a qa-ticket whose decide step does not push HEAD to the ticket branch is refused" | green |
| TICKET-23 | QA's decide step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its decide step is refused" | green |
| TICKET-23 | what a finding says | `scripts/verify-skills.test.mjs` › "a checkout that is not detached is named with its file and section" | green |
| TICKET-23 | the dev worktree holds the branch | Not covered | not run |
| TICKET-23 | the remote moved before QA's push | Not covered | not run |
| TICKET-23 | QA hands a ticket over | Not covered | not run |
| TICKET-25 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-25 | the architect has no merge queue | `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused" | green |
| TICKET-25 | two pull requests ready | Not covered | not run |
| TICKET-25 | `low-risk`, and a pull request that names a risk | Not covered | not run |
| TICKET-25 | `low-risk`, and a pull request that meets every condition | Not covered | not run |

Each new rule was seen red first, for its stated reason, with only its cases written:

- **The cases, 100 tests, 91 passing.** The seven new cases each failed with
  `expected 1 finding(s), got 0`, and the two new checks with `AssertionError: []`, a length of
  0 where 1 was expected: the check held `refine-ticket` § Merge queue to no spare worktree, no
  `--detach`, no `git push origin HEAD:<branch>`, no `in the background` and no
  `a code conflict goes back to the dev session`, and forbade `<id> bring current` nowhere and
  `Ready to merge → Changes requested` nowhere.
- **The contract, 100 tests, 98 passing.** With the T1 contract in `scripts/verify-skills.mjs`,
  the cases passed and the repository failed "the seven ticket skills of the repository pass" and
  "the check exits 0 over the repository and states what it judged" with nine findings, one per
  rule: the five statements `refine-ticket` § Merge queue lacked, `<id> bring current` in
  `ticket-flow`, `refine-ticket` and `qa-ticket`, and `Ready to merge → Changes requested` in
  `qa-ticket`. The skill edits turned both green.

The existing behaviour the change touches stays pinned by the cases that were there. The
`--detach` and `git push origin HEAD:<branch>` statements `qa-ticket` owes are pinned by "a
checkout that is not detached is named with its file and section" and "a qa-ticket whose decide
step does not push HEAD to the ticket branch is refused", each still exactly one finding now that
`refine-ticket` owes the same text; the forbidden-text helper by "a qa-ticket that moves a ticket
to Done is refused" and "a po-ticket that edits a repository file is refused", each still exactly
one finding; and the catalog's own bring-current by "a refine-ticket whose merge queue does not
bring the catalog pull request current is refused".

A differential run, over a copy of the base commit's tree (`9df3979`, through `git archive`) and
of this one: the base check over the base tree and this check over this tree each exit 0 with no
stderr. The base check over this tree exits 0: the change removes no statement the base check
held. This check over the base tree exits 1 with exactly nine findings, the rules it adds. No
other rule differs.

The description of `refine-ticket` is 1,020 characters (1,005 before) and that of `qa-ticket`
970 (1,004 before); `ticket-flow` (967) and `dev-ticket` (863) are unchanged;
`pnpm verify:skill-frontmatter` passes.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: not run by this change's writer, which ran on a shared
  machine under a brief that leaves the full gate to the parent session; the parent runs it over
  the archive's tree.
- After the archive: `pnpm verify:specs` exits 0 with no open change, and
  `pnpm report:spec-drift` lists harness/ticket-flow no longer, its spec verified at `36b003b`.
- Run at `2bf8a03`, each exit 0: `pnpm verify:skills:test` (100 of 100),
  `pnpm verify:skill-frontmatter`, `pnpm verify:specs`, `pnpm verify:english`,
  `pnpm verify:unicode-safety`, `pnpm verify:router-coverage`, `pnpm verify:maps`, and
  `eslint` over `scripts/verify-skills.mjs` and `scripts/verify-skills.test.mjs`.

## Not verified

- The procedures: whether an architect brings a pull request current in its spare worktree,
  aborts a conflicting merge, pushes in the background and waits for the gate; whether a dev
  session resolves the conflict by a merge; whether QA removes its worktree at hand-off. No runner
  drives a session.
- Whether the prose around each statement says what the rule says: the check proves only that
  each section names its statement.
- The assumptions A1 to A10 of the proposal wait for the owner; the skills apply them as written.
- The commands of § Merge queue step 6 (`git worktree add --detach`, `git checkout --detach`,
  `git merge`, `git merge --abort`, `git push origin HEAD:<branch>`): no remote was touched.
- `.claude/skills/process-intake/SKILL.md:83` and
  `.claude/skills/process-intake/ticket-flow.template.md:79` still name only QA as the session
  that merges the base and pushes it unforced: outside this change's edit surface.
