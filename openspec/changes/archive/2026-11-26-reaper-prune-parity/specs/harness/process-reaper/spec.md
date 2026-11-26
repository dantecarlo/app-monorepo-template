# Delta: harness/process-reaper

> **Change:** `2026-11-26-reaper-prune-parity`

## MODIFIED Requirements

### Requirement: REAP-03 — Only an orphan of a family is ended, by its executable and script

The reaper SHALL match a family against a process's entry alone: its own executable path and,
for an interpreter (node, python), the script it runs, its first argument that is not a flag
(`-m <module>` for python), with the arguments after it; never against text anywhere else in its
command line. Inline code is no script, whether its flag takes the code as the next argument
(`-c`, `-e`, `-p`, `--eval`, `--print`) or carries it attached (`--eval=<code>`, `--print=<code>`,
`-c<code>`, `-e<code>`, `-p<code>`), so an argument after it matches no family. It SHALL end an
orphan whose entry matches a family that is not a wrapper, together with every process descended
from it, and never an orphan outside every family. The families are one-shot runs: `turbo run dev`
or `start`, the turbo daemon, `vitest` without `run`, `tsc --watch`, tsserver and the dev servers
(`next dev`, `expo start`, metro) match none. A node process in watch mode, one whose flags before
its script name `--watch`, `--watch=<value>`, `--watch-path <path>` or `--watch-path=<path>`, SHALL
match no family, a wrapper included, `--watch-path` taking the next argument as its value; a flag
that only starts like one, `--watch-preserve-output` among them, starts no watch mode and is
skipped like any other flag; a candidate tree that holds a process in watch mode SHALL be kept,
with its reason.

**Evidence:** `.agents/contracts/process-reaper.json:5-142`,
`scripts/agent-harness/reaper/plan.mjs:41-65`, `scripts/agent-harness/reaper/plan.mjs:81-173`,
`scripts/agent-harness/reaper/plan.mjs:213-225`, `scripts/agent-harness/reaper/plan.mjs:277`,
`scripts/agent-harness/reaper/plan.mjs:293-344`; the lines this change moves are refreshed at
apply time.

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

#### Scenario: inline code with its value attached

- **GIVEN** orphans `node --eval=<code>`, `node --print=<code>`, `node -e<code>`, `node -p<code>`
  and `python -c<code>`, each followed by a vitest script
- **WHEN** the reaper plans
- **THEN** none is a candidate
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "inline code with its value attached is no script, so an argument after it matches no family"

#### Scenario: persistent and watch work

- **GIVEN** orphaned `turbo run dev`, `turbo run start`, the turbo daemon, `vitest --watch`, a bare
  `vitest`, `tsc --watch`, `tsc -w`, tsserver, `next dev`, `expo start`, metro,
  `esbuild --watch --serve`, and a tsc and a vitest run that node runs with `--watch`,
  `--watch=true`, `--watch-path <path>` or `--watch-path=<path>`, beside one-shot runs of each
  family
- **WHEN** the reaper plans
- **THEN** only the one-shot runs are candidates
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "persistent and watch work is never a candidate, one-shot runs are"

#### Scenario: a flag that only starts like a watch flag

- **GIVEN** an orphaned vitest run that node runs with `--watch-preserve-output` before its script
- **WHEN** the reaper plans
- **THEN** it is a candidate of the vitest family
- **Test:** `scripts/agent-harness/reaper/plan.test.mjs` › "a flag that only starts like --watch is no watch mode, so the run it belongs to is ended"

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
  code, with its value separate or attached, is no script
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "the entry of a process is its executable and its script, the flags before it skipped"

#### Scenario: the entry of a process in watch mode

- **GIVEN** node command lines with `--watch`, `--watch=true`, `--watch-path <path>` and
  `--watch-path=<path>` before a tsc script, and one with `--watch` after its script
- **WHEN** the reaper reads each entry
- **THEN** the first four read as watch mode with the tsc script, `--watch-path` taking the next
  argument as its value, and the last does not
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a node process in watch mode reads as watch mode, and --watch-path takes the next argument as its value"

#### Scenario: the entry of a process with a flag that only starts like a watch flag

- **GIVEN** a node command line with `--watch-preserve-output` before a tsc script
- **WHEN** the reaper reads its entry
- **THEN** it reads as no watch mode, with the tsc script
- **Test:** `scripts/agent-harness/reaper/contract.test.mjs` › "a node flag that only starts with --watch is skipped, and reads as no watch mode"

### Requirement: REAP-10 — A child stopped at its bound takes its tree with it

