# Proposal: the reaper reads node's watch flags, a POSIX start time that holds, and a lock that is its own

> **Status:** open

## Why

A downstream project ported the process reaper, and its code review found four defects.
Each one breaks behaviour the living spec states or means.

- **Watch mode is reaped.** `scriptOf` skips every flag before the script, `--watch` and
  `--watch-path` included (`scripts/agent-harness/reaper/plan.mjs:70-83`). So `node --watch …/tsc`
  matches the `tsc` family, although REAP-03 says watch work matches none. `--watch-path <p>` is
  worse: its value is read as the script.
- **SIGKILL can reach a reused pid on POSIX.** After the SIGTERM, `endOnPosix` probes each pid
  with signal 0 and sends SIGKILL when the probe succeeds (`platform.mjs:189-195`). A pid that a
  new process took in those 2 s passes the probe.
- **No POSIX start time holds.** `parsePosix` sets `startMs` to `now − etime`
  (`platform.mjs:81-96`). `etime` has a resolution of one second and `now` moves, so two
  listings give one process two start times. The re-read of REAP-12 then fails for every tree.
- **The lock is not its own.**
  - Two runs that find the same stale lock can both take it, since the check and the takeover
    are separate steps (`lock.mjs:48-53`).
  - The release deletes whatever lock is there, even one a later run took over (`lock.mjs:39-41`).

The parent session relayed the review's findings on 2026-11-25. No owner quote reached this
session directly. The parent session's words, verbatim:

- 2026-11-25: "**`plan.mjs` `scriptFrom` skips `--watch`/`--watch-path`.** As a result,
  `node --watch …/tsc` (and `--watch-path=…`) matches the `tsc` family, although watch work is
  never reaped. Fix: recognise node's watch flags (`--watch`, `--watch-path <p>`,
  `--watch-path=<p>`, `--watch-preserve-output`) as watch mode. A watch-mode process matches no
  family, and a tree that holds one is kept, with its reason."
- 2026-11-25: "**`platform.mjs` `endOnPosix`.** After SIGTERM, the probe with signal 0 treats the
  original pid as alive, so a reused pid can receive the SIGKILL. Fix: before escalating, list
  again, and send SIGKILL only to pids whose start time (`startMs`) is unchanged."
- 2026-11-25: "**`platform.mjs` `parsePosix`.** `startMs = now − etime` shifts on every listing,
  so `sortByIdentity`/the re-read identity check always fails on POSIX. Fix: read the absolute
  start time with `ps -o lstart=` under `LC_ALL=C`, which gives a fixed format such as
  `Wed Nov 25 12:03:39 2026`, and parse it deterministically. Keep `etime` only if something still
  needs it. Test the parser on fixed lines."
- 2026-11-25: "**`lock.mjs`.** Taking over a stale lock is racy: two runs can both decide it is
  stale and both take it. The release deletes any lock, even one a later run owns. Fix: take a
  stale lock through an exclusive guard file and re-check under it. Give each acquisition a
  unique token, written into the lock, and have the release remove the lock only when it still
  holds that token. Test both races with injected fs/clock where possible, plus one real
  two-process test if it stays deterministic."
- 2026-11-25: "(a) `--watch-path` takes the NEXT argument as its value, the same as the other
  value flags. Without that, the path is read as the script. `--watch-path=<p>` takes its value
  inline. (b) Before escalating to SIGKILL, the code takes a second listing. If that listing
  fails, or the time bound runs out, send no SIGKILL. Report the tree as not ended, with the
  reason. (c) If a run finds a lock guard file older than 30 s, left by a dead reaper, it deletes
  the guard only if the guard still holds the content that run read. That run takes nothing. The
  NEXT run takes the lock. (d) In `reap.mjs`, `sortByIdentity` keeps only the pids of each
  unchanged tree whose `startMs` is still the same, and passes those `starts` to `endTrees`. This
  way the per-pid taskkill on Windows never touches a reused pid either. Pin this on Windows with
  an injected listing."

## What changes

- **Watch mode (`plan.mjs`).**
  - Before the script, node's `--watch`, `--watch-path <p>`, `--watch-path=<p>` and
    `--watch-preserve-output` mark the entry as watch mode. `--watch-path` takes the next
    argument as its value.
  - A watch-mode entry matches no family, a wrapper included. A candidate tree that holds one is
    kept, with the reason `a process in it runs in watch mode`.
- **The POSIX listing (`platform.mjs`).** `ps -eo pid=,ppid=,lstart=,rss=,args=` runs under
  `LC_ALL=C`. Each start time is the absolute local time its `lstart` names, so it is the same in
  every listing. A `lstart` that does not parse reads as null. `etime` goes, since nothing else
  reads it.
- **The re-read keeps the pids it verified (`reap.mjs`).** Of each tree whose root held,
  `sortByIdentity` keeps only the pids still listed with the start time the plan read. It hands
  `endTrees` those pids and their start times, as `starts`. A per-pid taskkill on Windows then
  never names a reused pid.
- **The POSIX SIGKILL (`platform.mjs`).** After the SIGTERM and the 2 s wait, `endOnPosix` lists
  again. SIGKILL goes only to a pid still listed with its start time in `starts`.
  - No SIGKILL goes out when that listing fails or the bound has run out.
  - Every tree it signalled is then reported as not ended, with the reason.
- **The lock (`lock.mjs`).**
  - Each acquisition writes a unique token into the lock. The release removes the lock only
    while it still holds that token.
  - A stale lock is taken over only under an exclusive guard file beside it, `<lock>.guard`, and
    is checked again under it.
  - A guard older than 30 s, left by a reaper that died holding it, is removed. The run removes
    it only while it still holds what that run read, and takes nothing. The next run takes the
    lock.
- **Tests and docs.** Each rule gets a test, written first and seen red:
  `plan.test.mjs`, `contract.test.mjs`, `platform.test.mjs`, `reap.test.mjs`, and a new
  `lock.test.mjs` with one real two-process case. The `docs/harness.md` section 3g and its
  `pnpm reap:test` row name the new behaviour.

## Out of scope

- **The contract.** `.agents/contracts/process-reaper.json` keeps its families, spare list,
  grace and bound. Watch mode is read from the command line before any family is tried, so no
  family changes.
- **A release that races a takeover.** The release reads its token, then removes the lock. A
  takeover that lands between the two steps can lose its lock. Only a reaper that outlived the
  30 s stale age by far, beyond its own 8 s bound, can release that late.
- **Node watch mode set through `NODE_OPTIONS`.** It is not on the command line, so the reaper
  cannot read it.
- **The downstream project.** The parent session keeps the two versions in step.

## Affected specs

- `openspec/specs/harness/process-reaper/spec.md`: REAP-03, REAP-07, REAP-11 and REAP-12 modified.
  - REAP-03 gains watch mode: the four flags, `--watch-path` taking its value, and the tree kept.
  - REAP-07 lists with `lstart` under `LC_ALL=C`, and sends SIGKILL only after a second listing,
    to each pid whose start time held.
  - REAP-11 takes a stale lock under a guard, removes a stale guard, and releases only its own
    token.
  - REAP-12 keeps, of each tree whose root held, only the pids whose start time held, with their
    start times.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
