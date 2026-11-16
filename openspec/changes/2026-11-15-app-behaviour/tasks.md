# Tasks: 2026-11-15-app-behaviour

- [x] T1 — enum members in UPPER_SNAKE_CASE: the `enumMember` selector of `@typescript-eslint/naming-convention`, every enum member of both apps renamed with its usages, the naming table of `docs/code-standards.md` § 4 and the skill snippets (F24) · Requirements: none · Commit: 234e2b8
- [x] T2 — query keys hold their dynamic values in a trailing params object, in both apps, with the factory walk, the prefix invalidation and the redaction tests; the skills and docs that show key factories (F23) · Requirements: WEB-24, WEB-44, MOBILE-25, MOBILE-43 · Commit: 98df504
- [x] T3 — web: `useAppQuery` queues no toast; the dashboard shows the `ErrorState` with a retry when the items query fails; `error.tsx` and `global-error.tsx` report the crash once through `reportBoundaryError` (F25) · Requirements: WEB-07, WEB-26, WEB-38 · Commit: 4af4b7c
- [x] T4 — mobile: `useAppQuery` adds no toast; the dashboard shows the `ErrorState` with a retry when the items query fails; `RootErrorBoundary` reports the crash once through `reportBoundaryError` (F25) · Requirements: MOBILE-20, MOBILE-37 · Commit: 78df647
- [x] T5 — web sign-in through the auth gateway: the `Auth` service and adapter, the shared browser gateway in `src/lib/supabase/authGateway.adapter.ts`, the sign-in hook and the login form; the middleware tests (F11) · Requirements: WEB-13, WEB-20, WEB-31 · Commit: 65749b5
- [x] T6 — mobile: the result count once, a stable `useSession` (and the web one), no button without an action (F12) · Requirements: MOBILE-18, MOBILE-31, MOBILE-44, MOBILE-45 · Commit: e8b7c2b
- [ ] T7 — mobile light theme from the root: `themeVars` on the root view, `createThemedStyles` and `useThemedStyles`, every block on the active palette, `Screen` always themed, and the NativeWind preset reading each themed colour from its `--c-*` variable (F12) · Requirements: MOBILE-05, MOBILE-40, MOBILE-42, TOKENS-12 · Commit: —
- [ ] T8 — the docs and the map; `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-15-app-behaviour/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
