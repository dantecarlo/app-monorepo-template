# Tasks: 2026-11-26-reaper-prune-parity

The reaper tasks (T1, T2) come first and are independent of the pruner. T6 needs T1, since the
prune lock is the reaper's `takeLock`. Each task is one commit, test first, with its docs
alongside; the size is the forecast of authored changed lines, additions plus deletions, tests
included.

- [ ] T1 — The reaper lock: `scripts/agent-harness/reaper/lock.mjs` writes its pid on the first line, takes a lock over only when its holder has ended or after an hour, injects `holderRunning`, applies the same rule to the guard; `scripts/agent-harness/reaper/lock.test.mjs` and `scripts/agent-harness/reaper/reap.test.mjs` cases, the real two-process case aged past an hour; `docs/harness.md` § 3g lock paragraph · Requirements: REAP-11 · Size: about 200 lines · Commit: —
- [ ] T2 — The reaper's entry: `scripts/agent-harness/reaper/plan.mjs` reads attached inline code as no script (`INLINE_ATTACHED`) and the watch flags as `^--watch(?:-path)?(?:=|$)`, so `--watch-preserve-output` is skipped; the `scripts/agent-harness/reaper/plan.test.mjs` and `scripts/agent-harness/reaper/contract.test.mjs` cases move and the new ones are added, plus the test that the `usr/bin` spare entry decides alone (pins REAP-05, which already states it); `docs/harness.md` § 3g watch sentence · Requirements: REAP-03 · Size: about 150 lines · Commit: —
- [ ] T3 — A removal git ends partway: `scripts/prune-worktrees.mjs` re-reads the registered worktrees when `git worktree remove` fails and counts an unregistered one as removed; `removeLeftover` retries through `removePath` four times at 250, 500 and 750 ms, with injected `remove` and `wait`; `scripts/prune-worktrees.test.mjs` cases; `docs/harness.md` Layer 2 · Requirements: REAP-14 · Size: about 220 lines · Commit: —
- [ ] T4 — The announced removal: the real run prints `removing <path> (<branch>)` before each removal, and `failureLine` says a removal had started; `scripts/prune-worktrees.detect.mjs`, `scripts/prune-worktrees.mjs`, tests; `docs/harness.md` Layer 2 · Requirements: REAP-15 · Size: about 130 lines · Commit: —
- [ ] T5 — The age list: `parseWorktrees` reads each `HEAD`, one `git log --no-walk` reads the commit times, `reportLines` prints the kept worktrees oldest first outside `--quiet`; tests; `docs/harness.md` Layer 2 · Requirements: REAP-16 · Size: about 150 lines · Commit: —
- [ ] T6 — One real prune at a time: `takeLock` at `prune-worktrees.lock` in the git common directory before the fetch, released however the run ends, the busy line, a dry run with none; tests; `docs/harness.md` Layer 2 · Requirements: REAP-17 · Size: about 130 lines · Commit: —
- [ ] T7 — Orphan folders, judged: the worktree root, the folders under it with no `.git` and no registration, the decision with its kept reasons and the dry-run lines; `scripts/prune-worktrees.detect.mjs`, `scripts/prune-worktrees.mjs`, tests · Requirements: REAP-18 · Size: about 250 lines · Commit: —
- [ ] T8 — Orphan folders, finished: the re-read before the delete, the delete through `removeLeftover`, the branch after the folder, the order after the fast-forward and the install; tests · Requirements: REAP-18 · Size: about 230 lines · Commit: —
- [ ] T9 — Orphan folders wait for a first manual run: `--finish-orphans`, the `prune-finish-orphans.enabled` marker and its line, the `worktrees:prune:finish-orphans` script in `package.json`, the comment of `.husky/post-merge`; tests; `docs/harness.md` Layer 2 · Requirements: REAP-19 · Size: about 200 lines · Commit: —
- [ ] T10 — The docs that describe the whole: the two rows of `docs/code-standards.md` § 21 (merged worktrees removed, orphan processes ended), the `docs/harness.md` hook table row of `post-merge` and the `worktrees:prune:test` row, and a row of the parity ledger in `docs/INIT_AND_HARNESS_PLAN.md` naming the Certifipago commits and what was not ported · Requirements: none · Size: about 60 lines · Commit: —
- [ ] T11 — the verify report, then the archive: the deltas merged into `openspec/specs/harness/process-reaper/spec.md`, the evidence lines filled with `path:line`, the `Governs` line and the Purpose naming the pruner (per the answer to Q1), and the folder moved to `openspec/changes/archive/2026-11-26-reaper-prune-parity/` · Requirements: REAP-03, REAP-11, REAP-14, REAP-15, REAP-16, REAP-17, REAP-18, REAP-19 · Size: about 120 lines · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
Risk, for apply: T3 to T9 delete folders and branches (a high-risk item, irreversible effects),
so each is its own commit; T9's marker is the owner's gate before a run finishes orphan folders.
-->
