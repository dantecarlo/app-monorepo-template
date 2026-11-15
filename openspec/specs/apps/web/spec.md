# apps/web — living spec

> **Governs:** `apps/web/src`, `apps/web/next.config.ts`, `apps/web/instrumentation.ts`, `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts`
> **ID prefix:** `WEB`
> **Derived from:** `docs/architecture/web.md`, `docs/architecture/shared.md`, `docs/infrastructure.md`, `docs/e2e.md`, `docs/code-standards.md`, `AGENTS.md`
> **Verified against the code:** 2026-11-14 at `94cc114`

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
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "renders the dashboard header"
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "renders the nav bar"
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "renders the view all button"

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
- **Test:** `apps/web/src/services/ItemsSummary/itemsSummary.service.test.ts` › "returns summary counts that reflect the mocked item list"

#### Scenario: the screen loader forwards the summary

- **GIVEN** the summary service resolves a view model
- **WHEN** the summary screen's loader runs
- **THEN** it returns that view model unchanged
- **Test:** `apps/web/src/screens/ItemsSummary/loadItemsSummary.service.test.ts` › "returns the summary view model from the domain service"

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

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:43-53`, `apps/web/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:28-32`

#### Scenario: the list shows skeletons

- **GIVEN** the items service has not resolved
- **WHEN** the dashboard renders
- **THEN** at least one element with the status role is shown
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "shows loading skeletons while fetching"
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.test.ts` › "is in loading state initially"

#### Scenario: the stats card shows dashes

- **GIVEN** the stats card is told the items are loading
- **WHEN** it renders
- **THEN** it shows a dash in place of the counts
- **Test:** `apps/web/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.test.tsx` › "shows dash placeholder when loading"

### Requirement: WEB-05 — The dashboard lists the loaded items with their counts

The web app SHALL, once the items load, render one item card per item, the result count in the
list header, the total item count and the count of items whose status is active.

**Evidence:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:59-65`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:30-32`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:56-57`

#### Scenario: the item cards appear

- **GIVEN** the items service resolves the sample items
- **WHEN** the dashboard finishes loading
- **THEN** the item titles are shown
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "renders item list after loading"

#### Scenario: the counts are derived from the items

- **GIVEN** the items service resolves fixtures of which one is active
- **WHEN** the dashboard hook settles
- **THEN** it exposes one view model per item, a total equal to the item count and an active count of 1
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.test.ts` › "exposes adapted view models and derived counts on success"

#### Scenario: the cards show the counts

- **GIVEN** loaded counts
- **WHEN** the stats card and the list header render
- **THEN** the stats card shows the total and the list header shows the result count
- **Test:** `apps/web/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.test.tsx` › "renders stats when not loading"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.test.tsx` › "renders the list title and item count"

### Requirement: WEB-06 — The dashboard shows an empty state for no items

The web app SHALL render the empty state with the `items.dashboard.listEmpty` message when the
loaded item list is empty.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:54-55`

#### Scenario: the service returns no items

- **GIVEN** the items service resolves an empty list
- **WHEN** the dashboard finishes loading
- **THEN** the empty-list message is shown
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "shows empty-state message when items query returns an empty array"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.test.tsx` › "renders empty state when items list is empty"

### Requirement: WEB-07 — A failed items load falls back to the empty list

The web app SHALL, when the items query fails, queue an error toast carrying the fixed English
override message the dashboard hook passes, and render the items list as empty, with no error
state on the screen.

**Evidence:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:46-49`, `apps/web/src/lib/query/useAppQuery.hook.ts:36-49`, `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:54-55`

#### Scenario: the items service rejects

- **GIVEN** the items service rejects
- **WHEN** the dashboard settles
- **THEN** an error toast is queued and the empty-list message is shown
- **Test:** Not covered — no test makes the items query fail on the dashboard; the toast path alone is covered under WEB-26.

### Requirement: WEB-08 — The dashboard search re-queries the items

The web app SHALL re-run the items query with the typed search text and the item limit, 50 by
default, under the query key `QueryKeys.items.list(search)`.

**Evidence:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:40-57`, `apps/web/src/lib/query/queryKeys.constant.ts:30-37`, `apps/web/src/services/Items/items.service.ts:96-116`

#### Scenario: a search term is typed

- **GIVEN** the dashboard hook loaded with a limit of 10
- **WHEN** the search text changes to a term
- **THEN** the items service is called with that term and the limit
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.test.ts` › "forwards search and limit to the service when search changes"

#### Scenario: the search box is labelled

