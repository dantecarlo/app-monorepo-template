# apps/web — living spec

> **Governs:** `apps/web/src`, `apps/web/next.config.ts`, `apps/web/instrumentation.ts`, `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts`
> **ID prefix:** `WEB`
> **Derived from:** `docs/architecture/web.md`, `docs/architecture/shared.md`, `docs/infrastructure.md`, `docs/e2e.md`, `docs/code-standards.md`, `AGENTS.md`
> **Verified against the code:** 2026-11-17 at `5590d72`

## Purpose

The web app is the Next.js App Router consumer surface. It serves the home route (the cached
items summary server screen and the client items dashboard), the sign-in route and the Turnstile
verify API route, and renders their loading, empty and error states. It owns the edge guarantees
wired in its own code: the origin-lock middleware, the security and image cache headers, the
Sentry setup with PII scrubbing, and the single query-error capture path. It leaves the domain
types, ports, `scrubPII` and `sanitizeQueryKey` to packages/core, the origin guard and Turnstile
verdicts to packages/cloudflare, the Supabase clients and auth gateway to packages/supabase, the
translation catalogs to packages/i18n, and the theme values to packages/tokens.

## Requirements

### Requirement: WEB-01 — The home route composes the summary and the dashboard

The web app SHALL render, at the root route, the items summary server screen inside a Suspense
boundary followed by the client items dashboard screen, inside the page's `main` element.

**Evidence:** `apps/web/src/app/page.tsx:7-14`

#### Scenario: the dashboard parts render

- **GIVEN** the items service resolves the sample items
- **WHEN** the items dashboard screen renders
- **THEN** it shows the welcome text and title, the main navigation landmark and the View all items button
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "renders the dashboard header"
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "renders the nav bar"
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "renders the view all button"

#### Scenario: the served home page shows a glass surface

- **GIVEN** the built app served by the production server
- **WHEN** a browser opens the root route
- **THEN** at least one glass card is visible and its computed style matches the locked glass recipe
- **Test:** `e2e/glass.e2e.ts` › "glass-card computed style matches the locked recipe"

#### Scenario: the summary streams behind its boundary

- **GIVEN** the summary data is not cached yet
- **WHEN** the root route renders
- **THEN** the dashboard renders while the summary card waits inside its Suspense boundary
- **Test:** Not covered — no test renders `apps/web/src/app/page.tsx` or the async summary screen.

### Requirement: WEB-02 — The items summary shows four counts

The web app SHALL render, on the server, a summary card with the total, active, draft and archived
item counts computed from the items service, labelled with the `items.summary` translation keys.

**Evidence:** `apps/web/src/screens/ItemsSummary/ItemsSummary.screen.tsx:7-41`, `apps/web/src/services/ItemsSummary/itemsSummary.service.ts:24-31`, `apps/web/src/services/ItemsSummary/ItemsSummary.adapter.ts:8-15`

#### Scenario: the counts follow the item statuses

- **GIVEN** the items service returns one active, one archived and one draft item
- **WHEN** the summary service runs
- **THEN** it returns a total of 3 and a count of 1 for each status
- **Test:** `apps/web/src/services/ItemsSummary/__tests__/itemsSummary.service.test.ts` › "returns summary counts that reflect the mocked item list"

#### Scenario: the screen loader forwards the summary

- **GIVEN** the summary service resolves a view model
- **WHEN** the summary screen's loader runs
- **THEN** it returns that view model unchanged
- **Test:** `apps/web/src/screens/ItemsSummary/__tests__/loadItemsSummary.service.test.ts` › "returns the summary view model from the domain service"

#### Scenario: the card renders the counts

- **GIVEN** a summary view model
- **WHEN** the summary server screen renders
- **THEN** the card shows each count beside its translated label
- **Test:** Not covered — no test renders the async server component `apps/web/src/screens/ItemsSummary/ItemsSummary.screen.tsx`.

### Requirement: WEB-03 — The items summary is cached across requests

The web app SHALL cache the items summary result across requests with the `minutes` cache-life
profile under the `items-summary` cache tag.

**Evidence:** `apps/web/src/services/ItemsSummary/itemsSummary.service.ts:1`, `apps/web/src/services/ItemsSummary/itemsSummary.service.ts:26-27`, `apps/web/src/services/ItemsSummary/itemsSummary.constant.ts:4-7`, `apps/web/next.config.ts:33`

#### Scenario: a second request reuses the cached summary

- **GIVEN** a request has computed the items summary
- **WHEN** another request renders the summary within the cache-life profile
- **THEN** the cached result is served until it expires or its tag is revalidated
- **Test:** Not covered — the only service test mocks `cacheLife` and `cacheTag` from `next/cache`, so no test observes the cache.

### Requirement: WEB-04 — The dashboard shows placeholders while items load

The web app SHALL, while the items query is loading, render skeleton rows with the status role in
the items list and a dash in place of each count on the stats card.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:48-58`, `apps/web/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:28-32`

#### Scenario: the list shows skeletons

- **GIVEN** the items service has not resolved
- **WHEN** the dashboard renders
- **THEN** at least one element with the status role is shown
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows loading skeletons while fetching"
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "is in loading state initially"

#### Scenario: the stats card shows dashes

- **GIVEN** the stats card is told the items are loading
- **WHEN** it renders
- **THEN** it shows a dash in place of the counts
- **Test:** `apps/web/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows dash placeholder when loading"

### Requirement: WEB-05 — The dashboard lists the loaded items with their counts

The web app SHALL, once the items load, render one item card per item, the result count in the
list header, the total item count and the count of items whose status is active.

**Evidence:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:64-70`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:33-37`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:63-64`

#### Scenario: the item cards appear

- **GIVEN** the items service resolves the sample items
- **WHEN** the dashboard finishes loading
- **THEN** the item titles are shown
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "renders item list after loading"

#### Scenario: the counts are derived from the items

- **GIVEN** the items service resolves fixtures of which one is active
- **WHEN** the dashboard hook settles
- **THEN** it exposes one view model per item, a total equal to the item count and an active count of 1
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "exposes adapted view models and derived counts on success"

#### Scenario: the cards show the counts

- **GIVEN** loaded counts
- **WHEN** the stats card and the list header render
- **THEN** the stats card shows the total and the list header shows the result count
- **Test:** `apps/web/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "renders stats when not loading"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "renders the list title and item count"

### Requirement: WEB-06 — The dashboard shows an empty state for no items

The web app SHALL render the empty state with the `items.dashboard.listEmpty` message when the
loaded item list is empty.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:61-62`

#### Scenario: the service returns no items

- **GIVEN** the items service resolves an empty list
- **WHEN** the dashboard finishes loading
- **THEN** the empty-list message is shown
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows empty-state message when items query returns an empty array"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "renders empty state when items list is empty"

### Requirement: WEB-07 — A failed items load shows the error state

The web app SHALL, when the items query fails, render the error state with its generic copy in
the items list, in place of the items and the empty state, with a Try again button that runs the
items query again, show no result count in the list header, and queue no toast.

**Evidence:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:51`, `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:79-81`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:33-37`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:59-60`, `apps/web/src/lib/query/useAppQuery.hook.ts:21`

#### Scenario: the items service rejects

