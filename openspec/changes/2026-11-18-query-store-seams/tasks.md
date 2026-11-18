# Tasks: 2026-11-18-query-store-seams

- [ ] T1 — the query API of both apps: the project-owned option and result types of `useAppQuery` and `useAppMutation`, `AppQueryClientType`, `AppQueryProvider` and `useInvalidateAppQuery`, and the `createQueryWrapper` test helper · Requirements: WEB-62, WEB-63, MOBILE-60, MOBILE-61 · Commit: —
- [ ] T2 — every importer of TanStack Query outside `lib/query` moved onto it, the web providers, the mobile root layout and their tests, and its 8 allowlist entries removed · Requirements: WEB-65, MOBILE-63 · Commit: —
- [ ] T3 — `createAppStore` in both apps, every store and the mobile `useSession` moved onto it, zustand's seam narrowed to the helper, and its 8 allowlist entries removed · Requirements: WEB-64, WEB-65, MOBILE-62, MOBILE-63 · Commit: —
- [ ] T4 — the mobile theme and language configs keep their choice through `keyValueStorage`, the language config's test mocks `@/lib/storage`, and the 3 AsyncStorage allowlist entries removed · Requirements: MOBILE-03, MOBILE-04, MOBILE-06, MOBILE-07, MOBILE-56 · Commit: —
- [ ] T5 — the `store`, `service`, `screen`, `feature`, `arch`, `lib`, `test` and `fix-test` skills, `docs/code-standards.md`, `docs/architecture/web.md` and `mobile.md`, and `docs/maps/global-map.md` · Requirements: none · Commit: —
- [ ] T6 — `verify-report.md`, then the archive into the living specs · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
