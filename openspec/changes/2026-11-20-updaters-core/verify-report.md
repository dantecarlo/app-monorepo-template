# Verify report: 2026-11-20-updaters-core

> **Verified:** 2026-11-25 at `120b871`

## Scenarios

Every test ran green at `120b871`: `scripts/update-mcp-docs.test.mjs` 19 of 19 (6 new: the pin of
the update mode and the five `--check` and `--json` cases), `scripts/verify-updaters.test.mjs` 36
of 36, `scripts/updaters/run.test.mjs` 17 of 17. Each new test was seen red first: the `mcp:docs`
cases on main's updater at `e31b6d9` (5 of 19 failed: no `is current` line, exit 0 instead of 2,
text instead of one JSON document, `--check` refused by the argument parser), the gate's companion
on a missing module, and the runner's suite on a stub that only ran each check (17 of 17 failed).

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| MCP-13 | a block that is current | `scripts/update-mcp-docs.test.mjs` › "--check over a current block exits 0 and writes nothing" | green |
| MCP-13 | a server released | `scripts/update-mcp-docs.test.mjs` › "--check over an out-of-date block exits 2 and writes nothing" | green |
| MCP-13 | the registry fails | `scripts/update-mcp-docs.test.mjs` › "--check exits 1 and writes nothing when a registry request fails" | green |
| MCP-13 | the command as a process | `scripts/update-mcp-docs.test.mjs` › "the command exits 2 under --check and 0 without it over the same out-of-date doc" | green |
| MCP-14 | an update that writes | `scripts/update-mcp-docs.test.mjs` › "--json prints the run as one JSON document" | green |
| MCP-14 | a check | `scripts/update-mcp-docs.test.mjs` › "--json with --check prints the plan and writes nothing" | green |
| UPDATERS-01 | a registry whose entries are declared | `scripts/verify-updaters.test.mjs` › "a registry whose every entry is declared passes" | green |
| UPDATERS-01 | a key the registry does not know | `scripts/verify-updaters.test.mjs` › "an entry with a key the registry does not know fires" | green |
| UPDATERS-01 | a key left out | `scripts/verify-updaters.test.mjs` › "an entry without its verify key fires" | green |
| UPDATERS-01 | where an updater runs | `scripts/verify-updaters.test.mjs` › "a runsIn value other than ci or local fires" | green |
| UPDATERS-01 | the id of an updater | `scripts/verify-updaters.test.mjs` › "an id that is not kebab-case fires", "an id listed twice fires" | green |
| UPDATERS-01 | the repository's registry | `scripts/verify-updaters.test.mjs` › "the gate exits 0 over the repository and states what it judged" | green |
| UPDATERS-02 | a command with no script | `scripts/verify-updaters.test.mjs` › "a command naming a script package.json does not define fires" | green |
| UPDATERS-02 | a verify command with no script | `scripts/verify-updaters.test.mjs` › "a verify entry naming a script package.json does not define fires" | green |
| UPDATERS-02 | a command that is not a script | `scripts/verify-updaters.test.mjs` › "a command that is not pnpm and one script fires" | green |
| UPDATERS-03 | a rule file written by an updater that proposes nothing | `scripts/verify-updaters.test.mjs` › "a writes path the write guard calls a rule file fires while proposal is false" | green |
| UPDATERS-03 | the same updater as a proposal | `scripts/verify-updaters.test.mjs` › "the same rule-file path passes with proposal true" | green |
| UPDATERS-03 | a wildcard | `scripts/verify-updaters.test.mjs` › "a wildcard writes path fires while proposal is false" | green |
| UPDATERS-03 | the rule files come from the policy | `scripts/verify-updaters.test.mjs` › "the gate reads the rule files from the write guard's policy" | green |
| UPDATERS-03 | a policy that cannot be read | `scripts/verify-updaters.test.mjs` › "a write-guard policy that cannot be read fires" | green |
| UPDATERS-03 | the gate as a process | `scripts/verify-updaters.test.mjs` › "the gate exits 1 over a tree whose updater writes a rule file and names it" | green |
| UPDATERS-04 | an updater that is current | `scripts/updaters/run.test.mjs` › "a current updater runs its check and nothing else" | green |
| UPDATERS-04 | an updater that runs elsewhere | `scripts/updaters/run.test.mjs` › "an updater that does not run where the run does is skipped and runs nothing" | green |
| UPDATERS-04 | one updater by its id | `scripts/updaters/run.test.mjs` › "--only runs that updater alone", "--only naming no updater exits 1 and runs nothing" | green |
| UPDATERS-04 | a registry the gate refuses | `scripts/updaters/run.test.mjs` › "a registry the gate refuses runs nothing and exits 1" | green |
| UPDATERS-04 | the runner as a process | `scripts/updaters/run.test.mjs` › "the runner as a process skips an updater of another place and refuses an unknown --where" | green |
| UPDATERS-05 | no pull request open yet | `scripts/updaters/run.test.mjs` › "an out-of-date updater opens one pull request from updates/<id>" | green |
| UPDATERS-05 | a pull request already open | `scripts/updaters/run.test.mjs` › "an out-of-date updater with an open pull request updates it" | green |
| UPDATERS-05 | an update that changes nothing | `scripts/updaters/run.test.mjs` › "an update that changes nothing commits nothing and opens nothing" | green |
| UPDATERS-05 | a working tree with changes | `scripts/updaters/run.test.mjs` › "a working tree with changes is refused before any branch moves" | green |
| UPDATERS-06 | a diff that touches a rule file | `scripts/updaters/run.test.mjs` › "a diff that touches a rule path opens a draft labelled rule-proposal that quotes the LAW" | green |
| UPDATERS-06 | an updater that declares a proposal | `scripts/updaters/run.test.mjs` › "an updater that declares proposal true opens a draft labelled rule-proposal" | green |
| UPDATERS-06 | an open pull request becomes a proposal | `scripts/updaters/run.test.mjs` › "an open pull request that becomes a rule proposal is labelled and turned into a draft" | green |
| UPDATERS-07 | a check that fails | `scripts/updaters/run.test.mjs` › "a failed check opens nothing, reports the failure and the run checks the next updater" | green |
| UPDATERS-07 | a verify command that fails | `scripts/updaters/run.test.mjs` › "a failing verify command commits nothing and opens nothing" | green |
| UPDATERS-08 | every run of the suite | `scripts/updaters/run.test.mjs` › "no run merges, approves, enables auto-merge, pushes the default branch or sets ATL_WRITE_GUARD" | green |
| UPDATERS-09 | a dry run over an out-of-date updater | `scripts/updaters/run.test.mjs` › "a dry run prints the plan and runs no git or gh" | green |

