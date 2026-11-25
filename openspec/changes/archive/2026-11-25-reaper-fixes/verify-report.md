# Verify report: 2026-11-25-reaper-fixes

> **Verified:** 2026-11-25 at `c559cd82`

## Scenarios

Every test ran green in `pnpm reap:test` at `c559cd82`: 106 of 106. Eleven are new, and they
replace the one old POSIX case. Two existing tests are extended: the watch work in
`plan.test.mjs` and the entry shape in `contract.test.mjs`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| REAP-03 | the whole tree goes | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan of a family is a candidate with its whole tree" | green |
| REAP-03 | unknown names | `scripts/agent-harness/reaper/plan.test.mjs` › "an orphan outside every family is never touched" | green |
| REAP-03 | text in the arguments | `scripts/agent-harness/reaper/plan.test.mjs` › "a family is matched by the executable and its script, never by text in the arguments" | green |
| REAP-03 | persistent and watch work | `scripts/agent-harness/reaper/plan.test.mjs` › "persistent and watch work is never a candidate, one-shot runs are" | green |
| REAP-03 | a tree that holds a process in watch mode | `scripts/agent-harness/reaper/plan.test.mjs` › "a tree that holds a node process in watch mode is kept, with its reason" | green |
| REAP-03 | the entry of a process | `scripts/agent-harness/reaper/contract.test.mjs` › "the entry of a process is its executable and its script, the flags before it skipped" | green |
| REAP-03 | the entry of a process in watch mode | `scripts/agent-harness/reaper/contract.test.mjs` › "a node process in watch mode reads as watch mode, and --watch-path takes the next argument as its value" | green |
| REAP-07 | Windows | `scripts/agent-harness/reaper/platform.test.mjs` › "on Windows the listing is read from Get-CimInstance and a tree ends with taskkill /T /F" | green |
| REAP-07 | a pid an older process names as its parent | `scripts/agent-harness/reaper/platform.test.mjs` › "on Windows a tree whose pid an older process names as its parent is ended pid by pid" | green |
| REAP-07 | the POSIX listing | `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX the listing is read from ps under LC_ALL=C, each start time from its lstart" | green; renamed by the correction below |
| REAP-07 | POSIX | `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX a tree gets SIGTERM, then after 2 s SIGKILL only to each pid still listed with its start time" | green |
| REAP-07 | the SIGKILL check cannot run | `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX no SIGKILL is sent when the listing before it fails or the bound has run out" | green |
| REAP-11 | the lock is held | `scripts/agent-harness/reaper/reap.test.mjs` › "a second reaper finds the lock and exits 0 at once, ending nothing" | green |
| REAP-11 | a stale lock | `scripts/agent-harness/reaper/reap.test.mjs` › "a lock older than 30 s is a reaper that died, and is taken over" | green |
| REAP-11 | two runs find the same stale lock | `scripts/agent-harness/reaper/lock.test.mjs` › "two runs that find the same stale lock never both take it" | green |
| REAP-11 | the release after a takeover | `scripts/agent-harness/reaper/lock.test.mjs` › "a release leaves a lock a later run took over" | green |
| REAP-11 | a guard left by a reaper that died | `scripts/agent-harness/reaper/lock.test.mjs` › "a guard left by a reaper that died is removed, and the next run takes the lock" | green |
| REAP-11 | a stale guard replaced | `scripts/agent-harness/reaper/lock.test.mjs` › "a stale guard is removed only while it holds what the run read" | green |
| REAP-11 | two real processes | `scripts/agent-harness/reaper/lock.test.mjs` › "a reaper process that releases late leaves the lock another process took over" | green |
| REAP-11 | a dry run | `scripts/agent-harness/reaper/reap.test.mjs` › "a dry run takes no lock" | green |
| REAP-12 | a reused pid by the kill | `scripts/agent-harness/reaper/reap.test.mjs` › "a candidate whose pid names another process by its kill is left, and the rest are ended" | green |
| REAP-12 | a reused pid inside a tree | `scripts/agent-harness/reaper/reap.test.mjs` › "a tree ended pid by pid leaves a pid that names another process by its kill" | green |
| REAP-02 | the hour the clock falls back | `scripts/agent-harness/reaper/clock-change.test.mjs` › "in the hour the clock falls back, a live child never reads as older than its parent" | green, from the correction |
| REAP-07 | the POSIX listing | `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX the listing is read from ps under LC_ALL=C, the age from etime and the identity from lstart" | green, from the correction |
| REAP-07 | a second listing that returns no process | `scripts/agent-harness/reaper/platform.test.mjs` › "on POSIX a listing before SIGKILL that returns no process reports the tree as not ended" | green, from the correction |
| REAP-11 | a lock released during a takeover | `scripts/agent-harness/reaper/lock.test.mjs` › "a lock released and re-created during a takeover is never held twice" | green, from the correction |