- **GIVEN** the items service rejects
- **WHEN** the dashboard settles
- **THEN** the list shows the error state alert with its generic title, no empty-list message, and the toast store holds no toast
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows the error state and queues no toast when the items query fails"

#### Scenario: the list header shows no count

- **GIVEN** the items list card told the items failed to load
- **WHEN** it renders
- **THEN** it shows the error state alert with its generic title, and no result count
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state and no result count when the items failed to load"

#### Scenario: Try again after a failure

- **GIVEN** the dashboard showing the error state, and an items service that now resolves
- **WHEN** Try again is pressed
- **THEN** the items service is called again and the items are listed
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "loads the items again when Try again is pressed after a failure"

#### Scenario: the hook reports the failure

- **GIVEN** the items service rejects
- **WHEN** the dashboard hook settles
- **THEN** it reports the failure and an empty item list, and its retry calls the items service again
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry"

### Requirement: WEB-08 — The dashboard search re-queries the items

The web app SHALL re-run the items query with the typed search text and the item limit, 50 by
default, under the query key `QueryKeys.items.list({ search, limit })`, which holds both, so two
limits never share a cache entry.

**Evidence:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:43-62`, `apps/web/src/lib/query/queryKeys.constant.ts:44-49`, `apps/web/src/lib/query/queryKeys.type.ts:3-6`, `apps/web/src/services/Items/items.service.ts:96-116`

#### Scenario: a search term is typed

- **GIVEN** the dashboard hook loaded with a limit of 10
- **WHEN** the search text changes to a term
- **THEN** the items service is called with that term and the limit
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "forwards search and limit to the service when search changes"

#### Scenario: two limits

- **GIVEN** two dashboard hooks under one query client, with limits of 1 and 2
- **WHEN** both settle
- **THEN** each lists the items its own limit fetched, the items service is called once per limit, and the client holds one items list query per limit, keyed by `QueryKeys.items.list({ search, limit })`
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "keeps one cache entry per limit, each with its own items"

#### Scenario: the search box is labelled

- **GIVEN** the items list card
- **WHEN** it renders
- **THEN** it shows a search box named by the `items.dashboard.searchLabel` message
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "renders the search bar"

#### Scenario: the sample service filters the items

- **GIVEN** the in-memory sample items service
- **WHEN** it is asked for a search term
- **THEN** it keeps the items whose title, description or category contains the term, ignoring case, up to the limit
- **Test:** Not covered — the hook and screen tests mock `getItems`, and `apps/web/src/services/Items/__tests__/items.service.test.ts` covers only the HTTP variant `fetchItems`.

### Requirement: WEB-09 — Each item card shows the item and its author

The web app SHALL render each item with its title, description, category, author name, age and
status label, beside an avatar holding the author's initials, at most two, or a question mark when
the item has no author. The age and the status label SHALL be the `items.age` message of the
item's age unit and the `items.status` message of its status, in the active language; the items
adapter SHALL describe the age as a unit and a count: just now under one minute, then whole
minutes, hours or days.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.tsx:19-52`, `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.tsx:44`, `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.tsx:47`, `apps/web/src/services/Items/Items.adapter.ts:17-23`, `apps/web/src/services/Items/Items.adapter.ts:27-45`, `apps/web/src/services/Items/Items.adapter.ts:51-61`, `apps/web/src/services/Items/items.constant.ts:12-17`

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

### Requirement: WEB-10 — The dashboard navigation marks the active tab

The web app SHALL render the dashboard's bottom navigation as a landmark labelled by the
`items.dashboard.nav.ariaLabel` message, with home, items, search and settings tabs, marking the
active tab as selected, home by default.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component.tsx:17-46`, `apps/web/src/screens/ItemsDashboard/hooks/useItems.constant.ts:9`, `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:47`

#### Scenario: the navigation renders its tabs

- **GIVEN** the dashboard navigation with home active
- **WHEN** it renders
- **THEN** the four tab labels are shown and the home tab has `aria-selected` set to true
- **Test:** `apps/web/src/screens/ItemsDashboard/components/DashboardNav/__tests__/DashboardNav.component.test.tsx` › "renders all nav items"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/DashboardNav/__tests__/DashboardNav.component.test.tsx` › "marks the active item as selected"
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "renders the nav bar"

#### Scenario: a tab is pressed

- **GIVEN** the dashboard with home active
- **WHEN** another tab is pressed
- **THEN** that tab becomes the selected one and the route does not change
- **Test:** Not covered — no test presses a tab on the dashboard screen.

### Requirement: WEB-11 — The login route renders the auth shell

The web app SHALL render, at the login route, the login screen inside the auth shell: the theme
and language controls, the logo and app name, the `auth.login` title and subtitle, labelled email
and password fields, a submit button and a Google sign-in button.

**Evidence:** `apps/web/src/app/login/page.tsx:3`, `apps/web/src/components/ui/AuthShell/AuthShell.component.tsx:30-47`, `apps/web/src/screens/Login/Login.screen.tsx:27-78`

#### Scenario: the login screen renders

- **GIVEN** the login screen with its messages
- **WHEN** it renders
- **THEN** the app name, the title and the labelled email and password fields are shown
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "renders the brand name, title, and field labels"

#### Scenario: the shell controls render

- **GIVEN** the login screen
- **WHEN** it renders
- **THEN** a theme switch and a language button are shown
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "mounts the theme and language controls"

### Requirement: WEB-12 — The login form validates its fields before submitting

The web app SHALL reject a login submit whose email does not match the email pattern or whose
password is shorter than 8 characters, and show the `auth.login.errors.email` or
`auth.login.errors.password` message on the offending field.

**Evidence:** `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:19-33`, `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:63-68`, `apps/web/src/screens/Login/Login.constant.ts:4-7`, `apps/web/src/screens/Login/Login.screen.tsx:34-39`

#### Scenario: empty fields are submitted

- **GIVEN** the login screen with empty fields
- **WHEN** the submit button is pressed
- **THEN** both field error messages are shown
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "surfaces validation errors when submitting empty fields"

#### Scenario: the form hook rejects an invalid submit

- **GIVEN** the form hook with empty values
- **WHEN** the form is submitted
- **THEN** the default submit is prevented, both error keys are set and the form is not submitting
- **Test:** `apps/web/src/screens/Login/hooks/__tests__/useLoginForm.hook.test.ts` › "reports field error keys for an invalid submit"

### Requirement: WEB-13 — A valid login submit signs in through the auth gateway

The web app SHALL, on a login submit that passes validation, clear the field errors and send the
email and password to the auth gateway's `signIn`, through the auth service, showing the
submitting state while the request runs; when it resolves it SHALL replace the route with `/`,
and when it rejects it SHALL queue an error toast with the message resolved from the error's
`messageKey`, the message of the failure the gateway names (WEB-46) or else the generic one, set
no field error and leave the route unchanged. The sign-in result the screen keeps holds the user
id and not the access token.

**Evidence:** `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:45`, `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:69`, `apps/web/src/screens/Login/hooks/useSignIn.hook.ts:33-45`, `apps/web/src/services/Auth/auth.service.ts:19-21`, `apps/web/src/services/Auth/Auth.adapter.ts:10`, `apps/web/src/screens/Login/Login.constant.ts:22`, `apps/web/src/lib/query/useAppMutation.hook.ts:37`, `apps/web/src/lib/supabase/authGateway.adapter.ts:73-86`

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

