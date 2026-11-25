# Tasks: 2026-11-25-reaper-fixes

- [x] T1 — Watch mode: `plan.mjs` reads node's `--watch`, `--watch-path <p>`, `--watch-path=<p>` and `--watch-preserve-output` before the script as watch mode, matches it to no family and keeps a tree that holds one; cases in `plan.test.mjs` and `contract.test.mjs`; `docs/harness.md` § 3g · Requirements: REAP-03 · Commit: b9cdbf88
- [x] T2 — The POSIX listing: `platform.mjs` lists with `lstart` under `LC_ALL=C` and parses it to an absolute start time, `etime` dropped; cases in `platform.test.mjs`; `docs/harness.md` § 3g · Requirements: REAP-07 · Commit: 5c2a8d35
- [x] T3 — The re-read keeps its verified pids: `reap.mjs` `sortByIdentity` keeps, of each tree whose root held, the pids whose start time held, and hands them to `endTrees` with `starts`; a Windows case in `reap.test.mjs` · Requirements: REAP-12 · Commit: b53fbb86
- [x] T4 — The POSIX SIGKILL: `platform.mjs` `endOnPosix` lists again after the 2 s wait and sends SIGKILL only to the pids whose start time held, and none when that listing fails or the bound has run out; cases in `platform.test.mjs`; `docs/harness.md` § 3g · Requirements: REAP-07 · Commit: cc3f9134
- [x] T5 — The lock: `lock.mjs` writes a unique token, takes a stale lock under an exclusive guard, removes a stale guard only while it holds what it read, and releases only its own token; `lock.test.mjs`, with one real two-process case; `docs/harness.md` § 3g · Requirements: REAP-11 · Commit: c559cd82
- [x] T6 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/process-reaper/spec.md`, the evidence lines this change moved refreshed, and the folder moved to `openspec/changes/archive/2026-11-25-reaper-fixes/` · Requirements: REAP-03, REAP-07, REAP-11, REAP-12 · Commit: ab260731, and the archive that moves this folder
- [x] T7 — The verifier's correction: `etime` for age and parent order on POSIX and `lstart` for identity only (B1, with `clock-change.test.mjs`); a lock gone when read is created again and a stale one removed only while it holds the bytes read (A1); `--watch=<value>` (A4); an empty second listing ends no tree (A7); both spec files, `docs/harness.md` § 3g and this report · Requirements: REAP-02, REAP-03, REAP-07, REAP-11 · Commit: 4a1777a6

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
