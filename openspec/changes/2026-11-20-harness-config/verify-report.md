# Verify report: 2026-11-20-harness-config

> **Verified:** 2026-11-20 at `945d2a4`

## Scenarios

Every test ran green at `945d2a4`: `pnpm verify:skills:test` 94 of 94, of which 3 cases are new
and 1 check is rewritten (91 before the change), and `pnpm verify:harness-config:test` 36 of 36,
all new.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-20 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-20 | the contract drops `low-risk` | `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules name no low-risk merge policy is refused" | green |
| TICKET-20 | the architect's merge queue drops `manual` | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no manual merge policy is refused" | green |
| TICKET-20 | the architect's merge queue drops `low-risk` | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no low-risk merge policy is refused" | green |
| TICKET-20 | the architect's merge queue is gone | `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused" | green |
| TICKET-20 | the intake never offers `low-risk` | `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step names no low-risk merge policy is refused" | green |
| TICKET-20 | the intake's mapping step is gone | `scripts/verify-skills.test.mjs` › "a process-intake without its mapping step is refused" | green |
| TICKET-20 | the template never names `low-risk` | `scripts/verify-skills.test.mjs` › "a process template whose merge policy names no low-risk policy is refused" | green |
| TICKET-20 | the template records a policy of its own | `scripts/verify-skills.test.mjs` › "a process template whose merge policy records a policy, not the harness config, is refused" | green |
| TICKET-20 | the contract does not say where the policy is read | `scripts/verify-skills.test.mjs` › "a ticket-flow whose rules never name the harness config is refused" | green |
| TICKET-20 | the merge queue does not say where the policy is read | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue never names the harness config is refused" | green |
| TICKET-20 | the intake does not say where it writes the policy | `scripts/verify-skills.test.mjs` › "a process-intake whose mapping step never names the harness config is refused" | green |
| TICKET-20 | the schema and the skills agree on the policies | `scripts/verify-harness-config.test.mjs` › "the schema's merge policies are the ones the ticket skills name, manual the default" | green |
| TICKET-20 | a merge policy the schema does not allow | `scripts/verify-harness-config.test.mjs` › "a merge policy the schema does not allow is refused" | green |
| TICKET-20 | the template has no Policy line | `scripts/verify-skills.test.mjs` › "a process template whose merge policy has no Policy line is refused" | green |
| TICKET-20 | what a finding says | `scripts/verify-skills.test.mjs` › "a dropped merge policy is named with its file and section" | green |
| TICKET-20 | a hotfix under `low-risk` | Not covered | not covered |
| TICKET-24 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-24 | QA's hand-off sends no hotfix message | `scripts/verify-skills.test.mjs` › "a qa-ticket whose hand-off step sends no hotfix message is refused" | green |
| TICKET-24 | the architect never groups a hotfix | `scripts/verify-skills.test.mjs` › "a refine-ticket whose release step names no hotfix message is refused" | green |
| TICKET-24 | the contract has no hotfix message | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no hotfix line is refused" | green |
| TICKET-24 | the hotfix section lets QA merge | `scripts/verify-skills.test.mjs` › "a release-ticket whose hotfix section does not leave it at Ready to merge is refused" | green |
| TICKET-24 | a hotfix under `manual` | Not covered | not covered |
| TICKET-24 | a hotfix release with a migration | Not covered | not covered |
| TICKET-25 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-25 | the architect has no merge queue | `scripts/verify-skills.test.mjs` › "a refine-ticket without its merge queue is refused" | green |
| TICKET-25 | two pull requests ready | Not covered | not covered |
| TICKET-25 | `low-risk`, and a pull request that names a risk | Not covered | not covered |
| TICKET-25 | `low-risk`, and a pull request that meets every condition | Not covered | not covered |
| TICKET-31 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-31 | the merge queue does not check the catalog against the board | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not check the catalog rows against the board is refused" | green |
| TICKET-31 | the merge queue does not bring the catalog current | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not bring the catalog pull request current is refused" | green |
| TICKET-31 | a release's catalog under `low-risk` | Not covered | not covered |
| TICKET-31 | a catalog row that does not match its board page | Not covered | not covered |
| TICKET-31 | two catalog pull requests in flight | Not covered | not covered |

## RED before GREEN

- T1: against a gate whose `run` found nothing, 30 of the 36 tests of
  `scripts/verify-harness-config.test.mjs` failed, every case with "expected N finding(s), got 0";
  the 6 that passed are the 3 cases that must not fire, the blinded-gate check, the repository
  run and the agreement check. The agreement check was then seen red on its own: with `auto`
  planted in the schema's `delivery.mergePolicy` enum, it failed with
  `actual: [ 'manual', 'low-risk', 'auto' ]`, and passed again once the schema was restored.
- T2: before `scripts/verify-skills.mjs` changed, its 3 new cases failed with "expected 1
  finding(s), got 0", and the rewritten template check with `0 !== 1`; once it changed and
  before the skills did, the check over the repository reported 5 findings: the four sections
  naming no `.agents/harness.config.json`, and the template's `Policy` line giving `manual`.

## Gate

- `pnpm validate` was not run: the brief of this unit forbids it on the shared machine, and the
  parent runs it, one at a time.
- Run one by one at `945d2a4`, each exit 0: `agent-harness:projection-check`,
  `verify:agent-context:test`, `verify:agent-context`, `verify:harness-config:test`,
  `verify:harness-config`, `verify:manifest`, `verify:manifest:coverage`, `verify:manifest:test`,
  `verify:dependency-seams`, `verify:specs:test`, `verify:english`, `verify:instruction-entry`,
  `verify:unicode-safety`, `verify:skill-frontmatter`, `verify:router-coverage`,
  `codex-budget:test`, `verify:maps`, `verify:ticket-branch:test`, `verify:skills:test`, and
  `packages/tooling`'s `prune-boundary` test; ESLint and Prettier over every changed script and
  JSON file.
- `verify:specs`: exit 1 at `945d2a4`, as expected: the living spec still cites the test title
  "a process template whose merge policy does not default to manual is refused", which T2
  renamed. The archive moves the citation; `verify:specs` runs again after it.

## Not verified

- `pnpm validate`, and with it `turbo run lint typecheck test build format:check`,
  `write-guard:test`, `agent-harness:test`, `worktrees:prune:test`, `docs:diagrams:check`, the
  `@app/i18n` suite and `knip`.
- The procedures: whether an architect reads `delivery.mergePolicy` before a merge, and whether
  `process-intake` writes it. No runner drives a session; the check proves only that each
  section names the file.
- That the template's own config records `manual` (assumption A8): a project may pick
  `low-risk`, so no check every project runs holds it.
- The `patch-json` actions of the `sdd` and `supabase` prunes: `verify:manifest` judges their
  shape, and no executor applies them yet (phases P5 to P7).
- The evidence lines of the requirements this change does not modify: its edits moved 63
  citations of `scripts/verify-skills.mjs`, `.claude/skills/ticket-flow/SKILL.md` and
  `.claude/skills/refine-ticket/SKILL.md` in 15 other requirements, left as they were so the
  merge with `main`, which remapped the same lines, stays clean; they want a `sync` after it.