- **GIVEN** the items list card
- **WHEN** it renders
- **THEN** it shows a search box named by the `items.dashboard.searchLabel` message
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.test.tsx` › "renders the search bar"

#### Scenario: the sample service filters the items

- **GIVEN** the in-memory sample items service
- **WHEN** it is asked for a search term
- **THEN** it keeps the items whose title, description or category contains the term, ignoring case, up to the limit
- **Test:** Not covered — the hook and screen tests mock `getItems`, and `apps/web/src/services/Items/items.service.test.ts` covers only the HTTP variant `fetchItems`.

### Requirement: WEB-09 — Each item card shows the item and its author

The web app SHALL render each item with its title, description, category, author name, relative
creation time and status label, beside an avatar holding the author's initials, at most two, or a
question mark when the item has no author.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.tsx:20-49`, `apps/web/src/services/Items/Items.adapter.ts:15-51`

#### Scenario: the card content

- **GIVEN** an item view model
- **WHEN** its card renders
- **THEN** the title, description, category and relative time are shown
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.test.tsx` › "renders the title, description, category and time"

#### Scenario: the initials of a named author

- **GIVEN** an item whose author name has two words
- **WHEN** it is adapted for display
- **THEN** its initials are the first letter of each word
- **Test:** `apps/web/src/services/Items/Items.adapter.test.ts` › "builds initials from a two-word author name"

#### Scenario: an item with no author

- **GIVEN** an item with no author name
- **WHEN** it is adapted and rendered
- **THEN** the initials are a question mark and no author name is shown
- **Test:** `apps/web/src/services/Items/Items.adapter.test.ts` › "falls back to "?" initials when author_name is null"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.test.tsx` › "omits the author label when empty"

### Requirement: WEB-10 — The dashboard navigation marks the active tab

The web app SHALL render the dashboard's bottom navigation as a landmark labelled by the
`items.dashboard.nav.ariaLabel` message, with home, items, search and settings tabs, marking the
active tab as selected, home by default.

**Evidence:** `apps/web/src/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component.tsx:17-53`, `apps/web/src/screens/ItemsDashboard/hooks/useItems.constant.ts:9`, `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:44`

#### Scenario: the navigation renders its tabs

- **GIVEN** the dashboard navigation with home active
- **WHEN** it renders
- **THEN** the four tab labels are shown and the home tab has `aria-selected` set to true
- **Test:** `apps/web/src/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component.test.tsx` › "renders all nav items"
- **Test:** `apps/web/src/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component.test.tsx` › "marks the active item as selected"
- **Test:** `apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.test.tsx` › "renders the nav bar"

#### Scenario: a tab is pressed

- **GIVEN** the dashboard with home active
- **WHEN** another tab is pressed
- **THEN** that tab becomes the selected one and the route does not change
- **Test:** Not covered — no test presses a tab on the dashboard screen.

### Requirement: WEB-11 — The login route renders the auth shell

The web app SHALL render, at the login route, the login screen inside the auth shell: the theme
and language controls, the logo and app name, the `auth.login` title and subtitle, labelled email
and password fields, a submit button and a Google sign-in button.

**Evidence:** `apps/web/src/app/login/page.tsx:3`, `apps/web/src/components/ui/AuthShell/AuthShell.component.tsx:30-47`, `apps/web/src/screens/Login/Login.screen.tsx:25-84`

#### Scenario: the login screen renders

- **GIVEN** the login screen with its messages
- **WHEN** it renders
- **THEN** the app name, the title and the labelled email and password fields are shown
- **Test:** `apps/web/src/screens/Login/Login.screen.test.tsx` › "renders the brand name, title, and field labels"

#### Scenario: the shell controls render

- **GIVEN** the login screen
- **WHEN** it renders
- **THEN** a theme switch and a language button are shown
- **Test:** `apps/web/src/screens/Login/Login.screen.test.tsx` › "mounts the theme and language controls"

### Requirement: WEB-12 — The login form validates its fields before submitting

The web app SHALL reject a login submit whose email does not match the email pattern or whose
password is shorter than 8 characters, and show the `auth.login.errors.email` or
`auth.login.errors.password` message on the offending field.

**Evidence:** `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:18-32`, `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:60-65`, `apps/web/src/screens/Login/Login.constant.ts:4-7`, `apps/web/src/screens/Login/Login.screen.tsx:34-39`

#### Scenario: empty fields are submitted

- **GIVEN** the login screen with empty fields
- **WHEN** the submit button is pressed
- **THEN** both field error messages are shown
- **Test:** `apps/web/src/screens/Login/Login.screen.test.tsx` › "surfaces validation errors when submitting empty fields"

#### Scenario: the form hook rejects an invalid submit

- **GIVEN** the form hook with empty values
- **WHEN** the form is submitted
- **THEN** the default submit is prevented, both error keys are set and the form is not submitting
- **Test:** `apps/web/src/screens/Login/hooks/useLoginForm.hook.test.ts` › "reports field error keys for an invalid submit"

### Requirement: WEB-13 — A valid login submit only enters the submitting state

