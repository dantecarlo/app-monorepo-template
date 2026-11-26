# Delta: harness/worktree-pruner

> **Change:** `2026-11-26-reaper-prune-parity`
> **ID prefix:** `PRUNE`

## ADDED Requirements

### Requirement: PRUNE-01 — Where the pruner runs, and with which options

The pruner SHALL take `--dry-run`, `--quiet` and `--finish-orphans`, and throw, naming it, on any
other option. A run that finds `PRUNE_WORKTREES_RUNNING` set, the variable every git it runs
carries so that the post-merge its own fast-forward fires does not start it again, SHALL exit 0 at
once and print nothing. In a repository with no `origin` remote it SHALL print one line saying so
and exit 0. Outside a git repository it SHALL exit 1 and say nothing was removed. `--dry-run`
prints the decisions a real run carries out, removes and moves nothing, and ends with the
`not covered` line that names what it leaves out.

**Evidence:** `scripts/prune-worktrees.detect.mjs:33-39`, `scripts/prune-worktrees.detect.mjs:116-126`,
`scripts/prune-worktrees.detect.mjs:189-208`, `scripts/prune-worktrees.mjs:139`,
`scripts/prune-worktrees.mjs:660-672`, `scripts/prune-worktrees.mjs:722-766`

#### Scenario: the options

- **GIVEN** `--dry-run` and `--quiet`, then an unknown option
- **WHEN** the pruner reads its options
- **THEN** the first two are read, and the unknown option throws, naming it
- **Test:** `scripts/prune-worktrees.test.mjs` › "--dry-run and --quiet are read"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an unknown option throws, naming it"

#### Scenario: the option that finishes orphan folders

- **GIVEN** `--finish-orphans` beside the other two options
- **WHEN** the pruner reads its options
- **THEN** all three are read
- **Test:** `scripts/prune-worktrees.test.mjs` › "--finish-orphans is read"

#### Scenario: a run a prune started

- **GIVEN** `PRUNE_WORKTREES_RUNNING` set
- **WHEN** the pruner runs
- **THEN** it exits 0 and prints nothing
- **Test:** `scripts/prune-worktrees.test.mjs` › "a run started from inside a prune exits 0 at once and prints nothing"

#### Scenario: no origin, and no repository

- **GIVEN** a repository with no `origin` remote, then a folder that is no repository
- **WHEN** the pruner runs in each
- **THEN** the first prints that there is nothing to prune and exits 0, and the second exits 1,
  saying nothing was removed
- **Test:** `scripts/prune-worktrees.test.mjs` › "post-merge exits 0 in a repository with no origin, since there is nothing to prune"
- **Test:** `scripts/prune-worktrees.test.mjs` › "outside a git repository it exits 1 and removes nothing"

#### Scenario: a dry run

- **GIVEN** a clone with a merged worktree
- **WHEN** the pruner runs with `--dry-run` and then for real
- **THEN** the dry run exits 0, names the worktree it would remove, removes nothing, prints the
  decisions the real run then carries out, and ends with what it does not cover
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run exits 0 and names the worktree it would remove"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run removes no worktree, no directory and no branch"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run states the decisions the real run carries out"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run names what it does not cover as its last line"

### Requirement: PRUNE-02 — The fetch is bounded, and a stalled one skips the run

The pruner SHALL start with `git fetch --quiet --prune origin` through `runBounded` (harness/
process-reaper), stopped with every process it started after 30 s or the positive number of
seconds `PRUNE_WORKTREES_FETCH_SECONDS` names, rounded up to whole milliseconds; any other value
of the variable, an empty one included, makes the run throw, naming the variable and the value. A
fetch that is stopped there SHALL skip the prune and the fast-forward, print one line that says
so, `--quiet` included, and exit 0. A fetch that fails SHALL throw git's stderr, else the spawn's
error, else its exit code, never `undefined`.

**Evidence:** `scripts/prune-worktrees.mjs:186-216`, `scripts/prune-worktrees.mjs:660-672`,
`scripts/prune-worktrees.mjs:722-766`, `scripts/prune-worktrees.detect.mjs:41-72`,
`scripts/prune-worktrees.detect.mjs:524-535`