### Requirement: WEB-14 — Server-rendered translations follow the locale cookie

The web app SHALL resolve the locale of server-rendered translations from the `NEXT_LOCALE`
cookie, else the routing locale, falling back to the default language for a missing or unsupported
value, and load that locale's catalog with the UTC time zone.

**Evidence:** `apps/web/src/i18n/request.config.ts:12-23`, `apps/web/src/i18n/locale.helper.ts:23-28`, `apps/web/next.config.ts:10`

#### Scenario: no cookie is set

- **GIVEN** no `NEXT_LOCALE` cookie and no routing locale
- **WHEN** the request config resolves
- **THEN** the locale is the default language with its catalog and the UTC time zone
- **Test:** `apps/web/src/i18n/__tests__/request.config.test.ts` › "falls back to the default language when no cookie is set"

#### Scenario: the cookie names a supported language

- **GIVEN** a `NEXT_LOCALE` cookie set to the Spanish language code
- **WHEN** the request config resolves
- **THEN** the locale and the catalog are the Spanish ones
- **Test:** `apps/web/src/i18n/__tests__/request.config.test.ts` › "resolves the locale from the NEXT_LOCALE cookie"

#### Scenario: the cookie names an unsupported language

- **GIVEN** a `NEXT_LOCALE` cookie set to a language the app does not support
- **WHEN** the request config resolves
- **THEN** the locale is the default language
- **Test:** `apps/web/src/i18n/__tests__/request.config.test.ts` › "ignores an unsupported cookie value"

### Requirement: WEB-15 — Client components render in the active language

The web app SHALL render every client component with the locale and the catalog the request
config resolves (WEB-14), which a server component reads inside a `<Suspense>` of the root layout
and hands to the client providers, and SHALL keep the html element's language attribute equal to
that locale: the static document shell writes the default language, a pre-paint script replaces
it with the supported language the `NEXT_LOCALE` cookie names, and the providers set it whenever
their locale changes.

**Evidence:** `apps/web/src/app/layout.tsx:64-91`, `apps/web/src/app/layout.tsx:68`, `apps/web/src/app/layout.tsx:79-81`, `apps/web/src/app/layout.tsx:85-87`, `apps/web/src/app/LocaleProviders.tsx:15-26`, `apps/web/src/app/providers.tsx:44`, `apps/web/src/app/providers.tsx:47-51`, `apps/web/src/i18n/noFlashLocale.constant.ts:12-18`, `apps/web/src/i18n/useDocumentLanguage.hook.ts:12-18`, `apps/web/src/i18n/locale.helper.ts:23-34`

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

**Evidence:** `apps/web/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.ts:19-26`, `apps/web/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.ts:32-43`, `apps/web/src/i18n/i18n.constant.ts:3`, `apps/web/src/i18n/i18n.constant.ts:6`, `apps/web/src/components/ui/LanguageSwitcher/LanguageSwitcher.component.tsx:19`, `apps/web/src/components/ui/LanguageSwitcher/LanguageSwitcher.component.tsx:24`

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

### Requirement: WEB-17 — The theme is resolved before first paint

The web app SHALL set the html `data-theme` attribute before first paint from the `NEXT_THEME`
cookie when it holds light or dark, else from the `prefers-color-scheme` media query, and adopt
that painted value into the theme store on mount.

**Evidence:** `apps/web/src/lib/theme/noFlashTheme.constant.ts:17-25`, `apps/web/src/app/layout.tsx:76-78`, `apps/web/src/components/ThemeProvider/useThemeBootstrap.hook.ts:14-23`

#### Scenario: the head script paints the theme

- **GIVEN** a visitor with a `NEXT_THEME` cookie, or none
- **WHEN** the document head runs before first paint
- **THEN** the html element carries the cookie's theme, else the theme the colour-scheme preference names
- **Test:** Not covered — no test executes the head script; the glass e2e run only depends on it indirectly through a pinned dark colour scheme.

#### Scenario: the provider adopts the painted theme

- **GIVEN** the html element painted with the light theme
- **WHEN** the theme provider mounts
- **THEN** the theme store holds the light theme
- **Test:** `apps/web/src/components/ThemeProvider/__tests__/ThemeProvider.component.test.tsx` › "adopts the painted theme attribute into the store on mount"
- **Test:** `apps/web/src/components/ThemeProvider/__tests__/useThemeBootstrap.hook.test.ts` › "adopts the theme already painted on the document element"

#### Scenario: an unknown painted value

- **GIVEN** the html element painted with a value that is not a theme
- **WHEN** the theme bootstrap runs
- **THEN** the theme store keeps its value
- **Test:** `apps/web/src/components/ThemeProvider/__tests__/useThemeBootstrap.hook.test.ts` › "leaves the store untouched when the painted value is not a theme"

### Requirement: WEB-18 — Changing the theme repaints and persists it

The web app SHALL, when the theme changes, set the html `data-theme` attribute, write the
`NEXT_THEME` cookie for one year on the root path with SameSite Lax and update the theme store,
without a reload; the theme switch is on for the light theme.

**Evidence:** `apps/web/src/components/ThemeProvider/useTheme.hook.ts:28-35`, `apps/web/src/lib/theme/theme.constant.ts:5-8`, `apps/web/src/components/ui/ThemeToggle/useThemeToggle.hook.ts:15-22`

#### Scenario: the light theme is chosen

- **GIVEN** the dark theme is active
- **WHEN** the theme is set to light
- **THEN** the html element carries the light theme, the store holds it and the cookie names it
- **Test:** `apps/web/src/components/ThemeProvider/__tests__/useTheme.hook.test.ts` › "setTheme flips the data-theme attribute on the document element"
- **Test:** `apps/web/src/components/ThemeProvider/__tests__/useTheme.hook.test.ts` › "setTheme persists the choice to the NEXT_THEME cookie"

#### Scenario: the theme switch is flipped on

- **GIVEN** the dark theme is active
- **WHEN** the theme switch is turned on
- **THEN** the light theme is set, and the switch then reads as on
- **Test:** `apps/web/src/components/ui/ThemeToggle/__tests__/useThemeToggle.hook.test.ts` › "onValueChange(true) sets the light theme"
- **Test:** `apps/web/src/components/ui/ThemeToggle/__tests__/ThemeToggle.component.test.tsx` › "renders the switch as on when the theme is light"

### Requirement: WEB-19 — The auth provider tracks the session from the gateway

The web app SHALL set the auth status to loading on mount, then to authenticated or
unauthenticated from the auth gateway's current session and from every auth state change, and
unsubscribe from those changes on unmount.

**Evidence:** `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.ts:8-33`, `apps/web/src/app/providers.tsx:53`

#### Scenario: the gateway holds a session

- **GIVEN** a gateway whose current session exists
- **WHEN** the auth bootstrap runs
- **THEN** the store holds that session with the authenticated status
- **Test:** `apps/web/src/components/AuthProvider/__tests__/useAuthBootstrap.hook.test.ts` › "sets status to authenticated after getSession resolves with a session"

#### Scenario: the gateway holds no session