The web app SHALL, on a login submit that passes validation, clear the field errors and switch the
form to its submitting state, which disables the submit button and shows the
`auth.login.submitting` label, without calling the auth gateway.

**Evidence:** `apps/web/src/screens/Login/hooks/useLoginForm.hook.ts:60-69`, `apps/web/src/screens/Login/Login.screen.tsx:64-70`

#### Scenario: a valid email and password are submitted

- **GIVEN** the form hook holding a valid email and an 8-character password
- **WHEN** the form is submitted
- **THEN** the errors are empty and the form is submitting
- **Test:** `apps/web/src/screens/Login/hooks/useLoginForm.hook.test.ts` › "flips submitting on a valid submit and clears errors"

#### Scenario: the submit button reflects the submitting state

- **GIVEN** the login screen after a valid submit
- **WHEN** it re-renders
- **THEN** the submit button is disabled, shows the submitting label, and no sign-in request is made
- **Test:** Not covered — no test submits valid values on the screen or asserts that the auth gateway stays untouched.

### Requirement: WEB-14 — Server-rendered translations follow the locale cookie

The web app SHALL resolve the locale of server-rendered translations from the `NEXT_LOCALE`
cookie, else the routing locale, falling back to the default language for a missing or unsupported
value, and load that locale's catalog with the UTC time zone.

**Evidence:** `apps/web/src/i18n/request.config.ts:14-35`, `apps/web/next.config.ts:10`

#### Scenario: no cookie is set

- **GIVEN** no `NEXT_LOCALE` cookie and no routing locale
- **WHEN** the request config resolves
- **THEN** the locale is the default language with its catalog and the UTC time zone
- **Test:** `apps/web/src/i18n/request.config.test.ts` › "falls back to the default language when no cookie is set"

#### Scenario: the cookie names a supported language

- **GIVEN** a `NEXT_LOCALE` cookie set to the Spanish language code
- **WHEN** the request config resolves
- **THEN** the locale and the catalog are the Spanish ones
- **Test:** `apps/web/src/i18n/request.config.test.ts` › "resolves the locale from the NEXT_LOCALE cookie"

#### Scenario: the cookie names an unsupported language

- **GIVEN** a `NEXT_LOCALE` cookie set to a language the app does not support
- **WHEN** the request config resolves
- **THEN** the locale is the default language
- **Test:** `apps/web/src/i18n/request.config.test.ts` › "ignores an unsupported cookie value"

### Requirement: WEB-15 — Client components render in the default language

The web app SHALL render every client component with the default language locale and catalog,
whatever the `NEXT_LOCALE` cookie holds, inside an html element whose language attribute is
English.

**Evidence:** `apps/web/src/app/layout.tsx:56`, `apps/web/src/app/layout.tsx:59-63`, `apps/web/src/app/providers.tsx:43-47`

#### Scenario: the locale cookie names another language

- **GIVEN** a `NEXT_LOCALE` cookie set to a supported language other than the default
- **WHEN** a route with client components renders
- **THEN** the client components still show the default-language messages
- **Test:** Not covered — no test renders the root layout or the client providers.

### Requirement: WEB-16 — The language button cycles the locale cookie

The web app SHALL, when the language button is pressed, write the supported language that follows
the client locale to the `NEXT_LOCALE` cookie for one year on the root path with SameSite Lax, and
refresh the router; the button shows the client locale.

**Evidence:** `apps/web/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.ts:18-42`, `apps/web/src/components/ui/LanguageSwitcher/LanguageSwitcher.constant.ts:2-5`, `apps/web/src/components/ui/LanguageSwitcher/LanguageSwitcher.component.tsx:18-25`

#### Scenario: from the first language to the next

- **GIVEN** the client locale is English
- **WHEN** the language is cycled
- **THEN** the cookie holds the Spanish code and the router refreshes once
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.test.ts` › "cycling from en advances to es and writes the cookie"

#### Scenario: the cycle wraps around

- **GIVEN** the client locale is Spanish
- **WHEN** the language is cycled
- **THEN** the cookie holds the English code
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.test.ts` › "cycling wraps from es back to en"

#### Scenario: the button label

