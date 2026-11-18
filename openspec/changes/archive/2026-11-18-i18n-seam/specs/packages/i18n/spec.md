# Delta: packages/i18n

> **Change:** `2026-11-18-i18n-seam`

## ADDED Requirements

### Requirement: I18N-12 — One translator type for both apps

The i18n package SHALL define IAppTranslator, the translator both apps give their blocks, with no
translation runtime in it: `t(key, values?)` returns the message of a key in the active language
with its ICU arguments filled, `has(key)` tells whether the active catalog holds a string and
narrows it to a key, and `locale` is the active supported language. A key is
TranslationKeyType, a dot-separated path to a leaf of the English catalog, the catalog of the
default language, so a path the catalog lacks and a namespace are not keys; the values are
TranslationValuesType, the arguments by name, each a string or a number.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a leaf of the English catalog

- **GIVEN** a dot-separated path to a leaf of the English catalog, a numeric segment included
- **WHEN** it is passed to `t` or typed as TranslationKeyType
- **THEN** the type check accepts it
- **Test:** `packages/i18n/src/translator/__tests__/appTranslator.type.test.ts` › "a key is a dot-separated path to a leaf of the English catalog"

#### Scenario: a namespace or an unknown path

- **GIVEN** the path of a namespace, which holds messages, and a path the catalog lacks
- **WHEN** either is passed to `t`
- **THEN** the type check refuses it
- **Test:** `packages/i18n/src/translator/__tests__/appTranslator.type.test.ts` › "a namespace or a path the catalog lacks is not a key"

#### Scenario: a key that arrives as a string

- **GIVEN** a string, such as the message key of an AppError
- **WHEN** `has` returns true for it
- **THEN** the string is a TranslationKeyType inside that branch, and `t` accepts it
- **Test:** `packages/i18n/src/translator/__tests__/appTranslator.type.test.ts` › "has narrows a string to a key"

## MODIFIED Requirements

### Requirement: I18N-10 — The entry point exposes the language contract

The i18n package SHALL expose from its entry point LanguageEnum, SUPPORTED_LANGUAGES,
DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, FORMATTING_LOCALE, resources and APP_NAME, and the types
ILocaleResources, LanguageEnumType, SupportedLanguageType, IAppTranslator, TranslationKeyType and
TranslationValuesType.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an app imports the package

- **GIVEN** an app that depends on the i18n package
- **WHEN** it imports from the package entry point
- **THEN** those constants and types are available, and TranslationKeysType is not
- **Test:** `packages/i18n/src/__tests__/index.test.ts` › "the entry point exposes the language contract and the translator types"
