# Delta: harness/process-reaper

> **Change:** `2026-11-25-reaper-fixes`

## MODIFIED Requirements

### Requirement: REAP-02 — An orphan is a process its parent no longer holds

The reaper SHALL read a process as an orphan when its parent pid names no listed process, or
names one that started after it (a pid reused); on POSIX also when its parent is pid 1 or the
user's subreaper (`systemd --user`, a WSL `/init`); a parent whose start time, or whose child's,
cannot be read holds its child. On POSIX every start time SHALL be read in UTC, `ps` running under
`TZ=UTC`, which a clock change does not move, so that a child started in the hour a clock falls
back never reads as older than its parent.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: the hour the clock falls back

- **GIVEN** a New York machine at 07:00 UTC on 2026-11-01, where a session started at 05:50 UTC,
  the first 01:50, and its MCP server at 06:10 UTC, the second 01:10
- **WHEN** the reaper lists and plans
- **THEN** each start time reads at its UTC time, the session holds its server, and there is no
  candidate
- **Test:** `scripts/agent-harness/reaper/clock-change.test.mjs` › "in the hour the clock falls back, a live child never reads as older than its parent"

### Requirement: REAP-03 — Only an orphan of a family is ended, by its executable and script

The reaper SHALL match a family against a process's entry alone: its own executable path and,
for an interpreter (node, python), the script it runs, its first argument that is not a flag
(`-m <module>` for python), with the arguments after it; never against text anywhere else in its
command line. It SHALL end an orphan whose entry matches a family that is not a wrapper, together
with every process descended from it, and never an orphan outside every family. The families are
one-shot runs: `turbo run dev` or `start`, the turbo daemon, `vitest` without `run`,
`tsc --watch`, tsserver and the dev servers (`next dev`, `expo start`, metro) match none. A node
process in watch mode, one whose flags before its script name `--watch`, `--watch=<value>`,
`--watch-path <path>`, `--watch-path=<path>` or `--watch-preserve-output`, SHALL match no family,
a wrapper included,
`--watch-path` taking the next argument as its value; a candidate tree that holds one SHALL be
kept, with its reason.

**Evidence:** written at apply time, when the code exists.

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
  `--watch=true`, `--watch-path <path>`, `--watch-path=<path>` or `--watch-preserve-output`,
  beside one-shot runs of each family
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

- **GIVEN** node command lines with `--watch`, `--watch=true`, `--watch-path <path>`,
  `--watch-path=<path>` and `--watch-preserve-output` before a tsc script, and one with `--watch`
  after its script
- **WHEN** the reaper reads each entry
- **THEN** the first five read as watch mode with the tsc script, `--watch-path` taking the next
  argument as its value, and the last does not
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a node process in watch mode reads as watch mode, and --watch-path takes the next argument as its value"

### Requirement: REAP-07 — A tree ends the way its platform ends one

The reaper SHALL list processes with `Get-CimInstance Win32_Process` through `powershell` on
Windows and `ps -eo pid=,ppid=,lstart=,rss=,args=` under `LC_ALL=C` and `TZ=UTC` on POSIX,
reading each POSIX start time as the UTC time its `lstart` names (`Wed Nov 25 12:03:39 2026`), so
that it is the same in every listing and never repeats when a clock falls back, and one that does
not parse as unreadable; that one start time gives a process its age, its order against its parent
and its identity. It SHALL end a tree with `taskkill /PID <pid> /T /F` on Windows, pid by pid
without `/T` when an older process names a pid of the tree as its parent, and on POSIX with SIGTERM
to every pid of the tree, then, after 2 s, a second listing and SIGKILL only to each pid still
listed with the start time the plan read; when that listing fails, returns no process or the bound
has run out, it SHALL send no SIGKILL and report each tree it signalled as not ended, with the
reason.

**Evidence:** written at apply time, when the code exists.

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
- **THEN** `ps` ran with `lstart` under `LC_ALL=C`, each start time is the UTC time its `lstart`
  names, the same in both listings, and the unparsed one is null
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX the listing is read from ps under LC_ALL=C, each start time from its lstart read as UTC"

#### Scenario: ps runs in UTC

- **GIVEN** an injected spawn that records the environment of each command
- **WHEN** the reaper lists the processes on POSIX, then on Windows
- **THEN** `ps` ran with `TZ=UTC` and `LC_ALL=C`, and powershell under its own environment
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX ps runs with TZ=UTC in its env, so every lstart it prints is UTC"

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

#### Scenario: a second listing that returns no process

- **GIVEN** a tree that got its SIGTERM, then a second listing that parses to no process
- **WHEN** the reaper ends it
- **THEN** it sends no SIGKILL and reports the tree as not ended, since the second listing returned
  no process
- **Test:** `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX a listing before SIGKILL that returns no process reports the tree as not ended"

### Requirement: REAP-11 — One killing reaper at a time

A reaper run with `--kill` SHALL first create its lock file under the OS temp directory
exclusively, with a token unique to that acquisition, and exit 0 at once, ending nothing and
saying so, when another reaper holds it; a lock gone by the time the run reads it SHALL be created
again, never taken over. A lock older than 30 s SHALL be taken over only under an exclusive guard
file beside it, and removed under that guard only while it still holds the bytes the run read, so
that two runs never both take it. A guard older than 30 s, left by a reaper that died holding
it, SHALL be removed by the run that finds it only while it still holds what that run read, and
that run takes nothing. The run SHALL release its lock however it ends, removing it only while it
still holds its own token, and a dry run takes none.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: a lock released during a takeover

- **GIVEN** a held lock its owner releases right after a run found it, and another run that
  creates a fresh lock while that run goes on
- **WHEN** the first run finishes
- **THEN** at most one of the two holds the lock
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a lock released and re-created during a takeover is never held twice"

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

**Evidence:** written at apply time, when the code exists.

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
