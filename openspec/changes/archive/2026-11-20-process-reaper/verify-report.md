# Verify report: 2026-11-20-process-reaper

> **Verified:** 2026-11-20 at `a81e26a`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| REAP-01 | the committed contract | `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract lists every family the reaper may end" | green |
| REAP-01 | the spare list | `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract spares the shared MCP proxy, detached by design" | green |
| REAP-01 | an unknown key | `scripts/agent-harness/reaper/contract.test.mjs` › "a contract with an unknown key is refused, naming the file" | green |
| REAP-01 | a pattern that does not compile | `scripts/agent-harness/reaper/contract.test.mjs` › "a family whose pattern does not compile is refused, naming the family" | green |
| REAP-02 | a dead parent | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan of a family is a candidate with its whole tree" | green |
| REAP-02 | a live parent | `scripts/agent-harness/reaper/plan.test.mjs` › "a process whose parent is alive is no candidate" | green |
| REAP-02 | a reused parent pid | `scripts/agent-harness/reaper/plan.test.mjs` › "a parent pid reused by a process that started after its child makes the child an orphan" | green |
| REAP-02 | reparented on POSIX | `scripts/agent-harness/reaper/plan.test.mjs` › "on POSIX a process under pid 1 or the user's subreaper is an orphan" | green |
| REAP-03 | the whole tree goes | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan of a family is a candidate with its whole tree" | green |
| REAP-03 | unknown names | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan outside every family is never touched" | green |
| REAP-04 | the wrapper of an npx server | `scripts/agent-harness/reaper/plan.test.mjs` › "a wrapper whose only child is reapable is a candidate, its console aside" | green |
| REAP-04 | a wrapper of something else | `scripts/agent-harness/reaper/plan.test.mjs` › "a wrapper with a child outside the families is never touched" | green |
| REAP-05 | its own ancestry | `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds the reaper's own ancestry is kept" | green |
| REAP-05 | a daemon detached by design | `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds a process the contract spares is kept" | green |
| REAP-05 | the grace period | `scripts/agent-harness/reaper/plan.test.mjs` › "a tree with a process younger than the grace period is kept" | green |
| REAP-06 | the dry run | `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run prints each candidate with its family, age and MB, then the total, and ends nothing" | green |
| REAP-06 | the kill | `scripts/agent-harness/reaper/reap.test.mjs` › "--kill ends every candidate tree and prints what it ended" | green |
| REAP-06 | quiet and JSON | `scripts/agent-harness/reaper/reap.test.mjs` › "--quiet prints only the total and --json the plan" | green |
| REAP-07 | Windows | `scripts/agent-harness/reaper/platform.test.mjs` › "on Windows the listing is read from Get-CimInstance and a tree ends with taskkill /T /F" | green |
| REAP-07 | a pid an older process names as its parent | `scripts/agent-harness/reaper/platform.test.mjs` › "on Windows a tree whose pid an older process names as its parent is ended pid by pid" | green |
| REAP-07 | POSIX | `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX the listing is read from ps and a tree gets SIGTERM, then SIGKILL after 2 s" | green |
| REAP-08 | a listing that never answers | `scripts/agent-harness/reaper/reap.test.mjs` › "a listing that outlasts the bound ends nothing and exits 1" | green |
| REAP-08 | the bound runs out between two trees | `scripts/agent-harness/reaper/reap.test.mjs` › "the bound running out between two trees leaves the rest and exits 1" | green |
| REAP-08 | a listing that fails | `scripts/agent-harness/reaper/reap.test.mjs` › "a listing that fails exits 1, naming the command" | green |
| REAP-09 | the committed hook | `scripts/agent-harness/hooks-projection.test.mjs` › "the committed hook source renders the reaper at session start, with no matcher" | green |
| REAP-09 | the hook runs the reaper | `scripts/agent-harness/reaper/session-start.test.mjs` › "the session hook runs the reaper in kill mode, quiet, against the real core" | green |
| REAP-09 | the reaper fails | `scripts/agent-harness/reaper/session-start.test.mjs` › "a reaper that throws, fails or hangs prints one line to stderr and the hook exits 0" | green |
| REAP-10 | the bound | `scripts/agent-harness/reaper/bounded-child.test.mjs` › "a child that outlasts its bound has its tree ended and reads as timed out" | green |
| REAP-10 | a real tree on Windows | `scripts/agent-harness/reaper/bounded-child.test.mjs` › "on Windows a child stopped at its bound takes the process it started with it" | green, on Windows |
| REAP-10 | the pruner's fetch on Windows | `scripts/prune-worktrees.test.mjs` › "on Windows a fetch stopped at its bound ends the processes git started" | green, on Windows |

## Gate

- `pnpm validate`: not run by the session that built the change, on the owner's instruction
  that the machine is short of memory; the parent session runs it. The focused suites and single
  gates ran instead, each exit 0 on 2026-11-20: `pnpm reap:test` (68 tests),
  `pnpm agent-harness:test` (86), `pnpm agent-harness:projection-check`,
  `pnpm write-guard:test`, `node --test scripts/prune-worktrees.test.mjs` (80),
  `pnpm verify:manifest`, `pnpm verify:manifest:coverage`, `pnpm verify:manifest:test`,
  `pnpm verify:specs`, `pnpm verify:english`, `pnpm verify:maps`, `pnpm verify:tests`,
  `pnpm verify:dependency-seams`, `pnpm verify:unicode-safety`, `pnpm verify:instruction-entry`,
  `pnpm verify:agent-context`, `pnpm codex-budget:test`, `pnpm knip` and ESLint on every
  changed `.mjs` file.
- A differential run of the pruner at `860561f` and at this change, over a scratch clone with a
  remote that fails and one that answers, under `--dry-run` and `--quiet`: the same stdout,
  stderr and exit code.
- `pnpm reap` on the machine that built it, 2026-11-20: no tree to end, 0 MB; it kept the
  shared `mcp-proxy`, which the spare list names.

## Not verified

- The two Windows-only tests are skipped on POSIX, where a stopped child keeps receiving its
  signal alone, as before; no POSIX machine ran the suite.
- `pnpm reap:kill` and the session hook's kill mode never ran against this machine's processes:
  every kill in the suite goes to an injected spawn, by the owner's instruction that the parent
  reviews the dry-run list before any real kill.
- The hook was not run by a live Claude Code session (decision 34's live check); its projection
  and its script are tested, not its firing.