## Red first

- **T1 (`b9cdbf88`).** Four tests failed for the reason each states.
  - `node --watch …/tsc`, `--watch-path=src …/tsc` and `--watch-preserve-output …/vitest.mjs run`
    were candidates of tsc and vitest.
  - The turbo tree that holds `node --watch-path src server.js`, and the `cmd.exe` that wraps
    `node --watch …/tsc`, were candidates.
  - `entryOf` read no `watch`. For `--watch-path src …/tsc` it read the script as `src`.
- **T2 (`5c2a8d35`).** The listing test failed: `ps` ran with `etime`, and no `lstart` line was
  read. The old parser, fed one `etime` line twice 1.5 s apart, gave that one process two start
  times.
- **T3 (`b53fbb86`).** The new case failed: the per-pid taskkill named `/PID 12`, the pid a
  newer process had taken.
- **T4 (`cc3f9134`).** Both new tests failed.
  - The old code probed every pid with signal 0, and sent SIGKILL to pid 12, now a newer process.
  - When the listing failed, it still reported the tree as ended.
- **T5 (`c559cd82`).** The injection seams went in first, with the old algorithm unchanged. All
  five new tests then failed.
  - Both runs took the stale lock.
  - The first run's release removed the later run's lock, in the injected case and with two real
    node processes.
  - A run took a stale lock past a guard, live or dead.
- **Differential run.** The base reaper (`7442b265`) and the head ran over the same injected
  Windows listings, as a dry run, with `--json` and with `--kill`. The listings were an npx tree,
  a turbo run, a one-shot tsc, a tsc with `--watch` after its script, node flags before a vitest
  run, a young run and a stray child. Each one printed the same lines, the same exit code and the
  same taskkills. Only the three watch-mode listings differ, as requested: base ends them, head
  ends none and keeps the turbo tree, with its reason.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: not run here. The session that made this change was told
  not to run it or the turbo suite. The parent session runs it before the pull request.
- Run instead, at `c559cd82`:
  - `pnpm reap:test`: 106 of 106 pass.
  - `pnpm agent-harness:test`: 88 of 88 pass.
  - `pnpm reap`: a dry run, with no tree to end.
  - `pnpm verify:english`, `pnpm verify:manifest:coverage`, `pnpm knip` and eslint on the nine
    changed scripts: exit 0.
  - `pnpm verify:specs`: one finding before the archive. The living spec still names the POSIX
    test that T4 replaced. The archive merges the delta that names its successors.

## Not verified

- **A real POSIX run.** This change was built on Windows. The POSIX listing and kill are proven
  through an injected spawn and signal, never against a real `ps` or a real process tree.
- **A release that races a takeover.** The release reads the lock, then removes it. A takeover
  that lands between the two steps can lose its lock. Only a reaper that outlived the 30 s stale
  age, far past its 8 s bound, releases that late.
