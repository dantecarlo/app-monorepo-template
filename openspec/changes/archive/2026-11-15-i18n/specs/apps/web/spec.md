# Delta: apps/web

> **Change:** `2026-11-15-i18n`

## ADDED Requirements

### Requirement: WEB-46 — The auth gateway names each sign-in failure

The web app SHALL reject a sign-in through the browser's auth gateway with an `AppError` that
names the failure and carries the original rejection as its cause: `NOT_CONFIGURED` from the
no-op gateway; `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED` and `RATE_LIMITED` for the Supabase
Auth codes `invalid_credentials`, `email_not_confirmed` and `over_request_rate_limit`, each with
its `auth.error` message key; and `NETWORK_ERROR` with `helper.error.network` when Supabase cannot
be reached. Any other rejection SHALL pass through unchanged, and the auth service makes it the
generic error (WEB-13).

**Evidence:** written at apply time, when the code exists.

#### Scenario: the Supabase settings are missing

- **GIVEN** a browser with no Supabase URL or anon key
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with the `NOT_CONFIGURED` failure and the `auth.error.notConfigured` key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "rejects a sign-in with the not-configured failure without the Supabase settings"

#### Scenario: Supabase names the failure

- **GIVEN** a Supabase gateway whose sign-in rejects with the code `invalid_credentials`, `email_not_confirmed` or `over_request_rate_limit`
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with the failure of that code, its `auth.error` key and the Supabase error as its cause
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the failure of each Supabase Auth code a sign-in rejects with"

#### Scenario: Supabase cannot be reached

- **GIVEN** a Supabase gateway whose sign-in rejects with a retryable fetch error
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with the `NETWORK_ERROR` code and the `helper.error.network` key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a network failure when Supabase cannot be reached"

#### Scenario: a failure the gateway does not name

- **GIVEN** a Supabase gateway whose sign-in rejects with an error of another code
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with that same error
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "passes any other sign-in rejection through"

#### Scenario: every failure has its message

- **GIVEN** the message key of every failure the gateway names
- **WHEN** every catalog is searched for it
- **THEN** each catalog holds a value for every key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a message every catalog holds for each sign-in failure"

### Requirement: WEB-47 — The busy labels come from the catalogs

The web app SHALL label the busy indicator of `Button` and the `LoadingSkeleton` with the
`common.loading` message of the active language.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a busy button

- **GIVEN** a button whose action is running, under the Spanish locale
- **WHEN** it renders
- **THEN** its loading indicator reads the Spanish loading message
- **Test:** `apps/web/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its loading indicator in the active language"

#### Scenario: a skeleton

- **GIVEN** a loading skeleton, under the Spanish locale
- **WHEN** it renders
- **THEN** its status region is named with the Spanish loading message
- **Test:** `apps/web/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "labels the skeleton in the active language"

## MODIFIED Requirements

### Requirement: WEB-09 — Each item card shows the item and its author

The web app SHALL render each item with its title, description, category, author name, age and
status label, beside an avatar holding the author's initials, at most two, or a question mark when
the item has no author. The age and the status label SHALL be the `items.age` message of the
item's age unit and the `items.status` message of its status, in the active language; the items
adapter SHALL describe the age as a unit and a count: just now under one minute, then whole
minutes, hours or days.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the card content

- **GIVEN** an item view model
- **WHEN** its card renders
- **THEN** the title, description, category and age are shown
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "renders the title, description, category and time"

#### Scenario: the card in another language

- **GIVEN** an active item two hours old, under the Spanish locale
- **WHEN** its card renders
- **THEN** its age and status read the Spanish `items.age.hours` and `items.status.active` messages
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "shows the status and the age in the active language"

#### Scenario: the age of an item

- **GIVEN** items created under a minute, forty minutes, five hours and three days ago
- **WHEN** they are adapted
- **THEN** their ages are just now with a count of zero, 40 minutes, 5 hours and 3 days, each as a unit and a count
- **Test:** `apps/web/src/services/Items/__tests__/Items.adapter.test.ts` › "describes the age as a unit and a count"

#### Scenario: the initials of a named author

- **GIVEN** an item whose author name has two words
- **WHEN** it is adapted for display
- **THEN** its initials are the first letter of each word
- **Test:** `apps/web/src/services/Items/__tests__/Items.adapter.test.ts` › "builds initials from a two-word author name"

#### Scenario: an item with no author

- **GIVEN** an item with no author name
- **WHEN** it is adapted and rendered
- **THEN** the initials are a question mark and no author name is shown
- **Test:** `apps/web/src/services/Items/__tests__/Items.adapter.test.ts` › "falls back to "?" initials when author_name is null"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "omits the author label when empty"