#### Scenario: a fetch that outlasts its bound

- **GIVEN** a clone whose remote never answers, under a short bound
- **WHEN** the pruner runs
- **THEN** it removes and moves nothing, says why and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fetch that outlasts its bound skips the prune and the fast-forward, says why and exits 0"

#### Scenario: the fetch on Windows

- **GIVEN** a clone whose remote runs an ssh command that never answers
- **WHEN** the pruner's fetch is stopped at its bound on Windows
- **THEN** the run skips and exits 0, and the ssh command git started has ended
- **Test:** `scripts/prune-worktrees.test.mjs` › "on Windows a fetch stopped at its bound ends the processes git started"

#### Scenario: a silent fetch failure

- **GIVEN** a fetch that exits 128 with nothing on stderr, and one that never started
- **WHEN** the pruner builds its error
- **THEN** it names `exited 128` and the spawn's error, never `undefined`
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fetch that fails with nothing on stderr names its error or its exit code, never undefined"

#### Scenario: the bound

- **GIVEN** `PRUNE_WORKTREES_FETCH_SECONDS` unset, a positive number, and values that are not one
- **WHEN** the pruner reads it
- **THEN** it bounds the fetch at 30 s or at that number, and throws for the others
- **Test:** `scripts/prune-worktrees.test.mjs` › "the fetch is bound to 30 s unless PRUNE_WORKTREES_FETCH_SECONDS names another positive number"

### Requirement: PRUNE-03 — A worktree is removed only when its branch merged and its upstream is gone

