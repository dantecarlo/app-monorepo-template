# Tasks: 2026-11-20-posthog-privacy-follow-ups

- [x] T1 — apps/web: the deferred client runs each held call on its own · Requirements: WEB-62 · Commit: 603d349
- [x] T2 — apps/web: the URL scrub replaces a path segment that reads as a secret (A4) · Requirements: WEB-52 · Commit: 5efda08
- [x] T3 — apps/web: a revoke pauses the flags before its reset, and a grant after it resumes and reloads them (A3) · Requirements: WEB-57 · Commit: b5ebfaa
- [x] T4 — apps/web: an opt-in start with no recorded grant removes what `posthog-js` stored (A5) · Requirements: WEB-85 · Commit: 56cee4b
- [x] T5 — apps/mobile: the consent storage keeps nothing while not granted, writes the marker first, keeps a refused grant in memory, and its close waits for issued writes and goes on past a refused removal (A6, A7) · Requirements: MOBILE-54 · Commit: 119f728
- [x] T6 — apps/mobile: the consent API opens the storage before it constructs the client, and its revoke opts the client out, empties its queues and shuts it down, without a reset (A1, A2); the launch restore catches its failure; a comment moved in fc3eae3 · Requirements: MOBILE-53, MOBILE-55 · Commit: bb3a0b2
- [x] T7 — docs: `docs/observability.md` · Requirements: none · Commit: 51c0210
- [ ] T8 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-20-posthog-privacy-follow-ups/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