- **GIVEN** the client locale is English
- **WHEN** the language button renders
- **THEN** its text is the English code
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/LanguageSwitcher.component.test.tsx` › "renders the active locale label"

### Requirement: WEB-17 — The theme is resolved before first paint

The web app SHALL set the html `data-theme` attribute before first paint from the `NEXT_THEME`
cookie when it holds light or dark, else from the `prefers-color-scheme` media query, and adopt
that painted value into the theme store on mount.

**Evidence:** `apps/web/src/lib/theme/noFlashTheme.constant.ts:17-25`, `apps/web/src/app/layout.tsx:71-73`, `apps/web/src/components/ThemeProvider/useThemeBootstrap.hook.ts:14-23`

#### Scenario: the head script paints the theme

- **GIVEN** a visitor with a `NEXT_THEME` cookie, or none
- **WHEN** the document head runs before first paint
- **THEN** the html element carries the cookie's theme, else the theme the colour-scheme preference names
- **Test:** Not covered — no test executes the head script; the glass e2e run only depends on it indirectly through a pinned dark colour scheme.

#### Scenario: the provider adopts the painted theme

- **GIVEN** the html element painted with the light theme
- **WHEN** the theme provider mounts
- **THEN** the theme store holds the light theme
- **Test:** `apps/web/src/components/ThemeProvider/ThemeProvider.component.test.tsx` › "adopts the painted theme attribute into the store on mount"
- **Test:** `apps/web/src/components/ThemeProvider/useThemeBootstrap.hook.test.ts` › "adopts the theme already painted on the document element"

#### Scenario: an unknown painted value

- **GIVEN** the html element painted with a value that is not a theme
- **WHEN** the theme bootstrap runs
- **THEN** the theme store keeps its value
- **Test:** `apps/web/src/components/ThemeProvider/useThemeBootstrap.hook.test.ts` › "leaves the store untouched when the painted value is not a theme"

### Requirement: WEB-18 — Changing the theme repaints and persists it

The web app SHALL, when the theme changes, set the html `data-theme` attribute, write the
`NEXT_THEME` cookie for one year on the root path with SameSite Lax and update the theme store,
without a reload; the theme switch is on for the light theme.

**Evidence:** `apps/web/src/components/ThemeProvider/useTheme.hook.ts:28-35`, `apps/web/src/lib/theme/theme.constant.ts:5-8`, `apps/web/src/components/ui/ThemeToggle/useThemeToggle.hook.ts:15-22`

#### Scenario: the light theme is chosen

- **GIVEN** the dark theme is active
- **WHEN** the theme is set to light
- **THEN** the html element carries the light theme, the store holds it and the cookie names it
- **Test:** `apps/web/src/components/ThemeProvider/useTheme.hook.test.ts` › "setTheme flips the data-theme attribute on the document element"
- **Test:** `apps/web/src/components/ThemeProvider/useTheme.hook.test.ts` › "setTheme persists the choice to the NEXT_THEME cookie"

#### Scenario: the theme switch is flipped on

- **GIVEN** the dark theme is active
- **WHEN** the theme switch is turned on
- **THEN** the light theme is set, and the switch then reads as on
- **Test:** `apps/web/src/components/ui/ThemeToggle/useThemeToggle.hook.test.ts` › "onValueChange(true) sets the light theme"
- **Test:** `apps/web/src/components/ui/ThemeToggle/ThemeToggle.component.test.tsx` › "renders the switch as on when the theme is light"

### Requirement: WEB-19 — The auth provider tracks the session from the gateway

The web app SHALL set the auth status to loading on mount, then to authenticated or
unauthenticated from the auth gateway's current session and from every auth state change, and
unsubscribe from those changes on unmount.

**Evidence:** `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.ts:8-33`, `apps/web/src/app/providers.tsx:49`

#### Scenario: the gateway holds a session

- **GIVEN** a gateway whose current session exists
- **WHEN** the auth bootstrap runs
- **THEN** the store holds that session with the authenticated status
- **Test:** `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.test.ts` › "sets status to authenticated after getSession resolves with a session"

#### Scenario: the gateway holds no session

- **GIVEN** a gateway whose current session is empty
- **WHEN** the auth bootstrap runs
- **THEN** the status is unauthenticated
- **Test:** `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.test.ts` › "sets status to unauthenticated when getSession resolves with null"

#### Scenario: the subscription lifecycle

- **GIVEN** the auth provider mounted with a gateway
- **WHEN** it mounts and later unmounts
- **THEN** it subscribes to auth state changes once and unsubscribes once
- **Test:** `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.test.ts` › "subscribes to auth state changes"
- **Test:** `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.test.ts` › "calls unsubscribe on unmount"

### Requirement: WEB-20 — The auth gateway is a no-op without Supabase settings

The web app SHALL give the auth provider a no-op gateway during server rendering and in a browser
where `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset, so the session
resolves to none and a sign-in rejects; otherwise one Supabase auth gateway per browser.

**Evidence:** `apps/web/src/app/SupabaseProviders.tsx:16-36`, `apps/web/src/app/SupabaseProviders.tsx:42-44`

#### Scenario: the Supabase settings are missing

- **GIVEN** a browser build with no Supabase URL or anon key
- **WHEN** the providers mount
- **THEN** the auth status settles as unauthenticated and no Supabase client is created
- **Test:** Not covered — no test renders `apps/web/src/app/SupabaseProviders.tsx`.

### Requirement: WEB-21 — The browser Supabase client is created once from the public settings

