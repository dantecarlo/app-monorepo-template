# Verify report: 2026-11-19-ticket-flow-owner-decisions

> **Verified:** 2026-11-19 at `b4ff831`

## Scenarios

Every test ran green in `pnpm verify:skills:test` at `b4ff831`: 91 of 91, of which 17 are new
cases or checks in `scripts/verify-skills.test.mjs` and 6 cases of the PO's close step and the
catalog lines are gone (80 before the change).

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-32 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-32 | the contract has no Dropped state | `scripts/verify-skills.test.mjs` › "a ticket-flow whose states table has no Dropped row is refused" | green |
| TICKET-32 | the project layer has no Dropped state | `scripts/verify-skills.test.mjs` › "a process template whose states table has no Dropped row is refused" | green |
| TICKET-32 | the contract has no § Dropped | `scripts/verify-skills.test.mjs` › "a ticket-flow without its Dropped section is refused" | green |
| TICKET-32 | the drop record names no superseding ticket | `scripts/verify-skills.test.mjs` › "a ticket-flow whose Dropped section names no superseding ticket is refused" | green |
| TICKET-32 | the contract carries no drop line | `scripts/verify-skills.test.mjs` › "a ticket-flow whose messages name no dropped line is refused" | green |
| TICKET-32 | the PO has no drop step | `scripts/verify-skills.test.mjs` › "a po-ticket without its drop step is refused" | green |
| TICKET-32 | the PO's drop step sends no line | `scripts/verify-skills.test.mjs` › "a po-ticket whose drop step sends no dropped message is refused" | green |
| TICKET-32 | the architect has no drop step | `scripts/verify-skills.test.mjs` › "a refine-ticket without its drop step is refused" | green |
| TICKET-32 | the architect's drop step tells no session | `scripts/verify-skills.test.mjs` › "a refine-ticket whose drop step tells no session the ticket was dropped is refused" | green |
| TICKET-32 | the dev session does not stop | `scripts/verify-skills.test.mjs` › "a dev-ticket that does not stop on a dropped ticket is refused" | green |
| TICKET-32 | the QA session does not stop | `scripts/verify-skills.test.mjs` › "a qa-ticket that does not stop on a dropped ticket is refused" | green |
| TICKET-32 | a ticket superseded while in dev | Not covered | not run |
| TICKET-32 | a merged ticket the client withdraws | Not covered | not run |
| TICKET-32 | a dropped ticket aimed at the release's version | Not covered | not run |
| TICKET-01 | the contract of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-01 | a state is dropped | `scripts/verify-skills.test.mjs` › "a ticket-flow that drops a state is refused" | green |
| TICKET-01 | the board operations are gone | `scripts/verify-skills.test.mjs` › "a ticket-flow without its board operations is refused" | green |
| TICKET-01 | the pre-flight does not stop a team with no board | `scripts/verify-skills.test.mjs` › "a ticket-flow whose pre-flight does not send the team to process-intake is refused" | green |
| TICKET-01 | the ticket template is gone | `scripts/verify-skills.test.mjs` › "a ticket-flow without its ticket template is refused" | green |
| TICKET-01 | the ticket has no target version | `scripts/verify-skills.test.mjs` › "a ticket template without its target version is refused" | green |
| TICKET-01 | the board cannot set a target version | `scripts/verify-skills.test.mjs` › "a ticket-flow whose board operations cannot set the target version is refused" | green |
| TICKET-01 | the CI/CD role is dropped | `scripts/verify-skills.test.mjs` › "a ticket-flow whose roles table has no CI/CD row is refused" | green |
| TICKET-01 | the release template is gone | `scripts/verify-skills.test.mjs` › "a ticket-flow without its release template is refused" | green |
| TICKET-15 | an area not checked on staging | Not covered | not run |
| TICKET-15 | a hotfix release | Not covered | not run |
| TICKET-15 | a hotfix behind the production branch | Not covered | not run |
| TICKET-15 | a dropped ticket of the version | Not covered | not run |
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
| TICKET-28 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-28 | the contract does not make the board the source | `scripts/verify-skills.test.mjs` › "a ticket-flow whose board operations do not make the board the source of open tickets is refused" | green |
| TICKET-28 | the process template does not make the board the source | `scripts/verify-skills.test.mjs` › "a process template whose board adapter does not make the board the source of open tickets is refused" | green |
| TICKET-28 | a plan asked to list the backlog | Not covered | not run |
| TICKET-29 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-29 | the architect's close step is gone | `scripts/verify-skills.test.mjs` › "a refine-ticket without its close step is refused" | green |
| TICKET-29 | the close step names no catalog | `scripts/verify-skills.test.mjs` › "a refine-ticket whose close step names no closed ticket catalog is refused" | green |
| TICKET-29 | the close step opens no pull request per close | `scripts/verify-skills.test.mjs` › "a refine-ticket whose close step does not open one pull request per close or release is refused" | green |
| TICKET-29 | the close step does not record a drop apart | `scripts/verify-skills.test.mjs` › "a refine-ticket whose close step does not record a dropped ticket apart is refused" | green |
| TICKET-29 | the PO edits the repository | `scripts/verify-skills.test.mjs` › "a po-ticket that edits a repository file is refused" | green |
| TICKET-29 | a release of three tickets | Not covered | not run |
| TICKET-30 | a plan that records closed tickets only | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow, its closed ticket catalog and a pending section that points at the board passes" | green |
| TICKET-30 | no catalog | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow and no closed ticket catalog fails" | green |
| TICKET-30 | a catalog with no table | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow whose closed ticket catalog holds no table fails" | green |
| TICKET-30 | pending work that does not point at the board | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with a ticket flow whose pending section does not point at the board fails" | green |
| TICKET-30 | a project with no ticket flow | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with no ticket flow passes without a closed ticket catalog" | green |
| TICKET-30 | an empty PENDING section with no ticket flow | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan with no ticket flow and an empty pending section still fails" | green |
| TICKET-30 | a Windows checkout | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "a plan checked out with CRLF line endings passes" | green |
| TICKET-30 | the template | `.claude/skills/general-plan/validate-general-plan.test.mjs` › "the plan template passes with a ticket flow and without one" | green |
| TICKET-30 | a plan that names an open ticket | Not covered | not run |
| TICKET-30 | a dropped ticket among the delivered ones | Not covered | not run |
| TICKET-31 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-31 | the merge queue does not check the catalog against the board | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not check the catalog rows against the board is refused" | green |
| TICKET-31 | the merge queue does not bring the catalog current | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue does not bring the catalog pull request current is refused" | green |
| TICKET-31 | a release's catalog under `low-risk` | Not covered | not run |
| TICKET-31 | a catalog row that does not match its board page | Not covered | not run |
| TICKET-31 | two catalog pull requests in flight | Not covered | not run |

