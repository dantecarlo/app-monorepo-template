# harness/process-reaper — living spec

> **Governs:** `.agents/contracts/process-reaper.json`, `scripts/agent-harness/reaper/contract.mjs`, `scripts/agent-harness/reaper/plan.mjs`, `scripts/agent-harness/reaper/platform.mjs`, `scripts/agent-harness/reaper/bounded-child.mjs`, `scripts/agent-harness/reaper/reap.mjs`, `scripts/agent-harness/reaper/session-start.mjs`
> **ID prefix:** `REAP`
> **Derived from:** `docs/harness.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-20 at `01239a8`

## Purpose

The process-reaper unit of the harness ends the orphaned process trees a dead session leaves
behind: on Windows a killed parent does not take its children with it, so the MCP servers, npx
launchers, turbo, vitest workers, esbuild, tsc, jest workers and `git-remote-https` of a crashed
or restarted session, a stopped background shell or a stopped `pnpm validate` run on (F74). It
owns the contract of the families it may end and the processes it spares, the pure core that
decides which trees to end from the process list as data, the platform adapter that lists and
ends them, `runBounded`, which ends a bounded child with its tree, the command behind
`pnpm reap` and `pnpm reap:kill`, and the Claude Code SessionStart hook that runs it at every
session start. The hook projection that renders `.agents/hooks.json` into `.claude/settings.json`,
and the worktree pruner whose fetch runs through `runBounded`, are not part of this unit.

## Requirements

### Requirement: REAP-01 — One contract names every family the reaper may end

The reaper contract `.agents/contracts/process-reaper.json` SHALL hold the grace period and the
time bound in whole seconds and a non-empty list of families, each with a kebab-case `id` used
once, a `pattern` that compiles as a regular expression and a non-empty `what`, a wrapper family
also `wrapper: true`, and no other key, and an optional `spare` list of entries in the same shape
without `wrapper`; the reaper refuses a contract that breaks this shape, naming the file and the
entry.

**Evidence:** `.agents/contracts/process-reaper.json:3-5`, `.agents/contracts/process-reaper.json:53-59`,
`scripts/agent-harness/reaper/contract.mjs:18-23`, `scripts/agent-harness/reaper/contract.mjs:45-73`,
`scripts/agent-harness/reaper/contract.mjs:76-114`

#### Scenario: the committed contract

- **GIVEN** the committed `.agents/contracts/process-reaper.json`
- **WHEN** the reaper loads it
- **THEN** it holds the npx-launched MCP servers, the MCP server entrypoints, vitest, turbo,
  esbuild, tsc, jest, `git-remote-https` and the console wrappers, a 60 s grace and an 8 s bound
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract lists every family the reaper may end"

#### Scenario: the spare list

- **GIVEN** the committed contract
- **WHEN** the reaper loads it
- **THEN** its spare list names the shared MCP proxy, `mcp-proxy`, and no MCP server it hosts
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract spares the shared MCP proxy, detached by design"

#### Scenario: an unknown key

- **GIVEN** a contract whose family carries a key the schema does not name
- **WHEN** the reaper loads it
- **THEN** it throws, naming the file, the family and the key
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a contract with an unknown key is refused, naming the file"

#### Scenario: a pattern that does not compile

- **GIVEN** a family whose pattern is `(`
- **WHEN** the reaper loads it
- **THEN** it throws, naming the file and the family
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a family whose pattern does not compile is refused, naming the family"

### Requirement: REAP-02 — An orphan is a process its parent no longer holds

The reaper SHALL read a process as an orphan when its parent pid names no listed process, or
names one that started after it (a pid reused); on POSIX also when its parent is pid 1 or the
user's subreaper (`systemd --user`, a WSL `/init`); a parent whose start time, or whose child's,
cannot be read holds its child.

**Evidence:** `scripts/agent-harness/reaper/plan.mjs:26`, `scripts/agent-harness/reaper/plan.mjs:37-42`,
`scripts/agent-harness/reaper/plan.mjs:65-73`

#### Scenario: a dead parent

- **GIVEN** a listing where an npx MCP launcher's parent pid names no process
- **WHEN** the reaper plans
- **THEN** the launcher is a candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan of a family is a candidate with its whole tree"

#### Scenario: a live parent

- **GIVEN** a listing where the same launcher's parent is a live session
- **WHEN** the reaper plans
- **THEN** there is no candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a process whose parent is alive is no candidate"

#### Scenario: a reused parent pid

- **GIVEN** a listing where the launcher's parent pid names a process that started after it
- **WHEN** the reaper plans
- **THEN** the launcher is a candidate, and that newer process is not part of its tree
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a parent pid reused by a process that started after its child makes the child an orphan"

#### Scenario: reparented on POSIX

- **GIVEN** a POSIX listing with one family process under pid 1 and one under `systemd --user`
- **WHEN** the reaper plans
- **THEN** both are candidates
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "on POSIX a process under pid 1 or the user's subreaper is an orphan"

### Requirement: REAP-03 — Only an orphan of a family is ended, with its whole tree

The reaper SHALL end an orphan whose command line, or its name when the listing reads no command
line, matches the pattern of a family that is not a wrapper, together with every process
descended from it, and SHALL never end an orphan outside every family.

**Evidence:** `scripts/agent-harness/reaper/plan.mjs:78-81`, `scripts/agent-harness/reaper/plan.mjs:103-114`,
`scripts/agent-harness/reaper/plan.mjs:148-195`

#### Scenario: the whole tree goes

- **GIVEN** an orphaned npx launcher with a shell and a server below it
- **WHEN** the reaper plans
- **THEN** the candidate holds the three pids, its family and the sum of their memory
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan of a family is a candidate with its whole tree"

#### Scenario: unknown names

- **GIVEN** orphans named `slack.exe`, `sh.exe` and an orphaned `pnpm`
- **WHEN** the reaper plans
- **THEN** none is a candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan outside every family is never touched"

### Requirement: REAP-04 — A console wrapper goes only with the one process it wraps

The reaper SHALL read an orphaned process whose name matches a wrapper family (`cmd.exe`,
`conhost.exe`) only by what it wraps: it is a candidate when, its childless wrappers aside, it has
exactly one child and that child matches a family or is such a wrapper itself, and its command
line alone never makes it one.

**Evidence:** `.agents/contracts/process-reaper.json:46-51`, `scripts/agent-harness/reaper/plan.mjs:75-76`,
`scripts/agent-harness/reaper/plan.mjs:85-101`

#### Scenario: the wrapper of an npx server

- **GIVEN** an orphaned `cmd.exe` whose children are a `conhost.exe` and an npx launcher
- **WHEN** the reaper plans
- **THEN** the `cmd.exe` is a candidate of the npx family, via `cmd.exe`, with its tree
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a wrapper whose only child is reapable is a candidate, its console aside"

#### Scenario: a wrapper of something else

- **GIVEN** an orphaned `cmd.exe` that mentions `npx` and wraps a process outside the families
- **WHEN** the reaper plans
- **THEN** there is no candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a wrapper with a child outside the families is never touched"

### Requirement: REAP-05 — The reaper's own ancestry and a young process are never touched

The reaper SHALL keep, with its reason, a candidate tree that holds the reaper itself or any of
its ancestors, one that holds a process an entry of the contract's spare list matches (a daemon
detached by design, which reads as an orphan), naming that entry, and one that holds a process
younger than the contract's grace period or of an unreadable age.

**Evidence:** `scripts/agent-harness/reaper/plan.mjs:30-35`, `scripts/agent-harness/reaper/plan.mjs:116-137`

#### Scenario: its own ancestry

- **GIVEN** an orphaned npx launcher that is an ancestor of the reaper's own process
- **WHEN** the reaper plans
- **THEN** that tree is kept, with the reason that it holds the reaper's ancestry
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds the reaper's own ancestry is kept"

#### Scenario: a daemon detached by design

- **GIVEN** an orphaned `mcp-proxy.exe` whose command line names `context7-mcp`, and an orphaned
  npx launcher whose tree holds another
- **WHEN** the reaper plans
- **THEN** both trees are kept, each with the reason that it holds a process the contract spares
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds a process the contract spares is kept"

#### Scenario: the grace period

- **GIVEN** an orphaned launcher whose server started 30 s ago, under a 60 s grace
- **WHEN** the reaper plans
- **THEN** that tree is kept, with the reason that it is younger than the grace
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree with a process younger than the grace period is kept"

### Requirement: REAP-06 — A dry run by default, and the kill only when asked

`pnpm reap` SHALL be a dry run that prints one line per candidate (its pid, family, age, process
count and MB) and a total line, and ends nothing; `--kill` ends each candidate tree and prints
what it ended; `--quiet` prints only the total line; `--json` prints the plan, with the trees
kept and why; an unknown option exits 1.

**Evidence:** `scripts/agent-harness/reaper/reap.mjs:43-55`, `scripts/agent-harness/reaper/reap.mjs:107-122`,
`scripts/agent-harness/reaper/reap.mjs:124-159`

#### Scenario: the dry run

- **GIVEN** a listing with two candidate trees
- **WHEN** the reaper runs with no option
- **THEN** it prints both, then the total MB, ends nothing and exits 0
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run prints each candidate with its family, age and MB, then the total, and ends nothing"

#### Scenario: the kill

- **GIVEN** the same listing
- **WHEN** the reaper runs with `--kill`
- **THEN** it ends both trees, prints them as ended and exits 0
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "--kill ends every candidate tree and prints what it ended"

#### Scenario: quiet and JSON

- **GIVEN** the same listing
- **WHEN** the reaper runs with `--quiet`, then with `--json`
- **THEN** the first prints the total line alone, and the second the plan as JSON
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "--quiet prints only the total and --json the plan"

### Requirement: REAP-07 — A tree ends the way its platform ends one

The reaper SHALL list processes with `Get-CimInstance Win32_Process` through `powershell` on
Windows and `ps -eo pid=,ppid=,etime=,rss=,args=` on POSIX, and SHALL end a tree with
`taskkill /PID <pid> /T /F` on Windows, pid by pid without `/T` when an older process names a pid
of the tree as its parent, and on POSIX with SIGTERM to every pid of the tree, then SIGKILL after
2 s to each that still runs.

**Evidence:** `scripts/agent-harness/reaper/platform.mjs:30-41`, `scripts/agent-harness/reaper/platform.mjs:106-129`,
`scripts/agent-harness/reaper/platform.mjs:131-159`, `scripts/agent-harness/reaper/platform.mjs:173-201`

#### Scenario: Windows

- **GIVEN** an injected spawn that answers the CIM listing
- **WHEN** the reaper ends a candidate
- **THEN** it ran `taskkill /PID <root> /T /F`
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on Windows the listing is read from Get-CimInstance and a tree ends with taskkill /T /F"

#### Scenario: a pid an older process names as its parent

- **GIVEN** a tree whose root pid an older, unrelated process names as its parent
- **WHEN** the reaper ends it on Windows
- **THEN** it runs `taskkill /F` with one `/PID` per pid of the tree and no `/T`
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on Windows a tree whose pid an older process names as its parent is ended pid by pid"

#### Scenario: POSIX

- **GIVEN** an injected spawn that answers the `ps` listing and an injected signal
- **WHEN** the reaper ends a candidate
- **THEN** every pid got SIGTERM, and after 2 s the one still running got SIGKILL
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX the listing is read from ps and a tree gets SIGTERM, then SIGKILL after 2 s"

### Requirement: REAP-08 — The reaper ends within its bound, and says how it ended

The reaper SHALL exit 0 when it finished, with or without ends, and 1 on a failure (a listing
that fails, a tree it could not end, an unknown option); it SHALL end within the contract's time
bound, and a run that reaches the bound ends no tree it had not already decided on, says so and
exits 1.

**Evidence:** `scripts/agent-harness/reaper/reap.mjs:167-219`, `scripts/agent-harness/reaper/reap.mjs:231-237`

#### Scenario: a listing that never answers

- **GIVEN** a listing command that never finishes, under a short bound
- **WHEN** the reaper runs with `--kill`
- **THEN** it ends nothing, prints that the bound ran out and exits 1
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a listing that outlasts the bound ends nothing and exits 1"

#### Scenario: the bound runs out between two trees

- **GIVEN** two candidate trees and a clock that passes the bound after the first is ended
- **WHEN** the reaper runs with `--kill`
- **THEN** the second tree is left, the run says so and exits 1
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "the bound running out between two trees leaves the rest and exits 1"

#### Scenario: a listing that fails

- **GIVEN** a listing command that exits 1
- **WHEN** the reaper runs
- **THEN** it prints the command's failure and exits 1
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a listing that fails exits 1, naming the command"

### Requirement: REAP-09 — Every session start runs the reaper, and never fails for it

`.agents/hooks.json` SHALL hold a `SessionStart` hook, with no matcher and a 15 s timeout, that
runs `scripts/agent-harness/reaper/session-start.mjs`, which runs the reaper with `--kill` and
`--quiet` within its bound and exits 0 whatever happens, printing one line to stderr when the
reaper throws, fails or outlasts its bound; the hook projection renders a `SessionStart` hook
without a matcher into `.claude/settings.json`.

**Evidence:** `.agents/hooks.json:11-16`, `.claude/settings.json:16-26`, `scripts/agent-harness/hooks-projection.mjs:54-62`,
`scripts/agent-harness/hooks-projection.mjs:107-112`, `scripts/agent-harness/reaper/session-start.mjs:33-97`

#### Scenario: the committed hook

- **GIVEN** the committed `.agents/hooks.json`
- **WHEN** the projection renders `.claude/settings.json`
- **THEN** its `SessionStart` list runs the session-start script with a 15 s timeout and no matcher
- **Test:** `scripts/agent-harness/hooks-projection.test.mjs` › "the committed hook source renders the reaper at session start, with no matcher"

#### Scenario: the hook runs the reaper

- **GIVEN** an injected spawn answering a listing with one candidate
- **WHEN** the session-start script runs
- **THEN** it ended that tree, printed the total line alone and returned 0
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "the session hook runs the reaper in kill mode, quiet, against the real core"

#### Scenario: the reaper fails

- **GIVEN** a reaper that throws, one that exits 1 and one that never ends
- **WHEN** the session-start script runs each
- **THEN** each prints one stderr line and returns 0
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "a reaper that throws, fails or hangs prints one line to stderr and the hook exits 0"

### Requirement: REAP-10 — A child stopped at its bound takes its tree with it

`runBounded` SHALL run a command with a time bound and, at the bound, end the child's whole tree
with `signalProcessTree` (`taskkill /T /F` on Windows, the child's signal on POSIX), release its
pipes and read as timed out; the worktree pruner's `git fetch --prune` runs through it.

**Evidence:** `scripts/agent-harness/reaper/bounded-child.mjs:29-78`, `scripts/prune-worktrees.mjs:168-187`

#### Scenario: the bound

- **GIVEN** an injected child that never ends
- **WHEN** `runBounded` reaches its bound
- **THEN** it asked for the child's tree to end and returned timed out
- **Test:** `scripts/agent-harness/reaper/bounded-child.test.mjs` › "a child that outlasts its bound has its tree ended and reads as timed out"

#### Scenario: a real tree on Windows

- **GIVEN** a node child that starts a node grandchild and waits
- **WHEN** `runBounded` reaches its bound on Windows
- **THEN** both the child and the grandchild have ended
- **Test:** `scripts/agent-harness/reaper/bounded-child.test.mjs` › "on Windows a child stopped at its bound takes the process it started with it"

#### Scenario: the pruner's fetch on Windows

- **GIVEN** a clone whose remote runs an ssh command that never answers
- **WHEN** the pruner's fetch is stopped at its bound on Windows
- **THEN** the run skips and exits 0, and the ssh command git started has ended
- **Test:** `scripts/prune-worktrees.test.mjs` › "on Windows a fetch stopped at its bound ends the processes git started"

## Open questions

- **Q1** — the `NOT_COVERED` line the worktree pruner prints at the end of a dry run
  (`scripts/prune-worktrees.detect.mjs:61-71`) still says that on Windows a fetch stopped at its
  bound leaves the remote helper it started running on, while the fetch now runs through
  `runBounded` and is ended with its tree (`scripts/prune-worktrees.mjs:168-187`, REAP-10). The
  owner decides when that line changes; the requirement above states the code.