The web app SHALL create the browser Supabase client on first use from `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, return that same client afterwards, and throw an error naming
both variables when either is missing.

**Evidence:** `apps/web/src/lib/supabase/client.adapter.ts:17-40`

#### Scenario: the settings are present

- **GIVEN** both public Supabase settings
- **WHEN** the client is requested twice
- **THEN** it is created once with those settings and the same client is returned both times
- **Test:** `apps/web/src/lib/supabase/client.adapter.test.ts` › "creates the client lazily with the public env credentials"
- **Test:** `apps/web/src/lib/supabase/client.adapter.test.ts` › "returns the same instance on subsequent calls"

#### Scenario: the settings are missing

- **GIVEN** neither public Supabase setting
- **WHEN** the client is requested
- **THEN** it throws an error naming the missing settings
- **Test:** `apps/web/src/lib/supabase/client.adapter.test.ts` › "throws a helpful error when env is missing"

### Requirement: WEB-22 — The server Supabase client reads the request cookies

The web app SHALL create a new server Supabase client on every call, wired to the request cookie
store for reading and writing the session cookies.

**Evidence:** `apps/web/src/lib/supabase/server.adapter.ts:12-28`

#### Scenario: the client is created on the server

- **GIVEN** a request cookie store
- **WHEN** the server client is created
- **THEN** its cookie reader reads from that store
- **Test:** `apps/web/src/lib/supabase/server.adapter.test.ts` › "awaits the cookie store and forwards a getAll passthrough"

#### Scenario: two calls

- **GIVEN** a request
- **WHEN** the server client is created twice
- **THEN** the factory runs twice
- **Test:** `apps/web/src/lib/supabase/server.adapter.test.ts` › "returns a fresh client instance per call"

### Requirement: WEB-23 — Queries and mutations share fixed retry and freshness defaults

The web app SHALL create its query client with a 30-second stale time and one retry for queries,
and no retry for mutations.

**Evidence:** `apps/web/src/lib/query/createQueryClient.helper.ts:10`, `apps/web/src/lib/query/createQueryClient.helper.ts:22-32`, `apps/web/src/app/providers.tsx:20-27`

#### Scenario: the defaults of a new client

- **GIVEN** a query client created with no options
- **WHEN** its default options are read
- **THEN** the query stale time is 30 000 ms, queries retry once and mutations never retry
- **Test:** `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "applies 30s stale time by default"
- **Test:** `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "applies retry: 1 for queries"
- **Test:** `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "applies retry: 0 for mutations"

### Requirement: WEB-24 — Every failed query and mutation is reported once with a scrubbed key

The web app SHALL report every failed query and mutation once, from the query cache and mutation
cache error handlers, to the observability port, passing the query key through
`sanitizeQueryKey` from packages/core with the values of `QueryKeySegmentEnum` as its structural
segments.

**Evidence:** `apps/web/src/lib/query/createQueryClient.helper.ts:33-48`, `apps/web/src/lib/query/queryKeys.constant.ts:17-24`, `apps/web/src/lib/observability/toCaptureError.helper.ts:7-11`, `apps/web/src/app/providers.tsx:20-27`

#### Scenario: a query fails

- **GIVEN** a query whose key holds an identifier
- **WHEN** it fails
- **THEN** the capture sink is called once, from the query cache, with the identifier redacted
- **Test:** `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure"

#### Scenario: a query keyed by a search text

- **GIVEN** a query keyed by `QueryKeys.items.list('alice')`
- **WHEN** it fails
- **THEN** the capture sink receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure"

#### Scenario: a mutation fails

- **GIVEN** a mutation
- **WHEN** it fails
- **THEN** the capture sink is called from the mutation cache
- **Test:** `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure"

#### Scenario: the sink reaches the observability port

- **GIVEN** the capture sink built over an observability port
- **WHEN** it is called with an error and its context
- **THEN** the port's error capture receives both, once
- **Test:** `apps/web/src/lib/observability/toCaptureError.helper.test.ts` › "forwards error and context to captureError"

### Requirement: WEB-25 — An error message is resolved by one precedence

The web app SHALL resolve the message shown for an error from, in order, the caller's override,
the translated `messageKey` of an `AppError` when the catalog holds it, the error's own message,
and the `helper.error.generic` message.

**Evidence:** `apps/web/src/lib/query/resolveErrorMessage.helper.ts:11-31`, `apps/web/src/lib/query/useAppQuery.constant.ts:1`

#### Scenario: an override is given

- **GIVEN** an override message and an application error with a known key
- **WHEN** the message is resolved
- **THEN** the override is returned
- **Test:** `apps/web/src/lib/query/resolveErrorMessage.helper.test.ts` › "prefers the explicit errorMessage override"

#### Scenario: an application error with a known key

