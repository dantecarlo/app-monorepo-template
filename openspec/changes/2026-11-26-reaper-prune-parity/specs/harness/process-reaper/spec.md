# Delta: harness/process-reaper

> **Change:** `2026-11-26-reaper-prune-parity`

## ADDED Requirements

### Requirement: REAP-14 — A worktree git has unregistered counts as removed, and its leftover folder is retried

When `git worktree remove` fails for a worktree, the pruner SHALL read the registered worktrees
again (`git worktree list --porcelain`). A worktree git still lists, or a list git cannot read,
is kept as `git could not remove it` with git's message, as before. A worktree git no longer
lists, because git deleted its `.git` file and its registration before it failed, as at a file
another process holds on Windows, counts as removed, and the folder git left is removed through
`removePath` (`@app/tooling/remove-path`) in four tries, waiting 250 ms, then 500 ms, then 750 ms
between two tries, never through `rmSync`'s `force: true` and never with
`git worktree remove --force`; a junction or a symbolic link in it is removed as the link and its
target is never entered. A folder that stays after the fourth try is the residue: the removal line
names it, with the error of the last try, as `; its directory stays: <path>: <error>`, and the
run's exit code is unchanged. The branch is deleted after the folder, only while its tip is still
the commit it was judged at, whether or not the folder stayed.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a worktree git unregisters before its removal fails

- **GIVEN** a merged worktree whose `git worktree remove` deletes its `.git` file and its
  registration and then exits 1
- **WHEN** the pruner runs
- **THEN** the worktree is counted as removed, its folder and its branch are gone, and no residue
  is named
- **Test:** `scripts/prune-worktrees.test.mjs` › "a worktree git unregisters before its removal fails is removed, its folder finished"

#### Scenario: a leftover tried again

- **GIVEN** a leftover folder whose removal fails twice and then succeeds, with an injected
  `remove` and `wait`
- **WHEN** the pruner removes the leftover
- **THEN** it tried three times, waited 250 ms and then 500 ms, and reports no residue
- **Test:** `scripts/prune-worktrees.test.mjs` › "a leftover delete that fails partway is tried again until the directory goes"

#### Scenario: a leftover that stays

- **GIVEN** a leftover folder whose removal fails every time
- **WHEN** the pruner removes the leftover
- **THEN** it tried four times, waited 250, 500 and 750 ms, and returns the folder's path with the
  last error as the residue, and the removal line prints `its directory stays:` with it
- **Test:** `scripts/prune-worktrees.test.mjs` › "a leftover that stays after every try is named by its path"

#### Scenario: a directory released between tries

- **GIVEN** a worktree folder a process holds when git fails and releases before the third try
- **WHEN** the pruner runs
- **THEN** the folder goes whole, the branch is deleted and the removal line names no residue
- **Test:** `scripts/prune-worktrees.test.mjs` › "a held directory released between tries goes whole, with its branch"

#### Scenario: a worktree git still lists

- **GIVEN** a worktree whose `git worktree remove` fails and which git still lists
- **WHEN** the pruner runs
- **THEN** it is kept with git's message and its folder and branch stay
- **Test:** `scripts/prune-worktrees.test.mjs` › "a removal git refuses is kept with the message git gave"

#### Scenario: a junction in the leftover

- **GIVEN** a leftover folder holding a junction to a folder outside it and one whose target is gone
- **WHEN** the pruner removes it
- **THEN** the folder goes, and the target of the first junction is untouched
- **Test:** `scripts/prune-worktrees.test.mjs` › "a left directory goes, and a junction in it is not followed"

### Requirement: REAP-15 — Each removal is announced before it starts

A real pruner run SHALL print `prune-worktrees: removing <path> (<branch>)` on its own line,
`--quiet` included, before it asks git to remove a worktree, so that a run ended inside the
removal leaves it as its last line; a dry run prints none. A run that fails after a removal was
announced, and has not completed one, SHALL end with `a removal had started; the last "removing"
line above names it` in the place of `nothing was removed`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the announcement

- **GIVEN** a merged worktree
- **WHEN** the pruner runs
- **THEN** the `removing` line for that worktree is printed before its `removed` line, and a
  worktree git refuses is announced before it is tried
- **Test:** `scripts/prune-worktrees.test.mjs` › "each removal is announced before git removes it"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a removal git refuses is announced before it is tried"

#### Scenario: a dry run announces nothing

- **GIVEN** the same worktree
- **WHEN** the pruner runs with `--dry-run`
- **THEN** it prints no `removing` line
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run announces no removal"

#### Scenario: a failure after an announcement

- **GIVEN** a run that announced a removal and then fails with none completed
- **WHEN** it builds its failure line
- **THEN** the line says a removal had started and points at the `removing` line, never that
  nothing was removed, and the run exits 1
- **Test:** `scripts/prune-worktrees.test.mjs` › "a failure after a removal started does not say nothing was removed"

### Requirement: REAP-16 — The worktrees it kept are listed by age

