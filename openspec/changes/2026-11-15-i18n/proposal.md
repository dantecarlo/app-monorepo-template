# Proposal: show both apps in the active language, every string from the catalogs

> **Status:** open

## Why

Writing the living specs left two follow-ups on translation, rows F10 and F14 of
`docs/INIT_AND_HARNESS_PLAN.md`, and the app-behaviour change left two more catalog entries:

- **F10 (apps/web).** Client components are pinned to the default language: the root layout
  hands the client providers the English catalog (`apps/web/src/app/layout.tsx:59`), the providers
  fix the locale to `DEFAULT_LANGUAGE` (`apps/web/src/app/providers.tsx:44`) and the layout writes
  `lang="en"` (`apps/web/src/app/layout.tsx:65`). The language button cycles from the client locale,
  always English, so it always writes the Spanish code and can never switch back (WEB-15, WEB-16,
  web Q6).
- **F14 (packages/i18n, both apps).** English copy is written in the components and adapters of
  both apps: the toast's dismiss label, the async boundary's loading label, generic message and
  Retry button, the loading labels of `Button` and `LoadingSkeleton`, the item status labels and
  the items adapters' relative time ("just now", "3h ago") (web Q5, mobile Q4). The catalog key
  type comes from the Spanish catalog while the default language is English
  (`packages/i18n/src/locales/i18n.constant.ts:21`, I18N-09, i18n Q2).
- **Left by F.5.** No code reads `items.errorMessage` since a failed query shows its screen's
  `ErrorState` (F25), and every rejected web sign-in shows the generic message: the auth service
  wraps every gateway rejection in an `AppError` with `helper.error.generic`
  (`apps/web/src/services/Auth/auth.service.ts:21`), so a wrong password reads as "Something went
  wrong".

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"

The decisions the parent session made for this change, applied as stated:

- F10: client components read the active language, not the default one; the root layout writes
  `<html lang>` from the active locale instead of a fixed `"en"`; the language switcher changes
  what every client and server component shows, proved by a test that switches and reads
  translated text in a client component.
- F14: every user-facing string in the components and adapters of both apps comes from the i18n
  catalogs, in every catalog, the toast's dismiss label included; the catalog key type is derived
  from the template's default locale catalog, or from a locale-neutral key schema, not from the
  Spanish catalog; a test fails when a catalog lacks a key another catalog has; `pnpm
  verify:english` keeps Spanish inside `packages/i18n/src/locales/**` only.
- Left by F.5: remove the `items.errorMessage` entry; add an auth error key per sign-in failure
  the web auth gateway can report, so a rejected sign-in shows a specific message, and the same
  keys on mobile only where mobile reports the same failure.

## What changes

- **The key type (packages/i18n).** `TranslationKeysType` is the shape of the English catalog,
  the catalog of the default and fallback language, and `resources` is typed so every entry is a
  locale resource of that shape: a catalog that lacks a key of the English one fails typecheck.
  The default-locale catalog is chosen over a locale-neutral key schema because English is the
  language the template writes first and the one every lookup falls back to, so its catalog is
  already the complete key set; a separate schema would list the same keys a third time, kept by
  hand, with nothing reading it that the English catalog cannot serve.
- **Parity (packages/i18n).** The parity test compares every catalog of `resources` with every
  other, names the keys one holds and another lacks, and fails when a supported language has no
  catalog, so a third language is covered without editing the test.
- **The catalogs (packages/i18n).** `items.errorMessage` goes. New entries, in both catalogs:
  `auth.error.emailNotConfirmed`, `auth.error.invalidCredentials`, `auth.error.notConfigured` and
  `auth.error.rateLimited`; `items.status.active`, `items.status.archived` and
  `items.status.draft`; `items.age.justNow`, `items.age.minutes`, `items.age.hours` and
  `items.age.days`, each with a `{count}` argument but the first. The labels the blocks wrote by
  hand use the entries the catalogs already hold: `common.dismiss`, `common.loading`,
  `common.retry` and `helper.error.generic`.
- **The active locale on the web (F10).** The root layout keeps its document shell static, as
  Cache Components requires (a cookie read outside `<Suspense>` blocks the whole route), and
  renders the providers inside a `<Suspense>` through a server component that reads the
  request's locale and messages from next-intl (`getLocale`, `getMessages`), so the client
  providers receive the locale the `NEXT_LOCALE` cookie names. The routes' content therefore
  renders per request; only the document shell is prerendered. The shell writes the default
  language in `<html lang>`, and a pre-paint script beside the theme's replaces it with the
  cookie's supported language before first paint, the mechanism Next.js documents for an
  attribute of `<html>` that a cookie drives; the providers set it again whenever the locale
  changes, so a switch keeps it in step without a reload. `global-error.tsx`, which renders its
  own document, reads the cookie on the client. The cookie name, its lifetime, the time zone and
  the reduction of a value to a supported language get one owner in `src/i18n/`, which the
  request config, the switcher, the script and the error document share.
- **Sign-in failures (web).** The browser's auth gateway rejects a sign-in with an `AppError`
  that names the failure: the no-op gateway with `NOT_CONFIGURED`, and the Supabase gateway with
  `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED` or `RATE_LIMITED` for the Supabase Auth codes
  `invalid_credentials`, `email_not_confirmed` and `over_request_rate_limit`, each with its
  `auth.error.*` key, and with the service code `NETWORK_ERROR` and `helper.error.network` when
  Supabase cannot be reached. Any other rejection passes through and stays generic. The auth
  service already passes an `AppError` on unchanged, so the toast shows the specific message.
  Mobile signs no one in (MOBILE-31), so it reports none of these failures and maps none.
- **Copy from the catalogs (both apps).** The toast's dismiss label, the async boundary's loading
  label, generic message and Retry button, the busy labels of `Button` and `LoadingSkeleton`, and
  the item card's status label and age are read from the catalogs in the active language. The
  items adapters describe an item's age as a unit and a count (`{ unit: 'hours', count: 3 }`)
  instead of an English string, and the item card formats it with the `items.age` message of
  that unit.
- **Docs and skills.** `docs/architecture/web.md`, `docs/architecture/mobile.md`,
  `docs/code-standards.md` (§ 15.1 and the § 21 row), `docs/maps/global-map.md` and the skills
  that show the changed shapes say what ships.

## Out of scope

- A locale segment in the URL (`/[locale]/…`), which would let next-intl prerender each language:
  it changes every route and the middleware, which another branch is changing.
- The page metadata of the root layout (`title`, `description`), which stays static: the title is
  `APP_NAME`, and a per-request description would make the metadata request-bound too.
- The items services' sample records (titles, descriptions, categories), which stand in for
  backend data, not interface copy; and an error's own message, which the async boundary keeps
  showing (WEB-27).
- Typing next-intl's and i18next's `t` against the catalogs, and the catalog key casing (i18n Q1).
- The caption that shows "0 results" beside the `ErrorState` (F37) and the items query key that
  ignores `limit` (F38).

## Affected specs

- `openspec/specs/packages/i18n/spec.md`: modifies I18N-01 and I18N-09; adds I18N-11; open
  question Q2 closes at archive.
- `openspec/specs/apps/web/spec.md`: modifies WEB-09, WEB-13, WEB-15, WEB-16, WEB-20, WEB-27,
  WEB-37 and WEB-38; adds WEB-46 and WEB-47; open questions Q5 and Q6 close at archive.
- `openspec/specs/apps/mobile/spec.md`: modifies MOBILE-14, MOBILE-18 and MOBILE-36; adds
  MOBILE-46; open question Q4 closes at archive.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
