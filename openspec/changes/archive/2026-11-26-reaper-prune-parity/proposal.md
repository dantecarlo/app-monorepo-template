# Proposal: the reaper and the worktree pruner take the downstream project's fixes

> **Status:** archived — 2026-11-26

## Why

The downstream project Certifipago fixed its process reaper and its worktree pruner in
production on 2026-11-25. The template carries the same code and the same living spec
(harness/process-reaper), so each defect is open here until the fix lands.

- **A live reaper can lose its lock.** The lock is taken over once it is 30 s old
  (`scripts/agent-harness/reaper/lock.mjs`), although a reaper that stalls, a suspended laptop
  or a slow disk, still runs and later releases. The downstream fix takes the lock over only
  once its holder has ended, or after an hour.
- **Inline code with its value attached reads as a script.** `node --eval=<code> <script>` and
  `node -e<code> <script>` are matched against the script that follows
  (`scripts/agent-harness/reaper/plan.mjs`), and `--watch-preserve-output` alone, which starts no
  watch mode, keeps a process out of every family.
- **A removal git ends partway is reported as kept, forever.** On Windows `git worktree remove`
  can fail after it deleted the worktree's `.git` file and its registration. The pruner keeps
  that worktree as `git could not remove it`, tries its leftover folder once, and prints
  nothing before a removal, so a run that is ended inside one leaves no trace
  (`scripts/prune-worktrees.mjs`).
- **The pruner has no memory of what it kept, and two runs can overlap.** A kept worktree is
  never listed by age, a folder a half-finished removal left under the worktree root is never
  finished, and two prunes (two merges, two sessions) can run together.

The owner's words, verbatim:

- 2026-11-13 (translated from Spanish): "we are now at a maturity level where any project can
  start from here. So now you are the reference, and what we bring from other projects will be
  adapted to you, and you will ask the others to adapt to the new standards."
- 2026-11-05 (translated from Spanish): "Remember that if something changes in certifipago, it
  should also be implemented in the template and vice versa"

The owner approved this queue of Certifipago fixes on 2026-11-25. No quote of that approval
reached this session; the parent session that asked for this proposal reported it, and named the
Certifipago commits: `e4be74468`, `75a94b364`, `4cc61efe3`, `7a99f4fc9` and the merge `1cfa82741`.

## What changes

- **harness/process-reaper, the reaper.** REAP-11 takes a lock over only once its holder has
  ended (no process runs with the pid it names) or after an hour, with an injected
  `holderRunning`. REAP-03 reads inline code with its value attached as no script and reads
  `--watch-preserve-output` as no watch mode, so the watch flags are `--watch`,
  `--watch=<value>`, `--watch-path <path>` and `--watch-path=<path>`. REAP-10 is narrowed to
  `runBounded` itself: its pruner scenarios and the install move to the pruner's spec. A test
  pins that the `usr/bin` entry of the spare list spares a Git for Windows executable that no
  shell entry names (no requirement changes: REAP-05 already states it).
- **harness/worktree-pruner, a living spec of its own (prefix `PRUNE`).** It governs
  `scripts/prune-worktrees.mjs`, `scripts/prune-worktrees.detect.mjs` (the pure half of the same
  unit: every decision taken from what git printed) and `.husky/post-merge`. It states the
  pruner's existing behaviour, written from the code with its evidence and its tests
  (PRUNE-01 to PRUNE-05, PRUNE-09 to PRUNE-11 and PRUNE-15), and the ported behaviour:
  - PRUNE-06: a worktree git no longer lists counts as removed; its leftover folder is removed
    through `removePath` in four tries and a residue is named.
  - PRUNE-07: each removal is announced before it starts, and a run that fails after one does not
    say nothing was removed.
  - PRUNE-08: the kept worktrees are listed by the age of their last commit.
  - PRUNE-12: one real prune at a time, under the reaper's lock in the git common directory.
  - PRUNE-13 and PRUNE-14: orphan folders under the worktree root are judged and finished, and
    only by a run given `--finish-orphans` until one such run leaves none behind and writes a
    marker.
- **Docs.** `docs/harness.md` (Layer 2 and section 3g), the two enforcement rows of
  `docs/code-standards.md` section 21 and a row of the parity ledger in
  `docs/INIT_AND_HARNESS_PLAN.md` say what the code now does. The owner's mapping of the
  downstream rule-enforcement document to section 21 is the authority to edit those two rows.
- **At archive.** The new living spec gets its row in `openspec/README.md` section 2.1 and its
  claim in `template.manifest.json`, as the reaper's did. The reaper spec keeps its Purpose, which
  says the pruner is not part of that unit.

## Out of scope

- No force anywhere (LAW "A check is never forced or skipped"): no `rmSync` `force: true`, no
  `git worktree remove --force`, no `git branch -D`, no `taskkill /F` outside the reaper's
  registered exception. None of the ported steps relies on one: the downstream leftover removal
  is `rmSync(path, { recursive: true })` retried, and the template's equivalent is `removePath`
  (`packages/tooling/src/remove-path.mjs`), so there is nothing to substitute.
- The downstream PostToolUse hook prune-after-merge.mjs, its 50 s
  `PRUNE_BUDGET_MS` and its log lines. The template has no such hook: `.husky/post-merge` runs
  the pruner with no time bound (Q2).
- The downstream review folder (.codex-review) and its delivery process document, Certifipago-only.
- The fetch bound. The template already runs `git fetch --prune` through `runBounded`, for 30 s
  or `PRUNE_WORKTREES_FETCH_SECONDS` (PRUNE-02); the downstream 20 s exists to fit its 50 s hook
  budget, and a fetch that outlasts its bound skips the run with exit 0 here, where downstream
  it fails the run (Q3).
- The downstream hard-wired `origin/master`: the template reads the default branch from
  `origin/HEAD`, and every new requirement says "the default branch".
- The `${pid}:${uuid}` token spelling and the `.takeover` guard name of the downstream lock. The
  template's lock keeps its pid-and-token lines and its `.guard` file; only the takeover rule
  moves.
- The deletion of a branch at its judged tip after a removal: the template already does it
  (`update-ref -d` guarded by the tip).

## Open questions

Answered by the owner on 2026-11-26.

- **Q1.** Answered: the pruner gets its own living spec, harness/worktree-pruner, one spec per
  unit (the owner's F63 direction). The reaper spec keeps its Purpose; REAP-10 is restated as
  `runBounded` alone and the pruner's half moves to PRUNE-02 and PRUNE-10.
- **Q2.** Answered: no time budget around `.husky/post-merge`; only the announce line and the
  failure line are ported (PRUNE-07).
- **Q3.** Answered: keep the template's fetch, 30 s or `PRUNE_WORKTREES_FETCH_SECONDS`, a stalled
  fetch skipping the prune and exiting 0 (PRUNE-02).

## Affected specs

- `openspec/specs/harness/process-reaper/spec.md`: modified REAP-03, REAP-10 and REAP-11.
- `openspec/specs/harness/worktree-pruner/spec.md` (new): added PRUNE-01 to PRUNE-15.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
