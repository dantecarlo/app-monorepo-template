# packages/i18n — living spec

> **Governs:** `packages/i18n/src`
> **ID prefix:** `I18N`
> **Derived from:** `docs/code-standards.md`, `docs/architecture/shared.md`
> **Verified against the code:** 2026-11-14 at `9afce2d`

## Purpose

The i18n package owns the shared English and Spanish catalogs and their key parity, the language
constants (the supported, default and fallback languages and the formatting locale), the
resources map and APP_NAME. It holds no translation runtime: apps/web uses next-intl and
apps/mobile uses react-i18next, and the message keys it must carry come from the service-error
map of packages/core.

## Requirements

### Requirement: I18N-01 — Both catalogs hold the same keys

The i18n package SHALL keep the English and the Spanish catalogs on one identical set of dot-separated leaf keys.

**Evidence:** `packages/i18n/src/locales/__tests__/resources.constant.test.ts:32`, `packages/i18n/src/locales/en.json:1`, `packages/i18n/src/locales/es.json:1`

#### Scenario: a key is added to one catalog only

- **GIVEN** the English and the Spanish catalogs
- **WHEN** their leaf key paths are collected and sorted
- **THEN** the two lists are equal, so a key present in one catalog alone fails the suite
- **Test:** `packages/i18n/src/locales/__tests__/resources.constant.test.ts` › "es.json and en.json have identical key sets"

### Requirement: I18N-02 — English and Spanish are the supported languages

The i18n package SHALL support exactly two languages, en and es, listed in that order in SUPPORTED_LANGUAGES and named by LanguageEnum.

**Evidence:** `packages/i18n/src/locales/i18n.constant.ts:3`, `packages/i18n/src/locales/i18n.constant.ts:14`

#### Scenario: an app lists the languages it offers

- **GIVEN** an app that reads SUPPORTED_LANGUAGES
- **WHEN** it lists the languages
- **THEN** it gets en, then es
- **Test:** Not covered — no test in this package asserts the list; the apps' tests compare against the constant itself

### Requirement: I18N-03 — English is the default and the fallback language

The i18n package SHALL name English (en) as both the default language and the fallback language.

**Evidence:** `packages/i18n/src/locales/i18n.constant.ts:11`, `packages/i18n/src/locales/i18n.constant.ts:12`

#### Scenario: no language is chosen

- **GIVEN** an app that reads DEFAULT_LANGUAGE and FALLBACK_LANGUAGE
- **WHEN** it resolves a language for a user who chose none
- **THEN** both constants are en
- **Test:** Not covered — the apps' tests compare against DEFAULT_LANGUAGE itself, never against its value

### Requirement: I18N-04 — Numbers and dates format in en-US

The i18n package SHALL name en-US as the formatting locale.

**Evidence:** `packages/i18n/src/locales/i18n.constant.ts:13`

#### Scenario: an app formats a value

- **GIVEN** an app that reads FORMATTING_LOCALE
- **WHEN** it formats a number or a date
- **THEN** the locale it passes is en-US
- **Test:** Not covered — no test reads FORMATTING_LOCALE

### Requirement: I18N-05 — Resources map each language to its catalog

The i18n package SHALL expose a resources map whose en and es entries each hold that language's catalog under a translation key.

**Evidence:** `packages/i18n/src/locales/resources.constant.ts:4`, `packages/i18n/src/locales/resources.constant.ts:5`, `packages/i18n/src/locales/resources.constant.ts:6`

#### Scenario: an app loads the messages of a language

- **GIVEN** an i18n adapter in an app
- **WHEN** it reads the resources entry of a supported language
- **THEN** the translation key holds that language's catalog
- **Test:** Not covered — no test in this package reads resources; the web request config test reads it only through the app

### Requirement: I18N-06 — APP_NAME is the English catalog's app name

The i18n package SHALL expose APP_NAME as the value of app.name in the English catalog.

**Evidence:** `packages/i18n/src/locales/resources.constant.ts:17`, `packages/i18n/src/locales/en.json:3`

#### Scenario: a non-reactive context needs the display name

- **GIVEN** a context that cannot call a translation hook, such as static page metadata
- **WHEN** it reads APP_NAME
- **THEN** it gets the English catalog's app.name
- **Test:** Not covered — no test reads APP_NAME

### Requirement: I18N-07 — The catalogs carry the service-error message keys

The i18n package SHALL define, in every catalog, the five keys the service-error map of packages/core names: helper.error.forbidden, helper.error.generic, helper.error.network, helper.error.notFound and helper.error.server.

**Evidence:** `packages/i18n/src/locales/en.json:77`, `packages/i18n/src/locales/es.json:77`

#### Scenario: a service error reaches the user

- **GIVEN** an AppError whose message key comes from the packages/core service-error map
- **WHEN** an app translates that key
- **THEN** both catalogs hold a value for it
- **Test:** Not covered — no test compares the packages/core message keys with the catalogs; `docs/code-standards.md:629` records that check as not built

### Requirement: I18N-08 — Interpolations are single-brace ICU arguments

The i18n package SHALL write every interpolated value as a single-brace ICU argument, such as name in auth.logo.label and count in items.dashboard.listResults, with the same argument in both catalogs.

**Evidence:** `packages/i18n/src/locales/en.json:29`, `packages/i18n/src/locales/en.json:91`, `packages/i18n/src/locales/es.json:29`, `packages/i18n/src/locales/es.json:91`

#### Scenario: a translated message takes a value

- **GIVEN** a catalog value with an argument
- **WHEN** an app formats it with that argument
- **THEN** the argument is written in single braces, in both catalogs
- **Test:** Not covered — the parity test compares keys, not values; `docs/code-standards.md:534` records brace balance as not enforced

### Requirement: I18N-09 — The translation key type is the Spanish catalog's shape

The i18n package SHALL type a locale resource's translation as the shape of the Spanish catalog.

**Evidence:** `packages/i18n/src/locales/i18n.constant.ts:1`, `packages/i18n/src/locales/i18n.constant.ts:21`, `packages/i18n/src/locales/i18n.constant.ts:24`

#### Scenario: a consumer types its resources

- **GIVEN** a consumer that annotates a value as ILocaleResources
- **WHEN** it is type-checked
- **THEN** its translation must match the Spanish catalog's keys
- **Test:** Not covered — a type, checked only by typecheck

### Requirement: I18N-10 — The entry point exposes the language contract

The i18n package SHALL expose from its entry point LanguageEnum, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, FORMATTING_LOCALE, resources and APP_NAME, and the types ILocaleResources, LanguageEnumType and SupportedLanguageType.

**Evidence:** `packages/i18n/src/index.ts:1`, `packages/i18n/src/index.ts:6`, `packages/i18n/src/index.ts:13`

#### Scenario: an app imports the package

- **GIVEN** an app that depends on the i18n package
- **WHEN** it imports from the package entry point
- **THEN** those constants and types are available, and TranslationKeysType is not
- **Test:** Not covered — the parity test imports the catalogs directly; only the consumers' typecheck reads the entry point

## Open questions

- **Q1** — `docs/code-standards.md:519` requires PascalCase namespace segments in catalog keys,
  but the catalogs use camelCase ones (`packages/i18n/src/locales/en.json:2`).
- **Q2** — `docs/audits/2026-11-04-remediation.md:419` says the key type should come from the
  default locale, but `packages/i18n/src/locales/i18n.constant.ts:21` takes it from the Spanish
  catalog while the default language is English (`packages/i18n/src/locales/i18n.constant.ts:11`).
  I18N-09 states the code.
