# Verify report: 2026-11-17-qa-checkout-and-hotfix

> **Verified:** 2026-11-18 at `3263af0`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `3263af0`, inside
`pnpm verify:skills:test`: 57 of 57 in `scripts/verify-skills.test.mjs`, of which 9 are new.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-11 | a green branch behind its base | Not covered | not run |
| TICKET-11 | `low-risk`, and a pull request that names a risk | Not covered | not run |
| TICKET-11 | `low-risk`, and a pull request that meets every condition | Not covered | not run |
| TICKET-15 | an area not checked on staging | Not covered | not run |
| TICKET-15 | a hotfix release | Not covered | not run |
| TICKET-15 | a hotfix behind `production` | Not covered | not run |
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
| TICKET-23 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-23 | QA's checkout is not detached | `scripts/verify-skills.test.mjs` › "a qa-ticket whose checkout step adds no detached worktree is refused" | green |
| TICKET-23 | QA's checkout step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its checkout step is refused" | green |
| TICKET-23 | QA's push does not name the ticket branch | `scripts/verify-skills.test.mjs` › "a qa-ticket whose decide step does not push HEAD to the ticket branch is refused" | green |
| TICKET-23 | QA's decide step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its decide step is refused" | green |
| TICKET-23 | what a finding says | `scripts/verify-skills.test.mjs` › "a checkout that is not detached is named with its file and section" | green |
| TICKET-23 | the dev worktree holds the branch | Not covered | not run |
| TICKET-23 | the remote moved before QA's push | Not covered | not run |
| TICKET-24 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-24 | QA's merge step sends no hotfix message | `scripts/verify-skills.test.mjs` › "a qa-ticket whose merge step sends no hotfix message is refused" | green |
| TICKET-24 | the architect never groups a hotfix | `scripts/verify-skills.test.mjs` › "a refine-ticket whose release step names no hotfix message is refused" | green |
| TICKET-24 | the contract has no hotfix message | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no hotfix line is refused" | green |
| TICKET-24 | the hotfix section lets QA merge | `scripts/verify-skills.test.mjs` › "a release-ticket whose hotfix section does not leave it at Ready to merge is refused" | green |
| TICKET-24 | a hotfix under `manual` | Not covered | not run |
| TICKET-24 | a hotfix release with a migration | Not covered | not run |

## Red first

- **T1, before the check changed.** The five new tests failed for the reason each states: the
  four cases found 0 findings where they expected 1, and the finding check found none (53 tests,
  48 passed, 5 failed).
- **T1, check extended, skills not yet edited.** The repository failed it with two findings:
  `qa-ticket` § Step 2 named no `--detach`, and § Step 5 named no
  `git push origin HEAD:<branch>`.
- **T2, before the check changed.** The four new cases found 0 findings where they expected 1
  (57 tests, 53 passed, 4 failed).
- **T2, check extended, skills not yet edited.** The repository failed it with four findings:
  - `ticket-flow` § Messages, `refine-ticket` § Group a release and `qa-ticket` § Step 6 named
    no `<id> ready to merge, hotfix`;
  - `release-ticket` § Hotfix did not say "QA leaves it at Ready to merge".
- **Differential run.** The base check (`6b1d1fc`) passes both the base skills and the new ones,
  so the new skills keep every section the old contract held. The new check refuses the base
  skills with exactly the six findings above, and passes the new ones.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `3263af0`.
- `pnpm report:spec-drift`, inside it, lists harness/ticket-flow behind its code (eight governed
  files changed since `d08c097`). It never blocks, and the archive moves the spec's verified line.

## Not verified

- **The procedure scenarios.** TICKET-11's three, TICKET-15's three, TICKET-20's hotfix scenario,
  and the two procedure scenarios of each of TICKET-23 and TICKET-24 are procedures a session
  follows. No runner drives a session, a worktree, a remote, the board or a deploy. The
  structural check proves only that the sections name `--detach`, the `HEAD:<branch>` push, the
  hotfix's message, and that QA leaves the hotfix at Ready to merge.
- **A rebase under the never-forced push.** When the project layer says to bring a branch current
  by rebase, the rewritten branch is not a fast-forward of the remote, so the push
  `git push origin HEAD:<branch>`, never forced, is refused every time, and fetching and
  repeating does not end. Nothing here resolves it. The `process-intake` question of merge or
  rebase lies outside this change, and the parent decides it.