### Requirement: WEB-13 — A valid login submit signs in through the auth gateway

The web app SHALL, on a login submit that passes validation, clear the field errors and send the
email and password to the auth gateway's `signIn`, through the auth service, showing the
submitting state while the request runs; when it resolves it SHALL replace the route with `/`,
and when it rejects it SHALL queue an error toast with the message resolved from the error's
`messageKey`, the message of the failure the gateway names (WEB-46) or else the generic one, set
no field error and leave the route unchanged. The sign-in result the screen keeps holds the user
id and not the access token.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the gateway accepts the credentials

- **GIVEN** the login screen and a gateway that resolves a session
- **WHEN** a valid email and password are submitted
- **THEN** the gateway's `signIn` receives them once and the route is replaced with `/`
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "signs in through the auth gateway and replaces the route with the home page"

#### Scenario: the sign-in is running

- **GIVEN** the login screen and a gateway that has not answered
- **WHEN** a valid email and password are submitted
- **THEN** the submit button is disabled and shows the submitting label
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "disables the submit button while the sign-in runs"

#### Scenario: the gateway rejects the credentials

- **GIVEN** the login screen and a gateway that rejects with an error it does not name
- **WHEN** a valid email and password are submitted
- **THEN** an error toast with the generic message is queued, no field error is shown, and the route is not replaced
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "queues the error toast and sets no field error when the sign-in fails"

#### Scenario: the gateway names the failure

- **GIVEN** the login screen and a gateway that rejects with the invalid-credentials failure
- **WHEN** a valid email and password are submitted
- **THEN** the error toast shows the `auth.error.invalidCredentials` message, not the generic one
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "shows the message of the failure the gateway names"

#### Scenario: the form hook hands the values to the sign-in

- **GIVEN** the form hook holding a valid email and an 8-character password
- **WHEN** the form is submitted
- **THEN** the errors are empty and the gateway receives the values
- **Test:** `apps/web/src/screens/Login/hooks/__tests__/useLoginForm.hook.test.ts` › "sends the values to the sign-in on a valid submit and clears errors"

#### Scenario: the service maps a rejection

- **GIVEN** a gateway whose `signIn` rejects with a plain error, or resolves a session
- **WHEN** the auth service signs in
- **THEN** it rejects with an `AppError` carrying a message key, or resolves that session
- **Test:** `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "rejects with an AppError carrying a message key when the gateway rejects"
- **Test:** `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "resolves the session the gateway returns"

#### Scenario: the service keeps a named failure

- **GIVEN** a gateway whose `signIn` rejects with an `AppError` naming a failure
- **WHEN** the auth service signs in
- **THEN** it rejects with that same error
- **Test:** `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "keeps the failure the gateway names"

#### Scenario: the adapter drops the token

- **GIVEN** a session holding an access token
- **WHEN** it is adapted for the screen
- **THEN** the result holds the user id and no access token
- **Test:** `apps/web/src/services/Auth/__tests__/Auth.adapter.test.ts` › "keeps the user id and drops the access token"

### Requirement: WEB-15 — Client components render in the active language

The web app SHALL render every client component with the locale and the catalog the request
config resolves (WEB-14), which a server component reads inside a `<Suspense>` of the root layout
and hands to the client providers, and SHALL keep the html element's language attribute equal to
that locale: the static document shell writes the default language, a pre-paint script replaces
it with the supported language the `NEXT_LOCALE` cookie names, and the providers set it whenever
their locale changes.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the providers receive a locale

- **GIVEN** the client providers given the Spanish locale and its catalog
- **WHEN** a client component renders inside them
- **THEN** it shows the Spanish messages and the Spanish locale, and the document language is Spanish
- **Test:** `apps/web/src/app/__tests__/providers.test.tsx` › "renders client components in the locale it is given and sets the document language"

#### Scenario: the request names the locale

- **GIVEN** a request whose locale resolves to Spanish
- **WHEN** the locale providers render a client component
- **THEN** the component shows the Spanish messages and the Spanish locale
- **Test:** `apps/web/src/app/__tests__/LocaleProviders.test.tsx` › "hands the request's locale and messages to the client providers"

#### Scenario: the static shell

- **GIVEN** the root layout
- **WHEN** it renders its document
- **THEN** the html element holds the default language and the head holds the locale script
- **Test:** `apps/web/src/app/__tests__/layout.test.tsx` › "writes the default language and the locale script in the static shell"

#### Scenario: the pre-paint script

- **GIVEN** a `NEXT_LOCALE` cookie naming a supported language, an unsupported one, or none
- **WHEN** the locale script runs
- **THEN** the document language is the supported one, or stays the default
- **Test:** `apps/web/src/i18n/__tests__/noFlashLocale.constant.test.ts` › "sets the document language from a supported locale cookie"
- **Test:** `apps/web/src/i18n/__tests__/noFlashLocale.constant.test.ts` › "keeps the default language for a missing or unsupported cookie"

#### Scenario: the locale cookie is read

- **GIVEN** a cookie string, or a value, naming a supported language, an unsupported one, or none
- **WHEN** it is reduced to a supported language
- **THEN** a supported value is kept and anything else is the default language
- **Test:** `apps/web/src/i18n/__tests__/locale.helper.test.ts` › "keeps a supported language and turns anything else into the default"
- **Test:** `apps/web/src/i18n/__tests__/locale.helper.test.ts` › "reads the supported language of the locale cookie"

#### Scenario: the document language follows the locale

- **GIVEN** the document language hook given a locale
- **WHEN** it renders, and renders again with another locale
- **THEN** the document language is each locale in turn
- **Test:** `apps/web/src/i18n/__tests__/useDocumentLanguage.hook.test.ts` › "sets the document language to the locale and follows it"

### Requirement: WEB-16 — The language button cycles the locale cookie

The web app SHALL, when the language button is pressed, write the supported language that follows
the active locale to the `NEXT_LOCALE` cookie for one year on the root path with SameSite Lax, and
refresh the router, so the server renders the next language and every client component receives
it; the button shows the active locale.

**Evidence:** written at apply time, when the code exists.

#### Scenario: from the first language to the next

- **GIVEN** the active locale is English
- **WHEN** the language is cycled
- **THEN** the cookie holds the Spanish code and the router refreshes once
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/__tests__/useLanguageSwitcher.hook.test.ts` › "cycling from en advances to es and writes the cookie"

