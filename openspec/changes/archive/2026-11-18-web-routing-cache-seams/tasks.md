# Tasks: 2026-11-18-web-routing-cache-seams

- [x] T1 — `lib/routing`: `useAppRouter`, `IAppRouter`, `AppRouteType` and the barrel, with the hook's test; the seam of `next/navigation` narrowed to the hook · Requirements: WEB-73, WEB-75 · Commit: 626edca
- [x] T2 — `useLanguageSwitcher` and `useSignIn` on `useAppRouter`; `createRoutingDouble` of `src/test/routing.helper.ts`; the eight tests that mock `next/navigation` mock `@/lib/routing`; its 9 allowlist entries removed · Requirements: WEB-73, WEB-75 · Commit: 2e0ca2b
- [x] T3 — `lib/cache`: `applyCachePolicy`, `CacheLifeEnum` and the barrel, with the adapter's test; `getItemsSummary` on it, its test mocking `@/lib/cache` with a new test of its policy; the seam of `next/cache` narrowed and its 2 allowlist entries removed · Requirements: WEB-74, WEB-75, WEB-03 · Commit: b16a285
- [x] T4 — the `lib`, `screen`, `service` and `arch` skills, `docs/code-standards.md` § 23, `docs/architecture/web.md` and `docs/maps/global-map.md` · Requirements: none · Commit: a796698
- [x] T5 — `verify-report.md`, then the archive into the living specs · Requirements: none · Commit: 7e6a1d0

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
