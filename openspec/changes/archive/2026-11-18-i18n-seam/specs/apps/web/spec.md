# Delta: apps/web

> **Change:** `2026-11-18-i18n-seam`

## ADDED Requirements

### Requirement: WEB-58 — A client block translates through the app's translator

The web app SHALL give every client component one translator, `useAppTranslator()` of
`apps/web/src/lib/i18n/`, that implements IAppTranslator of packages/i18n over the translation
context `AppI18nProvider` gives: `t` returns the message of a key in the active locale's catalog
with its ICU values filled, `has` tells a key that catalog holds from a string it lacks, and
`locale` is the active supported language. `AppI18nProvider` gives its children the locale and the
catalog it is handed, formatting in the UTC time zone.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a message with a value

- **GIVEN** a block inside `AppI18nProvider` given the Spanish locale and its catalog
- **WHEN** it calls `t` with a key and an ICU value
- **THEN** it gets the Spanish message with the value in place
- **Test:** `apps/web/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "formats a message of the active catalog with its values"

#### Scenario: a key the catalog lacks

- **GIVEN** the same block
- **WHEN** it calls `has` with a key of the catalog and with a string the catalog lacks
- **THEN** the first is true and the second false
- **Test:** `apps/web/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "tells a key the active catalog holds from one it lacks"

#### Scenario: the active locale

- **GIVEN** the same block
- **WHEN** it reads `locale`
- **THEN** it is the Spanish language code
- **Test:** `apps/web/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "reports the active locale"

#### Scenario: the provider

- **GIVEN** `AppI18nProvider` given a locale and its catalog
- **WHEN** a block inside it renders a message
- **THEN** the block shows that catalog's message
- **Test:** `apps/web/src/lib/i18n/__tests__/AppI18nProvider.component.test.tsx` › "gives its children the locale and the catalog it is given"

### Requirement: WEB-59 — A server component translates through the same shape

The web app SHALL give every server component `getAppTranslator()` of
`apps/web/src/lib/i18n/appTranslator.adapter.ts`, an IAppTranslator of the request's locale and
catalog, and SHALL read the request's locale, reduced to a supported language, through
`getAppLocale()` and its catalog through `getAppMessages()`, the values the request config
resolves (WEB-14).

**Evidence:** written at apply time, when the code exists.

#### Scenario: a server component translates

- **GIVEN** a request whose locale is Spanish
- **WHEN** a server component awaits `getAppTranslator()` and calls `t`, `has` and `locale`
- **THEN** it gets the Spanish message with its values, true for a catalog key and false for
  another string, and the Spanish code
- **Test:** `apps/web/src/lib/i18n/__tests__/appTranslator.adapter.test.ts` › "gives a server component the translator of the request's locale"

#### Scenario: an unsupported request locale

- **GIVEN** a request locale the app does not support
- **WHEN** `getAppLocale()` resolves
- **THEN** it is the default language
- **Test:** `apps/web/src/lib/i18n/__tests__/appTranslator.adapter.test.ts` › "reduces the request's locale to a supported language"

#### Scenario: the request's catalog

- **GIVEN** a request whose catalog is the Spanish one
- **WHEN** `getAppMessages()` resolves
- **THEN** it is that catalog
- **Test:** `apps/web/src/lib/i18n/__tests__/appTranslator.adapter.test.ts` › "hands the request's catalog over"

### Requirement: WEB-60 — Only lib/i18n and the framework config files import next-intl

The web app SHALL import next-intl only in `apps/web/src/lib/i18n/**`, in the request config
`apps/web/src/i18n/request.config.ts`, which next-intl loads by path, and in
`apps/web/next.config.ts`, which loads its plugin; every other file, tests included, reaches
translation through `@/lib/i18n/…`, and a test of any other unit mocks that module or renders
through `renderWithIntl`, never next-intl.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a block outside the seam imports next-intl

- **GIVEN** a component, screen, hook or test outside those files that imports or mocks next-intl
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: WEB-61 — The sampled screens keep their messages in both languages

The web app SHALL render the sign-in screen, the items dashboard with items, the items summary
and the error, empty, confirmation and offline blocks with the catalog messages, in the order
and with the values, that the record in `apps/web/src/test/__tests__/intl.helper.test.tsx` holds
for each language, taken at `571d25b`, and each of those messages SHALL show the copy its
language's catalog holds.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the messages behind the text

- **GIVEN** a catalog whose every message is its own key, in English and in Spanish
- **WHEN** each sample renders with it
- **THEN** its visible text and accessible labels equal the record for that language
- **Test:** `apps/web/src/test/__tests__/intl.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages"

#### Scenario: the copy of each language

- **GIVEN** the real English and Spanish catalogs
- **WHEN** each sample renders with one of them
- **THEN** its visible text and accessible labels are the record with every message in that
  catalog's copy
- **Test:** `apps/web/src/test/__tests__/intl.helper.test.tsx` › "every sample shows the copy its catalog holds, in both languages"
