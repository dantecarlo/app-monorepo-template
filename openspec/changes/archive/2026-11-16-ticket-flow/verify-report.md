# Verify report: 2026-11-16-ticket-flow

> **Verified:** 2026-11-16 at `8156227`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `8156227`, inside
`pnpm verify:ticket-branch:test`: 52 of 52, of which `scripts/verify-ticket-branch.test.mjs` 21
and `scripts/verify-skills.test.mjs` 31.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-01 | the contract of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-01 | a state is dropped | `scripts/verify-skills.test.mjs` › "a ticket-flow that drops a state is refused" | green |
| TICKET-01 | the board operations are gone | `scripts/verify-skills.test.mjs` › "a ticket-flow without its board operations is refused" | green |
| TICKET-01 | the pre-flight does not stop a team with no board | `scripts/verify-skills.test.mjs` › "a ticket-flow whose pre-flight does not send the team to process-intake is refused" | green |
| TICKET-01 | the ticket template is gone | `scripts/verify-skills.test.mjs` › "a ticket-flow without its ticket template is refused" | green |
| TICKET-01 | the ticket has no target version | `scripts/verify-skills.test.mjs` › "a ticket template without its target version is refused" | green |
| TICKET-01 | the board cannot set a target version | `scripts/verify-skills.test.mjs` › "a ticket-flow whose board operations cannot set the target version is refused" | green |
| TICKET-01 | the CI/CD role is dropped | `scripts/verify-skills.test.mjs` › "a ticket-flow whose roles table has no CI/CD row is refused" | green |
| TICKET-01 | the release template is gone | `scripts/verify-skills.test.mjs` › "a ticket-flow without its release template is refused" | green |
| TICKET-02 | a role skill that does not open with the contract | `scripts/verify-skills.test.mjs` › "a role skill that does not open with ticket-flow is refused" | green |
| TICKET-02 | a role skill that copies the states table | `scripts/verify-skills.test.mjs` › "a role skill that copies the states table is refused" | green |
| TICKET-02 | a role skill that copies the board operations table | `scripts/verify-skills.test.mjs` › "a role skill that copies the board operations table is refused" | green |
| TICKET-03 | healthy skills | `scripts/verify-skills.test.mjs` › "healthy ticket skills pass" | green |
| TICKET-03 | a Windows checkout | `scripts/verify-skills.test.mjs` › "a skill checked out with CRLF line endings passes" | green |
| TICKET-03 | a name that is not its folder | `scripts/verify-skills.test.mjs` › "a ticket skill whose name is not its folder is refused" | green |
| TICKET-03 | no DO NOT USE | `scripts/verify-skills.test.mjs` › "a ticket skill without DO NOT USE is refused" | green |
| TICKET-03 | no CONTRACT | `scripts/verify-skills.test.mjs` › "a ticket skill without its CONTRACT section is refused" | green |
| TICKET-03 | a skill that is gone | `scripts/verify-skills.test.mjs` › "a missing ticket skill is caught, not skipped" | green |
| TICKET-03 | the check as a process, refusing | `scripts/verify-skills.test.mjs` › "the check run over a tree that lacks a ticket skill exits 1 and names it" | green |
| TICKET-03 | the check as a process, passing | `scripts/verify-skills.test.mjs` › "the check exits 0 over the repository and states what it judged" | green |
| TICKET-04 | no board adapter section | `scripts/verify-skills.test.mjs` › "a process template without the board adapter section is refused" | green |
| TICKET-04 | an operation left out | `scripts/verify-skills.test.mjs` › "a process template that leaves out a board operation is refused" | green |
| TICKET-04 | the template is gone | `scripts/verify-skills.test.mjs` › "a missing process template is caught, not skipped" | green |
| TICKET-04 | no deploy targets section | `scripts/verify-skills.test.mjs` › "a process template without the deploy targets section is refused" | green |
| TICKET-05 | a GitHub issue | `scripts/verify-ticket-branch.test.mjs` › "a ticket branch whose pull request body names its issue passes" | green |
| TICKET-05 | a keyed id | `scripts/verify-ticket-branch.test.mjs` › "a branch with a keyed id and a body that names the key passes" | green |
| TICKET-06 | no id | `scripts/verify-ticket-branch.test.mjs` › "a branch with no id is refused" | green |
| TICKET-06 | an unknown type | `scripts/verify-ticket-branch.test.mjs` › "a branch with an unknown type is refused" | green |
| TICKET-06 | no slug | `scripts/verify-ticket-branch.test.mjs` › "a branch missing the slug is refused" | green |
| TICKET-06 | no type | `scripts/verify-ticket-branch.test.mjs` › "a branch with no type is refused" | green |
| TICKET-06 | what a finding says | `scripts/verify-ticket-branch.test.mjs` › "a finding names the branch and the shape it owes" | green |
| TICKET-07 | another id | `scripts/verify-ticket-branch.test.mjs` › "a body that names another id is refused" | green |
| TICKET-07 | a longer number | `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer id is refused" | green |
| TICKET-07 | a longer key | `scripts/verify-ticket-branch.test.mjs` › "a body that names a longer key is refused" | green |
| TICKET-08 | a refusal | `scripts/verify-ticket-branch.test.mjs` › "the check exits 1 and names the id the body owes" | green |
| TICKET-08 | a pass | `scripts/verify-ticket-branch.test.mjs` › "the check exits 0 and states what it judged" | green |
| TICKET-09 | the validate script | `scripts/verify-ticket-branch.test.mjs` › "the template's validate runs the tests and not the check" | green |
| TICKET-10 | a dependency still in dev | Not covered | not run |
| TICKET-11 | a green branch behind its base | Not covered | not run |
| TICKET-12 | a UI area | Not covered | not run |
| TICKET-13 | a link behind a login | Not covered | not run |
| TICKET-14 | the branching is gone | `scripts/verify-skills.test.mjs` › "a release-ticket without its branching section is refused" | green |
| TICKET-14 | the alternative is gone | `scripts/verify-skills.test.mjs` › "a release-ticket whose branching names no tags-only alternative is refused" | green |
| TICKET-14 | the architect cannot group a release | `scripts/verify-skills.test.mjs` › "a refine-ticket without its release step is refused" | green |
| TICKET-15 | an area not checked on staging | Not covered | not run |
| TICKET-16 | a target fails its check | Not covered | not run |
| TICKET-17 | a column the live app still reads | Not covered | not run |
| TICKET-18 | the plan cannot meet the version | Not covered | not run |
| TICKET-19 | a 1.5 feature merged before the 1.4 release | Not covered | not run |

Each test was seen red first:

- **The branch check** (`scripts/verify-ticket-branch.test.mjs`): against a stub whose `run` finds
  nothing, every refusal case failed with "expected 1 finding(s), got 0" ("every defect of one
  branch is named on its own": expected 3, got 0), the three detail checks found no finding, the
  process checks exited 0 or printed no branch, and the validate check found no
  `verify:ticket-branch:test` in `validate`: 17 of 21 red. Against a stub that refuses everything,
  the three passing cases failed with "expected 0 finding(s), got 1". "the cases fail against a
  gate that finds nothing" proves the red cases assert something.
- **The skills check** (`scripts/verify-skills.test.mjs`): against a `run` that finds nothing,
  every refusal case and both detail checks failed (expected 1, got 0) and the process check over
  a tree without `dev-ticket` exited 0: 24 of 27 red. Against a `run` that refuses everything, the
  healthy and CRLF cases failed (expected 0, got 1). The two repository checks then ran red over
  the repository before the skills existed: ten files "is not there", exit 1. The target version
  rules ran red the same way: the two new cases (expected 1, got 0) before the contract named
  them, then the repository checks on the missing `read version` and `set version` rows and the
  missing target version, version and versions-per-target sections of the templates.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-16, at `8156227` (turbo 24 of 24 tasks;
  `verify:ticket-branch:test` 52 of 52; `verify:specs` 9 living specs and 1 open change;
  `report:spec-drift` 0 of 9 specs behind; `verify:english` 1184 files; `codex-budget:test` green
  with `AGENTS.md` at 33853 bytes counted with CRLF endings, against a budget of 65536; `knip`
  green).

## Not verified

- TICKET-10 to TICKET-13 and TICKET-15 to TICKET-19 are procedures a session follows: no runner
  drives a session, a board or a deploy, so their scenarios say `Not covered`. The structural
  check proves only that the skills carry the sections, states, roles and operations those
  procedures name.
- No `gh` command of the GitHub Issues mapping was run against a real repository; each is
  written from `gh`'s documented flags, and the milestone of `set version` must exist first.
- `pnpm verify:ticket-branch` runs in no CI: the template's own branches carry no ticket id, and
  wiring it is a project's decision.