- **GIVEN** no override and an application error whose key the catalog holds
- **WHEN** the message is resolved
- **THEN** the translated key is returned
- **Test:** `apps/web/src/lib/query/resolveErrorMessage.helper.test.ts` › "resolves AppError.messageKey via i18n when no override"

#### Scenario: the key or the error type falls through

- **GIVEN** an application error whose key the catalog lacks, or a plain error
- **WHEN** the message is resolved
- **THEN** the error's own message is returned
- **Test:** `apps/web/src/lib/query/resolveErrorMessage.helper.test.ts` › "falls back to error.message when the key is missing from catalog"
- **Test:** `apps/web/src/lib/query/resolveErrorMessage.helper.test.ts` › "falls back to error.message for a plain Error"

#### Scenario: the error is not an Error

- **GIVEN** a thrown value that is not an error object
- **WHEN** the message is resolved
- **THEN** the generic fallback is returned
- **Test:** `apps/web/src/lib/query/resolveErrorMessage.helper.test.ts` › "uses the generic fallback for a non-Error value"

### Requirement: WEB-26 — Query and mutation outcomes are queued as toasts

The web app SHALL queue each failure of a query as one error toast with the resolved message,
however often the component that runs the query re-renders, each failed mutation as an error
toast with the resolved message, and a mutation's success message as a success toast, in the
toast store, which drops each toast after 4 seconds.

**Evidence:** `apps/web/src/lib/query/useAppQuery.hook.ts:36-49`, `apps/web/src/lib/query/useAppMutation.hook.ts:29-45`, `apps/web/src/stores/toast.store.ts:36-48`

#### Scenario: a query fails

- **GIVEN** a query with an override message
- **WHEN** it fails
- **THEN** an error toast with the override message is queued
- **Test:** `apps/web/src/lib/query/useAppQuery.hook.test.ts` › "fires an error toast with the override message on failure"

#### Scenario: a failed query re-renders

- **GIVEN** a query that failed once and queued its toast
- **WHEN** its component renders again while the query stays in error
- **THEN** no other toast is queued
- **Test:** `apps/web/src/lib/query/useAppQuery.hook.test.ts` › "queues one error toast per failure however often it re-renders"

#### Scenario: the query fails again

- **GIVEN** a query that failed once and queued its toast
- **WHEN** it is refetched and fails again
- **THEN** a second error toast is queued
- **Test:** `apps/web/src/lib/query/useAppQuery.hook.test.ts` › "queues another error toast when the query fails again"

#### Scenario: a mutation fails or succeeds

- **GIVEN** a mutation with an override message or a success message
- **WHEN** it fails or succeeds
- **THEN** an error toast or a success toast with that message is queued
- **Test:** `apps/web/src/lib/query/useAppMutation.hook.test.ts` › "shows an error toast with the override message on failure"
- **Test:** `apps/web/src/lib/query/useAppMutation.hook.test.ts` › "shows a success toast when successMessage is provided"

#### Scenario: a toast expires

- **GIVEN** a queued toast
- **WHEN** 4 seconds pass
- **THEN** the toast store no longer holds it
- **Test:** `apps/web/src/stores/toast.store.test.ts` › "toast auto-dismisses after 4 seconds"

### Requirement: WEB-27 — The async boundary shows a loading status and a retryable error

The web app SHALL, inside an async boundary, render a status region while the children suspend,
and, when they throw, an alert with the error's message, or a generic message for a non-error
value, and a Retry button that resets the boundary.

**Evidence:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx:11-19`, `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component.tsx:7-15`, `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:6-16`

#### Scenario: the children render

- **GIVEN** children that neither suspend nor throw
- **WHEN** the boundary renders
- **THEN** the children are shown
- **Test:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundary.component.test.tsx` › "renders its children when nothing suspends or throws"

#### Scenario: the loading fallback