- **GIVEN** a gateway whose current session is empty
- **WHEN** the auth bootstrap runs
- **THEN** the status is unauthenticated
- **Test:** `apps/web/src/components/AuthProvider/__tests__/useAuthBootstrap.hook.test.ts` › "sets status to unauthenticated when getSession resolves with null"

#### Scenario: the subscription lifecycle

- **GIVEN** the auth provider mounted with a gateway
- **WHEN** it mounts and later unmounts
- **THEN** it subscribes to auth state changes once and unsubscribes once
- **Test:** `apps/web/src/components/AuthProvider/__tests__/useAuthBootstrap.hook.test.ts` › "subscribes to auth state changes"
- **Test:** `apps/web/src/components/AuthProvider/__tests__/useAuthBootstrap.hook.test.ts` › "calls unsubscribe on unmount"

### Requirement: WEB-20 — The auth gateway is a no-op without Supabase settings

The web app SHALL give the auth provider and the auth service one gateway: a no-op gateway during
server rendering and in a browser where `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset, so the session resolves to none and a sign-in rejects
with the not-configured failure (WEB-46); otherwise one Supabase auth gateway per browser, whose
sign-in names its failures (WEB-46).

**Evidence:** `apps/web/src/lib/supabase/authGateway.adapter.ts:88-99`, `apps/web/src/lib/supabase/authGateway.adapter.ts:110-118`, `apps/web/src/app/SupabaseProviders.tsx:22`

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

### Requirement: WEB-21 — The browser Supabase client is created once from the public settings

The web app SHALL create the browser Supabase client on first use from `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, return that same client afterwards, and throw an error naming
both variables when either is missing.

**Evidence:** `apps/web/src/lib/supabase/client.adapter.ts:17-40`

#### Scenario: the settings are present

- **GIVEN** both public Supabase settings
- **WHEN** the client is requested twice
- **THEN** it is created once with those settings and the same client is returned both times
- **Test:** `apps/web/src/lib/supabase/__tests__/client.adapter.test.ts` › "creates the client lazily with the public env credentials"
- **Test:** `apps/web/src/lib/supabase/__tests__/client.adapter.test.ts` › "returns the same instance on subsequent calls"

#### Scenario: the settings are missing

- **GIVEN** neither public Supabase setting
- **WHEN** the client is requested
- **THEN** it throws an error naming the missing settings
- **Test:** `apps/web/src/lib/supabase/__tests__/client.adapter.test.ts` › "throws a helpful error when env is missing"

### Requirement: WEB-22 — The server Supabase client reads the request cookies

The web app SHALL create a new server Supabase client on every call, wired to the request cookie
store for reading and writing the session cookies.

**Evidence:** `apps/web/src/lib/supabase/server.adapter.ts:12-28`

#### Scenario: the client is created on the server

- **GIVEN** a request cookie store
- **WHEN** the server client is created
- **THEN** its cookie reader reads from that store
- **Test:** `apps/web/src/lib/supabase/__tests__/server.adapter.test.ts` › "awaits the cookie store and forwards a getAll passthrough"

#### Scenario: two calls

- **GIVEN** a request
- **WHEN** the server client is created twice
- **THEN** the factory runs twice
- **Test:** `apps/web/src/lib/supabase/__tests__/server.adapter.test.ts` › "returns a fresh client instance per call"

### Requirement: WEB-23 — Queries and mutations share fixed retry and freshness defaults

The web app SHALL create its query client with a 30-second stale time and one retry for queries,
and no retry for mutations.

**Evidence:** `apps/web/src/lib/query/createQueryClient.helper.ts:10`, `apps/web/src/lib/query/createQueryClient.helper.ts:22-32`, `apps/web/src/app/providers.tsx:20-27`

#### Scenario: the defaults of a new client

- **GIVEN** a query client created with no options
- **WHEN** its default options are read
- **THEN** the query stale time is 30 000 ms, queries retry once and mutations never retry
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "applies 30s stale time by default"
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "applies retry: 1 for queries"
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "applies retry: 0 for mutations"

### Requirement: WEB-24 — Every failed query and mutation is reported once with a scrubbed key

The web app SHALL report every failed query and mutation once, from the query cache and mutation
cache error handlers, to the observability port, passing the query key through
`sanitizeQueryKey` from packages/core with the values of `QueryKeySegmentEnum` as its structural
segments, so the trailing params object of a key (WEB-45) is always redacted, whatever it holds.

**Evidence:** `apps/web/src/lib/query/createQueryClient.helper.ts:41`, `apps/web/src/lib/query/queryKeys.constant.ts:37-49`, `apps/web/src/lib/observability/toCaptureError.helper.ts:7-11`, `apps/web/src/app/providers.tsx:20-27`

#### Scenario: a query fails

- **GIVEN** a query whose key holds an identifier
- **WHEN** it fails
- **THEN** the capture sink is called once, from the query cache, with the identifier redacted
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure"

#### Scenario: a query keyed by a search text

- **GIVEN** a query keyed by `QueryKeys.items.list({ limit, search: 'alice' })`
- **WHEN** it fails
- **THEN** the capture sink receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure"

#### Scenario: a typed value equal to a registered word

- **GIVEN** a query keyed by `QueryKeys.items.list({ limit, search: 'list' })`
- **WHEN** it fails
- **THEN** the capture sink receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list search that equals a registered segment on query failure"

#### Scenario: a mutation fails

- **GIVEN** a mutation
- **WHEN** it fails
- **THEN** the capture sink is called from the mutation cache
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure"

#### Scenario: the sink reaches the observability port

- **GIVEN** the capture sink built over an observability port
- **WHEN** it is called with an error and its context
- **THEN** the port's error capture receives both, once
- **Test:** `apps/web/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError"

### Requirement: WEB-25 — An error message is resolved by one precedence

The web app SHALL resolve the message shown for an error from, in order, the caller's override,
the translated `messageKey` of an `AppError` when the catalog holds it, the error's own message,
and the `helper.error.generic` message.

**Evidence:** `apps/web/src/lib/query/resolveErrorMessage.helper.ts:11-31`, `apps/web/src/lib/query/useAppQuery.constant.ts:1`

#### Scenario: an override is given

- **GIVEN** an override message and an application error with a known key
- **WHEN** the message is resolved
- **THEN** the override is returned
- **Test:** `apps/web/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "prefers the explicit errorMessage override"

#### Scenario: an application error with a known key

- **GIVEN** no override and an application error whose key the catalog holds
- **WHEN** the message is resolved
- **THEN** the translated key is returned
- **Test:** `apps/web/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "resolves AppError.messageKey via i18n when no override"

#### Scenario: the key or the error type falls through

- **GIVEN** an application error whose key the catalog lacks, or a plain error
- **WHEN** the message is resolved
- **THEN** the error's own message is returned
- **Test:** `apps/web/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "falls back to error.message when the key is missing from catalog"
- **Test:** `apps/web/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "falls back to error.message for a plain Error"

#### Scenario: the error is not an Error

- **GIVEN** a thrown value that is not an error object
- **WHEN** the message is resolved
- **THEN** the generic fallback is returned
- **Test:** `apps/web/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "uses the generic fallback for a non-Error value"

### Requirement: WEB-26 — Mutation outcomes are queued as toasts, query failures are not

