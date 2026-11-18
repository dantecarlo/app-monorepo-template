# Verify report: 2026-11-18-i18n-seam

> **Verified:** 2026-11-18 at `4d8d3ee`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `4d8d3ee` (exit 0): the web suite
113 files and 437 tests, the mobile suite 77 files and 219 tests, and `pnpm --filter @app/i18n
test`. The type scenarios of I18N-12 and I18N-10 are checked by `tsc --noEmit` of the package,
inside the same run's `typecheck`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| I18N-12 | a leaf of the English catalog | `packages/i18n/src/translator/__tests__/appTranslator.type.test.ts` › "a key is a dot-separated path to a leaf of the English catalog" | green |
| I18N-12 | a namespace or an unknown path | `packages/i18n/src/translator/__tests__/appTranslator.type.test.ts` › "a namespace or a path the catalog lacks is not a key" | green |
| I18N-12 | a key that arrives as a string | `packages/i18n/src/translator/__tests__/appTranslator.type.test.ts` › "has narrows a string to a key" | green |
| I18N-10 | an app imports the package | `packages/i18n/src/__tests__/index.test.ts` › "the entry point exposes the language contract and the translator types" | green |
| WEB-58 | a message with a value | `apps/web/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "formats a message of the active catalog with its values" | green |
| WEB-58 | a key the catalog lacks | `apps/web/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "tells a key the active catalog holds from one it lacks" | green |
| WEB-58 | the active locale | `apps/web/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "reports the active locale" | green |
| WEB-58 | the provider | `apps/web/src/lib/i18n/__tests__/AppI18nProvider.component.test.tsx` › "gives its children the locale and the catalog it is given" | green |
| WEB-59 | a server component translates | `apps/web/src/lib/i18n/__tests__/appTranslator.adapter.test.ts` › "gives a server component the translator of the request's locale" | green |
| WEB-59 | an unsupported request locale | `apps/web/src/lib/i18n/__tests__/appTranslator.adapter.test.ts` › "reduces the request's locale to a supported language" | green |
| WEB-59 | the request's catalog | `apps/web/src/lib/i18n/__tests__/appTranslator.adapter.test.ts` › "hands the request's catalog over" | green |
| WEB-60 | a block outside the seam imports next-intl | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, 61 allowlist entries, none of next-intl) | green gate |
| WEB-61 | the messages behind the text | `apps/web/src/test/__tests__/intl.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages" | green |
| WEB-61 | the copy of each language | `apps/web/src/test/__tests__/intl.helper.test.tsx` › "every sample shows the copy its catalog holds, in both languages" | green |
| MOBILE-57 | a message with a value | `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "formats a message of the active catalog with its values" | green |
| MOBILE-57 | a key the catalog lacks | `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "tells a key the active catalog holds from one it lacks" | green |
| MOBILE-57 | the active locale | `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "reports the active locale" | green |
| MOBILE-58 | a block outside the seam imports react-i18next | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, none of react-i18next) | green gate |
| MOBILE-59 | the messages behind the text | `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages" | green |
| MOBILE-59 | the copy of each language | `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the copy its catalog holds, in both languages" | green |

## The visible text, before and after

The record tests landed at `0d14707`, on the base code, and passed there; the same files pass
unchanged at `4d8d3ee`, after every import moved. Changing one message of a sampled block (the
empty state's title read from its message key) failed both tests of each app, so the record
catches a block that shows another message. The two languages' records differ only in the code
the language button shows. The mobile React Native stand-in renders no `TextInput` placeholder
and no svg label, so the mobile sample reads neither; the web sample reads both.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `4d8d3ee`; `report:spec-drift`
  listed the four specs this change archives into.
- `pnpm --filter @app/web build`: exit 0 at `0c447f8`.
- `pnpm --filter @app/mobile export:web`: exit 0 at `992e7e8`; `apps/mobile/dist-web` removed.
- `pnpm smoke:web`: exit 0 at `4d8d3ee`, HTTP 200 and the marker present.
- `pnpm verify:dependency-seams`: allowlist 143 entries at the base, 61 after (82 removed: 51
  `next-intl`, 31 `react-i18next`).

## Not verified

- WEB-60 and MOBILE-58 have no test of their own: the seam is held by the lint rule and the gate,
  whose own scenarios are harness/dependency-seams SEAM-03 and SEAM-07.
- No device run: the mobile bundle was exported for the web, not started on iOS or Android.
