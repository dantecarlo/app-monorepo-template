# Delta: apps/mobile

> **Change:** `2026-11-18-i18n-seam`

## ADDED Requirements

### Requirement: MOBILE-57 — A block translates through the app's translator

The mobile app SHALL give every block one translator, `useAppTranslator()` of
`apps/mobile/src/lib/i18n/`, that implements IAppTranslator of packages/i18n over the active
i18next instance: `t` returns the message of a key in the active language with its ICU values
filled, `has` tells a key the catalog holds from a string it lacks, and `locale` is the active
language, reduced to a supported one.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a message with a value

- **GIVEN** a block under an i18next instance started in Spanish on the real catalogs
- **WHEN** it calls `t` with a key and an ICU value
- **THEN** it gets the Spanish message with the value in place
- **Test:** `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "formats a message of the active catalog with its values"

#### Scenario: a key the catalog lacks

- **GIVEN** the same block
- **WHEN** it calls `has` with a key of the catalog and with a string the catalog lacks
- **THEN** the first is true and the second false
- **Test:** `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "tells a key the active catalog holds from one it lacks"

#### Scenario: the active locale

- **GIVEN** the same block
- **WHEN** it reads `locale`
- **THEN** it is the Spanish language code
- **Test:** `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "reports the active locale"

### Requirement: MOBILE-58 — Only lib/i18n imports the i18n libraries

The mobile app SHALL import react-i18next, i18next, i18next-icu, @formatjs/intl-pluralrules and
expo-localization only in `apps/mobile/src/lib/i18n/**`; every other file, tests included,
reaches translation through `@/lib/i18n/…`, and a test of any other unit mocks that module or
renders through `renderWithI18n`, never one of those libraries.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a block outside the seam imports react-i18next

- **GIVEN** a component, screen, hook or test outside `apps/mobile/src/lib/i18n/` that imports or
  mocks react-i18next
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-59 — The sampled screens keep their messages in both languages

The mobile app SHALL render the sign-in screen, the items dashboard with items and the error,
empty, confirmation and offline blocks with the catalog messages, in the order and with the
values, that the record in `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` holds for each
language, taken at `571d25b`, and each of those messages SHALL show the copy its language's
catalog holds.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the messages behind the text

- **GIVEN** a catalog whose every message is its own key, in English and in Spanish
- **WHEN** each sample renders with it
- **THEN** its visible text and accessible labels equal the record for that language
- **Test:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages"

#### Scenario: the copy of each language

- **GIVEN** the real English and Spanish catalogs
- **WHEN** each sample renders with one of them
- **THEN** its visible text and accessible labels are the record with every message in that
  catalog's copy
- **Test:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the copy its catalog holds, in both languages"
