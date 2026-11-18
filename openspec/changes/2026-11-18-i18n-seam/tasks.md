# Tasks: 2026-11-18-i18n-seam

- [ ] T1 — the visible-text record of both apps, taken at the base `571d25b` before any import moves: `apps/web/src/test/__tests__/intl.helper.test.tsx` and `apps/mobile/src/test/__tests__/i18n.helper.test.tsx`, with the test helpers taking a catalog · Requirements: WEB-61, MOBILE-59 · Commit: —
- [ ] T2 — `IAppTranslator`, `TranslationKeyType` and `TranslationValuesType` in packages/i18n, exported from its entry point; the web `useAppTranslator`, `appTranslator.adapter.ts` and `AppI18nProvider`, the request config's resolution in `requestConfig.helper.ts`; the mobile `useAppTranslator`; the `next-intl` seam narrowed in the registry · Requirements: I18N-10, I18N-12, WEB-58, WEB-59 · Commit: —
- [ ] T3 — every web importer of next-intl moved to `@/lib/i18n`, tests and mocks included, and its 51 allowlist entries removed · Requirements: WEB-60, WEB-61 · Commit: —
- [ ] T4 — every mobile importer of react-i18next moved to `@/lib/i18n`, tests and mocks included, and its 31 allowlist entries removed · Requirements: MOBILE-57, MOBILE-58, MOBILE-59 · Commit: —
- [ ] T5 — `docs/code-standards.md` § 15, `docs/architecture/web.md` and `mobile.md`, `docs/maps/global-map.md`, the `lib`, `feature` and `service` skills, and the manifest's i18n capability · Requirements: none · Commit: —
- [ ] T6 — `verify-report.md`, then the archive into the living specs · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