Each new rule was seen red first, for its stated reason, with only its case written:

- **T1 (F61), 79 tests, 74 passing.** "a refine-ticket without its close step is refused", "a
  refine-ticket whose close step names no closed ticket catalog is refused", "a refine-ticket
  whose close step does not open one pull request per close or release is refused" and "a
  refine-ticket whose merge queue does not bring the catalog pull request current is refused"
  each failed with `expected 1 finding(s), got 0`: the check held `refine-ticket` to no close
  step and its merge queue to no catalog pull request it brings current. "a po-ticket that edits
  a repository file is refused" failed with `AssertionError: []`: the check forbade `po-ticket`
  nothing.
- With the T1 contract in `scripts/verify-skills.mjs`, the cases passed and the repository
  failed "the seven ticket skills of the repository pass" and "the check exits 0 over the
  repository and states what it judged" with three findings: `po-ticket` names `edits:`,
  `refine-ticket` has no § Record the closed tickets, and its § Merge queue does not name
  `the architect brings it current itself` (79 tests, 77 passing). The skill edits turned both
  green.
- **T2 (F60), 91 tests, 79 passing.** All twelve new cases failed with
  `expected 1 finding(s), got 0`: the check knew no Dropped state, no § Dropped, no
  `<id> dropped` and no `### Dropped tickets`.