- **The start time's resolution.** `lstart` counts whole seconds. A pid taken by a process that
  started in the same second as its earlier holder reads as the same process.

## The verifier's correction

An independent verifier read the branch at `071547c3` and passed REAP-03, REAP-11 and REAP-12.
It found one blocker this change caused, and advisories. One correction batch, `4a1777a6`, fixed
them. Each test was seen red first, for its stated reason. `pnpm reap:test` then ran 109 of 109
green.

- **B1, a live MCP server reaped in the hour the clock falls back.**
  - The cause: `lstart` is a wall-clock time. In the repeated hour, JavaScript reads it with the
    first, daylight offset. So a child started in the second 01:05 read as older than a parent
    started in the first 01:50, and `holds` dropped the parent link. The base read `etime` and
    gave no candidate.
  - Red: `clock-change.test.mjs`, in New York at 07:00 UTC on 2026-11-01. Its `ps` prints the
    columns it is asked for. Pid 200, the server, was an npx-mcp candidate, 6900 s old.
  - Fixed first (REAP-02, REAP-07, `4a1777a6`): age and parent order on POSIX came from `etime`,
    and `lstart` only named a process across listings, as `identityMs`.
  - Simplified after the merge, for parity with the downstream port: `ps` runs under `TZ=UTC`
    beside `LC_ALL=C`, and each `lstart` is read as a UTC time. That one field never repeats
    when a clock falls back, so it gives the age, the order against the parent and the identity.
    The `etime` column and `identityMs` are gone, since nothing else read them.
  - Red for the simplification: the new test found no `TZ` in the environment `ps` ran under,
    and the listing test found the `etime` column and local start times. `clock-change.test.mjs`
    now shows the session at 05:50 UTC and its server at 06:10 UTC, the first 01:50 and the
    second 01:10 in New York. Each reads at its UTC time, and there is no candidate. It failed on
    the `etime` code, whose start times came from the live clock.
- **A1, a lock held twice with no slow reaper.** The base had it too.
  - The cause: a lock gone between the failed create and the stat read as stale, and the takeover
    removed whatever lock was there by then.
  - Red: the verifier's case. Its owner releases at the second fs call, another run creates a lock
    at the fifth, and both runs held it.
  - Fixed (REAP-11): a lock gone by the time it is read is created again, never taken over. Under
    the guard, a stale lock is removed only while it still holds the bytes the run read.
- **A4, `--watch=<value>`.** `node --watch=true …/tsc` runs in watch mode. Red: the entry read no
  watch mode, and the plan made it a tsc candidate. Fixed (REAP-03).
- **A7, an empty second listing.**
  - The cause: a second listing that parses to no process read every pid as gone. It sent no
    SIGKILL, yet reported every tree as ended.
  - Red: the tree read as ended. Fixed (REAP-07): it reports the tree as not ended, since "the
    second listing returned no process".
- **Differential run.** The base and the corrected head ran over the same injected Windows
  listings, ten kinds, each as a dry run, with `--json` and with `--kill`. Only the three
  watch-mode kinds differ.
- **Checks at `4a1777a6`.** `pnpm reap:test`, `pnpm agent-harness:test`, `pnpm verify:specs`,
  `pnpm verify:english` and eslint on the changed scripts pass. `pnpm reap`, a dry run, has no
  tree to end. `pnpm validate` was not run here, as the brief says.
- **Checks after the merge of `origin/main` (`9d033880`) and the simplification.**
  - `pnpm reap:test`: 116 of 116 pass, also under UTC, New York and Kolkata time zones.
  - `pnpm mcp:launch:test`: 10 of 10 pass. `scripts/prune-worktrees.test.mjs`: 89 of 89.
    `scripts/validate.test.mjs`: 42 of 42. `pnpm agent-harness:test`: 88 of 88.
  - `pnpm verify:specs`, `pnpm verify:english`, `pnpm knip` and eslint pass. `pnpm reap`, a
    dry run, has no tree to end.
