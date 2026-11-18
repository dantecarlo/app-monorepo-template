# packages/i18n — living spec

> **Governs:** `packages/i18n/src`
> **ID prefix:** `I18N`
> **Derived from:** `docs/code-standards.md`, `docs/architecture/shared.md`
> **Verified against the code:** 2026-11-18 at `7bb32cc`

## Purpose

The i18n package owns the shared English and Spanish catalogs and their key parity, the language
constants (the supported, default and fallback languages and the formatting locale), the
resources map, APP_NAME and IAppTranslator, the translator type both apps implement with its key
type taken from the English catalog. It holds no translation runtime: apps/web implements the
translator over next-intl and apps/mobile over react-i18next, each in its lib/i18n, and the
message keys it must carry come from the service-error map of packages/core.

## Requirements

### Requirement: I18N-01 — Every catalog holds the same keys

The i18n package SHALL hold, in resources, a catalog for every supported language, and SHALL keep
every catalog on one identical set of dot-separated leaf keys.

**Evidence:** `packages/i18n/src/locales/__tests__/resources.constant.test.ts:44`, `packages/i18n/src/locales/__tests__/resources.constant.test.ts:58`, `packages/i18n/src/locales/resources.constant.ts:10-13`, `packages/i18n/src/locales/en.json:1`, `packages/i18n/src/locales/es.json:1`

#### Scenario: a key is added to one catalog only

- **GIVEN** every catalog of resources
- **WHEN** the leaf key paths of each are compared with those of every other
- **THEN** no catalog lacks a key another holds, so a key present in one catalog alone fails the suite and names that key
- **Test:** `packages/i18n/src/locales/__tests__/resources.constant.test.ts` › "every catalog holds every key another catalog has"

#### Scenario: a supported language has no catalog

- **GIVEN** the supported languages
- **WHEN** resources is read for each
- **THEN** each one has a catalog
- **Test:** `packages/i18n/src/locales/__tests__/resources.constant.test.ts` › "holds a catalog for every supported language"

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

**Evidence:** `packages/i18n/src/locales/resources.constant.ts:10`, `packages/i18n/src/locales/resources.constant.ts:11`, `packages/i18n/src/locales/resources.constant.ts:12`

#### Scenario: an app loads the messages of a language

- **GIVEN** an i18n adapter in an app
- **WHEN** it reads the resources entry of a supported language
- **THEN** the translation key holds that language's catalog
- **Test:** Not covered — no test in this package reads resources; the web request config test reads it only through the app

### Requirement: I18N-06 — APP_NAME is the English catalog's app name

The i18n package SHALL expose APP_NAME as the value of app.name in the English catalog.

**Evidence:** `packages/i18n/src/locales/resources.constant.ts:23`, `packages/i18n/src/locales/en.json:3`

#### Scenario: a non-reactive context needs the display name

- **GIVEN** a context that cannot call a translation hook, such as static page metadata
- **WHEN** it reads APP_NAME
- **THEN** it gets the English catalog's app.name
- **Test:** Not covered — no test reads APP_NAME

### Requirement: I18N-07 — The catalogs carry the service-error message keys

The i18n package SHALL define, in every catalog, the five keys the service-error map of packages/core names: helper.error.forbidden, helper.error.generic, helper.error.network, helper.error.notFound and helper.error.server.

**Evidence:** `packages/i18n/src/locales/en.json:83`, `packages/i18n/src/locales/es.json:83`

#### Scenario: a service error reaches the user

- **GIVEN** an AppError whose message key comes from the packages/core service-error map
- **WHEN** an app translates that key
- **THEN** both catalogs hold a value for it
- **Test:** Not covered — no test compares the packages/core message keys with the catalogs; `docs/code-standards.md:686` records that check as not built

### Requirement: I18N-08 — Interpolations are single-brace ICU arguments

The i18n package SHALL write every interpolated value as a single-brace ICU argument, such as name in auth.logo.label and count in items.dashboard.listResults, with the same argument in both catalogs.

**Evidence:** `packages/i18n/src/locales/en.json:35`, `packages/i18n/src/locales/en.json:103`, `packages/i18n/src/locales/es.json:35`, `packages/i18n/src/locales/es.json:103`