- With the T2 contract, the cases passed and the repository failed the same two checks with nine
  findings, one per rule: the missing § Dropped, the Dropped rows of both states tables, the
  missing `<id> dropped` of `ticket-flow` § Messages, `dev-ticket` and `qa-ticket`, the missing
  drop steps of `po-ticket` and `refine-ticket`, and the missing `### Dropped tickets` of
  `refine-ticket` § Record the closed tickets (91 tests, 89 passing). The skill edits turned both
  green.

The existing behaviour the change touches stays pinned by the cases that were there. The
`STATES` list both states tables read is pinned by "a ticket-flow that drops a state is refused",
still one finding; the board check of the catalog by its case, still exactly one finding over a
healthy set that now names the drop; and the general plan's validator by its eight cases, the
template among them with its new `### Dropped tickets` table.

A differential run, over `git archive` copies of the base commit's tree (`b2b65fd`) and this one
(`b4ff831`): the base check over the base tree and this check over this tree each exit 0 with no
stderr. The base check over this tree exits 1 with exactly five findings, the statements this
change removes on purpose: the two catalog lines of `ticket-flow` § Messages and of
`refine-ticket` § Merge queue, and `po-ticket` § Step 6 — Record the closed tickets. This check
over the base tree exits 1 with exactly eleven findings, the rules it adds. No other rule
differs.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-19, at `b4ff831`. Every gate before
  `pnpm verify:specs` passed, `turbo run lint typecheck test build format:check` among them;
  `pnpm verify:specs` failed with six findings, as expected before the archive: the living spec
  still cites the six titles this change removed ("a po-ticket without its close step is
  refused", "a po-ticket whose close step names no closed ticket catalog is refused", "a
  po-ticket whose close step does not open one pull request per close or release is refused", "a
  ticket-flow whose messages name no catalog line is refused", "a po-ticket whose close step
  sends no catalog message is refused" and "a refine-ticket whose merge queue takes no catalog
  pull request is refused").
- Every later gate of the `validate` script, run one by one at `b4ff831`, exited 0:
  `git-free-env:test`, `report:spec-drift:test`, `report:spec-drift` (it lists
  harness/ticket-flow as behind its code until the archive), `verify:english:test`,
  `verify:english`, `verify:instruction-entry:test`, `verify:instruction-entry`,
  `verify:unicode-safety:test`, `verify:unicode-safety`, `verify:workflow-pins:test`,
  `verify:workflow-pins`, `verify:skill-frontmatter:test`, `verify:skill-frontmatter`,
  `codex-budget:test`, `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`,
  `verify:structure`, `verify:security`, `verify:theme-sync:test`, `verify:theme-sync`,
  `mcp:docs:test`, `verify:mcp-docs:test`, `verify:mcp-docs`, `verify:ticket-branch:test`,
  `verify:skills:test`, `docs:diagrams:check`, `pnpm --filter @app/i18n test` and `knip`.
- `ATL_TEMPLATE_SELF=1 pnpm validate` runs again after the archive; its result is the line below.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19, over the archive's tree: the deltas
  merged into `openspec/specs/harness/ticket-flow/spec.md`, `verify-specs` passing with no open
  change, and `report-spec-drift` listing 0 of 11 living specs behind their code.

## Not verified

- The procedures: whether a PO decides a drop and comments its record, an architect closes the
  pull request unmerged, moves the ticket, re-plans its dependents and records the drop, a dev or
  QA session removes its worktree, or the architect writes, keeps current, checks and merges the
  catalog pull request. No runner drives a session.
- Whether the prose around each statement says what the decisions say: the check proves only
  that each section names its statement.
- The assumptions A1 to A11 of the proposal wait for the owner; the skills apply them as written.
- The `gh issue close <id> --reason "not planned"` and `gh pr close <n>` commands: no board or
  host was touched.
- A dropped release ticket, and a hotfix that should not ship once at Ready to merge: out of
  scope.
