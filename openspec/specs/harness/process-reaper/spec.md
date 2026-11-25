# harness/process-reaper — living spec

> **Governs:** `.agents/contracts/process-reaper.json`, `scripts/agent-harness/reaper/contract.mjs`, `scripts/agent-harness/reaper/plan.mjs`, `scripts/agent-harness/reaper/platform.mjs`, `scripts/agent-harness/reaper/bounded-child.mjs`, `scripts/agent-harness/reaper/lock.mjs`, `scripts/agent-harness/reaper/reap.mjs`, `scripts/agent-harness/reaper/session-start.mjs`
> **ID prefix:** `REAP`
> **Derived from:** `docs/harness.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-25 at `ab260731`

## Purpose

The process-reaper unit of the harness ends the orphaned process trees a dead session leaves
behind: on Windows a killed parent does not take its children with it, so the MCP servers, npx
launchers, turbo, vitest workers, esbuild, tsc, jest workers and `git-remote-https` of a crashed
or restarted session, a stopped background shell or a stopped `pnpm validate` run on (F74). It
owns the contract of the families it may end and the processes it spares, the pure core that
decides which trees to end from the process list as data, the platform adapter that lists and
ends them, `runBounded`, which ends a bounded child with its tree, the lock that keeps one
killing reaper at a time, the command behind `pnpm reap` and `pnpm reap:kill`, and the Claude
Code SessionStart hook that runs it at every session start. The hook projection that renders
`.agents/hooks.json` into `.claude/settings.json`, the worktree pruner whose fetch runs through
`runBounded`, and `signalProcessTree` (packages/tooling, TOOLING-12) are not part of this unit.

## Requirements

### Requirement: REAP-01 — One contract names every family the reaper may end

The reaper contract `.agents/contracts/process-reaper.json` SHALL hold the grace period and the
time bound in whole seconds, a non-empty list of families and an optional `spare` list, each
entry with a kebab-case `id` used once across both lists, a non-empty `what` and a non-empty
`match` list whose entries hold an `exe` pattern and may hold a `script` and an `args` pattern,
each compiling as a case-insensitive regular expression, a wrapper family also `wrapper: true`,
and no other key; the reaper refuses a contract that breaks this shape, naming the file and the
entry.

**Evidence:** `.agents/contracts/process-reaper.json:3-5`, `.agents/contracts/process-reaper.json:143-183`,
`scripts/agent-harness/reaper/contract.mjs:23-30`, `scripts/agent-harness/reaper/contract.mjs:52-104`,
`scripts/agent-harness/reaper/contract.mjs:107-145`

#### Scenario: the committed contract

- **GIVEN** the committed `.agents/contracts/process-reaper.json`
- **WHEN** the reaper loads it
- **THEN** it holds the npx-launched MCP servers, the MCP server entrypoints, vitest, turbo,
  esbuild, tsc, jest, `git-remote-https` and the console wrappers, a 60 s grace and an 8 s bound
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract lists every family the reaper may end"

#### Scenario: an unknown key

- **GIVEN** a contract whose family carries a key the schema does not name
- **WHEN** the reaper loads it
- **THEN** it throws, naming the file, the family and the key
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a contract with an unknown key is refused, naming the file"

#### Scenario: a pattern that does not compile

- **GIVEN** a family whose `exe` pattern is `(`
- **WHEN** the reaper loads it
- **THEN** it throws, naming the file, the family and the pattern
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a family whose pattern does not compile is refused, naming the family"

### Requirement: REAP-02 — An orphan is a process its parent no longer holds

The reaper SHALL read a process as an orphan when its parent pid names no listed process, or
names one that started after it (a pid reused); on POSIX also when its parent is pid 1 or the
user's subreaper (`systemd --user`, a WSL `/init`); a parent whose start time, or whose child's,
cannot be read holds its child.

**Evidence:** `scripts/agent-harness/reaper/plan.mjs:33`, `scripts/agent-harness/reaper/plan.mjs:164-169`,
`scripts/agent-harness/reaper/plan.mjs:192-200`

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

### Requirement: REAP-03 — Only an orphan of a family is ended, by its executable and script

The reaper SHALL match a family against a process's entry alone: its own executable path and,
for an interpreter (node, python), the script it runs, its first argument that is not a flag
(`-m <module>` for python), with the arguments after it; never against text anywhere else in its
command line. It SHALL end an orphan whose entry matches a family that is not a wrapper, together
with every process descended from it, and never an orphan outside every family. The families are
one-shot runs: `turbo run dev` or `start`, the turbo daemon, `vitest` without `run`,
`tsc --watch`, tsserver and the dev servers (`next dev`, `expo start`, metro) match none. A node
process in watch mode, one whose flags before its script name `--watch`, `--watch-path <path>`,
`--watch-path=<path>` or `--watch-preserve-output`, SHALL match no family, a wrapper included,
`--watch-path` taking the next argument as its value; a candidate tree that holds one SHALL be
kept, with its reason.

**Evidence:** `.agents/contracts/process-reaper.json:5-142`, `scripts/agent-harness/reaper/plan.mjs:39-60`,
`scripts/agent-harness/reaper/plan.mjs:76-162`, `scripts/agent-harness/reaper/plan.mjs:202-214`,
`scripts/agent-harness/reaper/plan.mjs:266`, `scripts/agent-harness/reaper/plan.mjs:282-333`

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

#### Scenario: text in the arguments

- **GIVEN** orphans `Code.exe D:\repos\vitest\src`, `npx tsx watch src/mcp/server.ts`,
  `node D:\Dev\context7-mcp-fork\server.js` and a script whose arguments name turbo and vitest
- **WHEN** the reaper plans
- **THEN** none is a candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a family is matched by the executable and its script, never by text in the arguments"

#### Scenario: persistent and watch work

- **GIVEN** orphaned `turbo run dev`, `turbo run start`, the turbo daemon, `vitest --watch`, a bare
  `vitest`, `tsc --watch`, `tsc -w`, tsserver, `next dev`, `expo start`, metro,
  `esbuild --watch --serve`, and a tsc and a vitest run that node runs with `--watch`,
  `--watch-path <path>`, `--watch-path=<path>` or `--watch-preserve-output`, beside one-shot runs
  of each family
- **WHEN** the reaper plans
- **THEN** only the one-shot runs are candidates
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "persistent and watch work is never a candidate, one-shot runs are"

#### Scenario: a tree that holds a process in watch mode

- **GIVEN** an orphaned turbo run whose child is `node --watch-path src server.js`, and an
  orphaned `cmd.exe` that wraps `node --watch` of a tsc
- **WHEN** the reaper plans
- **THEN** there is no candidate, and the turbo tree is kept with the reason that a process in it
  runs in watch mode
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds a node process in watch mode is kept, with its reason"

#### Scenario: the entry of a process

- **GIVEN** a node command line with flags, a flag that takes a value and a `.bin/..` script path
- **WHEN** the reaper reads its entry
- **THEN** the flags before the script are skipped, the script path is normalised, and inline
  code is no script
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the entry of a process is its executable and its script, the flags before it skipped"

#### Scenario: the entry of a process in watch mode

- **GIVEN** node command lines with `--watch`, `--watch-path <path>`, `--watch-path=<path>` and
  `--watch-preserve-output` before a tsc script, and one with `--watch` after its script
- **WHEN** the reaper reads each entry
- **THEN** the first four read as watch mode with the tsc script, `--watch-path` taking the next
  argument as its value, and the last does not
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a node process in watch mode reads as watch mode, and --watch-path takes the next argument as its value"

### Requirement: REAP-04 — A wrapper goes only with the one process it wraps

The reaper SHALL read a process whose entry matches a wrapper family (`cmd.exe`, `conhost.exe`,
powershell, pwsh, the npx launcher, `npm exec`, and the POSIX `sh`, `bash`, `dash`, `zsh`, `env`
and `timeout`) only by what it wraps: an orphaned wrapper is a candidate when, its childless
wrappers aside, it has exactly one child and that child matches a family or is such a wrapper
itself, and nothing in its own command line ever makes it one.

**Evidence:** `.agents/contracts/process-reaper.json:122-141`, `scripts/agent-harness/reaper/plan.mjs:202-207`,
`scripts/agent-harness/reaper/plan.mjs:218-234`

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

#### Scenario: a reparented POSIX shell

- **GIVEN** a POSIX `sh -c vitest run` under pid 1 whose only child is that vitest run
- **WHEN** the reaper plans
- **THEN** the shell is a candidate of the vitest family, via `sh`, with the run
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "on POSIX a reparented shell that wraps one reapable run goes with it"

#### Scenario: the wrapper family

- **GIVEN** the committed wrapper family
- **WHEN** it is matched against consoles, POSIX shells, the npx launcher, a Git for Windows
  `sh.exe` and an app
- **THEN** it matches the first three only
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the wrapper family matches the consoles, the POSIX shells and the npx launcher"

### Requirement: REAP-05 — Its own ancestry, a spared process and a young process are never touched

The reaper SHALL keep, with its reason, a candidate tree that holds the reaper itself or any of
its ancestors, one that holds a process an entry of the contract's spare list matches, naming
that entry, and one that holds a process younger than the contract's grace period or of an
unreadable age. The spare list names the shared MCP proxy however it is launched (the
`mcp-proxy` executable, `python -m mcp_proxy`, a node `mcp-proxy` script), every Git for Windows
(MSYS) process, whose runtime reports a parent already gone while it works, and tmux and screen;
no spared process is ever a candidate itself.

**Evidence:** `.agents/contracts/process-reaper.json:143-183`, `scripts/agent-harness/reaper/plan.mjs:62-68`,
`scripts/agent-harness/reaper/plan.mjs:157-162`, `scripts/agent-harness/reaper/plan.mjs:249-271`

#### Scenario: its own ancestry

- **GIVEN** an orphaned turbo run that is an ancestor of the reaper's own process
- **WHEN** the reaper plans
- **THEN** that tree is kept, with the reason that it holds the reaper's ancestry
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds the reaper's own ancestry is kept"

#### Scenario: a daemon detached by design

- **GIVEN** an orphaned `mcp-proxy.exe`, a turbo run whose tree holds `python -m mcp_proxy`, and a
  turbo run whose tree holds a Git for Windows `sh.exe`
- **WHEN** the reaper plans
- **THEN** there is no candidate, and both turbo trees are kept, naming `mcp-proxy` and
  `msys-runtime`
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds a process the contract spares is kept"

#### Scenario: a live Git for Windows shell

- **GIVEN** a Git for Windows `sh.exe` whose parent is gone, running `pnpm turbo run dev` above a
  `next dev`
- **WHEN** the reaper plans
- **THEN** there is no candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a live MSYS shell that runs pnpm turbo run dev is never a candidate, whatever its text"

#### Scenario: the spare list

- **GIVEN** the committed contract
- **WHEN** the proxy is launched as an executable, through python, through `python -m` and through
  node
- **THEN** each is spared as `mcp-proxy`, and an MCP server it hosts is not
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract spares the shared MCP proxy, detached by design"

#### Scenario: Git for Windows and the multiplexers

- **GIVEN** `sh.exe`, `bash.exe`, `timeout.exe` and `env.exe` of Git for Windows, tmux and screen
- **WHEN** the spare list is matched against each
- **THEN** each is spared as `msys-runtime` or `terminal-multiplexer`
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the committed contract spares Git for Windows processes and terminal multiplexers"

#### Scenario: the grace period

- **GIVEN** an orphaned launcher whose server started 30 s ago, under a 60 s grace
- **WHEN** the reaper plans
- **THEN** that tree is kept, with the reason that it is younger than the grace
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a tree with a process younger than the grace period is kept"

### Requirement: REAP-06 — A dry run by default, and the kill only when asked

`pnpm reap` SHALL be a dry run that prints one line per candidate (its pid, family, the wrapper
it came through, age, process count and MB), one `kept` line per kept tree with its reason, and a
total line, and ends nothing; `--kill` ends each candidate tree and prints what it ended;
`--quiet` prints only the total line; `--json` prints the plan, with the trees kept and why; an
unknown option exits 1.

**Evidence:** `scripts/agent-harness/reaper/reap.mjs:51-62`, `scripts/agent-harness/reaper/reap.mjs:92-130`,
`scripts/agent-harness/reaper/reap.mjs:134-183`

#### Scenario: the dry run

- **GIVEN** a listing with two candidate trees and one kept tree
- **WHEN** the reaper runs with no option
- **THEN** it prints both, then the kept tree's line, then the total MB, ends nothing and exits 0
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
Windows and `ps -eo pid=,ppid=,lstart=,rss=,args=` under `LC_ALL=C` on POSIX, reading each POSIX
start time as the absolute local time its `lstart` names (`Wed Nov 25 12:03:39 2026`), so that it
is the same in every listing, and one that does not parse as unreadable. It SHALL end a tree with
`taskkill /PID <pid> /T /F` on Windows, pid by pid without `/T` when an older process names a pid
of the tree as its parent, and on POSIX with SIGTERM to every pid of the tree, then, after 2 s, a
second listing and SIGKILL only to each pid still listed with the start time the plan read; when
that listing fails or the bound has run out, it SHALL send no SIGKILL and report each tree it
signalled as not ended, with the reason.

**Evidence:** `scripts/agent-harness/reaper/platform.mjs:31-67`, `scripts/agent-harness/reaper/platform.mjs:92-120`,
`scripts/agent-harness/reaper/platform.mjs:130-184`, `scripts/agent-harness/reaper/platform.mjs:198-265`

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

#### Scenario: the POSIX listing

- **GIVEN** an injected spawn that answers fixed `ps` lines, one of them with a day of the month
  padded by a space and one whose `lstart` does not parse
- **WHEN** the reaper lists the processes twice
- **THEN** `ps` ran with `lstart` under `LC_ALL=C`, each start time is the local time its
  `lstart` names, the same in both listings, and the unparsed one is null
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX the listing is read from ps under LC_ALL=C, each start time from its lstart"

#### Scenario: POSIX

- **GIVEN** a tree whose one pid survives its SIGTERM and whose other pid a newer process has
  taken by the SIGKILL check
- **WHEN** the reaper ends it
- **THEN** every pid got SIGTERM, and after 2 s and a second listing only the survivor whose
  start time held got SIGKILL
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX a tree gets SIGTERM, then after 2 s SIGKILL only to each pid still listed with its start time"

#### Scenario: the SIGKILL check cannot run

- **GIVEN** a tree that got its SIGTERM, then a second listing that fails, and then a bound that
  has run out by the check
- **WHEN** the reaper ends it
- **THEN** it sends no SIGKILL and reports the tree as not ended, with the reason
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX no SIGKILL is sent when the listing before it fails or the bound has run out"

### Requirement: REAP-08 — The reaper ends within its bound, and says how it ended

The reaper SHALL exit 0 when it finished, with or without ends, and 1 on a failure (a listing
that fails, a tree it could not end, an unknown option); it SHALL end within the contract's time
bound, and a run that reaches the bound ends no tree it had not already decided on, says so and
exits 1.

**Evidence:** `scripts/agent-harness/reaper/reap.mjs:185-189`, `scripts/agent-harness/reaper/reap.mjs:265-330`,
`scripts/agent-harness/reaper/reap.mjs:342-348`

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
reaper throws, fails or outlasts its bound, a hung reaper included; the hook projection renders
a `SessionStart` hook without a matcher into `.claude/settings.json`, and still refuses a
`PreToolUse` hook with no matcher as `missing matcher`.

**Evidence:** `.agents/hooks.json:11-16`, `.claude/settings.json:16-26`,
`scripts/agent-harness/hooks-projection.mjs:28-66`, `scripts/agent-harness/reaper/session-start.mjs:33-99`

#### Scenario: the committed hook

- **GIVEN** the committed `.agents/hooks.json`
- **WHEN** the projection renders `.claude/settings.json`
- **THEN** its `SessionStart` list runs the session-start script with a 15 s timeout and no matcher
- **Test:** `scripts/agent-harness/hooks-projection.test.mjs` › "the committed hook source renders the reaper at session start, with no matcher"

#### Scenario: a PreToolUse hook with no matcher

- **GIVEN** a `PreToolUse` hook with no matcher, then one with no matcher and no name
- **WHEN** the projection reads the source
- **THEN** it refuses them as `hooks[0]: missing matcher` and `hooks[0]: missing matcher, name`
- **Test:** `scripts/agent-harness/hooks-projection.test.mjs` › "a PreToolUse hook with no matcher is refused as missing it, in the words it always used"

#### Scenario: the hook runs the reaper

- **GIVEN** an injected spawn answering a listing with one candidate
- **WHEN** the session-start script runs
- **THEN** it listed twice, ended that tree, printed the total line alone and returned 0
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "the session hook runs the reaper in kill mode, quiet, against the real core"

#### Scenario: the reaper fails

- **GIVEN** a reaper that throws, one that exits 1 and one that never ends
- **WHEN** the session-start script runs each
- **THEN** each prints one stderr line and returns 0
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "a reaper that throws, fails or hangs prints one line to stderr and the hook exits 0"

#### Scenario: a hung reaper in a process of its own

- **GIVEN** a process that runs the hook over a reaper whose promise never settles
- **WHEN** the bound passes
- **THEN** the process prints its one line and exits 0, never Node's unsettled-await exit 13
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "a hung reaper still lets the hook process exit 0 with its one line"

### Requirement: REAP-10 — A child stopped at its bound takes its tree with it

`runBounded` SHALL run a command with a time bound and, at the bound, end the child's whole tree
with `signalProcessTree` (`taskkill /T /F` on Windows, the child's signal on POSIX), release its
pipes and read as timed out; the worktree pruner's `git fetch --prune` runs through it, and a
fetch that fails reports git's stderr, else the spawn's error, else its exit code.

**Evidence:** `scripts/agent-harness/reaper/bounded-child.mjs:29-78`, `scripts/prune-worktrees.mjs:168-192`

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

#### Scenario: a silent fetch failure

- **GIVEN** a fetch that exits 128 with nothing on stderr, and one that never started
- **WHEN** the pruner builds its error
- **THEN** it names `exited 128` and the spawn's error, never `undefined`
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fetch that fails with nothing on stderr names its error or its exit code, never undefined"

### Requirement: REAP-11 — One killing reaper at a time

A reaper run with `--kill` SHALL first create its lock file under the OS temp directory
exclusively, with a token unique to that acquisition, and exit 0 at once, ending nothing and
saying so, when another reaper holds it. A lock older than 30 s SHALL be taken over only under an
exclusive guard file beside it, checked again under that guard, so that two runs that find the
same stale lock never both take it. A guard older than 30 s, left by a reaper that died holding
it, SHALL be removed by the run that finds it only while it still holds what that run read, and
that run takes nothing. The run SHALL release its lock however it ends, removing it only while it
still holds its own token, and a dry run takes none.

**Evidence:** `scripts/agent-harness/reaper/lock.mjs:23-110`, `scripts/agent-harness/reaper/reap.mjs:250-257`,
`scripts/agent-harness/reaper/reap.mjs:265-330`

#### Scenario: the lock is held

- **GIVEN** a lock file another reaper wrote a moment ago
- **WHEN** the reaper runs with `--kill --quiet`
- **THEN** it spawns nothing, prints that another reaper holds the lock and exits 0
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a second reaper finds the lock and exits 0 at once, ending nothing"

#### Scenario: a stale lock

- **GIVEN** a lock file last written 31 s ago
- **WHEN** the reaper runs with `--kill --quiet`
- **THEN** it takes the lock, ends the trees and removes the lock
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a lock older than 30 s is a reaper that died, and is taken over"

#### Scenario: two runs find the same stale lock

- **GIVEN** a stale lock, and a second run that takes it over after the first run read it as
  stale
- **WHEN** the first run goes on
- **THEN** it takes nothing, and the lock still holds the second run's token
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "two runs that find the same stale lock never both take it"

#### Scenario: the release after a takeover

- **GIVEN** a run whose lock went stale and was taken over by a later run
- **WHEN** the first run releases its lock
- **THEN** the later run's lock stays, and the later run's own release removes it
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a release leaves a lock a later run took over"

#### Scenario: a guard left by a reaper that died

- **GIVEN** a stale lock and a guard last written 31 s ago
- **WHEN** a run finds them, and then another run comes
- **THEN** the first removes the guard and takes nothing, and the next one takes the lock
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a guard left by a reaper that died is removed, and the next run takes the lock"

#### Scenario: a stale guard replaced

- **GIVEN** a stale guard that another run replaces with its own after this run read it
- **WHEN** this run goes on
- **THEN** the other run's guard stays, and this run takes nothing
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a stale guard is removed only while it holds what the run read"

#### Scenario: two real processes

- **GIVEN** a process that holds the lock until it is told to release, a lock made stale, and a
  second process that takes it over
- **WHEN** the first process releases
- **THEN** the lock still holds the second process's token
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a reaper process that releases late leaves the lock another process took over"

#### Scenario: a dry run

- **GIVEN** a lock file another reaper holds
- **WHEN** the reaper runs as a dry run
- **THEN** it reports its plan as usual
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run takes no lock"

### Requirement: REAP-12 — Each candidate is read again right before its kill

A reaper run with `--kill` SHALL list the processes again right before its kills and leave, with
its reason, every candidate whose root pid is gone or now names a process with another start
time, ending only the candidates whose identity held, since a platform tree kill follows a reused
pid. Of each such tree it SHALL hand the kill only the pids still listed with the start time the
plan read, with those start times, so that neither a per-pid taskkill nor a POSIX signal names a
pid a newer process took.

**Evidence:** `scripts/agent-harness/reaper/reap.mjs:132`, `scripts/agent-harness/reaper/reap.mjs:191-248`,
`scripts/agent-harness/reaper/platform.mjs:151-154`, `scripts/agent-harness/reaper/platform.mjs:198-265`

#### Scenario: a reused pid by the kill

- **GIVEN** two candidates, the root of one ended and its pid taken by a newer process by the time
  of the kill
- **WHEN** the reaper runs with `--kill`
- **THEN** it ends the other one only, prints the first as left with its reason and exits 0
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a candidate whose pid names another process by its kill is left, and the rest are ended"

#### Scenario: a reused pid inside a tree

- **GIVEN** a candidate ended pid by pid on Windows, one of whose pids below its root a newer
  process has taken by the time of the kill
- **WHEN** the reaper runs with `--kill`
- **THEN** its taskkill names every pid of the tree but that one, and the tree reads as ended
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a tree ended pid by pid leaves a pid that names another process by its kill"
