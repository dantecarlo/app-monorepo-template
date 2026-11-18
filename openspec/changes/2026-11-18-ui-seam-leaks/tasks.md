# Tasks: 2026-11-18-ui-seam-leaks

- [x] T1 — the web variant unions: `VariantUnionsType` in `variants.helper.ts`, one tuple and union per variant in the 10 blocks' `*.constant.ts`, their props on the unions, a type test per block, and the 10 `tailwind-variants` allowlist entries removed · Requirements: WEB-70 · Commit: fd1d135
- [x] T2 — `IAsyncBoundaryFallbackProps` in both apps, and the `react-error-boundary` seam narrowed to the boundary's component file · Requirements: WEB-71, MOBILE-70 · Commit: ee9d6a2
- [x] T3 — the web `ui/Image` block, the logo on it, every test mocking it instead of `next/image`, the seam narrowed and the 4 `next/image` allowlist entries removed · Requirements: WEB-72 · Commit: b735563
- [x] T4 — the mobile `ui/Gradient` block, the accent gradient, the skeleton and the toggle on it, the dashboard header test without its vendor mock, the seam narrowed and the `expo-linear-gradient` allowlist entry removed · Requirements: MOBILE-71 · Commit: 6314bc8
- [x] T5 — the mobile `ui/StatusBar` block with `StatusBarStyleType`, the root layout and the root theme's type on it, the layout test mocking it, the seam narrowed and the 3 `expo-status-bar` allowlist entries removed · Requirements: MOBILE-72 · Commit: a1eb12a
- [x] T6 — `applyTheme` in `lib/theme`, the `Screen` and `Text` tests on it, and the 2 unit-5 `nativewind` allowlist entries removed · Requirements: MOBILE-73 · Commit: 8ec65af
- [ ] T7 — the `component` and `modify` skills, `docs/code-standards.md` § 22, `docs/architecture/web.md` and `mobile.md`, and `docs/maps/global-map.md` · Requirements: none · Commit: —
- [ ] T8 — `verify-report.md`, then the archive into the living specs · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