#### Scenario: the cycle wraps around

- **GIVEN** the active locale is Spanish
- **WHEN** the language is cycled
- **THEN** the cookie holds the English code
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/__tests__/useLanguageSwitcher.hook.test.ts` › "cycling wraps from es back to en"

#### Scenario: the button label

- **GIVEN** the active locale is English
- **WHEN** the language button renders
- **THEN** its text is the English code
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/__tests__/LanguageSwitcher.component.test.tsx` › "renders the active locale label"

#### Scenario: a switch reaches the client components and comes back

- **GIVEN** the client providers in English, a refresh that runs the request config on the cookie and hands its result to the providers
- **WHEN** the language button is pressed twice
- **THEN** the client components show the Spanish messages and code after the first press, and the English ones again after the second
- **Test:** `apps/web/src/app/__tests__/providers.test.tsx` › "switches the client components to the next language and back"

### Requirement: WEB-20 — The auth gateway is a no-op without Supabase settings

The web app SHALL give the auth provider and the auth service one gateway: a no-op gateway during
server rendering and in a browser where `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset, so the session resolves to none and a sign-in rejects
with the not-configured failure (WEB-46); otherwise one Supabase auth gateway per browser, whose
sign-in names its failures (WEB-46).

**Evidence:** written at apply time, when the code exists.

#### Scenario: the Supabase settings are missing

- **GIVEN** a browser with no Supabase URL or anon key
- **WHEN** the gateway is requested
- **THEN** its session resolves to none, its sign-in rejects, and no Supabase gateway is created
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "returns a no-op gateway without the Supabase settings"

#### Scenario: the Supabase settings are present

- **GIVEN** a browser with both public Supabase settings
- **WHEN** the gateway is requested twice
- **THEN** one Supabase auth gateway is created, and the same gateway over it is returned both times
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "creates one Supabase auth gateway per browser with the settings"

#### Scenario: the page is rendered on the server

- **GIVEN** server rendering
- **WHEN** the providers mount
- **THEN** the auth provider receives the no-op gateway
- **Test:** Not covered — happy-dom always defines `window`, so no test renders the server branch.

### Requirement: WEB-27 — The async boundary shows a loading status and a retryable error

The web app SHALL, inside an async boundary, render a status region holding the `common.loading`
message while the children suspend, and, when they throw, an alert with the error's message, or
the `helper.error.generic` message for a non-error value, and a button labelled with the
`common.retry` message that resets the boundary, every message in the active language.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the children render

- **GIVEN** children that neither suspend nor throw
- **WHEN** the boundary renders
- **THEN** the children are shown
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its children when nothing suspends or throws"

#### Scenario: the loading fallback

- **GIVEN** the default loading fallback, under the English or the Spanish locale
- **WHEN** it renders
- **THEN** a status region holding that language's loading message is shown
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultLoading.component.test.tsx` › "renders a status region with a loading label"
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultLoading.component.test.tsx` › "renders the loading label of the active language"

#### Scenario: the error fallback

- **GIVEN** the default error fallback for a thrown error, or for a thrown value that is not an error
- **WHEN** it renders and Retry is pressed
- **THEN** the error message, or the generic message, was shown in an alert and the boundary is reset once
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "renders the error message when error is an Error instance"
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "renders fallback text when error is not an Error instance"
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "calls resetErrorBoundary when Retry is clicked"
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "has role=alert"

#### Scenario: the error fallback in another language

- **GIVEN** the default error fallback for a thrown value that is not an error, under the Spanish locale
- **WHEN** it renders
- **THEN** the generic message and the retry button read the Spanish messages
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "renders the generic message and Retry in the active language"

### Requirement: WEB-37 — The root providers show the toast viewport

The web app SHALL mount the toast viewport inside the root providers, rendering every toast of the
toast store, with its message and a dismiss button, labelled with the `common.dismiss` message of
the active language, that removes it, in a polite status region.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a queued error toast is shown and dismissed

- **GIVEN** the root providers render a page
- **WHEN** an error toast is queued and its Dismiss button is then pressed
- **THEN** the toast's message is shown, and after the press it is gone
- **Test:** `apps/web/src/app/__tests__/providers.test.tsx` › "shows a queued error toast and removes it when Dismiss is pressed"

#### Scenario: no toast is queued

- **GIVEN** an empty toast store
- **WHEN** the viewport renders
- **THEN** it renders an empty status region
- **Test:** `apps/web/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "renders an empty live region when there are no toasts"