The web app SHALL queue each failed mutation as an error toast with the resolved message, and a
mutation's success message as a success toast, in the toast store, which drops each toast after 4
seconds; a failed query SHALL queue no toast, however many components observe it.

**Evidence:** `apps/web/src/lib/query/useAppQuery.hook.ts:21`, `apps/web/src/lib/query/useAppMutation.hook.ts:37`, `apps/web/src/lib/query/useAppMutation.hook.ts:42`, `apps/web/src/stores/toast.store.ts:36-48`

#### Scenario: a query fails

- **GIVEN** two components observing one query
- **WHEN** the query fails
- **THEN** no toast is queued
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "queues no toast when the query fails, however many components observe it"

#### Scenario: a mutation fails or succeeds

- **GIVEN** a mutation with an override message or a success message
- **WHEN** it fails or succeeds
- **THEN** an error toast or a success toast with that message is queued
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows an error toast with the override message on failure"
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows a success toast when successMessage is provided"

#### Scenario: a toast expires

- **GIVEN** a queued toast
- **WHEN** 4 seconds pass
- **THEN** the toast store no longer holds it
- **Test:** `apps/web/src/stores/__tests__/toast.store.test.ts` › "toast auto-dismisses after 4 seconds"

### Requirement: WEB-27 — The async boundary shows a loading status and a retryable error

The web app SHALL, inside an async boundary, render a status region holding the `common.loading`
message while the children suspend, and, when they throw, an alert with the error's message, or
the `helper.error.generic` message for a non-error value, and a button labelled with the
`common.retry` message that resets the boundary, every message in the active language.

