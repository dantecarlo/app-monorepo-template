# Verify report: 2026-11-18-ticket-flow-defaults

> **Verified:** 2026-11-18 at `a8d8c73`

## Scenarios

Every test ran green in `pnpm verify:skills:test` at `a8d8c73`: 63 of 63 in
`scripts/verify-skills.test.mjs`, of which 6 are new and 4 are renamed.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-11 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-11 | QA's hand-off sends no message | `scripts/verify-skills.test.mjs` › "a qa-ticket whose hand-off step names no ready to merge message is refused" | green |
| TICKET-11 | QA's hand-off step is gone | `scripts/verify-skills.test.mjs` › "a qa-ticket without its hand-off step is refused" | green |
| TICKET-11 | QA moves a ticket to Done | `scripts/verify-skills.test.mjs` › "a qa-ticket that moves a ticket to Done is refused" | green |
| TICKET-11 | a green branch behind its base | Not covered | not run |
| TICKET-11 | another merge landed first | Not covered | not run |
| TICKET-14 | the branching is gone | `scripts/verify-skills.test.mjs` › "a release-ticket without its branching section is refused" | green |
| TICKET-14 | the alternative is gone | `scripts/verify-skills.test.mjs` › "a release-ticket whose branching names no tags-only alternative is refused" | green |
| TICKET-14 | the architect cannot group a release | `scripts/verify-skills.test.mjs` › "a refine-ticket without its release step is refused" | green |
| TICKET-15 | an area not checked on staging | Not covered | not run |
| TICKET-15 | a hotfix release | Not covered | not run |
| TICKET-15 | a hotfix behind the production branch | Not covered | not run |
| TICKET-20 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-20 | the contract drops `low-risk` | `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules name no low-risk merge policy is refused" | green |
| TICKET-20 | the architect's merge queue drops `manual` | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no manual merge policy is refused" | green |
| TICKET-20 | the architect's merge queue drops `low-risk` | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no low-risk merge policy is refused" | green |
| TICKET-20 | the architect's merge queue is gone | `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused" | green |
| TICKET-20 | the intake never offers `low-risk` | `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no low-risk merge policy is refused" | green |
| TICKET-20 | the intake's mapping step is gone | `scripts/verify-skills.test.mjs` › "a process-intake without its mapping step is refused" | green |
| TICKET-20 | the template never names `low-risk` | `scripts/verify-skills.test.mjs` › "a process template whose merge policy names no low-risk policy is refused" | green |
| TICKET-20 | the template defaults to `low-risk` | `scripts/verify-skills.test.mjs` › "a process template whose merge policy does not default to manual is refused" | green |
| TICKET-20 | the template has no Policy line | `scripts/verify-skills.test.mjs` › "a process template whose merge policy has no Policy line is refused" | green |
| TICKET-20 | what a finding says | `scripts/verify-skills.test.mjs` › "a dropped merge policy is named with its file and section" | green |
| TICKET-20 | a hotfix under `low-risk` | Not covered | not run |
| TICKET-24 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-24 | QA's hand-off sends no hotfix message | `scripts/verify-skills.test.mjs` › "a qa-ticket whose hand-off step sends no hotfix message is refused" | green |
| TICKET-24 | the architect never groups a hotfix | `scripts/verify-skills.test.mjs` › "a refine-ticket whose release step names no hotfix message is refused" | green |
| TICKET-24 | the contract has no hotfix message | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no hotfix line is refused" | green |
| TICKET-24 | the hotfix section lets QA merge | `scripts/verify-skills.test.mjs` › "a release-ticket whose hotfix section does not leave it at Ready to merge is refused" | green |
| TICKET-24 | a hotfix under `manual` | Not covered | not run |
| TICKET-24 | a hotfix release with a migration | Not covered | not run |
| TICKET-25 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-25 | the architect has no merge queue | `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused" | green |
| TICKET-25 | two pull requests ready | Not covered | not run |
| TICKET-25 | `low-risk`, and a pull request that names a risk | Not covered | not run |
| TICKET-25 | `low-risk`, and a pull request that meets every condition | Not covered | not run |
| TICKET-26 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-26 | the ticket template does not mark the version required | `scripts/verify-skills.test.mjs` › "a ticket template that does not mark its version required is refused" | green |
| TICKET-26 | an issue with no milestone | Not covered | not run |
| TICKET-26 | a technical ticket | Not covered | not run |
| TICKET-26 | a requirement with no version | Not covered | not run |
| TICKET-27 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-27 | the template names no production branch | `scripts/verify-skills.test.mjs` › "a process template whose branching model names no production branch is refused" | green |
| TICKET-27 | the template's default is another name | `scripts/verify-skills.test.mjs` › "a process template whose production branch does not default to production is refused" | green |
| TICKET-27 | a project that names `prod` | Not covered | not run |

