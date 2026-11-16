# Verify report: 2026-11-15-i18n

> **Verified:** 2026-11-16 at `b306bca`

## Scenarios

Each task wrote its scenario tests first and ran them before the code; the red column is what
that run showed. A test of behaviour the code already had is marked as such, and pins it.

| Requirement | Scenario | Test | Red before the code | Result |
| ----------- | -------- | ---- | ------------------- | ------ |
| I18N-01 | a key is added to one catalog only | `packages/i18n/src/locales/__tests__/resources.constant.test.ts` › "every catalog holds every key another catalog has" | run with `common.dismiss` removed from the Spanish catalog: `expected [ 'es lacks common.dismiss' ] to deeply equal []`; the catalog was restored | green |
| I18N-01 | a supported language has no catalog | `packages/i18n/src/locales/__tests__/resources.constant.test.ts` › "holds a catalog for every supported language" | existing behaviour: both languages had a catalog | green |
| I18N-09 | the English catalog gains a key the Spanish one lacks | Not covered — `pnpm --filter @app/i18n typecheck` with a probe key added to the English catalog only | before: exit 0, the key type came from the Spanish catalog and nothing typed `resources`; after: exit 2, TS2719 at `resources.constant.ts:12`, the Spanish entry lacks the probe key; the catalog was restored | exit 0 on the real catalogs |
| I18N-11 | a rejected sign-in reaches the user | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a message every catalog holds for each sign-in failure" | `SignInFailureEnum` did not exist: `Cannot convert undefined or null to object` | green |
| WEB-09 | the card content | `apps/web/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "renders the title, description, category and time" | `ItemAgeUnitEnum` did not exist: `Cannot read properties of undefined (reading 'HOURS')` | green |
| WEB-09 | the card in another language | `apps/web/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "shows the status and the age in the active language" | as above | green |
| WEB-09 | the age of an item | `apps/web/src/services/Items/__tests__/Items.adapter.test.ts` › "describes the age as a unit and a count" | `Cannot read properties of undefined (reading 'JUST_NOW')` | green |
| WEB-09 | the initials of a named author | `apps/web/src/services/Items/__tests__/Items.adapter.test.ts` › "builds initials from a two-word author name" | existing test | green |
| WEB-09 | an item with no author | `apps/web/src/services/Items/__tests__/Items.adapter.test.ts` › "falls back to "?" initials when author_name is null", `apps/web/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "omits the author label when empty" | existing tests | green |
| WEB-13 | the gateway accepts the credentials | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "signs in through the auth gateway and replaces the route with the home page" | existing test | green |
| WEB-13 | the sign-in is running | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "disables the submit button while the sign-in runs" | existing test | green |
| WEB-13 | the gateway rejects the credentials | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "queues the error toast and sets no field error when the sign-in fails" | existing test, pins the generic message for an unnamed failure | green |
| WEB-13 | the gateway names the failure | `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "shows the message of the failure the gateway names" | `Cannot read properties of undefined (reading 'INVALID_CREDENTIALS')`: the gateway named no failure | green |
| WEB-13 | the form hook hands the values to the sign-in | `apps/web/src/screens/Login/hooks/__tests__/useLoginForm.hook.test.ts` › "sends the values to the sign-in on a valid submit and clears errors" | existing test | green |
| WEB-13 | the service maps a rejection | `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "rejects with an AppError carrying a message key when the gateway rejects", "resolves the session the gateway returns" | existing tests | green |
| WEB-13 | the service keeps a named failure | `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "keeps the failure the gateway names" | existing behaviour: `buildServiceError` returns an `AppError` unchanged | green |
| WEB-13 | the adapter drops the token | `apps/web/src/services/Auth/__tests__/Auth.adapter.test.ts` › "keeps the user id and drops the access token" | existing test | green |
| WEB-15 | the providers receive a locale | `apps/web/src/app/__tests__/providers.test.tsx` › "renders client components in the locale it is given and sets the document language" | the language button read `en` under the Spanish locale and catalog: the providers pinned the default language | green |
| WEB-15 | the request names the locale | `apps/web/src/app/__tests__/LocaleProviders.test.tsx` › "hands the request's locale and messages to the client providers" | `@/app/LocaleProviders` did not resolve | green |
| WEB-15 | the static shell | `apps/web/src/app/__tests__/layout.test.tsx` › "writes the default language and the locale script in the static shell" | `@/i18n/noFlashLocale.constant` did not resolve: no locale script existed | green |
| WEB-15 | the pre-paint script | `apps/web/src/i18n/__tests__/noFlashLocale.constant.test.ts` › "sets the document language from a supported locale cookie", "keeps the default language for a missing or unsupported cookie" | the module did not resolve | green |
| WEB-15 | the locale cookie is read | `apps/web/src/i18n/__tests__/locale.helper.test.ts` › "keeps a supported language and turns anything else into the default", "reads the supported language of the locale cookie" | the module did not resolve | green |
| WEB-15 | the document language follows the locale | `apps/web/src/i18n/__tests__/useDocumentLanguage.hook.test.ts` › "sets the document language to the locale and follows it" | the module did not resolve | green |
| WEB-16 | from the first language to the next | `apps/web/src/components/ui/LanguageSwitcher/__tests__/useLanguageSwitcher.hook.test.ts` › "cycling from en advances to es and writes the cookie" | existing test, pins the cycle through the shared constants | green |
| WEB-16 | the cycle wraps around | `apps/web/src/components/ui/LanguageSwitcher/__tests__/useLanguageSwitcher.hook.test.ts` › "cycling wraps from es back to en" | existing test | green |
| WEB-16 | the button label | `apps/web/src/components/ui/LanguageSwitcher/__tests__/LanguageSwitcher.component.test.tsx` › "renders the active locale label" | existing test | green |
| WEB-16 | a switch reaches the client components and comes back | `apps/web/src/app/__tests__/providers.test.tsx` › "switches the client components to the next language and back" | after the first press the button still read `en`, so a second press would write the Spanish code again | green |
| WEB-20 | the Supabase settings are missing | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "returns a no-op gateway without the Supabase settings" | existing test | green |
| WEB-20 | the Supabase settings are present | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "creates one Supabase auth gateway per browser with the settings" | existing test, now also asserts the gateway delegates `getSession` to the Supabase one | green |
| WEB-20 | the page is rendered on the server | Not covered | — | — |
| WEB-27 | the children render | `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its children when nothing suspends or throws" | existing test | green |
| WEB-27 | the loading fallback | `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultLoading.component.test.tsx` › "renders a status region with a loading label", "renders the loading label of the active language" | the Spanish run read the English label | green |
| WEB-27 | the error fallback | `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "renders the error message when error is an Error instance", "renders fallback text when error is not an Error instance", "calls resetErrorBoundary when Retry is clicked", "has role=alert" | the fallback showed `An error occurred`, not the `helper.error.generic` message | green |
| WEB-27 | the error fallback in another language | `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "renders the generic message and Retry in the active language" | no element held the Spanish generic message | green |
| WEB-37 | a queued error toast is shown and dismissed | `apps/web/src/app/__tests__/providers.test.tsx` › "shows a queued error toast and removes it when Dismiss is pressed" | existing test | green |
| WEB-37 | no toast is queued | `apps/web/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "renders an empty live region when there are no toasts" | existing test | green |
| WEB-37 | the dismiss label in another language | `apps/web/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "labels the dismiss button in the active language" | no button named with the Spanish dismiss message | green |
| WEB-38 | a route crashes while rendering | `apps/web/src/app/__tests__/error.test.tsx` › "renders the generic error state for a render crash", "retries the segment when Try again is pressed" | existing tests | green |
| WEB-38 | the root layout crashes | `apps/web/src/app/__tests__/global-error.test.tsx` › "renders the generic error state in its own document" | existing test | green |
| WEB-38 | the root layout crashes for a Spanish reader | `apps/web/src/app/__tests__/global-error.test.tsx` › "renders the error state in the language of the locale cookie" | the html element held `lang="en"` under a Spanish cookie | green |
| WEB-38 | the error document reads the cookie on the client | `apps/web/src/i18n/__tests__/useCookieLanguage.hook.test.ts` › "returns the supported language of the locale cookie" | the module did not resolve | green |
| WEB-38 | the crash is reported | `apps/web/src/app/__tests__/error.test.tsx` › "reports the crash to observability once", `apps/web/src/app/__tests__/global-error.test.tsx` › "reports the root layout crash to observability once" | existing tests | green |
| WEB-38 | the report helper | `apps/web/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures an error once however often it is reported", "captures each distinct error" | existing tests | green |
| WEB-46 | the Supabase settings are missing | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "rejects a sign-in with the not-configured failure without the Supabase settings" | the rejection was the plain `Auth is not configured` error, not an `AppError` | green |
| WEB-46 | Supabase names the failure | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the failure of each Supabase Auth code a sign-in rejects with" | `Cannot read properties of undefined (reading 'INVALID_CREDENTIALS')` | green |
| WEB-46 | Supabase cannot be reached | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a network failure when Supabase cannot be reached" | the rejection was the raw retryable fetch error, not an `AppError` | green |
| WEB-46 | a failure the gateway does not name | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "passes any other sign-in rejection through" | existing behaviour: every rejection passed through | green |
| WEB-46 | every failure has its message | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a message every catalog holds for each sign-in failure" | `Cannot convert undefined or null to object` | green |
| WEB-47 | a busy button | `apps/web/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its loading indicator in the active language" | no element held the Spanish loading message | green |
| WEB-47 | a skeleton | `apps/web/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "labels the skeleton in the active language" | no status named with the Spanish loading message | green |
| MOBILE-14 | the age of an item | `apps/mobile/src/services/Items/__tests__/Items.adapter.test.ts` › "describes the age as a unit and a count" | `Cannot read properties of undefined (reading 'JUST_NOW')` | green |
| MOBILE-14 | an item created three hours ago | `apps/mobile/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "shows the status and the age in the active language" | `Cannot read properties of undefined (reading 'HOURS')` | green |
| MOBILE-18 | items have loaded | Not covered | — | — |
| MOBILE-18 | the count caption | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the result count once" | existing test | green |
| MOBILE-36 | a toast is added while a route is shown | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "shows a toast added to the store over the routes" | existing test | green |
| MOBILE-36 | the toast is dismissed | `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed" | existing test, now on the real English catalog | green |
| MOBILE-36 | the dismiss label in another language | `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "labels the dismiss control in the active language" | no button named with the Spanish dismiss message | green |
| MOBILE-46 | a busy button | `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its busy indicator in the active language" | no element labelled with the Spanish loading message | green |
| MOBILE-46 | a skeleton | `apps/mobile/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "labels the skeleton in the active language" | as above | green |
| MOBILE-46 | the loading fallback | `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultLoading.component.test.tsx` › "labels the loading region in the active language" | as above | green |
| MOBILE-46 | the error fallback | `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "shows the generic message and the retry label in the active language" | no element held the Spanish generic message | green |
| MOBILE-46 | an error is thrown | `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "shows the message of a thrown error" | existing behaviour | green |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-16, at `b306bca`. Everything before
  `verify:specs` passed, `turbo run lint typecheck test build format:check` included.
  `verify:specs` failed for the one expected reason: the living I18N-01 still cites the renamed
  parity test, "es.json and en.json have identical key sets", which the archive replaces. Every
  later gate then ran one by one and exited 0: `git-free-env:test`, `report:spec-drift:test`,
  `report:spec-drift` (it lists the three specs this change touches), `verify:english:test`,
  `verify:english`, `verify:instruction-entry:test`, `verify:instruction-entry`,
  `codex-budget:test`, `verify:maps`, `check:identity` (with `ATL_TEMPLATE_SELF=1`),
  `init-project:test`, `verify:pairing`, `verify:structure`, `verify:security`,
  `verify:theme-sync:test`, `verify:theme-sync`, `mcp:docs:test`, `verify:mcp-docs:test`,
  `verify:mcp-docs`, `docs:diagrams:check`, `pnpm --filter @app/i18n test` and `pnpm knip`.
- `pnpm --filter @app/web build`: exit 0. With Cache Components on, `/`, `/login` and
  `/_not-found` are partial prerenders: a static document shell and per-request content.
- `pnpm --filter @app/mobile export:web`: exit 0; `apps/mobile/dist-web` was deleted afterwards.
- Runtime probe of the built web app (`next start`): `/login` with a Spanish `NEXT_LOCALE`
  cookie served the Spanish labels of client components (the language button and the sign-in
  button) and the locale script; without the cookie, the English ones. The shell's `lang` is the
  default language in both, as designed: the script sets it before paint in a browser.

## Not verified

- I18N-09 is a type, proven by typecheck and recorded above, not by a test.
- WEB-20, the server branch of the gateway: happy-dom always defines `window`.
- MOBILE-18, five item cards in order: the list card test mocks the item card away.
- The pre-paint script in a real browser before first paint; the test runs its text against
  happy-dom's document.
- The WEB-46 tests build errors of the shape supabase-js rejects with (its `name`, `status` and
  `code`), because a test may not import a vendor SDK; the network case's red was observed
  against the SDK's own `AuthRetryableFetchError` before the tests moved to that shape.