`runBounded` SHALL run a command with a time bound and, at the bound, end the child's whole tree
with `signalProcessTree` (`taskkill /T /F` on Windows, the child's signal on POSIX), release its
pipes and read as timed out. The worktree pruner runs its fetch and its install through it
(PRUNE-02 and PRUNE-10 of harness/worktree-pruner).

**Evidence:** `scripts/agent-harness/reaper/bounded-child.mjs:29-78`

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

### Requirement: REAP-11 — One killing reaper at a time

A reaper run with `--kill` SHALL first create its lock file under the OS temp directory
exclusively, holding its pid on the first line and a token unique to that acquisition on the
second, and exit 0 at once, ending nothing and saying so, when another reaper holds it; a lock
gone by the time the run reads it SHALL be created again, never taken over. A lock SHALL be taken
over only when its holder has ended, that is when no process runs with the pid its first line
names (`process.kill(pid, 0)` answers ESRCH), or when it is older than one hour: a holder that
still runs keeps its lock however long its run stalls, and a pid the run may not signal, or a lock
that names none, reads as running. A takeover SHALL run under an exclusive guard file beside the
lock, read the same way: the run that creates the guard checks the lock can still be taken over
and removes it only while it still holds the bytes the run read, so that two runs never both take
it. A guard whose holder has ended, or that is older than one hour, left by a reaper that died
holding it, SHALL be removed by the run that finds it only while it still holds what that run
read, and that run takes nothing. The run SHALL release its lock however it ends, removing it only
while it still holds its own token, and a dry run takes none. Every removal goes through
`removePath` (`@app/tooling/remove-path`), which counts a path already gone (ENOENT) as removed and
rethrows every other failure, never through `rmSync`'s `force: true`. Whether a holder runs is
injected (`holderRunning`), as `fs`, `now` and `token` are.

**Evidence:** `scripts/agent-harness/reaper/lock.mjs:23-125`,
`scripts/agent-harness/reaper/reap.mjs:252-259`, `scripts/agent-harness/reaper/reap.mjs:267-332`,
`packages/tooling/src/remove-path.mjs:23-29`; the lines this change moves are refreshed at apply
time.

#### Scenario: the lock is held

- **GIVEN** a lock file another reaper wrote a moment ago
- **WHEN** the reaper runs with `--kill --quiet`
- **THEN** it spawns nothing, prints that another reaper holds the lock and exits 0
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a second reaper finds the lock and exits 0 at once, ending nothing"

#### Scenario: a lock whose holder ended

- **GIVEN** a lock file whose first line names a pid no process runs with
- **WHEN** the reaper runs with `--kill --quiet`
- **THEN** it takes the lock, ends the trees and removes the lock
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a lock whose holder has ended is a reaper that died, and is taken over"

#### Scenario: a holder that stalls

- **GIVEN** a lock written 31 s ago whose holder still runs
- **WHEN** a run takes the lock
- **THEN** it takes nothing, and the lock stays
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a lock whose holder still runs is not taken over before an hour, however long its run stalls"

#### Scenario: a lock held for over an hour

- **GIVEN** a lock written 61 minutes ago whose pid a process runs with
- **WHEN** a run takes the lock
- **THEN** it takes the lock over
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a lock held for over an hour is taken over even when a process holds its pid"

#### Scenario: reading whether a holder runs

- **GIVEN** a lock naming this process's pid, one naming a pid that ended, one naming a pid the
  run may not signal and one naming none
- **WHEN** the lock reads whether each holder runs
- **THEN** the first, third and last read as running and the second as ended
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a holder is read as running from the pid its lock names, and a lock without one as running"

#### Scenario: two runs find the same lock

- **GIVEN** a lock whose holder ended, and a second run that takes it over after the first run read
  its holder as ended
- **WHEN** the first run goes on
- **THEN** it takes nothing, and the lock still holds the second run's token
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "two runs that find the same lock's holder ended never both take it"

#### Scenario: a lock released during a takeover

- **GIVEN** a held lock its owner releases right after a run found it, and another run that
  creates a fresh lock while that run goes on
- **WHEN** the first run finishes
- **THEN** at most one of the two holds the lock
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a lock released and re-created during a takeover is never held twice"

#### Scenario: the release after a takeover

- **GIVEN** a run whose lock a later run took over after an hour
- **WHEN** the first run releases its lock
- **THEN** the later run's lock stays, and the later run's own release removes it
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a release leaves a lock a later run took over"

#### Scenario: a guard left by a reaper that died

- **GIVEN** a lock and a guard whose holders ended
- **WHEN** a run finds them, and then another run comes
- **THEN** the first removes the guard and takes nothing, and the next one takes the lock
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a guard left by a reaper that died is removed, and the next run takes the lock"

#### Scenario: a guard whose holder runs

- **GIVEN** a lock whose holder ended and a guard whose holder runs
- **WHEN** a run takes the lock
- **THEN** it takes nothing, and the lock and the guard stay
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a run that finds a takeover under way by a holder that runs takes nothing and leaves the lock"

#### Scenario: a guard replaced

- **GIVEN** a guard whose holder ended that another run replaces with its own after this run read
  it
- **WHEN** this run goes on
- **THEN** the other run's guard stays, and this run takes nothing
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a guard whose holder ended is removed only while it holds what the run read"

#### Scenario: two real processes

- **GIVEN** a process that holds the lock until it is told to release, a lock made older than an
  hour, and a second process that takes it over
- **WHEN** the first process releases
- **THEN** the lock still holds the second process's token
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a reaper process that releases late leaves the lock another process took over"

#### Scenario: a removal that fails for another reason than a missing file

- **GIVEN** a lock the run holds and a removal that fails with a code other than ENOENT
- **WHEN** the run releases it
- **THEN** the failure is raised, not swallowed
- **Test:** Not covered — `removePath` itself is tested in packages/tooling, but no reaper test makes
  the lock's removal fail

#### Scenario: a dry run

- **GIVEN** a lock file another reaper holds
- **WHEN** the reaper runs as a dry run
- **THEN** it reports its plan as usual
- **Test:** `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run takes no lock"