**Evidence:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx:11-19`, `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component.tsx:8-17`, `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:7-25`

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

### Requirement: WEB-28 — The error state shows translated copy by error code

The web app SHALL render the error state as an alert whose title and message come from the
`components.errorState` catalog entry of the given error code, or its generic entry when no code is
given, with a retry button only when a retry or reset handler is given.

**Evidence:** `apps/web/src/components/ui/ErrorState/ErrorState.component.tsx:11-51`, `apps/web/src/components/ui/ErrorState/ErrorState.constant.ts:3-8`

#### Scenario: no code is given

- **GIVEN** the error state with no code
- **WHEN** it renders
- **THEN** the generic title and message are shown in an alert
- **Test:** `apps/web/src/components/ui/ErrorState/__tests__/ErrorState.component.test.tsx` › "renders generic copy when no code"
- **Test:** `apps/web/src/components/ui/ErrorState/__tests__/ErrorState.component.test.tsx` › "has role=alert"

#### Scenario: a not-found code

- **GIVEN** the error state with the not-found code
- **WHEN** it renders
- **THEN** the not-found title is shown
- **Test:** `apps/web/src/components/ui/ErrorState/__tests__/ErrorState.component.test.tsx` › "renders code-specific copy for 404"

#### Scenario: the retry button

- **GIVEN** the error state with a retry handler, a reset handler, or neither
- **WHEN** it renders and the retry button is pressed
- **THEN** the handler runs once, and with neither handler no button is rendered
- **Test:** `apps/web/src/components/ui/ErrorState/__tests__/ErrorState.component.test.tsx` › "renders retry button and calls onRetry"
- **Test:** `apps/web/src/components/ui/ErrorState/__tests__/ErrorState.component.test.tsx` › "calls resetErrorBoundary as fallback retry"
- **Test:** `apps/web/src/components/ui/ErrorState/__tests__/ErrorState.component.test.tsx` › "does not render retry button when neither onRetry nor resetErrorBoundary given"

### Requirement: WEB-29 — Observability scrubs PII and stays silent without a DSN

The web app SHALL send errors, messages, breadcrumbs and the user to Sentry only when
`NEXT_PUBLIC_SENTRY_DSN` is set, passing every context, breadcrumb payload and user through
`scrubPII` from packages/core first.

**Evidence:** `apps/web/src/lib/observability/createSentryObservability.adapter.ts:24-65`, `apps/web/src/lib/observability/observability.adapter.ts:5-6`

#### Scenario: an error is captured

- **GIVEN** a DSN is set
- **WHEN** an error is captured with a context holding an email
- **THEN** Sentry receives the error with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError forwards the exception to Sentry"
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context before sending"

#### Scenario: the user and breadcrumbs are scrubbed

- **GIVEN** a DSN is set
- **WHEN** a user or a breadcrumb holding an email is sent
- **THEN** Sentry receives it with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload"
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "addBreadcrumb scrubs PII from breadcrumb data"

#### Scenario: no DSN

- **GIVEN** no DSN
- **WHEN** every observability method is called
- **THEN** Sentry receives nothing
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "all methods no-op when the DSN is absent"

### Requirement: WEB-30 — The Sentry SDK scrubs every event in every runtime

The web app SHALL initialise Sentry in the browser, Node and edge runtimes, the last two loaded by
the instrumentation hook, enabled only when `NEXT_PUBLIC_SENTRY_DSN` is set, with every event and
breadcrumb passed through `scrubPII` before sending.

**Evidence:** `apps/web/sentry.client.config.ts:6-12`, `apps/web/sentry.server.config.ts:6-12`, `apps/web/sentry.edge.config.ts:6-12`, `apps/web/instrumentation.ts:3-10`

#### Scenario: an event leaves the app

- **GIVEN** a DSN is set
- **WHEN** the SDK sends an event or a breadcrumb holding personal data
- **THEN** the personal data is redacted
- **Test:** Not covered — no test loads the Sentry config files; `scripts/verify-security-static.mjs` only checks that the client and server configs name `scrubPII` at `beforeSend`.

### Requirement: WEB-31 — The middleware rejects requests from an untrusted origin

The web app SHALL answer 403 with an empty body to every request outside `_next/static`,
`_next/image`, the favicon, `images` and `fonts` when the origin guard reports it untrusted, and
let it through otherwise.

**Evidence:** `apps/web/src/middleware.ts:8`, `apps/web/src/middleware.ts:14-15`, `apps/web/src/middleware.ts:25-27`, `apps/web/src/lib/origin-guard/originGuard.adapter.ts:4`

#### Scenario: the origin secret is right

- **GIVEN** a configured origin secret and a request whose origin header matches it
- **WHEN** the middleware runs
- **THEN** the request continues to the route
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "lets a request with the configured origin secret through"

#### Scenario: the origin secret is missing or wrong

- **GIVEN** a configured origin secret and a request with no origin header, or one that does not match it
- **WHEN** the middleware runs
- **THEN** the response is 403 with an empty body
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "answers 403 with an empty body when the origin secret header is missing"
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "answers 403 with an empty body when the origin secret header is wrong"

#### Scenario: no origin secret is configured

- **GIVEN** no `CF_ORIGIN_SECRET`
- **WHEN** the origin guard checks a request with no origin header
- **THEN** it reports the request trusted
- **Test:** `apps/web/src/lib/origin-guard/__tests__/originGuard.adapter.test.ts` › "assertTrustedOrigin passes through when no secret is configured"

#### Scenario: an exempt path is requested

- **GIVEN** the middleware matcher
- **WHEN** a built static asset, an optimised image, the favicon, an image or a font is requested, and then a page
- **THEN** the middleware does not run for the first five, and runs for the page
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "does not run for the paths the guard exempts"
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "runs for a page route"

### Requirement: WEB-32 — The Turnstile route rejects an unreadable body

The web app SHALL answer a POST to the Turnstile verify route whose body is not JSON with status
400, a body whose success is false, and `Cache-Control: no-store`.

**Evidence:** `apps/web/src/app/api/turnstile/verify/route.ts:5-24`

#### Scenario: the body is empty

- **GIVEN** a POST with no body
- **WHEN** the route handles it
- **THEN** it answers 400, success false and no-store
- **Test:** `apps/web/src/app/api/turnstile/verify/__tests__/route.test.ts` › "POST returns 400 when the request body is empty"

#### Scenario: the body is not JSON

- **GIVEN** a POST whose body is plain text
- **WHEN** the route handles it
- **THEN** it answers 400, success false and no-store
- **Test:** `apps/web/src/app/api/turnstile/verify/__tests__/route.test.ts` › "POST returns 400 when the request body is not valid JSON"

### Requirement: WEB-33 — The Turnstile route answers with the verification verdict

The web app SHALL verify the posted token, an empty string when absent, with the Turnstile bot
protection from packages/cloudflare, passing the `x-forwarded-for` header as the remote IP, and
answer 400 with success false and the error codes when verification fails, or 200 with success
true, both with `Cache-Control: no-store`.

**Evidence:** `apps/web/src/app/api/turnstile/verify/route.ts:26-43`, `apps/web/src/lib/bot-protection/botProtection.adapter.ts:4-5`

#### Scenario: no Turnstile secret is configured

- **GIVEN** no `TURNSTILE_SECRET_KEY` outside production
- **WHEN** the bot protection verifies any token
- **THEN** it reports success
- **Test:** `apps/web/src/lib/bot-protection/__tests__/botProtection.adapter.test.ts` › "verifyToken degrades to success when no secret is configured"

#### Scenario: verification fails

- **GIVEN** a token the bot protection rejects
- **WHEN** it is posted to the route
- **THEN** the route answers 400 with success false, the error codes and no-store
- **Test:** Not covered — the route tests only send unreadable bodies; no test drives a failing or passing verdict through the route.

#### Scenario: verification passes

- **GIVEN** a token the bot protection accepts
- **WHEN** it is posted to the route
- **THEN** the route answers 200 with success true and no-store
- **Test:** Not covered — no test posts a readable token to the route.

### Requirement: WEB-34 — Every response carries the security headers

The web app SHALL send, on every path, `X-Frame-Options: SAMEORIGIN`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a
`Permissions-Policy` that denies camera, microphone and geolocation, and a two-year
`Strict-Transport-Security` with subdomains and preload.

**Evidence:** `apps/web/next.config.ts:12-24`, `apps/web/next.config.ts:37-40`

#### Scenario: a page is served

- **GIVEN** the built app
- **WHEN** any path is requested
- **THEN** the response carries the five security headers
- **Test:** Not covered — no test reads response headers; `scripts/verify-security-static.mjs` only checks that `apps/web/next.config.ts` names four of the header keys.

### Requirement: WEB-35 — Image responses are cached for a year

The web app SHALL send a `Cache-Control` header of
`public, max-age=31536000, immutable, stale-while-revalidate=86400` on every path ending in an
svg, jpg, jpeg, png, webp, avif, gif or ico extension.

**Evidence:** `apps/web/next.config.ts:26-30`, `apps/web/next.config.ts:39`, `apps/web/src/lib/image-delivery/imageCacheHeaders.constant.ts:1-7`

#### Scenario: the header value

- **GIVEN** the image cache header constants
- **WHEN** the image cache header is built
- **THEN** it is a Cache-Control header whose value holds immutable and a one-year max-age
- **Test:** `apps/web/src/lib/image-delivery/__tests__/imageCacheHeaders.helper.test.ts` › "buildImageCacheHeaders returns a long immutable Cache-Control header"

#### Scenario: an image path is served

- **GIVEN** the built app
- **WHEN** a path ending in an image extension is requested
- **THEN** the response carries that Cache-Control value
- **Test:** Not covered — no test reads the headers `apps/web/next.config.ts` attaches to image paths.

### Requirement: WEB-36 — Image URLs are public paths by default

The web app SHALL build image URLs with the public pass-through image delivery from packages/core,
which returns the requested path unchanged.

**Evidence:** `apps/web/src/lib/image-delivery/imageDelivery.adapter.ts:4-5`

#### Scenario: an image URL is built

- **GIVEN** the default image delivery
- **WHEN** a URL is built for a public path
- **THEN** the path is returned unchanged
- **Test:** `apps/web/src/lib/image-delivery/__tests__/imageDelivery.adapter.test.ts` › "buildImageUrl returns the raw public path by default"

### Requirement: WEB-37 — The root providers show the toast viewport

The web app SHALL mount the toast viewport inside the root providers, rendering every toast of the
toast store, with its message and a dismiss button, labelled with the `common.dismiss` message of
the active language, that removes it, in a polite status region.

**Evidence:** `apps/web/src/app/providers.tsx:54`, `apps/web/src/components/ui/Toast/Toast.component.tsx:20-46`, `apps/web/src/components/ui/Toast/Toast.component.tsx:35`

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

**Evidence:** `apps/web/src/app/error.tsx:19`, `apps/web/src/app/global-error.tsx:24`, `apps/web/src/app/global-error.tsx:27`, `apps/web/src/app/global-error.tsx:34`, `apps/web/src/i18n/useCookieLanguage.hook.ts:22-27`, `apps/web/src/lib/observability/useReportBoundaryError.hook.ts:13`, `apps/web/src/lib/observability/reportBoundaryError.helper.ts:23`, `apps/web/src/lib/observability/reportBoundaryError.helper.ts:26`, `apps/web/src/components/ui/ErrorState/ErrorState.component.tsx:27-49`

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

### Requirement: WEB-39 — A screen or section only positions

The web app SHALL keep the look of a screen, a route entry and a container outside the component
blocks in a component block (`src/components/ui/`, or a screen's own `components/`): their class
strings and style props carry only layout, spacing, size, position, overflow and visibility.

**Evidence:** `eslint-local-rules/style-positioning.detect.mjs:342`, `eslint.rules.mjs:702`, `apps/web/src/helpers/layout.style.ts:5`, `apps/web/src/screens/Login/Login.style.ts:1`, `eslint-style-positioning-allowlist.json:1`

#### Scenario: a screen style carries a colour

- **GIVEN** a web screen style file whose class string holds a colour utility
- **WHEN** it is linted
- **THEN** `local/style-positions-only` reports the token and names where the look belongs
- **Test:** `eslint-local-rules/index.test.mjs` › "export const X = { TITLE: 'mt-lg text-accent-text' }"

#### Scenario: a component block keeps its look

- **GIVEN** a `components/ui` style file and a screen's own component style file with colour classes
- **WHEN** the scope of the rule is read
- **THEN** neither file is in scope, while a screen, a route entry and a container are
- **Test:** `eslint-local-rules/index.test.mjs` › "positions-only reads screens, routes and containers, never a component block"

#### Scenario: the shipped web sources only position

- **GIVEN** the web app's source
- **WHEN** `pnpm validate` lints it and runs `verify:allowlist-freshness`
- **THEN** no screen or section breaks the rule and the allowlist holds no web entry
- **Test:** Not covered — the gate reads the repository itself, and its cases run on scratch trees: `scripts/verify-allowlist-freshness.test.mjs` › "a violating file the list does not carry is named"

### Requirement: WEB-40 — Every web style value is a token

The web app SHALL take every value of its style files and views from `@app/tokens` or a step of
Tailwind's scale: no raw colour, no Tailwind palette colour and no arbitrary value.

**Evidence:** `eslint-local-rules/style-positioning.detect.mjs:721`, `eslint-local-rules/style-positioning.detect.mjs:295`, `apps/web/src/app/globals.css:3`

#### Scenario: a component holds an arbitrary value

- **GIVEN** a `components/ui` style file with an arbitrary padding
- **WHEN** it is linted
- **THEN** `local/style-token-values` reports the token
- **Test:** `eslint-local-rules/index.test.mjs` › "export const X = { PILL: 'px-[11px] rounded-full' }"

#### Scenario: a palette colour stands in for a token

- **GIVEN** a style file with a white overlay and a black scrim from Tailwind's palette
- **WHEN** it is linted
- **THEN** the arbitrary overlay and the palette scrim are each reported
- **Test:** `eslint-local-rules/index.test.mjs` › "export const X = { DOT: 'bg-white/[0.08]', SCRIM: 'bg-black/60' }"

### Requirement: WEB-41 — Text, Divider and Screen carry the look screens used to hold

The web app SHALL render text in a screen through the `Text` block, whose variant, tone and weight
set its typography and colour, a labelled rule through the `Divider` block, and a screen's
surface through the `Screen` block, which fills the viewport and paints the base background.

**Evidence:** `apps/web/src/components/ui/Text/Text.style.ts:10`, `apps/web/src/components/ui/Text/Text.component.tsx:4`, `apps/web/src/components/ui/Divider/Divider.component.tsx:4`, `apps/web/src/components/ui/Screen/Screen.component.tsx:4`, `apps/web/src/screens/Login/Login.screen.tsx:66`

#### Scenario: a text variant renders

- **GIVEN** the `Text` block with the title variant on a paragraph
- **WHEN** it renders
- **THEN** the paragraph carries the display family, the title size, the semibold weight and the primary text colour
- **Test:** `apps/web/src/components/ui/Text/__tests__/Text.component.test.tsx` › "renders a variant's typography on the element it is given"

#### Scenario: a tone and a weight are set

- **GIVEN** the `Text` block with the success tone and the semibold weight
- **WHEN** it renders
- **THEN** it carries the success text colour and the semibold weight, and no other typography
- **Test:** `apps/web/src/components/ui/Text/__tests__/Text.component.test.tsx` › "applies the tone and the weight on their own"

#### Scenario: a labelled divider renders

- **GIVEN** the `Divider` block with a label
- **WHEN** it renders
- **THEN** the label sits between two divider rules hidden from assistive technology
- **Test:** `apps/web/src/components/ui/Divider/__tests__/Divider.component.test.tsx` › "renders the label between two rules"

#### Scenario: a screen surface renders

- **GIVEN** the `Screen` block around content
- **WHEN** it renders
- **THEN** the content sits on a full-height surface painted with the base background
- **Test:** `apps/web/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the base background behind its children"

