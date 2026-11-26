# Verify report: 2026-11-26-reaper-prune-parity

> **Verified:** 2026-11-26 at `2d89fdf7`

## Scenarios

Every test below ran green: `pnpm reap:test` (the reaper suite) and `pnpm worktrees:prune:test`
(`node --test scripts/prune-worktrees.test.mjs`). A scenario of PRUNE-01 to PRUNE-05, PRUNE-09 to
PRUNE-11 and PRUNE-15 names a test that existed before this change, written from the code; the
rest were written red first, task by task.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| REAP-03 | the whole tree goes | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan of a family is a candidate with its whole tree" | green |
| REAP-03 | unknown names | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan outside every family is never touched" | green |
| REAP-03 | text in the arguments | `scripts/agent-harness/reaper/plan.test.mjs` › "a family is matched by the executable and its script, never by text in the arguments" | green |
| REAP-03 | inline code with its value attached | `scripts/agent-harness/reaper/plan.test.mjs` › "inline code with its value attached is no script, so an argument after it matches no family" | green |
| REAP-03 | persistent and watch work | `scripts/agent-harness/reaper/plan.test.mjs` › "persistent and watch work is never a candidate, one-shot runs are" | green |
| REAP-03 | a flag that only starts like a watch flag | `scripts/agent-harness/reaper/plan.test.mjs` › "a flag that only starts like --watch is no watch mode, so the run it belongs to is ended" | green |
| REAP-03 | a tree that holds a process in watch mode | `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds a node process in watch mode is kept, with its reason" | green |
| REAP-03 | the entry of a process | `scripts/agent-harness/reaper/contract.test.mjs` › "the entry of a process is its executable and its script, the flags before it skipped" | green |
| REAP-03 | the entry of a process in watch mode | `scripts/agent-harness/reaper/contract.test.mjs` › "a node process in watch mode reads as watch mode, and --watch-path takes the next argument as its value" | green |
| REAP-03 | the entry of a process with a flag that only starts like a watch flag | `scripts/agent-harness/reaper/contract.test.mjs` › "a node flag that only starts with --watch is skipped, and reads as no watch mode" | green |
| REAP-10 | the bound | `scripts/agent-harness/reaper/bounded-child.test.mjs` › "a child that outlasts its bound has its tree ended and reads as timed out" | green |
| REAP-10 | a real tree on Windows | `scripts/agent-harness/reaper/bounded-child.test.mjs` › "on Windows a child stopped at its bound takes the process it started with it" | green |
| REAP-11 | the lock is held | `scripts/agent-harness/reaper/reap.test.mjs` › "a second reaper finds the lock and exits 0 at once, ending nothing" | green |
| REAP-11 | a lock whose holder ended | `scripts/agent-harness/reaper/reap.test.mjs` › "a lock whose holder has ended is a reaper that died, and is taken over" | green |
| REAP-11 | a holder that stalls | `scripts/agent-harness/reaper/lock.test.mjs` › "a lock whose holder still runs is not taken over before an hour, however long its run stalls" | green |
| REAP-11 | a lock held for over an hour | `scripts/agent-harness/reaper/lock.test.mjs` › "a lock held for over an hour is taken over even when a process holds its pid" | green |
| REAP-11 | reading whether a holder runs | `scripts/agent-harness/reaper/lock.test.mjs` › "a holder is read as running from the pid its lock names, and a lock without one as running" | green |
| REAP-11 | two runs find the same lock | `scripts/agent-harness/reaper/lock.test.mjs` › "two runs that find the same lock's holder ended never both take it" | green |
| REAP-11 | a lock released during a takeover | `scripts/agent-harness/reaper/lock.test.mjs` › "a lock released and re-created during a takeover is never held twice" | green |
| REAP-11 | the release after a takeover | `scripts/agent-harness/reaper/lock.test.mjs` › "a release leaves a lock a later run took over" | green |
| REAP-11 | a guard left by a reaper that died | `scripts/agent-harness/reaper/lock.test.mjs` › "a guard left by a reaper that died is removed, and the next run takes the lock" | green |
| REAP-11 | a guard whose holder runs | `scripts/agent-harness/reaper/lock.test.mjs` › "a run that finds a takeover under way by a holder that runs takes nothing and leaves the lock" | green |
| REAP-11 | a guard replaced | `scripts/agent-harness/reaper/lock.test.mjs` › "a guard whose holder ended is removed only while it holds what the run read" | green |
| REAP-11 | two real processes | `scripts/agent-harness/reaper/lock.test.mjs` › "a reaper process that releases late leaves the lock another process took over" | green |
| REAP-11 | a dry run | `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run takes no lock" | green |
| PRUNE-01 | the options | `scripts/prune-worktrees.test.mjs` › "--dry-run and --quiet are read" | green |
| PRUNE-01 | the options | `scripts/prune-worktrees.test.mjs` › "an unknown option throws, naming it" | green |
| PRUNE-01 | the option that finishes orphan folders | `scripts/prune-worktrees.test.mjs` › "--finish-orphans is read" | green |
| PRUNE-01 | a run a prune started | `scripts/prune-worktrees.test.mjs` › "a run started from inside a prune exits 0 at once and prints nothing" | green |
| PRUNE-01 | no origin, and no repository | `scripts/prune-worktrees.test.mjs` › "post-merge exits 0 in a repository with no origin, since there is nothing to prune" | green |
| PRUNE-01 | no origin, and no repository | `scripts/prune-worktrees.test.mjs` › "outside a git repository it exits 1 and removes nothing" | green |
| PRUNE-01 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run exits 0 and names the worktree it would remove" | green |
| PRUNE-01 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run removes no worktree, no directory and no branch" | green |
| PRUNE-01 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run states the decisions the real run carries out" | green |
| PRUNE-01 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run names what it does not cover as its last line" | green |
| PRUNE-02 | a fetch that outlasts its bound | `scripts/prune-worktrees.test.mjs` › "a fetch that outlasts its bound skips the prune and the fast-forward, says why and exits 0" | green |
| PRUNE-02 | the fetch on Windows | `scripts/prune-worktrees.test.mjs` › "on Windows a fetch stopped at its bound ends the processes git started" | green |
| PRUNE-02 | a silent fetch failure | `scripts/prune-worktrees.test.mjs` › "a fetch that fails with nothing on stderr names its error or its exit code, never undefined" | green |
| PRUNE-02 | the bound | `scripts/prune-worktrees.test.mjs` › "the fetch is bound to 30 s unless PRUNE_WORKTREES_FETCH_SECONDS names another positive number" | green |
| PRUNE-03 | a merged worktree | `scripts/prune-worktrees.test.mjs` › "a merged, clean worktree whose upstream is gone is removed" | green |
| PRUNE-03 | a locked worktree | `scripts/prune-worktrees.test.mjs` › "a locked worktree is kept with its lock reason, in the dry run as in the real one" | green |
| PRUNE-03 | a worktree on the default branch, a detached one and the main checkout | `scripts/prune-worktrees.test.mjs` › "a worktree tracking the default branch itself is kept" | green |
| PRUNE-03 | a worktree on the default branch, a detached one and the main checkout | `scripts/prune-worktrees.test.mjs` › "a detached worktree is kept" | green |
| PRUNE-03 | a worktree on the default branch, a detached one and the main checkout | `scripts/prune-worktrees.test.mjs` › "the main checkout is kept" | green |
| PRUNE-03 | a worktree inside a merged one | `scripts/prune-worktrees.test.mjs` › "the work of a worktree nested inside a merged one survives" | green |
| PRUNE-04 | ignored files that are written again | `scripts/prune-worktrees.test.mjs` › "ignored files an install or a build writes do not keep it" | green |
| PRUNE-04 | ignored files nothing writes again | `scripts/prune-worktrees.test.mjs` › "an ignored file nothing rebuilds keeps the worktree and stays" | green |
| PRUNE-04 | ignored files nothing writes again | `scripts/prune-worktrees.test.mjs` › "an env file keeps the worktree: nothing writes it again" | green |
| PRUNE-04 | ignored files nothing writes again | `scripts/prune-worktrees.test.mjs` › "a file under .atl/ keeps the worktree and stays" | green |
| PRUNE-04 | the skill registry | `scripts/prune-worktrees.test.mjs` › "an .atl/ that holds only the two skill-registry files does not keep the worktree" | green |
| PRUNE-04 | the skill registry | `scripts/prune-worktrees.test.mjs` › "an .atl/ that holds anything besides the skill-registry files keeps the worktree, and it all stays" | green |
| PRUNE-04 | changes git status compares as bytes | `scripts/prune-worktrees.test.mjs` › "a file that differs only in its line endings is a local change and keeps the worktree" | green |
| PRUNE-04 | changes git status compares as bytes | `scripts/prune-worktrees.test.mjs` › "status.showUntrackedFiles=no does not hide untracked work" | green |
| PRUNE-04 | a change after the decision | `scripts/prune-worktrees.test.mjs` › "an ignored file written after the decision keeps the worktree, and the file stays" | green |
| PRUNE-04 | a change after the decision | `scripts/prune-worktrees.test.mjs` › "a worktree still clean just before its removal goes, and its branch with it" | green |
| PRUNE-05 | a refusal | `scripts/prune-worktrees.test.mjs` › "a removal git refuses is kept with the message git gave" | green |
| PRUNE-05 | a branch whose tip moved | `scripts/prune-worktrees.test.mjs` › "a branch whose tip moved since it was judged is kept when its worktree goes" | green |
| PRUNE-05 | a branch still at its tip | `scripts/prune-worktrees.test.mjs` › "a branch still at its judged tip is deleted with its worktree, and its config with it" | green |
| PRUNE-06 | a worktree git unregisters before its removal fails | `scripts/prune-worktrees.test.mjs` › "a worktree git unregisters before its removal fails is removed, its folder finished" | green |
| PRUNE-06 | a leftover tried again | `scripts/prune-worktrees.test.mjs` › "a leftover delete that fails partway is tried again until the directory goes" | green |
| PRUNE-06 | a leftover that stays | `scripts/prune-worktrees.test.mjs` › "a leftover that stays after every try is named by its path" | green |
| PRUNE-06 | a directory released between tries | `scripts/prune-worktrees.test.mjs` › "a held directory released between tries goes whole, with its branch" | green |
| PRUNE-06 | a worktree git still lists | `scripts/prune-worktrees.test.mjs` › "a removal git refuses is kept with the message git gave" | green |
| PRUNE-06 | a worktree list git cannot read | `scripts/prune-worktrees.test.mjs` › "a failed remove whose worktree list git cannot read is kept, and nothing is deleted" | green |
| PRUNE-06 | a junction in the leftover | `scripts/prune-worktrees.test.mjs` › "a left directory goes, and a junction in it is not followed" | green |
| PRUNE-07 | the announcement | `scripts/prune-worktrees.test.mjs` › "each removal is announced before git removes it" | green |
| PRUNE-07 | the announcement | `scripts/prune-worktrees.test.mjs` › "a removal git refuses is announced before it is tried" | green |
| PRUNE-07 | a dry run announces nothing | `scripts/prune-worktrees.test.mjs` › "a dry run announces no removal" | green |
| PRUNE-07 | a failure after an announcement | `scripts/prune-worktrees.test.mjs` › "a failure after a removal started does not say nothing was removed" | green |
| PRUNE-08 | the list | `scripts/prune-worktrees.test.mjs` › "the kept worktrees are listed by the age of their last commit, oldest first" | green |
| PRUNE-08 | a real run, and --quiet | `scripts/prune-worktrees.test.mjs` › "a real run lists each kept worktree by its age, and --quiet does not" | green |
| PRUNE-09 | a main checkout behind | `scripts/prune-worktrees.test.mjs` › "a main checkout on main behind origin is fast-forwarded" | green |
| PRUNE-09 | a main checkout behind | `scripts/prune-worktrees.test.mjs` › "the default branch is origin's, whatever its name" | green |
| PRUNE-09 | a local change | `scripts/prune-worktrees.test.mjs` › "a local change the fast-forward would overwrite stays, unmoved" | green |
| PRUNE-09 | a local change | `scripts/prune-worktrees.test.mjs` › "a staged change blocks the fast-forward, and a dry run says so" | green |
| PRUNE-09 | a local change | `scripts/prune-worktrees.test.mjs` › "a local change to a file the fast-forward does not touch blocks it too" | green |
| PRUNE-09 | a main checkout that cannot be moved | `scripts/prune-worktrees.test.mjs` › "a main checkout that diverged is left with git's fatal line, not a hint" | green |
| PRUNE-09 | a main checkout that cannot be moved | `scripts/prune-worktrees.test.mjs` › "a main checkout on another branch is not moved" | green |
| PRUNE-09 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run names the fast-forward and does not move the checkout" | green |
| PRUNE-09 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run over an untracked file the fast-forward would overwrite names git's refusal and touches nothing" | green |
| PRUNE-09 | a dry run | `scripts/prune-worktrees.test.mjs` › "an index.lock in the main checkout leaves the dry run's prediction as it was, and stays" | green |
| PRUNE-09 | no origin/HEAD | `scripts/prune-worktrees.test.mjs` › "with no origin/HEAD the default branch is unknown: it exits 1, names the fix and moves nothing" | green |
| PRUNE-10 | an install after a fast-forward that changed the lockfile | `scripts/prune-worktrees.test.mjs` › "a fast-forward that changes pnpm-lock.yaml runs pnpm install" | green |
| PRUNE-10 | an install that rewrites the lockfile | `scripts/prune-worktrees.test.mjs` › "an install that rewrites pnpm-lock.yaml says so in one line, under --quiet too, and the run exits 0" | green |
| PRUNE-10 | an install that fails or outlasts its bound | `scripts/prune-worktrees.test.mjs` › "an install that fails or outlasts PRUNE_WORKTREES_INSTALL_SECONDS names the command to run, and the run exits 0" | green |
| PRUNE-10 | the install bound | `scripts/prune-worktrees.test.mjs` › "the install is bound to 120 s unless PRUNE_WORKTREES_INSTALL_SECONDS names another positive number" | green |
| PRUNE-10 | a bound that is not a number, read only when an install is due | `scripts/prune-worktrees.test.mjs` › "an invalid PRUNE_WORKTREES_INSTALL_SECONDS is read only when an install is due" | green |
| PRUNE-10 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run says it would install after a fast-forward that changes pnpm-lock.yaml, and installs nothing" | green |
| PRUNE-11 | the summary | `scripts/prune-worktrees.test.mjs` › "the summary line counts the removed and the kept by reason" | green |
| PRUNE-11 | quiet | `scripts/prune-worktrees.test.mjs` › "--quiet prints the removals and the summary, no kept line" | green |
| PRUNE-11 | a failure after the removals | `scripts/prune-worktrees.test.mjs` › "a step that fails after the removals still reports what was removed, and exits 1" | green |
| PRUNE-12 | another prune holds the lock | `scripts/prune-worktrees.test.mjs` › "a run that finds another prune holding the lock prints one line, exits 0 and removes nothing" | green |
| PRUNE-12 | the lock is released | `scripts/prune-worktrees.test.mjs` › "a real run releases the lock it took" | green |
| PRUNE-12 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run while another prune holds the lock still prints its plan" | green |
| PRUNE-13 | a merged orphan folder | `scripts/prune-worktrees.test.mjs` › "an orphan folder whose branch is merged goes with its branch, announced first" | green |
| PRUNE-13 | a dry run | `scripts/prune-worktrees.test.mjs` › "a dry run names the orphan folder it would finish and deletes nothing" | green |
| PRUNE-13 | a folder that is kept | `scripts/prune-worktrees.test.mjs` › "an orphan folder is kept and named for each reason that keeps it" | green |
| PRUNE-13 | a folder that holds a registered worktree | `scripts/prune-worktrees.test.mjs` › "a dry run judges an orphan folder that holds a registered worktree as kept" | green |
| PRUNE-13 | read again before the delete | `scripts/prune-worktrees.test.mjs` › "an orphan folder that holds a worktree registered by the time of its delete is kept, and nothing is deleted" | green |
| PRUNE-13 | read again before the delete | `scripts/prune-worktrees.test.mjs` › "an orphan folder registered as a worktree by the time of its delete is kept, and nothing is deleted" | green |
| PRUNE-13 | read again before the delete | `scripts/prune-worktrees.test.mjs` › "an orphan folder that holds a .git by the time of its delete is kept, and nothing is deleted" | green |
| PRUNE-13 | read again before the delete | `scripts/prune-worktrees.test.mjs` › "an orphan folder whose worktree list git cannot read again is kept, and nothing is deleted" | green |
| PRUNE-13 | only the worktree root | `scripts/prune-worktrees.test.mjs` › "a folder outside the worktree root is never touched, even with a merged branch" | green |
| PRUNE-13 | only the worktree root | `scripts/prune-worktrees.test.mjs` › "a registered worktree under the worktree root is no orphan, even with no .git" | green |
| PRUNE-13 | only the worktree root | `scripts/prune-worktrees.test.mjs` › "a folder under the worktree root that holds a .git is no orphan, and stays" | green |
| PRUNE-13 | only the worktree root | `scripts/prune-worktrees.test.mjs` › "a junction under the worktree root is no orphan folder, and its target stays" | green |
| PRUNE-13 | a folder that stays | `scripts/prune-worktrees.test.mjs` › "an orphan folder that stays keeps its branch and is named" | green |
| PRUNE-13 | the order | `scripts/prune-worktrees.test.mjs` › "the main checkout is fast-forwarded before any orphan folder is deleted" | green |
| PRUNE-14 | the option | `scripts/prune-worktrees.test.mjs` › "--finish-orphans is read" | green |
| PRUNE-14 | the option | `scripts/prune-worktrees.test.mjs` › "an unknown option throws, naming it" | green |
| PRUNE-14 | before the marker | `scripts/prune-worktrees.test.mjs` › "a run before the marker exists reports the orphan folder it could finish and finishes none" | green |
| PRUNE-14 | the first manual run | `scripts/prune-worktrees.test.mjs` › "a --finish-orphans run that finishes every orphan folder it could writes the marker" | green |
| PRUNE-14 | a folder left on disk | `scripts/prune-worktrees.test.mjs` › "an orphan folder finished with its folder left on disk withholds the marker" | green |
| PRUNE-14 | after the marker | `scripts/prune-worktrees.test.mjs` › "once the marker exists a plain run finishes a new orphan folder with its branch" | green |
| PRUNE-14 | the package script | `scripts/prune-worktrees.test.mjs` › "the root package runs the first manual orphan run from worktrees:prune:finish-orphans" | green |
| PRUNE-15 | the hook runs the pruner | `scripts/prune-worktrees.test.mjs` › "post-merge runs the prune from the main checkout" | green |
| PRUNE-15 | the hook runs the pruner | `scripts/prune-worktrees.test.mjs` › "post-merge exits 0 and lists no kept line" | green |
| PRUNE-15 | the worktree the command runs in | `scripts/prune-worktrees.test.mjs` › "the worktree the command runs in survives the post-merge hook the main checkout's fast-forward fires" | green |
| PRUNE-15 | a prune that fails | `scripts/prune-worktrees.test.mjs` › "post-merge fails when the prune fails, so the failure is seen" | green |
| PRUNE-13 | a worktree root reached through a link | `scripts/prune-worktrees.test.mjs` › "an orphan folder reached through a linked worktree root keeps the registered worktree inside it" | green; added by the correction batch |
| PRUNE-13 | a nested repository | `scripts/prune-worktrees.test.mjs` › "an orphan folder holding a nested repository is kept" | green; added by the correction batch |
| REAP-11 | a lock file another run is deleting | `scripts/agent-harness/reaper/lock.test.mjs` › "a lock file another run is deleting reads as held, not as a failure" | green; added by the correction batch |

The correction batch (B1, the nested repository, A5 to A8) re-ran both suites green: 251 of 251.
The PRUNE-14 test "an orphan folder finished with its folder left on disk withholds the marker"
now also runs a real `--finish-orphans` over a held folder and asserts that no marker file is written.

## Gate

- `pnpm validate`: exit 0, 2026-11-26, on the archived tree (71 steps, 370 s), before the correction batch; its re-run after the batch: exit 0, 2026-11-26 (71 steps, 464 s).

## Not verified

- REAP-11, a removal that fails for another reason than a missing file: Not covered; `removePath` itself is tested in packages/tooling, but no reaper test makes the lock's removal fail.
- The Windows-only cases (a held directory, a fetch stopped at its bound) ran on Windows only; on
  POSIX the held directory is a read-only one, as the downstream suite does.