- **GIVEN** the default loading fallback
- **WHEN** it renders
- **THEN** a status region with a loading label is shown
- **Test:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component.test.tsx` › "renders a status region with a loading label"

#### Scenario: the error fallback

- **GIVEN** the default error fallback for a thrown error
- **WHEN** Retry is pressed
- **THEN** the error message was shown in an alert and the boundary is reset once
- **Test:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.test.tsx` › "renders the error message when error is an Error instance"
- **Test:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.test.tsx` › "calls resetErrorBoundary when Retry is clicked"
- **Test:** `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.test.tsx` › "has role=alert"

### Requirement: WEB-28 — The error state shows translated copy by error code

The web app SHALL render the error state as an alert whose title and message come from the
`components.errorState` catalog entry of the given error code, or its generic entry when no code is
given, with a retry button only when a retry or reset handler is given.

**Evidence:** `apps/web/src/components/ui/ErrorState/ErrorState.component.tsx:11-51`, `apps/web/src/components/ui/ErrorState/ErrorState.constant.ts:3-8`

#### Scenario: no code is given

- **GIVEN** the error state with no code
- **WHEN** it renders
- **THEN** the generic title and message are shown in an alert
- **Test:** `apps/web/src/components/ui/ErrorState/ErrorState.component.test.tsx` › "renders generic copy when no code"
- **Test:** `apps/web/src/components/ui/ErrorState/ErrorState.component.test.tsx` › "has role=alert"

#### Scenario: a not-found code

- **GIVEN** the error state with the not-found code
- **WHEN** it renders
- **THEN** the not-found title is shown
- **Test:** `apps/web/src/components/ui/ErrorState/ErrorState.component.test.tsx` › "renders code-specific copy for 404"

#### Scenario: the retry button

- **GIVEN** the error state with a retry handler, a reset handler, or neither
- **WHEN** it renders and the retry button is pressed
- **THEN** the handler runs once, and with neither handler no button is rendered
- **Test:** `apps/web/src/components/ui/ErrorState/ErrorState.component.test.tsx` › "renders retry button and calls onRetry"
- **Test:** `apps/web/src/components/ui/ErrorState/ErrorState.component.test.tsx` › "calls resetErrorBoundary as fallback retry"
- **Test:** `apps/web/src/components/ui/ErrorState/ErrorState.component.test.tsx` › "does not render retry button when neither onRetry nor resetErrorBoundary given"

### Requirement: WEB-29 — Observability scrubs PII and stays silent without a DSN

The web app SHALL send errors, messages, breadcrumbs and the user to Sentry only when
`NEXT_PUBLIC_SENTRY_DSN` is set, passing every context, breadcrumb payload and user through
`scrubPII` from packages/core first.

**Evidence:** `apps/web/src/lib/observability/createSentryObservability.adapter.ts:24-65`, `apps/web/src/lib/observability/observability.adapter.ts:5-6`

#### Scenario: an error is captured

- **GIVEN** a DSN is set
- **WHEN** an error is captured with a context holding an email
- **THEN** Sentry receives the error with the email redacted
- **Test:** `apps/web/src/lib/observability/createSentryObservability.adapter.test.ts` › "captureError forwards the exception to Sentry"
- **Test:** `apps/web/src/lib/observability/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context before sending"

#### Scenario: the user and breadcrumbs are scrubbed

