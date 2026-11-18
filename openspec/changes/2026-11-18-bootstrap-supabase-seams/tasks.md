# Tasks: 2026-11-18-bootstrap-supabase-seams

- [x] T1 — unit 6: `lib/bootstrap` (`holdSplashScreen` and `hideSplashScreen`, `useAppBootstrap` and its `APP_FONTS`, `AppSafeAreaProvider`), the root layout and its test on them, the splash, font and safe-area seams narrowed, and their 7 allowlist entries removed · Requirements: MOBILE-02, MOBILE-74 · Commit: 93ed226
- [x] T2 — unit 6: the theme config on `applyTheme`, the root layout's test switching the theme through it and mocking the observability binding instead of PostHog, and the `nativewind` and `posthog-react-native` allowlist entries removed · Requirements: MOBILE-73, MOBILE-74 · Commit: 1fcd9ee
- [x] T3 — unit 6: the `arch` skill, `docs/code-standards.md` § 23, `docs/architecture/mobile.md` and `docs/maps/global-map.md` · Requirements: none · Commit: a99da28
- [x] T4 — unit 7: `BackendClientType` and `backendClient.adapter.ts` in packages/supabase, both client factories returning it, the auth gateway taking it, and its tests · Requirements: SUPABASE-01, SUPABASE-02, SUPABASE-30 · Commit: 7455343
- [x] T5 — unit 7: both apps' `lib/supabase` on the opaque client, the mobile `authGateway.adapter.ts`, the root layout and its test on it, the `@app/supabase` seam narrowed, and its 2 allowlist entries removed · Requirements: WEB-80, MOBILE-75, MOBILE-76 · Commit: ee31184
- [x] T6 — unit 7: the `lib` and `arch` skills, `docs/code-standards.md` § 23, `docs/architecture/mobile.md` and `shared.md`, `packages/supabase/docs/database.md` and `docs/maps/global-map.md` · Requirements: none · Commit: d2a3ac9
- [ ] T7 — `verify-report.md`, then the archive into the living specs · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
