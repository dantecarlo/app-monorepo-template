# Delta: packages/i18n

> **Change:** `2026-11-15-i18n`

## ADDED Requirements

### Requirement: I18N-11 — The catalogs carry a message per sign-in failure

The i18n package SHALL define, in every catalog, one message for each sign-in failure the web
auth gateway names: auth.error.emailNotConfirmed, auth.error.invalidCredentials,
auth.error.notConfigured and auth.error.rateLimited.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a rejected sign-in reaches the user

- **GIVEN** the message key of each sign-in failure the web auth gateway names
- **WHEN** every catalog is searched for it
- **THEN** each catalog holds a value for every key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a message every catalog holds for each sign-in failure"

## MODIFIED Requirements

### Requirement: I18N-01 — Every catalog holds the same keys

The i18n package SHALL hold, in resources, a catalog for every supported language, and SHALL keep
every catalog on one identical set of dot-separated leaf keys.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: I18N-09 — The translation key type is the default language's catalog shape

The i18n package SHALL type a locale resource's translation as the shape of the English catalog,
the catalog of the default language, and SHALL type every entry of resources as a locale
resource, so that a catalog lacking a key of the English one fails the type check.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the English catalog gains a key the Spanish one lacks

- **GIVEN** a key added to the English catalog only
- **WHEN** the package is type-checked
- **THEN** the Spanish entry of resources is rejected for lacking it
- **Test:** Not covered — a type, checked by `pnpm --filter @app/i18n typecheck`; the verify report records that run against a catalog missing one key
