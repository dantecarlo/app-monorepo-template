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
| REAP-03 | text in the arguments | `scripts/agent-harness/reaper/plan.test.mjs` › "a family is matched by the executable and its script, never by text in the arguments" | green |
| REAP-03 | persistent and watch work | `scripts/agent-harness/reaper/plan.test.mjs` › "persistent and watch work is never a candidate, one-shot runs are" | green |
| REAP-03 | the entry of a process | `scripts/agent-harness/reaper/contract.test.mjs` › "the entry of a process is its executable and its script, the flags before it skipped" | green |
| REAP-04 | a reparented POSIX shell | `scripts/agent-harness/reaper/plan.test.mjs` › "on POSIX a reparented shell that wraps one reapable run goes with it" | green |
| REAP-04 | the wrapper family | `scripts/agent-harness/reaper/contract.test.mjs` › "the wrapper family matches the consoles, the POSIX shells and the npx launcher" | green |
| REAP-05 | a live Git for Windows shell | `scripts/agent-harness/reaper/plan.test.mjs` › "a live MSYS shell that runs pnpm turbo run dev is never a candidate, whatever its text" | green |
| REAP-05 | Git for Windows and the multiplexers | `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract spares Git for Windows processes and terminal multiplexers" | green |
| REAP-09 | a PreToolUse hook with no matcher | `scripts/agent-harness/hooks-projection.test.mjs` › "a PreToolUse hook with no matcher is refused as missing it, in the words it always used" | green |
| REAP-09 | a hung reaper in a process of its own | `scripts/agent-harness/reaper/session-start.test.mjs` › "a hung reaper still lets the hook process exit 0 with its one line" | green |
| REAP-10 | a silent fetch failure | `scripts/prune-worktrees.test.mjs` › "a fetch that fails with nothing on stderr names its error or its exit code, never undefined" | green |
| REAP-11 | the lock is held | `scripts/agent-harness/reaper/reap.test.mjs` › "a second reaper finds the lock and exits 0 at once, ending nothing" | green |
| REAP-11 | a stale lock | `scripts/agent-harness/reaper/reap.test.mjs` › "a lock older than 30 s is a reaper that died, and is taken over" | green |
| REAP-11 | a dry run | `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run takes no lock" | green |
| REAP-12 | a reused pid by the kill | `scripts/agent-harness/reaper/reap.test.mjs` › "a candidate whose pid names another process by its kill is left, and the rest are ended" | green |
| TOOLING-12 | taskkill is bounded | `packages/tooling/src/__tests__/process-tree.test.mjs` › "on Windows taskkill is bounded at 5 s, waited for or not" | green, on Windows |

## The verifier's correction

An independent verifier read the branch at `d217c8f` and found two blockers and eight
advisories; one correction batch fixed all of them, each test seen red for its stated reason
first.

- **B1, a live shell ended.** A family matched text anywhere in a command line, and a Git for
  Windows shell reports a parent already gone while it works, so the dry run on the building
  machine listed `sh -c 'sleep 200; : turbo run dev marker'` as "would end pid 59832, turbo".
  Red: the verifier's table (an `sh.exe` running `pnpm turbo run dev` above a `next dev`) gave
  that shell as a turbo candidate. Fixed: a family matches the executable and the script alone
  (REAP-03); consoles, POSIX shells and the npx launcher are wrappers (REAP-04); Git for Windows
  processes, tmux and screen are spared (REAP-05). Live check after the fix: an orphaned
  `sh.exe` naming `turbo run dev marker`, 66 s old, was no candidate.
- **B2, an error text changed.** A PreToolUse hook with no matcher read "matcher must name the
  tools it runs on". Red with that text; fixed back to `missing matcher` and
  `missing matcher, name` (REAP-09). A differential run of the base and the fix over thirteen hook
  sources differs only in the list of events, which now names SessionStart.
- **Advisories.** A lock, stale after 30 s, and a second listing right before the kills
  (REAP-11, REAP-12; red: the module and the kill had neither). The spare matches `mcp-proxy`
  however it is launched (REAP-05). Persistent and watch work matches no family (REAP-03).
  `signalProcessTree` stops taskkill after 5 s (TOOLING-12; red: `timeout: undefined`); a POSIX
  kill is one `process.kill` system call and needs no bound. The session hook's race timer holds
  the process (REAP-09; red: exit 13, an unsettled top-level await). A silent fetch failure names
  its error or exit code (REAP-10; red: `failed in /r: undefined`). Q1 is closed: the parent
  corrected the pruner's not-covered text in `d217c8f`. REAP-06 states the `kept` lines.
- **Checks after the batch:** `pnpm reap:test` 96 pass, `pnpm agent-harness:test` 88, the
  projection check, `pnpm write-guard:test`, the pruner suite 81, the tooling process-tree suite 5,
  `pnpm verify:specs`, `pnpm verify:english`, `pnpm knip` and ESLint, each exit 0; `pnpm reap` on
  the building machine: no tree to end, 0 MB.

## Gate

- `pnpm validate`: not run by the session that built the change, on the owner's instruction
  that the machine is short of memory; the parent session runs it. The focused suites and single
  gates ran instead, each exit 0 on 2026-11-20: `pnpm reap:test` (71 tests),
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

- The three Windows-only tests (the bounded child's real tree, the pruner's stopped fetch and the
  taskkill bound) are skipped on POSIX, where a stopped child keeps receiving its signal alone, as
  before; no POSIX machine ran the suites, and the POSIX tables of the core are synthetic.
- `pnpm reap:kill` and the session hook's kill mode never ran against this machine's processes:
  every kill in the suite goes to an injected spawn, by the owner's instruction that the parent
  reviews the dry-run list before any real kill.
- The hook was not run by a live Claude Code session (decision 34's live check); its projection
  and its script are tested, not its firing.
