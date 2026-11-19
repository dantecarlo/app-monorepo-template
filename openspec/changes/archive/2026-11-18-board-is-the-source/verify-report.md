# Verify report: 2026-11-18-board-is-the-source

> **Verified:** 2026-11-18 at `7d329c0`

## Scenarios

Every test ran green in `pnpm verify:skills:test` at `7d329c0`: 76 of 76, of which 5 are new
cases in `scripts/verify-skills.test.mjs` and 8 are the first checks of
`.claude/skills/general-plan/validate-general-plan.test.mjs`, which `pnpm verify:skills:test`
runs with its own.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TICKET-28 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-28 | the contract does not make the board the source | `scripts/verify-skills.test.mjs` › "a ticket-flow whose board operations do not make the board the source of open tickets is refused" | green |
| TICKET-28 | the process template does not make the board the source | `scripts/verify-skills.test.mjs` › "a process template whose board adapter does not make the board the source of open tickets is refused" | green |
| TICKET-28 | a plan asked to list the backlog | Not covered | not run |
| TICKET-29 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-29 | the PO's close step is gone | `scripts/verify-skills.test.mjs` › "a po-ticket without its close step is refused" | green |
| TICKET-29 | the close step names no catalog | `scripts/verify-skills.test.mjs` › "a po-ticket whose close step names no closed ticket catalog is refused" | green |
| TICKET-29 | the close step opens no pull request per close | `scripts/verify-skills.test.mjs` › "a po-ticket whose close step does not open one pull request per close or release is refused" | green |
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
| TICKET-18 | the plan cannot meet the version | Not covered | not run |
| TICKET-18 | a confirmed move | Not covered | not run |
| TICKET-26 | the skills of the repository | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass" | green |
| TICKET-26 | the ticket template does not mark the version required | `scripts/verify-skills.test.mjs` › "a ticket template that does not mark its version required is refused" | green |
| TICKET-26 | an issue with no milestone | Not covered | not run |
| TICKET-26 | a technical ticket | Not covered | not run |
| TICKET-26 | a requirement with no version | Not covered | not run |

Each new rule was seen red first, for its stated reason:

- TICKET-28: both cases failed with "expected 1 finding(s), got 0"; with the contract added, the
  repository failed on `ticket-flow` § Board operations and the process template's § Board
  adapter until both named the board the source of every open ticket.
- TICKET-29: the three cases failed with "expected 1 finding(s), got 0"; with the contract added,
  the repository failed on `po-ticket`'s missing § Step 6 — Record the closed tickets, then on its
  phrase `one pull request per close or release` split across two lines.
- TICKET-30: the CRLF check failed on the four frontmatter checks; the five ticket-flow checks
  failed with no PASS or FAIL line of the catalog or the pointer, the template one on its missing
  § Closed Ticket Catalog; the two checks that pin the old behaviour were green before and after.

A differential run of the base commit's validator (`6f5b899`) and this one over the same plans
gave identical stdout, stderr and exit codes for a plan with no ticket flow, a plan that fails,
a missing file and no argument; only a plan beside docs/process/ticket-flow.md differs, by the
rules of TICKET-30.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `7d329c0`.

## Not verified

- The procedures: whether a session points at the board, records a close in one pull request,
  or leaves the plan alone on a version move. No runner drives a session.
- Whether a plan names an open ticket. No gate reads the board, so nothing tells an open ticket
  from a closed one; the review of the plan's pull request reads it.
- The `DONE` and `PENDING` non-empty checks count the inner lines of a multi-line HTML comment as
  content, so a plan copied from the template with its guidance comments alone passes them. The
  new checks strip comments first; the old two are unchanged by this change.