- **GIVEN** a DSN is set
- **WHEN** a user or a breadcrumb holding an email is sent
- **THEN** Sentry receives it with the email redacted
- **Test:** `apps/web/src/lib/observability/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload"
- **Test:** `apps/web/src/lib/observability/createSentryObservability.adapter.test.ts` › "addBreadcrumb scrubs PII from breadcrumb data"

#### Scenario: no DSN

- **GIVEN** no DSN
- **WHEN** every observability method is called
- **THEN** Sentry receives nothing
- **Test:** `apps/web/src/lib/observability/createSentryObservability.adapter.test.ts` › "all methods no-op when the DSN is absent"

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

**Evidence:** `apps/web/src/middleware.ts:5-23`, `apps/web/src/lib/origin-guard/originGuard.adapter.ts:4`

#### Scenario: the origin secret is wrong

- **GIVEN** a configured origin secret and a request whose origin header does not match it
- **WHEN** the middleware runs
- **THEN** the response is 403 with an empty body
- **Test:** Not covered — no test drives `apps/web/src/middleware.ts`; the guard's verdict belongs to packages/cloudflare.

#### Scenario: no origin secret is configured

- **GIVEN** no `CF_ORIGIN_SECRET`
- **WHEN** the origin guard checks a request with no origin header
- **THEN** it reports the request trusted
- **Test:** `apps/web/src/lib/origin-guard/originGuard.adapter.test.ts` › "assertTrustedOrigin passes through when no secret is configured"

#### Scenario: a static asset is requested

- **GIVEN** a configured origin secret
- **WHEN** a request for a built static asset arrives without the origin header
- **THEN** the middleware does not run for it
- **Test:** Not covered — no test exercises the middleware matcher.

### Requirement: WEB-32 — The Turnstile route rejects an unreadable body

The web app SHALL answer a POST to the Turnstile verify route whose body is not JSON with status
400, a body whose success is false, and `Cache-Control: no-store`.

**Evidence:** `apps/web/src/app/api/turnstile/verify/route.ts:5-24`

#### Scenario: the body is empty

- **GIVEN** a POST with no body
- **WHEN** the route handles it
- **THEN** it answers 400, success false and no-store
- **Test:** `apps/web/src/app/api/turnstile/verify/route.test.ts` › "POST returns 400 when the request body is empty"

#### Scenario: the body is not JSON

- **GIVEN** a POST whose body is plain text
- **WHEN** the route handles it
- **THEN** it answers 400, success false and no-store
- **Test:** `apps/web/src/app/api/turnstile/verify/route.test.ts` › "POST returns 400 when the request body is not valid JSON"

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
- **Test:** `apps/web/src/lib/bot-protection/botProtection.adapter.test.ts` › "verifyToken degrades to success when no secret is configured"

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
- **Test:** `apps/web/src/lib/image-delivery/imageCacheHeaders.helper.test.ts` › "buildImageCacheHeaders returns a long immutable Cache-Control header"

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
- **Test:** `apps/web/src/lib/image-delivery/imageDelivery.adapter.test.ts` › "buildImageUrl returns the raw public path by default"

### Requirement: WEB-37 — The root providers show the toast viewport

The web app SHALL mount the toast viewport inside the root providers, rendering every toast of the
toast store, with its message and a dismiss button that removes it, in a polite status region.

**Evidence:** `apps/web/src/app/providers.tsx:50`, `apps/web/src/components/ui/Toast/Toast.component.tsx:20-45`

#### Scenario: a queued error toast is shown and dismissed

- **GIVEN** the root providers render a page
- **WHEN** an error toast is queued and its Dismiss button is then pressed
- **THEN** the toast's message is shown, and after the press it is gone
- **Test:** `apps/web/src/app/providers.test.tsx` › "shows a queued error toast and removes it when Dismiss is pressed"

#### Scenario: no toast is queued

- **GIVEN** an empty toast store
- **WHEN** the viewport renders
- **THEN** it renders an empty status region
- **Test:** `apps/web/src/components/ui/Toast/Toast.component.test.tsx` › "renders an empty live region when there are no toasts"

### Requirement: WEB-38 — A render crash shows the error state

The web app SHALL catch a render crash below the root layout with the root `error.tsx` boundary,
and a crash of the root layout itself with `global-error.tsx`, which renders its own document;
each SHALL show the error state with its generic copy and a Try again button that retries the
segment.

**Evidence:** `apps/web/src/app/error.tsx:13-17`, `apps/web/src/app/global-error.tsx:18-34`, `apps/web/src/components/ui/ErrorState/ErrorState.component.tsx:27-49`

#### Scenario: a route crashes while rendering

- **GIVEN** a route below the root layout throws while rendering
- **WHEN** the root error boundary renders and Try again is pressed
- **THEN** the generic error title and message are shown in an alert, and the segment is retried once
- **Test:** `apps/web/src/app/error.test.tsx` › "renders the generic error state for a render crash"
- **Test:** `apps/web/src/app/error.test.tsx` › "retries the segment when Try again is pressed"

#### Scenario: the root layout crashes

- **GIVEN** the root layout throws while rendering
- **WHEN** the global error boundary renders
- **THEN** it renders its own html and body, holding the generic error state
- **Test:** `apps/web/src/app/global-error.test.tsx` › "renders the generic error state in its own document"

## Open questions

- **Q1** — `docs/infrastructure.md:109` and `docs/infrastructure.md:111` list `X-XSS-Protection`
  and a `Content-Security-Policy`, and `docs/infrastructure.md:92` puts HSTS at Cloudflare, but
  `apps/web/next.config.ts:12` sends neither of the first two and adds `Strict-Transport-Security`
  itself (WEB-34).
- **Q2** — `docs/infrastructure.md:136` names the Cloudflare Images or R2 adapters as the default
  image delivery, but `apps/web/src/lib/image-delivery/imageDelivery.adapter.ts:4` defaults to the
  public delivery (WEB-36).
- **Q3** — `docs/code-standards.md:616` sends query errors to a per-screen `ErrorState` or
  `AsyncBoundary`, but `apps/web/src/lib/query/useAppQuery.hook.ts:48` queues a toast for every
  failed query, and the dashboard
  (`apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:46`) shows the empty-list message
  instead of an error state (WEB-07).
- **Q4** — Closed on 2026-11-14 by `openspec/changes/archive/2026-11-14-error-surfacing/`: the
  root providers mount the toast viewport (WEB-37), and `error.tsx` and `global-error.tsx` catch
  render crashes (WEB-38).
- **Q5** — `docs/code-standards.md:603`, `docs/code-standards.md:607` and `AGENTS.md:141` route
  user-facing copy through the catalogs and ask a reason for an override, but English copy is
  written in `apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:49` (an override with no
  comment), `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:11`,
  `apps/web/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component.tsx:12` and
  `apps/web/src/components/ui/Toast/Toast.constant.ts:1`.
- **Q6** — `docs/architecture/web.md:74` resolves the locale from the `NEXT_LOCALE` cookie, but only
  server components follow it: `apps/web/src/app/providers.tsx:43` and
  `apps/web/src/app/layout.tsx:56` pin client components to the default language and
  `apps/web/src/app/layout.tsx:62` writes `lang="en"`, so the language switcher
  (`apps/web/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.ts:37`) always writes the
  Spanish code and can never switch back (WEB-14 to WEB-16).