#### Scenario: the dismiss label in another language

- **GIVEN** a queued toast, under the Spanish locale
- **WHEN** the viewport renders
- **THEN** its dismiss button is named with the Spanish dismiss message
- **Test:** `apps/web/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "labels the dismiss button in the active language"

### Requirement: WEB-38 — A render crash shows the error state and is reported once

The web app SHALL catch a render crash below the root layout with the root `error.tsx` boundary,
and a crash of the root layout itself with `global-error.tsx`, which renders its own document in
the supported language the `NEXT_LOCALE` cookie names, else the default language, with that
language on its html element; each SHALL show the error state with its generic copy and a Try
again button that retries the segment, and report the error it caught to the observability port
once, through `reportBoundaryError` under `src/lib/observability/`, however often the boundary
renders.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a route crashes while rendering

- **GIVEN** a route below the root layout throws while rendering
- **WHEN** the root error boundary renders and Try again is pressed
- **THEN** the generic error title and message are shown in an alert, and the segment is retried once
- **Test:** `apps/web/src/app/__tests__/error.test.tsx` › "renders the generic error state for a render crash"
- **Test:** `apps/web/src/app/__tests__/error.test.tsx` › "retries the segment when Try again is pressed"

#### Scenario: the root layout crashes

- **GIVEN** the root layout throws while rendering
- **WHEN** the global error boundary renders
- **THEN** it renders its own html and body, holding the generic error state
- **Test:** `apps/web/src/app/__tests__/global-error.test.tsx` › "renders the generic error state in its own document"

#### Scenario: the root layout crashes for a Spanish reader

- **GIVEN** a `NEXT_LOCALE` cookie naming Spanish, and the root layout throws while rendering
- **WHEN** the global error boundary renders
- **THEN** the error state reads the Spanish messages and its html element holds the Spanish language
- **Test:** `apps/web/src/app/__tests__/global-error.test.tsx` › "renders the error state in the language of the locale cookie"

#### Scenario: the error document reads the cookie on the client

- **GIVEN** a `NEXT_LOCALE` cookie naming Spanish
- **WHEN** the cookie language hook renders on the client
- **THEN** it returns the Spanish language
- **Test:** `apps/web/src/i18n/__tests__/useCookieLanguage.hook.test.ts` › "returns the supported language of the locale cookie"

#### Scenario: the crash is reported

- **GIVEN** a boundary holding a caught error
- **WHEN** it renders, and renders again with the same error
- **THEN** the observability port captures that error once, with the boundary source
- **Test:** `apps/web/src/app/__tests__/error.test.tsx` › "reports the crash to observability once"
- **Test:** `apps/web/src/app/__tests__/global-error.test.tsx` › "reports the root layout crash to observability once"

#### Scenario: the report helper

- **GIVEN** the boundary report helper over an observability port
- **WHEN** one error is reported twice and another once
- **THEN** the port captures each error once
- **Test:** `apps/web/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures an error once however often it is reported"
- **Test:** `apps/web/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures each distinct error"