Outside `--quiet`, the pruner SHALL print, after its decision lines and before the main
checkout's line, the heading `prune-worktrees: worktrees kept, by the age of their last commit,
oldest first:` and one line for each kept worktree whose HEAD commit time git reports, oldest
first: the whole days since that commit, right-aligned in four columns, then `d`, its path, its
branch and its reason. The main checkout and the worktree the command runs in are left out, and
no heading is printed when no line remains. The commit times are read with one
`git log --no-walk=unsorted --ignore-missing` over the HEADs `git worktree list --porcelain`
names; a log git cannot run leaves the list out. A dry run prints the list too.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the list

- **GIVEN** three kept worktrees whose last commits are 2, 40 and 9 days old, the main checkout
  and the current worktree
- **WHEN** the report is built
- **THEN** the list names the three, the 40-day one first, and neither the main checkout nor the
  current worktree
- **Test:** `scripts/prune-worktrees.test.mjs` › "the kept worktrees are listed by the age of their last commit, oldest first"

#### Scenario: a real run, and --quiet

- **GIVEN** a clone with one worktree the pruner keeps
- **WHEN** the pruner runs, and again with `--quiet`
- **THEN** the first prints the list with that worktree and the second prints no list
- **Test:** `scripts/prune-worktrees.test.mjs` › "a real run lists each kept worktree by its age, and --quiet does not"

### Requirement: REAP-17 — One real prune at a time

A real pruner run SHALL take `takeLock` (REAP-11) at `prune-worktrees.lock` in the repository's
common git directory before it runs `git fetch`, and release it however it ends. A run that finds
the lock held SHALL print `prune-worktrees: another prune of <root> holds <lock path>; this run
removes nothing.`, remove and move nothing and exit 0. A dry run SHALL take no lock and print its
plan whoever holds it. A run started from inside a prune (`PRUNE_WORKTREES_RUNNING` set) still
exits before the lock.

**Evidence:** written at apply time, when the code exists.

#### Scenario: another prune holds the lock

- **GIVEN** a lock file a running process holds in the common git directory
- **WHEN** the pruner runs
- **THEN** it prints one line naming the lock, removes nothing and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "a run that finds another prune holding the lock prints one line, exits 0 and removes nothing"

#### Scenario: the lock is released

- **GIVEN** a merged worktree
- **WHEN** a real run ends
- **THEN** the lock file is gone
- **Test:** `scripts/prune-worktrees.test.mjs` › "a real run releases the lock it took"

#### Scenario: a dry run

- **GIVEN** a lock another prune holds
- **WHEN** the pruner runs with `--dry-run`
- **THEN** it prints its plan as usual
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run while another prune holds the lock still prints its plan"

### Requirement: REAP-18 — A folder a removal left under the worktree root is finished

The pruner SHALL read the worktree root, `<main checkout parent>/<main checkout name>-worktrees/`,
for orphan folders: a directory directly under it, a link excepted, that holds no `.git` and that
no registered worktree is at. It SHALL finish one, deleting the folder and then its branch, only
when its last write is more than 10 minutes old, exactly one local branch has its name as the last
segment of its path, no registered worktree sits inside it, that branch is checked out in no
registered worktree and its tip is reachable from the default branch; every other orphan folder is
kept and printed with its reason (no branch, several branches, a worktree inside, checked out,
not merged, written in the last 10 minutes). Right before a delete it SHALL read the registered
worktrees again and keep the folder, deleting nothing, when git cannot list them, a worktree sits
inside the folder, the folder is registered itself or it holds a `.git` by then. The folder is
deleted as REAP-14 deletes a leftover and announced as REAP-15 announces a removal, as `removing
orphan folder <path> (<branch>)`; its branch goes only once the folder is gone, at the tip it was
judged at, and a folder that stays keeps its branch and is named. Nothing outside the worktree
root is read for orphans or deleted as one. Orphan folders are finished last, after the main
checkout's fast-forward and its install, and a dry run names each it would finish and deletes
nothing.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a merged orphan folder

- **GIVEN** a folder under the worktree root with no `.git` and no registration, older than 10
  minutes, whose one matching branch is merged
- **WHEN** a run finishes orphan folders
- **THEN** it prints `removing orphan folder` first, deletes the folder and then the branch
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder whose branch is merged goes with its branch, announced first"

#### Scenario: a dry run

- **GIVEN** the same folder
- **WHEN** the pruner runs with `--dry-run --finish-orphans`
- **THEN** it names the folder it would finish and deletes nothing
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run names the orphan folder it would finish and deletes nothing"

#### Scenario: a folder that is kept

- **GIVEN** orphan folders with no matching branch, with two, whose branch is checked out, not
  merged, or written a minute ago
- **WHEN** a run finishes orphan folders
- **THEN** each is kept, named with its reason, and nothing is deleted
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder is kept and named for each reason that keeps it"

#### Scenario: a folder that holds a registered worktree

- **GIVEN** an orphan folder with a registered worktree inside it, in the dry run
- **WHEN** the pruner judges it
- **THEN** it is kept as holding another registered worktree
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run judges an orphan folder that holds a registered worktree as kept"

#### Scenario: read again before the delete

- **GIVEN** an orphan folder judged finishable, and then a worktree registered inside it, the
  folder registered itself, a `.git` written in it, or a worktree list git cannot read
- **WHEN** the run reaches its delete
- **THEN** the folder is kept and nothing is deleted
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder that holds a worktree registered by the time of its delete is kept, and nothing is deleted"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder registered as a worktree by the time of its delete is kept, and nothing is deleted"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder that holds a .git by the time of its delete is kept, and nothing is deleted"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder whose worktree list git cannot read again is kept, and nothing is deleted"

#### Scenario: only the worktree root

- **GIVEN** a folder beside the worktree root whose name matches a merged branch, a registered
  worktree under the root with no `.git`, a folder under it that holds a `.git`, and a junction
  under it
- **WHEN** a run finishes orphan folders
- **THEN** none is deleted, and the junction's target stays
- **Test:** `scripts/prune-worktrees.test.mjs` › "a folder outside the worktree root is never touched, even with a merged branch"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a registered worktree under the worktree root is no orphan, even with no .git"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a folder under the worktree root that holds a .git is no orphan, and stays"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a junction under the worktree root is no orphan folder, and its target stays"

#### Scenario: a folder that stays

- **GIVEN** an orphan folder whose delete fails every try
- **WHEN** the run finishes it
- **THEN** its branch stays and the line names the folder as staying
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder that stays keeps its branch and is named"

#### Scenario: the order

- **GIVEN** a main checkout behind its origin and a finishable orphan folder
- **WHEN** a run finishes orphan folders
- **THEN** the main checkout is fast-forwarded before the folder is deleted
- **Test:** `scripts/prune-worktrees.test.mjs` › "the main checkout is fast-forwarded before any orphan folder is deleted"

### Requirement: REAP-19 — Orphan folders wait for a first manual run

The pruner SHALL take `--finish-orphans` beside `--dry-run` and `--quiet`, an unknown option still
throwing and naming itself. It SHALL finish orphan folders (REAP-18) only in a real run given
`--finish-orphans` or while the file `prune-finish-orphans.enabled` exists in the repository's
common git directory; otherwise a folder it could finish is kept, with the reason `orphan folders
wait for a first manual run with --finish-orphans`. A real `--finish-orphans` run that leaves none
of the folders it set out to finish on disk, a kept one excepted, SHALL write that file, holding
the time, and print that every run finishes orphan folders from now on with its path; a run that
leaves one on disk writes none, and a dry run writes none. `pnpm worktrees:prune:finish-orphans`
SHALL run the pruner with `--finish-orphans`. `.husky/post-merge` runs the pruner as before, with
`--quiet` alone.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the option

- **GIVEN** `--dry-run`, `--quiet` and `--finish-orphans`, then an unknown option
- **WHEN** the pruner reads its options
- **THEN** the first three are read, and the unknown option throws, naming it
- **Test:** `scripts/prune-worktrees.test.mjs` › "--finish-orphans is read"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an unknown option throws, naming it"

#### Scenario: before the marker

- **GIVEN** a finishable orphan folder and no marker
- **WHEN** the pruner runs without `--finish-orphans`
- **THEN** it keeps the folder, naming the manual run, and deletes nothing
- **Test:** `scripts/prune-worktrees.test.mjs` › "a run before the marker exists reports the orphan folder it could finish and finishes none"

#### Scenario: the first manual run

- **GIVEN** the same folder
- **WHEN** the pruner runs with `--finish-orphans`
- **THEN** it finishes the folder, writes the marker and says every run finishes from now on
- **Test:** `scripts/prune-worktrees.test.mjs` › "a --finish-orphans run that finishes every orphan folder it could writes the marker"

#### Scenario: a folder left on disk

- **GIVEN** an orphan folder whose delete fails
- **WHEN** the pruner runs with `--finish-orphans`
- **THEN** it writes no marker
- **Test:** `scripts/prune-worktrees.test.mjs` › "an orphan folder finished with its folder left on disk withholds the marker"

#### Scenario: after the marker

- **GIVEN** the marker, and a new finishable orphan folder
- **WHEN** the pruner runs without `--finish-orphans`
- **THEN** it finishes the folder with its branch
- **Test:** `scripts/prune-worktrees.test.mjs` › "once the marker exists a plain run finishes a new orphan folder with its branch"

#### Scenario: the package script

- **GIVEN** the root `package.json`
- **WHEN** it is read
- **THEN** `worktrees:prune:finish-orphans` runs `node scripts/prune-worktrees.mjs --finish-orphans`
- **Test:** `scripts/prune-worktrees.test.mjs` › "the root package runs the first manual orphan run from worktrees:prune:finish-orphans"

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
- **Test:** `scripts/agent-harness/reaper/lock.test.mjs` › "a run that finds a takeover under way takes nothing and leaves the lock"

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