The pruner SHALL keep, with its reason, a worktree that is the main checkout, the one the command
runs in, locked (with the lock's reason), under `.claude/worktrees/`, holding another registered
worktree, on a detached HEAD, on a branch with no upstream, on a branch that tracks the default
branch (the one `origin/HEAD` names), on a branch whose upstream still exists, or on a branch
whose tip is not in the default branch; only one whose branch upstream reads `[gone]` and whose
tip is in the default branch goes on to the checks of PRUNE-04.

**Evidence:** `scripts/prune-worktrees.detect.mjs:165-183`, `scripts/prune-worktrees.detect.mjs:263-288`,
`scripts/prune-worktrees.mjs:218-268`, `scripts/prune-worktrees.mjs:320-352`

#### Scenario: a merged worktree

- **GIVEN** a clean worktree on a merged branch whose upstream is gone
- **WHEN** the pruner runs
- **THEN** its folder and its branch are gone
- **Test:** `scripts/prune-worktrees.test.mjs` › "a merged, clean worktree whose upstream is gone is removed"

#### Scenario: a locked worktree

- **GIVEN** a locked worktree that would otherwise go
- **WHEN** the pruner runs, as a dry run and for real
- **THEN** it is kept with the lock's reason both times
- **Test:** `scripts/prune-worktrees.test.mjs` › "a locked worktree is kept with its lock reason, in the dry run as in the real one"

#### Scenario: a worktree on the default branch, a detached one and the main checkout

- **GIVEN** a worktree whose branch tracks the default branch, a detached worktree and the main
  checkout
- **WHEN** the pruner runs
- **THEN** each is kept
- **Test:** `scripts/prune-worktrees.test.mjs` › "a worktree tracking the default branch itself is kept"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a detached worktree is kept"
- **Test:** `scripts/prune-worktrees.test.mjs` › "the main checkout is kept"

#### Scenario: a worktree inside a merged one

- **GIVEN** a merged worktree that holds another registered worktree
- **WHEN** the pruner runs
- **THEN** the outer worktree is kept and the work of the inner one survives
- **Test:** `scripts/prune-worktrees.test.mjs` › "the work of a worktree nested inside a merged one survives"

### Requirement: PRUNE-04 — A worktree holding work that would be lost is kept

The pruner SHALL keep a worktree that `git status --porcelain --untracked-files=all` shows as
modified or untracked, a line-ending-only difference included and whatever the repository's
`status.showUntrackedFiles`; that holds a tracked file `git ls-files -v` marks skip-worktree or
assume-unchanged; or that holds an ignored file outside what an install, a build or the next
session writes again (`node_modules/`, the build outputs at a root, `.husky/_/` and an `.atl/` that
holds only `skill-registry.md` and `.skill-registry.cache.json`), an env file and anything else
under `.atl/` included. It SHALL read those again just before the removal and keep a worktree that
gained one in the meantime.

**Evidence:** `scripts/prune-worktrees.detect.mjs:138-163`, `scripts/prune-worktrees.detect.mjs:290-360`,
`scripts/prune-worktrees.mjs:270-381`, `scripts/prune-worktrees.mjs:446-458`

#### Scenario: ignored files that are written again

- **GIVEN** a merged worktree whose only ignored files are install and build outputs
- **WHEN** the pruner runs
- **THEN** it is removed
- **Test:** `scripts/prune-worktrees.test.mjs` › "ignored files an install or a build writes do not keep it"

#### Scenario: ignored files nothing writes again

- **GIVEN** a merged worktree holding an ignored file nothing rebuilds, one holding an env file and
  one holding a file under `.atl/`
- **WHEN** the pruner runs
- **THEN** each is kept and its file stays
- **Test:** `scripts/prune-worktrees.test.mjs` › "an ignored file nothing rebuilds keeps the worktree and stays"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an env file keeps the worktree: nothing writes it again"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a file under .atl/ keeps the worktree and stays"

#### Scenario: the skill registry

- **GIVEN** an `.atl/` that holds only the two skill-registry files, then one that holds anything
  more
- **WHEN** the pruner runs
- **THEN** the first does not keep its worktree, and the second keeps it with everything in it
- **Test:** `scripts/prune-worktrees.test.mjs` › "an .atl/ that holds only the two skill-registry files does not keep the worktree"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an .atl/ that holds anything besides the skill-registry files keeps the worktree, and it all stays"

#### Scenario: changes git status compares as bytes

- **GIVEN** a worktree whose file differs only in its line endings, and a repository whose
  `status.showUntrackedFiles` is `no` over an untracked file
- **WHEN** the pruner runs
- **THEN** both worktrees are kept
- **Test:** `scripts/prune-worktrees.test.mjs` › "a file that differs only in its line endings is a local change and keeps the worktree"
- **Test:** `scripts/prune-worktrees.test.mjs` › "status.showUntrackedFiles=no does not hide untracked work"

#### Scenario: a change after the decision

- **GIVEN** a worktree judged removable that gains an ignored file nothing rebuilds before its
  removal, and one that stays clean
- **WHEN** the pruner removes them
- **THEN** the first is kept with its file, and the second goes with its branch
- **Test:** `scripts/prune-worktrees.test.mjs` › "an ignored file written after the decision keeps the worktree, and the file stays"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a worktree still clean just before its removal goes, and its branch with it"

### Requirement: PRUNE-05 — A worktree is removed by plain git, and its branch only at the tip judged

The pruner SHALL remove a worktree with `git -c status.showUntrackedFiles=all worktree remove
<path>`, never with `--force`, and keep it with git's message when git refuses. After it, it
SHALL delete the branch with `git update-ref -d` only while the branch tip is still the commit it
was judged at, and remove the branch's configuration section; a branch that moved since keeps
the commits it gained.

**Evidence:** `scripts/prune-worktrees.mjs:383-452`

#### Scenario: a refusal

- **GIVEN** a worktree git refuses to remove
- **WHEN** the pruner runs
- **THEN** it is kept with the message git gave
- **Test:** `scripts/prune-worktrees.test.mjs` › "a removal git refuses is kept with the message git gave"

#### Scenario: a branch whose tip moved

- **GIVEN** a branch that gained a commit after it was judged
- **WHEN** its worktree is removed
- **THEN** the branch is kept
- **Test:** `scripts/prune-worktrees.test.mjs` › "a branch whose tip moved since it was judged is kept when its worktree goes"

#### Scenario: a branch still at its tip

- **GIVEN** a branch at the tip it was judged at, with configuration
- **WHEN** its worktree is removed
- **THEN** the branch and its configuration are gone
- **Test:** `scripts/prune-worktrees.test.mjs` › "a branch still at its judged tip is deleted with its worktree, and its config with it"

### Requirement: PRUNE-06 — A worktree git has unregistered counts as removed, and its leftover folder is retried

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

### Requirement: PRUNE-07 — Each removal is announced before it starts

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

### Requirement: PRUNE-08 — The worktrees it kept are listed by age

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

### Requirement: PRUNE-09 — The main checkout is fast-forwarded to the default branch, or left with the reason

After every removal the pruner SHALL, when the main checkout is on the default branch, run
`git merge --ff-only` to it, and leave it where it is, saying how far behind it is and why, when
it holds any tracked local change (staged or not, a line-ending-only one included) or git refuses
(a local commit, an untracked file the merge would overwrite); the reason is git's first line that
is not a hint, with the files it lists. A main checkout on another branch is not moved, and one
already at the default branch prints no line. A dry run predicts the refusal from an ancestry
check and a dry run of the checkout (`git read-tree -m -u --dry-run`) against a refreshed copy of
the index, so a file whose timestamp alone changed is no refusal and the checkout's own index and
`index.lock` are left alone. With no `origin/HEAD` the run throws, naming `git remote set-head
origin --auto`, and moves nothing.

**Evidence:** `scripts/prune-worktrees.mjs:136-141`, `scripts/prune-worktrees.mjs:226-244`,
`scripts/prune-worktrees.mjs:459-657`, `scripts/prune-worktrees.detect.mjs:128-135`,
`scripts/prune-worktrees.detect.mjs:360-413`

#### Scenario: a main checkout behind

- **GIVEN** a main checkout on its branch, behind origin
- **WHEN** the pruner runs, and for a default branch of another name
- **THEN** it is fast-forwarded, and the default branch is whatever `origin/HEAD` names
- **Test:** `scripts/prune-worktrees.test.mjs` › "a main checkout on main behind origin is fast-forwarded"
- **Test:** `scripts/prune-worktrees.test.mjs` › "the default branch is origin's, whatever its name"

#### Scenario: a local change

- **GIVEN** a main checkout with a tracked local change the fast-forward would overwrite, one with
  a staged change, and one whose change is on a file the fast-forward does not touch
- **WHEN** the pruner runs
- **THEN** each stays unmoved, with its reason
- **Test:** `scripts/prune-worktrees.test.mjs` › "a local change the fast-forward would overwrite stays, unmoved"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a staged change blocks the fast-forward, and a dry run says so"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a local change to a file the fast-forward does not touch blocks it too"

#### Scenario: a main checkout that cannot be moved

- **GIVEN** a main checkout that diverged, and one on another branch
- **WHEN** the pruner runs
- **THEN** the first is left with git's fatal line, not a hint, and the second is not moved
- **Test:** `scripts/prune-worktrees.test.mjs` › "a main checkout that diverged is left with git's fatal line, not a hint"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a main checkout on another branch is not moved"

#### Scenario: a dry run

- **GIVEN** a main checkout behind its origin, one with an untracked file the fast-forward would
  overwrite, and one with an `index.lock`
- **WHEN** the pruner runs with `--dry-run`
- **THEN** it says it would fast-forward, names git's refusal where there is one, moves nothing,
  and leaves the index and its lock as they were
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run names the fast-forward and does not move the checkout"
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run over an untracked file the fast-forward would overwrite names git's refusal and touches nothing"
- **Test:** `scripts/prune-worktrees.test.mjs` › "an index.lock in the main checkout leaves the dry run's prediction as it was, and stays"

#### Scenario: no origin/HEAD

- **GIVEN** a clone whose `origin/HEAD` is unset
- **WHEN** the pruner runs
- **THEN** it exits 1, names the command that sets it and moves nothing
- **Test:** `scripts/prune-worktrees.test.mjs` › "with no origin/HEAD the default branch is unknown: it exits 1, names the fix and moves nothing"

### Requirement: PRUNE-10 — A fast-forward that changed the lockfile is followed by a bounded install

After a fast-forward it made that changed `pnpm-lock.yaml`, the pruner SHALL run a plain `pnpm
install` in the main checkout (through `cmd.exe` on Windows), through `runBounded`, stopped with
its tree after 120 s or the positive number of seconds `PRUNE_WORKTREES_INSTALL_SECONDS` names,
and read only when such an install is due. An install that fails or is stopped, or a bound that
is not a positive number when one is due, prints one line, `--quiet` included, with the exit code
or the bound and the `pnpm install` to run, and leaves the run's exit code at 0. An install that
leaves `pnpm-lock.yaml` changed, by `git diff --quiet -- pnpm-lock.yaml`, prints one line, `--quiet`
included, offering to commit it on a branch or to run `git restore --source=HEAD -- pnpm-lock.yaml`,
which discards the install's lockfile change, and never `git checkout --`. A dry run says it
would install and installs nothing.

**Evidence:** `scripts/prune-worktrees.mjs:536-605`, `scripts/prune-worktrees.detect.mjs:46-114`,
`scripts/prune-worktrees.detect.mjs:447-496`

#### Scenario: an install after a fast-forward that changed the lockfile

- **GIVEN** a main checkout one commit behind, whose next commit changes `pnpm-lock.yaml`, and a
  `pnpm` on the path that records its arguments
- **WHEN** the pruner runs
- **THEN** it fast-forwards, runs `pnpm install` once in the main checkout, with no other
  argument, says so, prints no rewrite line and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fast-forward that changes pnpm-lock.yaml runs pnpm install"

#### Scenario: an install that rewrites the lockfile

- **GIVEN** the same checkout, and a `pnpm` that rewrites `pnpm-lock.yaml`
- **WHEN** the pruner runs, and again with `--quiet`
- **THEN** each run leaves the rewritten lockfile as it is, prints exactly one line naming it, the
  choice to commit it on a branch and `git restore --source=HEAD -- pnpm-lock.yaml` with "this
  discards the install's lockfile change", and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an install that rewrites pnpm-lock.yaml says so in one line, under --quiet too, and the run exits 0"

#### Scenario: an install that fails or outlasts its bound

- **GIVEN** the same checkout, and a `pnpm` that exits 1, then one that never ends under
  `PRUNE_WORKTREES_INSTALL_SECONDS=1`
- **WHEN** the pruner runs with `--quiet`
- **THEN** it fast-forwards, prints one line with the exit code or the bound and the
  `pnpm install` to run in the main checkout, and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an install that fails or outlasts PRUNE_WORKTREES_INSTALL_SECONDS names the command to run, and the run exits 0"

#### Scenario: the install bound

- **GIVEN** `PRUNE_WORKTREES_INSTALL_SECONDS` unset, `2.5`, empty, `0` and `ten`
- **WHEN** the pruner reads it
- **THEN** it bounds the install at 120 s and 2.5 s, and throws for the other three, naming the
  variable and the value
- **Test:** `scripts/prune-worktrees.test.mjs` › "the install is bound to 120 s unless PRUNE_WORKTREES_INSTALL_SECONDS names another positive number"

#### Scenario: a bound that is not a number, read only when an install is due

- **GIVEN** `PRUNE_WORKTREES_INSTALL_SECONDS` set to `0`, `ten` and empty over a fast-forward that
  leaves `pnpm-lock.yaml` as it was, then to `0` over one that changes it
- **WHEN** the pruner runs each
- **THEN** the first three fast-forward, print exactly the lines a run without the install prints
  and exit 0; the last fast-forwards, runs no `pnpm`, prints the line naming the variable and
  `pnpm install`, and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an invalid PRUNE_WORKTREES_INSTALL_SECONDS is read only when an install is due"

#### Scenario: a dry run

- **GIVEN** the same checkout
- **WHEN** the pruner runs with `--dry-run`
- **THEN** it says it would install after the fast-forward, installs nothing, and its last line
  adds what the install leaves out
- **Test:** `scripts/prune-worktrees.test.mjs` › "a dry run says it would install after a fast-forward that changes pnpm-lock.yaml, and installs nothing"

### Requirement: PRUNE-11 — The report counts what was done, and a failure says how far it got

The pruner SHALL print one line per worktree (a kept one left out under `--quiet`), the main
checkout's line, the install's lines and a summary line that counts the removed and the kept by
reason. A read that fails before anything is removed SHALL exit 1 and say nothing was removed; a
step that fails after a removal SHALL still print the report of what was done, then git's message
and how many worktrees were removed before it, and exit 1.

**Evidence:** `scripts/prune-worktrees.detect.mjs:393-446`, `scripts/prune-worktrees.detect.mjs:498-535`,
`scripts/prune-worktrees.mjs:660-766`

#### Scenario: the summary

- **GIVEN** a clone with one removable worktree and kept ones for several reasons
- **WHEN** the pruner runs
- **THEN** the last line counts the removed and the kept by reason
- **Test:** `scripts/prune-worktrees.test.mjs` › "the summary line counts the removed and the kept by reason"

#### Scenario: quiet

- **GIVEN** one removed worktree and one kept
- **WHEN** the report is built with `--quiet`
- **THEN** it holds the removal and the summary, and no kept line
- **Test:** `scripts/prune-worktrees.test.mjs` › "--quiet prints the removals and the summary, no kept line"

#### Scenario: a failure after the removals

- **GIVEN** a step that fails after worktrees were removed
- **WHEN** the pruner runs
- **THEN** it prints what was removed, then the reason and the count, and exits 1
- **Test:** `scripts/prune-worktrees.test.mjs` › "a step that fails after the removals still reports what was removed, and exits 1"

### Requirement: PRUNE-12 — One real prune at a time

A real pruner run SHALL take `takeLock` (REAP-11 of harness/process-reaper) at `prune-worktrees.lock` in the repository's
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

### Requirement: PRUNE-13 — A folder a removal left under the worktree root is finished

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
deleted as PRUNE-06 deletes a leftover and announced as PRUNE-07 announces a removal, as `removing
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

### Requirement: PRUNE-14 — Orphan folders wait for a first manual run

The pruner SHALL take `--finish-orphans` beside `--dry-run` and `--quiet`, an unknown option still
throwing and naming itself. It SHALL finish orphan folders (PRUNE-13) only in a real run given
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

### Requirement: PRUNE-15 — A local merge or pull runs the pruner, and a failure is seen

`.husky/post-merge` SHALL run `node scripts/prune-worktrees.mjs --quiet` from its own checkout,
so that the worktree the merge ran in survives the post-merge the main checkout's fast-forward
fires; it SHALL exit 0 in a repository with no origin, list no kept line, and fail when the prune
fails, since a post-merge hook never undoes the merge.

**Evidence:** `.husky/post-merge:1-6`

#### Scenario: the hook runs the pruner

- **GIVEN** a clone with a merged worktree, the one the merge ran in
- **WHEN** `post-merge` runs
- **THEN** the merged worktree is removed, the hook exits 0 and prints no kept line
- **Test:** `scripts/prune-worktrees.test.mjs` › "post-merge runs the prune from the main checkout"
- **Test:** `scripts/prune-worktrees.test.mjs` › "post-merge exits 0 and lists no kept line"

#### Scenario: the worktree the command runs in

- **GIVEN** a worktree that runs the pruner, while the main checkout's fast-forward fires its own
  post-merge
- **WHEN** both run
- **THEN** the worktree the command runs in survives
- **Test:** `scripts/prune-worktrees.test.mjs` › "the worktree the command runs in survives the post-merge hook the main checkout's fast-forward fires"

#### Scenario: a prune that fails

- **GIVEN** a repository whose `origin` cannot be fetched
- **WHEN** `post-merge` runs
- **THEN** it exits non-zero, so the failure is seen
- **Test:** `scripts/prune-worktrees.test.mjs` › "post-merge fails when the prune fails, so the failure is seen"