### Requirement: WEB-42 — Only the ui blocks import a UI kit

The web app SHALL import a UI kit, its headless primitives or its class helpers (shadcn's
`class-variance-authority`, Radix, `tailwind-variants`, a future `@mui/*`) only from a block under
`src/components/ui/`, so a kit is swapped by rewriting that folder alone.

**Evidence:** `eslint-local-rules/ui-kit.detect.mjs:17`, `eslint-local-rules/ui-kit.detect.mjs:70`, `eslint-local-rules/index.mjs:853`

#### Scenario: a screen imports a kit primitive

- **GIVEN** a web screen that imports a Radix primitive
- **WHEN** it is linted
- **THEN** `local/ui-kit-boundary` reports the import
- **Test:** `eslint-local-rules/index.test.mjs` › "import * as Dialog from '@radix-ui/react-dialog'"

#### Scenario: a ui block wraps the kit

- **GIVEN** a `components/ui` style file that imports `tailwind-variants` and a Radix primitive
- **WHEN** it is linted
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/index.test.mjs` › "import { tv } from 'tailwind-variants'\nimport * as Dialog from '@radix-ui/react-dialog'"

### Requirement: WEB-43 — The web theme is the generated CSS, with no JS config

The web app SHALL read every token value from the generated `@app/tokens/theme.css`, which
`src/app/globals.css` imports, and load no Tailwind JavaScript config; the rules `globals.css` still
writes by hand (the glass card, the document body and its aurora, the accent gradient and the
shimmer) SHALL read every colour, shadow, font and motion value through a variable the generated
theme declares, and spell no colour; and the root layout SHALL load each font family under the CSS
variable the tokens name for it.

**Evidence:** `apps/web/src/app/globals.css:3`, `apps/web/src/app/globals.css:45`, `apps/web/src/app/globals.css:57`, `apps/web/src/app/globals.css:100`, `apps/web/src/app/globals.css:109`, `apps/web/src/app/layout.tsx:20`, `apps/web/src/app/layout.tsx:27`

#### Scenario: the CSS entry is read

- **GIVEN** the web app's CSS entry
- **WHEN** it is read
- **THEN** it imports the generated theme, holds no `@config`, and no `tailwind.config.cjs` exists
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config"

#### Scenario: a hand-written rule reads a value

- **GIVEN** the hand-written rules of the CSS entry and the generated theme
- **WHEN** every variable the rules read is looked up in the generated theme
- **THEN** each is declared there, and the rules spell no hex or colour function
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "reads every colour, shadow, font and motion value of its own rules from a generated variable"

#### Scenario: the layout loads the fonts

- **GIVEN** the root layout and the tokens
- **WHEN** the layout's font loaders are read
- **THEN** each family is loaded under the variable the generated theme reads for it
- **Test:** `apps/web/src/app/__tests__/layout.test.tsx` › "loads each family under the variable the generated theme reads"

#### Scenario: the served pages render in both themes

- **GIVEN** the built app served by the production server
- **WHEN** the home and login pages are opened in the dark and the light theme
- **THEN** every element computes the same style it did through the preset bridge
- **Test:** Not covered — no committed test renders both themes; the verify report records a
  one-off Playwright comparison of computed styles and screenshots before and after the change,
  and `e2e/glass.e2e.ts` covers the dark glass card only

### Requirement: WEB-44 — The shared tv merges every token name

The web app SHALL build the variants of every `ui/` style file with the shared `tv` of
`src/components/ui/variants.helper.ts`. Its tailwind-merge config SHALL register every name of
`themeNames` from `@app/tokens` under the tailwind-merge theme key of its namespace, so that:

- of two classes of one utility that carry token names, only the last stays;
- a shadow size and a shadow colour both stay;
- a token font size stays beside a text colour;
- every merge tailwind-merge already resolved resolves as before.

**Evidence:** `apps/web/src/components/ui/variants.helper.ts:20`, `apps/web/src/components/ui/variants.helper.ts:27`, `packages/tokens/src/themeNames.constant.ts:13`, `apps/web/src/components/ui/Button/Button.style.ts:1`

#### Scenario: two classes of one utility carry token names

- **GIVEN** a variant pair per namespace whose classes share a utility and carry token names,
  such as `p-sm p-lg`, `top-knob-inset top-sm`, `max-w-narrow max-w-wide`,
  `shadow-rim-light shadow-none` and `ease-shimmer ease-linear`
- **WHEN** the shared `tv` resolves each pair
- **THEN** only the last class stays
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps only the last of two classes of one utility that carry token names"

#### Scenario: a shadow size meets a shadow colour

- **GIVEN** `shadow-card shadow-accent`, its reverse, and two shadow sizes
- **WHEN** the shared `tv` resolves each
- **THEN** the size and the colour both stay, and of the two sizes only the last stays
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps a shadow size beside a shadow colour, and the last of two shadow sizes"

#### Scenario: a pair tailwind-merge already resolved

- **GIVEN** pairs that resolved before the token names were registered: two radii, two families,
  a family and a weight, a colour and a size, two sizes, two backgrounds, two text colours and
  two Tailwind durations
- **WHEN** the shared `tv` resolves each
- **THEN** each resolves as it did before
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "resolves as before the pairs tailwind-merge already resolved"

#### Scenario: every theme name is registered

- **GIVEN** `themeNames` and the installed tailwind-merge
- **WHEN** each namespace is looked up among tailwind-merge's theme keys, and each name is
  resolved after the previous name of its namespace
- **THEN** every namespace is a theme key, and every name replaces the one before it
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "registers every theme name of @app/tokens under a tailwind-merge theme key"

#### Scenario: a token font size meets a text colour

- **GIVEN** each token font size and glyph size beside a text colour
- **WHEN** a variant sets another text colour
- **THEN** the size stays and the later colour replaces the earlier one
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps every token font size beside a text colour"

#### Scenario: a ui block builds its variants

- **GIVEN** every `*.style.ts` file under `src/components/ui/`
- **WHEN** their imports are read
- **THEN** some build variants with `tv`, and none imports `tailwind-variants` directly
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "is the tv every ui block builds its variants with"

#### Scenario: the ui blocks keep their classes

- **GIVEN** the resolved class string of every `ui/` block, for each variant and each `className`
  a caller passes
- **WHEN** it is resolved with the registered names
- **THEN** each string equals the one before the change, or drops a class a later class of the
  same utility overrides
- **Test:** Not covered — no committed test records every block's strings; the verify report
  records a one-off comparison before and after the change

### Requirement: WEB-45 — A query key keeps its dynamic values in a trailing params object

The web app SHALL build every key of `QueryKeys` from `QueryKeySegmentEnum` values followed, when
the key carries a dynamic value, by one trailing params object that holds every such value, so
that no string segment of a key is a value the user typed or the data supplied, and a feature's
`all` key is a prefix of each of its keys.

**Evidence:** `apps/web/src/lib/query/queryKeys.constant.ts:25`, `apps/web/src/lib/query/queryKeys.constant.ts:36`, `apps/web/src/lib/query/queryKeys.constant.ts:37-42`, `apps/web/src/lib/query/queryKeys.constant.ts:44-49`, `apps/web/src/lib/query/queryKeys.type.ts:3-6`

#### Scenario: every factory is walked

- **GIVEN** every entry of `QueryKeys`, each factory called with a probe argument of its own type
- **WHEN** the string segments of the keys they return are read
- **THEN** every factory has a probe, and each string segment is a value of `QueryKeySegmentEnum`
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum"

#### Scenario: the list search and limit and the detail id

- **GIVEN** a list search, a list limit and an item id
- **WHEN** the list and detail keys are built
- **THEN** they are `['items', 'list', { limit, search }]` and `['items', 'detail', { id }]`, and a list key with no search, or an empty one, holds the empty search beside its limit
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list search and limit and the detail id in a trailing params object"
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "keeps the limit in the list key when no search is given"

#### Scenario: the items prefix is invalidated

- **GIVEN** a cached list query and a cached detail query of the items
- **WHEN** the query client invalidates `QueryKeys.items.all`
- **THEN** both queries are invalidated
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key"

### Requirement: WEB-46 — The auth gateway names each sign-in failure

The web app SHALL reject a sign-in through the browser's auth gateway with an `AppError` that
names the failure and carries the original rejection as its cause: `NOT_CONFIGURED` from the
no-op gateway; `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED` and `RATE_LIMITED` for the Supabase
Auth codes `invalid_credentials`, `email_not_confirmed` and `over_request_rate_limit`, each with
its `auth.error` message key; and `NETWORK_ERROR` with `helper.error.network` when Supabase cannot
be reached. Any other rejection SHALL pass through unchanged, and the auth service makes it the
generic error (WEB-13).

**Evidence:** `apps/web/src/lib/supabase/authGateway.adapter.ts:27-38`, `apps/web/src/lib/supabase/authGateway.adapter.ts:42-50`, `apps/web/src/lib/supabase/authGateway.adapter.ts:55-71`, `apps/web/src/lib/supabase/authGateway.adapter.ts:73-86`, `apps/web/src/lib/supabase/authGateway.adapter.ts:88-99`, `apps/web/src/lib/supabase/authGateway.constant.ts:6-11`, `apps/web/src/lib/supabase/authGateway.constant.ts:14-22`, `apps/web/src/lib/supabase/authGateway.constant.ts:28`, `apps/web/src/lib/supabase/authGateway.constant.ts:34-40`, `apps/web/src/services/Auth/auth.service.ts:21`

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

**Evidence:** `apps/web/src/components/ui/Button/Button.component.tsx:24`, `apps/web/src/components/ui/Button/Button.component.tsx:44`, `apps/web/src/components/ui/LoadingSkeleton/LoadingSkeleton.component.tsx:13`, `apps/web/src/components/ui/LoadingSkeleton/LoadingSkeleton.component.tsx:19`

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

## Open questions

- **Q1** — `docs/infrastructure.md:109` and `docs/infrastructure.md:111` list `X-XSS-Protection`
  and a `Content-Security-Policy`, and `docs/infrastructure.md:92` puts HSTS at Cloudflare, but
  `apps/web/next.config.ts:12` sends neither of the first two and adds `Strict-Transport-Security`
  itself (WEB-34).
- **Q2** — `docs/infrastructure.md:136` names the Cloudflare Images or R2 adapters as the default
  image delivery, but `apps/web/src/lib/image-delivery/imageDelivery.adapter.ts:4` defaults to the
  public delivery (WEB-36).
- **Q3** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-app-behaviour/`: a
  failed query queues no toast and the dashboard shows its error state (WEB-07, WEB-26).
- **Q4** — Closed on 2026-11-14 by `openspec/changes/archive/2026-11-14-error-surfacing/`: the
  root providers mount the toast viewport (WEB-37), and `error.tsx` and `global-error.tsx` catch
  render crashes (WEB-38).
- **Q5** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-i18n/`: the async
  boundary, the toast and the busy labels read their copy from the catalogs (WEB-27, WEB-37,
  WEB-47).
- **Q6** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-i18n/`: client
  components render in the active locale, the document language follows it, and the language
  button switches back (WEB-15, WEB-16).
