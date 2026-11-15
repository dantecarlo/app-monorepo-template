# Tasks: 2026-11-14-error-surfacing

- [x] T1 — web `useAppQuery` queues one error toast per query failure, from an effect · Requirements: WEB-26 · Commit: cf3d557
- [x] T2 — web root providers mount the `Toast` viewport · Requirements: WEB-37 · Commit: 6b3a233
- [x] T3 — web `error.tsx` and `global-error.tsx` render the `ErrorState` with a retry; `docs/architecture/web.md` says they ship · Requirements: WEB-38 · Commit: 1892ab1
- [x] T4 — mobile `useAppQuery` adds one error toast per query failure, from an effect · Requirements: MOBILE-20 · Commit: 5db951b
- [x] T5 — the mobile `react-native` test double renders accessible DOM elements; the mobile root layout mounts the `Toast` viewport, whose pill gains its background · Requirements: MOBILE-36 · Commit: e905045
- [x] T6 — mobile `RootErrorBoundary`, exported by the root layout as its `ErrorBoundary`; `docs/architecture/mobile.md` and `docs/maps/global-map.md` say it ships · Requirements: MOBILE-37 · Commit: 5cc5333
- [ ] T7 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-error-surfacing/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