#### Scenario: a translated message takes a value

- **GIVEN** a catalog value with an argument
- **WHEN** an app formats it with that argument
- **THEN** the argument is written in single braces, in both catalogs
- **Test:** Not covered — the parity test compares keys, not values; `docs/code-standards.md:595` records brace balance as not enforced

### Requirement: I18N-09 — The translation key type is the default language's catalog shape

The i18n package SHALL type a locale resource's translation as the shape of the English catalog,
the catalog of the default language, and SHALL type every entry of resources as a locale
resource, so that a catalog lacking a key of the English one fails the type check.

**Evidence:** `packages/i18n/src/locales/i18n.constant.ts:1`, `packages/i18n/src/locales/i18n.constant.ts:24`, `packages/i18n/src/locales/i18n.constant.ts:26-28`, `packages/i18n/src/locales/resources.constant.ts:13`

#### Scenario: the English catalog gains a key the Spanish one lacks

- **GIVEN** a key added to the English catalog only
- **WHEN** the package is type-checked
- **THEN** the Spanish entry of resources is rejected for lacking it
- **Test:** Not covered — a type, checked by `pnpm --filter @app/i18n typecheck`; the verify report of `openspec/changes/archive/2026-11-15-i18n/` records that run against a catalog missing one key

### Requirement: I18N-10 — The entry point exposes the language contract

The i18n package SHALL expose from its entry point LanguageEnum, SUPPORTED_LANGUAGES,
DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, FORMATTING_LOCALE, resources and APP_NAME, and the types
ILocaleResources, LanguageEnumType, SupportedLanguageType, IAppTranslator, TranslationKeyType and
TranslationValuesType.

**Evidence:** `packages/i18n/src/index.ts:1`, `packages/i18n/src/index.ts:6`, `packages/i18n/src/index.ts:13`, `packages/i18n/src/index.ts:14-18`

#### Scenario: an app imports the package

- **GIVEN** an app that depends on the i18n package
- **WHEN** it imports from the package entry point
- **THEN** those constants and types are available, and TranslationKeysType is not
- **Test:** `packages/i18n/src/__tests__/index.test.ts` › "the entry point exposes the language contract and the translator types"

### Requirement: I18N-11 — The catalogs carry a message per sign-in failure

The i18n package SHALL define, in every catalog, one message for each sign-in failure the web
auth gateway names: auth.error.emailNotConfirmed, auth.error.invalidCredentials,
auth.error.notConfigured and auth.error.rateLimited.

**Evidence:** `packages/i18n/src/locales/en.json:6-11`, `packages/i18n/src/locales/es.json:6-11`, `apps/web/src/lib/supabase/authGateway.constant.ts:14-22`

#### Scenario: a rejected sign-in reaches the user

- **GIVEN** the message key of each sign-in failure the web auth gateway names
- **WHEN** every catalog is searched for it
- **THEN** each catalog holds a value for every key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a message every catalog holds for each sign-in failure"

### Requirement: I18N-12 — One translator type for both apps

The i18n package SHALL define IAppTranslator, the translator both apps give their blocks, with no
translation runtime in it: `t(key, values?)` returns the message of a key in the active language
with its ICU arguments filled, `has(key)` tells whether the active catalog holds a string and
narrows it to a key, and `locale` is the active supported language. A key is
TranslationKeyType, a dot-separated path to a leaf of the English catalog, the catalog of the
default language, so a path the catalog lacks and a namespace are not keys; the values are
TranslationValuesType, the arguments by name, each a string or a number.

**Evidence:** `packages/i18n/src/translator/appTranslator.type.ts:8-18`, `packages/i18n/src/translator/appTranslator.type.ts:21-23`, `packages/i18n/src/translator/appTranslator.type.ts:29-36`, `packages/i18n/src/index.ts:14-18`

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

## Open questions

- **Q1** — `docs/code-standards.md:575` requires PascalCase namespace segments in catalog keys,
  but the catalogs use camelCase ones (`packages/i18n/src/locales/en.json:2`).
- **Q2** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-i18n/`: the key type
  comes from the English catalog, the catalog of the default language, and types every entry of
  resources (I18N-09).
