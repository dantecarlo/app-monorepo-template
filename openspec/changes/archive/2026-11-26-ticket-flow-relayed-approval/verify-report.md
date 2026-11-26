# Verify report: ticket-flow-relayed-approval

> **Verified:** 2026-11-26 at `465798e2`

## Scenarios

| Requirement | Scenario                                             | Test                                                                                                                                | Result  |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- |
| TICKET-36   | the skills of the repository                         | `scripts/verify-skills.test.mjs` › "the seven ticket skills of the repository pass"                                                 | green   |
| TICKET-36   | rule 6 drops the relay                               | `scripts/verify-skills.test.mjs` › "a ticket-flow whose approval rule names no architect relay is refused"                          | green   |
| TICKET-36   | a relay that carries the owner's word, time, question | Not covered                                                                                                                         | n/a     |
| TICKET-36   | a relay that goes beyond its question                | Not covered                                                                                                                         | n/a     |
| TICKET-36   | a relay from another session                         | Not covered                                                                                                                         | n/a     |
| TICKET-16   | a target fails its check                             | Not covered                                                                                                                         | n/a     |
| TICKET-16   | Step 2 drops the relay                               | `scripts/verify-skills.test.mjs` › "a release-ticket whose owner's word step names no architect relay is refused"                   | green   |
| TICKET-16   | a relayed go covers the release and no irreversible step | Not covered                                                                                                                     | n/a     |
| TICKET-25   | the merge queue says nothing about a relay           | `scripts/verify-skills.test.mjs` › "a refine-ticket whose merge queue names no rule on a relay from another session is refused"     | green   |

The three new tests were seen red first (`expected 1 finding(s), got 0`), before the check held
the texts. The rest of the scenarios of TICKET-16 and TICKET-25 keep the tests they had.
`node --test scripts/verify-skills.test.mjs`: 110 pass, 0 fail.

## Gate

- `pnpm validate`: exit 0, 2026-11-26, on the archive tree (71 steps). A first run, before the
  archive moved the spec's verified line to `f1332cd1`, exited 1 at `report:spec-drift`, which
  listed this spec behind its governed files; the archive cleared it.

## Not verified

- The five scenarios marked Not covered: each is a procedure a session follows, and no runner
  drives a session.
- Whether the line citations of TICKET-01 to TICKET-35 not listed in the proposal hold the claim
  of their requirement: only blank, bracket-only and out-of-range lines, and TICKET-09, were
  judged by content.
