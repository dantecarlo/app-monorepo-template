# Proposal: one translator for both apps, behind each app's lib/i18n

> **Status:** archived — 2026-11-18

## Why

Decision 51 of `docs/INIT_AND_HARNESS_PLAN.md` puts every library outside the core stack behind
one adapter of the template, and the plan's decisions taken as recommended (decision 58) ask for
one i18n API for both apps, `IAppTranslator` in `@app/i18n`. F.8 unit 1 registered every package
and froze the imports that broke its seam: 82 of them are i18n, 51 of `next-intl` across the web
app and 31 of `react-i18next` across the mobile app, from components, screens, hooks, tests and
mocks alike (`eslint-dependency-seam-allowlist.json`). Today a block reads `useTranslations` in
the web and `useTranslation` on mobile, with namespaces in one and key prefixes in the other, so
the same screen reads differently in each app and swapping a translation runtime rewrites every
block; its tests mock the vendor, so they would be rewritten too.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "every package that is not core must be decoupled and have
  an adapter, in ui as a wrapper for example, and so think a strategy for each one; currently the
  Certifipago project already more or less does it, but evaluate and analyze and put it in the
  plan"
- 2026-11-15 (translated from Spanish): "Not only the UI libraries, but all the libraries
  themselves."
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **One translator type, in packages/i18n.** `IAppTranslator`, exported from `@app/i18n`, holds
  `t(key, values?)`, `has(key)` and `locale`. A key is `TranslationKeyType`, a dot-separated path
  to a leaf of the English catalog, the catalog of the default language (F.6), so a key the
  catalog lacks, or a namespace, fails the type check; `values` are the message's ICU arguments;
  `has` narrows a string, such as an `AppError` message key, to a key; `locale` is the active
  supported language. The type names no runtime.
- **The web implementation, in `apps/web/src/lib/i18n/`.** `useAppTranslator()` wraps next-intl's
  `useTranslations` and `useLocale` for client components; `getAppTranslator()`, `getAppLocale()`
  and `getAppMessages()` wrap `next-intl/server` for server components; `AppI18nProvider` wraps
  `NextIntlClientProvider` with the UTC time zone. The request config keeps the one
  `getRequestConfig` call and moves its resolution, the cookie, the routing locale and the
  default, into `apps/web/src/i18n/requestConfig.helper.ts`, so a test runs it without the
  vendor.
- **The mobile implementation, in `apps/mobile/src/lib/i18n/`.** `useAppTranslator()` wraps
  react-i18next's `useTranslation`, with the same shape: a screen reads the same in either app.
  The language setter stays `setLanguage` of the same folder.
- **Every importer migrated.** All 82 frozen imports move to the project module: blocks and
  screens call `useAppTranslator()` with full keys, `useAppMutation` resolves an error key with
  `has`, the language switchers read `locale`, the providers and the error document render
  `AppI18nProvider`, and every test mocks `@/lib/i18n/…` or renders with the real catalogs through
  the app's test helper (`renderWithIntl`, `renderWithI18n`), never the vendor. Their 82 entries
  leave `eslint-dependency-seam-allowlist.json` (143 to 61).
- **The seams narrowed.** In `.agents/contracts/dependencies.json`, `next-intl` may be imported
  only by `apps/web/src/lib/i18n/**`, the request config `apps/web/src/i18n/request.config.ts`
  (next-intl loads it by path) and `apps/web/next.config.ts` (its plugin); `react-i18next`,
  `i18next`, `i18next-icu`, `@formatjs/intl-pluralrules` and `expo-localization` only by
  `apps/mobile/src/lib/i18n/**`. Test infrastructure (`src/test/**`) keeps admitting any
  registered package.
- **No visible change, with its proof.** One test per app renders a sample of screens and blocks
  in English and in Spanish and compares what they show with a record taken at the base,
  `571d25b`: the record names the catalog message, and its values, behind every piece of visible
  text and accessible label, so it holds no copy of either language; the test renders the sample
  once with a catalog whose every value is its own key, which must match the record, and once with
  the real catalogs, which must show the record's messages in that language's copy. Every existing
  component and screen test stays green; where one asserted through a vendor mock, it asserts the
  same message through the project module.
- **The docs.** `docs/code-standards.md` § 15, `docs/architecture/web.md` and `mobile.md`,
  `docs/maps/global-map.md`, the `lib` skill and the `feature` and `service` skills, whose
  snippets import `next-intl`; the manifest's i18n capability removes `apps/web/src/lib/i18n/**`
  with the rest of i18n.

## Out of scope

- **The key-value storage of the language choice.** `apps/mobile/src/lib/i18n/i18n.config.ts`
  still imports AsyncStorage; F.8 unit 4 moves it onto the storage port.
- **A namespace or a key prefix.** The translator takes full keys only, so a key is found by
  search in both apps; nothing asked for a scoped translator.
- **Rich text, dates and number formats.** No block uses them through the vendor today; the type
  carries `t`, `has` and `locale`, and a later need extends `IAppTranslator` in packages/i18n.
- **The catalogs.** No message, key or argument changes.
- **The other frozen imports**, units 3 to 8.

## Affected specs

- `openspec/specs/packages/i18n/spec.md`: added I18N-12; modified I18N-10.
- `openspec/specs/apps/web/spec.md`: added WEB-58, WEB-59, WEB-60, WEB-61.
- `openspec/specs/apps/mobile/spec.md`: added MOBILE-57, MOBILE-58, MOBILE-59.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