The update mode of `pnpm mcp:docs` is unchanged: the pin "the update mode prints the lines and
exit codes it printed before --check" passed on main's updater before the change and after it, and
a differential run of main's `scripts/update-mcp-docs.mjs` (`e31b6d9`) against this change, both
as processes over twelve steps of identical scratch trees (first write, nothing new, a failed
request, a release with a bump, a waiting release and a new major, a repin, a `.mcp.json` server,
no markers, a malformed catalog, an inexact pin), found no difference in stdout, stderr, the exit
code or the doc. The same differential against `da5dcaf`, before the merge, found none over eleven
steps.

## Gate

- `pnpm validate`: not run by the writer, on the coordinator's instruction (the machine is shared);
  the coordinator runs it. Run one by one at `120b871`, each exit 0: `node --test
  scripts/validate.test.mjs` (42 of 42), `pnpm verify:updaters`, `pnpm verify:mcp-docs`,
  `pnpm verify:manifest`, `pnpm verify:manifest:coverage`, `pnpm verify:specs`,
  `pnpm verify:english`, `pnpm verify:maps`, `pnpm knip`, and eslint over every changed script.

## Not verified

- The runner against a real `git` and `gh`: every case uses fakes, so whether GitHub accepts each
  call (`gh pr ready --undo` on a pull request that is already a draft, `gh label create --force`
  without the permission to manage labels) is first seen when slice 2 schedules it with the
  GitHub App.
- Whether an updater writes only what its `writes` declares, which no gate reads (UPDATERS-03
  covers the declaration, the runner the diff it got).
