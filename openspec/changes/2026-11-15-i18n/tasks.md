# Tasks: 2026-11-15-i18n

- [x] T1 — packages/i18n: the parity test over every catalog of `resources`, the key type from the English catalog with `resources` typed by it, the `auth.error`, `items.status` and `items.age` entries, `items.errorMessage` removed (F14) · Requirements: I18N-01, I18N-09, I18N-11 · Commit: 688e954
- [x] T2 — web: client components in the active language: the locale providers inside a `<Suspense>` of the root layout, the providers given the locale, the document language from the pre-paint script and the providers, `global-error.tsx` from the cookie, one owner in `src/i18n/` for the cookie, the time zone and the supported-language reduction (F10) · Requirements: WEB-15, WEB-16, WEB-38 · Commit: e384320
- [x] T3 — web: the browser's auth gateway names each sign-in failure with its message key, and a rejected sign-in shows it (left by F.5) · Requirements: WEB-13, WEB-20, WEB-46, I18N-11 · Commit: 9bbf9e1
- [x] T4 — web: the toast's dismiss label, the async boundary's labels, the busy labels of `Button` and `LoadingSkeleton`, and the item card's status and age from the catalogs; the items adapter describes the age as a unit and a count (F14) · Requirements: WEB-09, WEB-27, WEB-37, WEB-47 · Commit: f8e2555
- [x] T5 — mobile: the same copy from the catalogs: the toast, the async boundary, `Button`, `LoadingSkeleton`, and the item card's status and age, with the age as a unit and a count (F14) · Requirements: MOBILE-14, MOBILE-18, MOBILE-36, MOBILE-46 · Commit: 8694225
- [x] T6 — the docs, the skills and the map; `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-15-i18n/` as the last commit · Requirements: none · Commit: b306bca

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