## Red first

- **T1, before the check changed.** Six tests failed for the reason each states: five cases
  found 0 findings where they expected 1, and the check of a QA that moves a ticket to Done found
  none (60 tests, 54 passed, 6 failed).
- **T1, check extended, skills not yet edited.** The repository failed it with three findings:
  `refine-ticket` had no § Merge queue, `qa-ticket` had no Step 6 — Hand it to the architect,
  and `qa-ticket` named `Ready to merge → Done`, which it must not.
- **T2, before the check changed.** The new case found 0 findings where it expected 1 (61 tests,
  60 passed, 1 failed).
- **T2, check extended, skills not yet edited.** The repository failed it with one finding: the
  ticket template's § Target version did not name `**Version (required):**`.
- **T3, before the check changed.** Both new cases found 0 findings where they expected 1
  (63 tests, 61 passed, 2 failed).
- **T3, check extended, skills not yet edited.** The repository failed it with one finding: the
  process template's § Branching model had no `Production branch` line, which owes `production`.
- **Differential run**, over scratch copies of `scripts/` and `.claude/skills/` at the base
  (`a3e7e75`) and at `a8d8c73`:
  - the base check passes the base skills, and refuses the new ones with one finding: the
    `qa-ticket` Step 6 it knew, "One merge at a time, under the merge policy", which this change
    replaces on purpose, since QA no longer merges;
  - the new check refuses the base skills with exactly the five findings above, and passes the
    new ones.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-18, at `a8d8c73`, at `verify:specs` alone, with
  the four findings this change expects until its archive: the living spec still cites the four
  test titles it renames ("a qa-ticket whose merge step names no manual merge policy is refused",
  its `low-risk` twin, "a qa-ticket without its merge step is refused" and "a qa-ticket whose
  merge step sends no hotfix message is refused"). Every gate before it passed, the
  `turbo run lint typecheck test build format:check` step with 24 of 24 tasks.
- Every gate after it, run one by one at `a8d8c73`: exit 0 each.
  `git-free-env:test`, `report:spec-drift:test`, `report:spec-drift`, `verify:english:test`, `verify:english`, `verify:instruction-entry:test`, `verify:instruction-entry`, `codex-budget:test`, `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`, `verify:structure`, `verify:security`, `verify:theme-sync:test`, `verify:theme-sync`, `mcp:docs:test`, `verify:mcp-docs:test`, `verify:mcp-docs`, `verify:ticket-branch:test`, `verify:skills:test`, `docs:diagrams:check`, `pnpm --filter @app/i18n test`, `knip`.
- `ATL_TEMPLATE_SELF=1 pnpm validate` runs again after the archive, which merges the deltas and
  so the renamed titles.

## Not verified

- **The procedure scenarios.** TICKET-11's two, TICKET-15's three, TICKET-20's hotfix scenario,
  TICKET-24's two, TICKET-25's three, TICKET-26's three and TICKET-27's one are procedures a
  session follows. No runner drives a session, the board, a pull request or a deploy. The
  structural check proves only what each section names.
- **The target version on the board.** No gate reads the board: `scripts/verify-ticket-branch.mjs`
  judges a branch and a pull request body only. The PO's Step 3 and the architect's Steps 1 and
  4 are where the rule is checked, until the board-is-the-source change brings a board check.
- **"The production branch the layer names" in prose.** The structural check holds only the
  template's `Production branch` line. A sweep by hand of the seven skills and their templates
  (`git grep -n production -- .claude/skills`) found every remaining backticked `production` to
  be a default, and every other `production` to name the environment (production checks,
  migrations, the production database and project, the EAS update channel).
- **The Vercel facts.** They are recorded as Certifipago relayed them; this session did not
  open a Vercel dashboard or call its API.
