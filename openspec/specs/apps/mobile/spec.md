# apps/mobile — living spec

> **Governs:** `apps/mobile/src`, `apps/mobile/app.json`
<!-- region sentry -->
> **Governs:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts`
<!-- endregion sentry -->
> **ID prefix:** `MOBILE`
> **Derived from:** `docs/architecture/mobile.md`, `docs/architecture/shared.md`, `docs/code-standards.md`, `docs/observability.md`, `docs/e2e.md`, `docs/responsive.md`, `AGENTS.md`, `docs/manifest.md`, `docs/decisions/0001-pluggable-providers.md`
> **Verified against the code:** 2026-11-20 at `79b55e8`

## Purpose

The mobile app is the Expo Router client of the template. It owns two routes with no guard: the
items dashboard, backed by a sample service, and a sign-in form that validates its fields but
signs no one in. It also owns the theme and language controls and their persistence, the
light and dark themes painted from the root, the translator its blocks read their copy
through, over react-i18next behind its lib/i18n, the stores, created through its lib/store over
zustand, a query layer of its own types over TanStack Query behind its lib/query that shows a
failed query on its screen, toasts a failed mutation and captures both through the
observability port, the boot of its root layout behind its lib/bootstrap (the fonts, the splash
screen and the safe area), and the environment wiring of Supabase, whose client it holds as the
opaque backend client and whose auth gateway it builds in its lib/supabase, of PostHog, the
default observability provider, with its consent mode and the consent API, and the device's
key-value storage. It leaves the error, PII-scrubbing, query-key,
auth-gateway, consent and key-value storage contracts to packages/core, the catalogs and language constants to packages/i18n, the
Supabase client and auth gateway to packages/supabase, the theme values to packages/tokens, and
the web counterpart to apps/web.

<!-- region sentry -->
The optional Sentry part of the mobile app, the error-monitoring provider of the `sentry`
capability beside the PostHog default, sits in this region and in the one that closes the
requirements: the adapter of the observability port, which starts the Sentry SDK at module
scope (MOBILE-80 to MOBILE-82). The `sentry` prune drops these regions and the one of the
header, which names the file the part governs, and the `mobile-expo` prune removes the whole
spec.
<!-- endregion sentry -->

## Requirements

### Requirement: MOBILE-01 — Two routes with no guard

The mobile app SHALL render the items dashboard at the root route (/) and the login screen at
/login, under one root stack that checks no session before either renders.

**Evidence:** `apps/mobile/src/app/index.tsx:7`, `apps/mobile/src/app/login.tsx:7`, `apps/mobile/src/app/_layout.tsx:41-50`

#### Scenario: the root route shows the dashboard

- **GIVEN** the app has finished loading its fonts
- **WHEN** the user opens the root route
- **THEN** the items dashboard screen renders
- **Test:** Not covered — no test renders a route file or the root stack; the opt-in mobile-web e2e opens the root route but asserts only layout bounds

#### Scenario: /login shows the login screen

- **GIVEN** the app has finished loading its fonts
- **WHEN** the user opens /login
- **THEN** the login screen renders
- **Test:** Not covered — no test renders `apps/mobile/src/app/login.tsx`

#### Scenario: a signed-out user is not redirected

- **GIVEN** the auth store holds no session
- **WHEN** the user opens the root route
- **THEN** the dashboard renders and no redirect to /login happens
- **Test:** Not covered — no test renders the root stack with a session state

### Requirement: MOBILE-02 — Splash held until the fonts settle

The mobile app SHALL keep the native splash screen up and render no route until the Inter and
Montserrat fonts have loaded or failed to load: `useAppBootstrap` of
`src/lib/bootstrap/useAppBootstrap.hook.ts` loads the seven faces `APP_FONTS` of
`useAppBootstrap.constant.ts` names (Inter 400 and 500, Montserrat 400 to 800), hides the splash
screen once they settle, and tells the root layout when it may render.

**Evidence:** `apps/mobile/src/lib/bootstrap/useAppBootstrap.hook.ts:14-24`, `apps/mobile/src/lib/bootstrap/useAppBootstrap.constant.ts:14-22`, `apps/mobile/src/app/_layout.tsx:24`, `apps/mobile/src/app/_layout.tsx:32-36`

#### Scenario: the faces the app loads

- **GIVEN** the app has just launched
- **WHEN** the bootstrap starts
- **THEN** it loads Inter 400 and 500 and Montserrat 400, 500, 600, 700 and 800
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.constant.test.ts` › "holds the Inter and Montserrat faces the app uses"
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "loads the faces the app renders its text in"

#### Scenario: fonts still loading

- **GIVEN** the app has just launched
- **WHEN** the fonts have neither loaded nor failed
- **THEN** the bootstrap is not ready, the splash screen stays visible, and the root layout renders
  nothing
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "keeps the splash screen up and the routes back while the fonts load"
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "renders no route until the bootstrap is ready"

#### Scenario: the fonts load

- **GIVEN** the app has just launched
- **WHEN** the fonts load
- **THEN** the splash screen hides and the bootstrap is ready
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "hides the splash screen and lets the routes render once the fonts load"

#### Scenario: a font fails to load

- **GIVEN** the app has just launched
- **WHEN** loading a font fails
- **THEN** the splash screen hides and the routes render with the fallback font
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/useAppBootstrap.hook.test.ts` › "hides the splash screen and lets the routes render when a font fails to load"

### Requirement: MOBILE-03 — Initial theme from storage, then the device

The mobile app SHALL start in the theme stored under the app.theme key of the device storage,
read through `keyValueStorage` (MOBILE-56), else in the device appearance when it is light or
dark, else in the dark default of packages/tokens.

**Evidence:** `apps/mobile/src/lib/theme/theme.config.ts:9-14`, `apps/mobile/src/lib/theme/theme.config.ts:27-47`

#### Scenario: a stored theme wins

- **GIVEN** the user chose light in an earlier session
- **WHEN** the app launches on a device set to dark
- **THEN** the app applies the light theme
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "starts in the theme the device storage holds"

#### Scenario: no stored theme and no device preference

- **GIVEN** nothing is stored and the device reports no color scheme
- **WHEN** the app launches
- **THEN** the app applies the dark theme
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "starts in the dark default when nothing is stored and the device has no appearance"

### Requirement: MOBILE-04 — Theme toggle persists the choice

The mobile app SHALL show the theme switch on while the light theme is active, and on a flip
store the matching theme under the app.theme key, through `keyValueStorage` (MOBILE-56), and
apply it to the NativeWind color scheme.

**Evidence:** `apps/mobile/src/components/ui/ThemeToggle/useThemeToggle.hook.ts:14-18`, `apps/mobile/src/lib/theme/theme.config.ts:22-25`

#### Scenario: switching to light

- **GIVEN** the dark theme is active and the switch is off
- **WHEN** the user turns the switch on
- **THEN** light is stored and applied, and every theme-token consumer re-renders in light
- **Test:** Not covered — no test calls useThemeToggle; `setTheme`, which the switch calls, is
  tested alone in MOBILE-56

### Requirement: MOBILE-05 — The root frame follows the theme

The mobile app SHALL paint the navigator background with the active theme's base background, show
dark status bar glyphs under the light theme and light glyphs under the dark one, and wrap the
routes in a view that carries the active theme's `themeVars` from packages/tokens, through
NativeWind's `vars()`.

**Evidence:** `apps/mobile/src/lib/theme/useRootTheme.hook.ts:17`, `apps/mobile/src/lib/theme/useRootTheme.hook.ts:24`, `apps/mobile/src/app/_layout.tsx:31`, `apps/mobile/src/app/_layout.tsx:42`

#### Scenario: the light theme is active

- **GIVEN** the NativeWind color scheme is light
- **WHEN** the root theme is derived
- **THEN** the status bar style is dark, the content background is the light base colour, and the theme style carries the light theme's variables
- **Test:** `apps/mobile/src/lib/theme/__tests__/useRootTheme.hook.test.ts` › "derives the light base, dark glyphs and the light variables under the light theme"

#### Scenario: the root layout renders

- **GIVEN** the light theme is active and the fonts have loaded
- **WHEN** the root layout renders
- **THEN** the routes sit inside a view whose style holds the light theme's variables
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme"

### Requirement: MOBILE-06 — Initial language from storage, then the device

The mobile app SHALL start in the language stored under the app.language key of the device
storage, read through `keyValueStorage` (MOBILE-56), when packages/i18n supports it, else in the
device locale reduced to its language code when supported, else in the default language.

**Evidence:** `apps/mobile/src/lib/i18n/i18n.config.ts:19-27`, `apps/mobile/src/lib/i18n/i18n.config.ts:36-67`

#### Scenario: a regional tag maps to its language

- **GIVEN** no language is stored
- **WHEN** the language is resolved from the tag en-US
- **THEN** a supported language is returned
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "normalizes BCP-47 tag to a supported language"

#### Scenario: an unsupported device language

- **GIVEN** no language is stored
- **WHEN** the language is resolved from an unsupported tag
- **THEN** the default language is returned
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "falls back to default for an unsupported language tag"

#### Scenario: no device language at all

- **GIVEN** no language is stored
- **WHEN** the device reports no language code
- **THEN** the default language is returned
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "returns the default language for null input"

#### Scenario: a stored language wins

- **GIVEN** the user picked a supported language in an earlier session
- **WHEN** the app launches on a device in the other language
- **THEN** i18next starts in the stored language
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "starts i18next in the language the device storage holds"

### Requirement: MOBILE-07 — Language switcher cycles and persists

The mobile app SHALL show the active language code on the language switcher and, on each press,
move to the next language of packages/i18n in order, wrapping to the first, storing it under the
app.language key, through `keyValueStorage` (MOBILE-56), before switching i18next.

**Evidence:** `apps/mobile/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.ts:12-28`, `apps/mobile/src/lib/i18n/i18n.config.ts:29-34`

#### Scenario: pressing on the last language

- **GIVEN** the active language is the last supported one
- **WHEN** the user presses the language switcher
- **THEN** the first supported language is stored and applied, and the switcher shows its code
- **Test:** Not covered — no test calls useLanguageSwitcher; `setLanguage`, which the switcher
  calls, is tested alone in MOBILE-56

### Requirement: MOBILE-08 — Plural rules polyfilled for Hermes

The mobile app SHALL install the Intl.PluralRules polyfill with English and Spanish locale data
before i18next and its ICU plugin initialise.

**Evidence:** `apps/mobile/src/lib/i18n/i18n.config.ts:1`, `apps/mobile/src/lib/i18n/intlPolyfill.config.ts:5-7`

#### Scenario: a plural message on Hermes

- **GIVEN** the app runs on the Hermes engine
- **WHEN** a catalog message with a plural for a count of one renders
- **THEN** the singular form shows instead of the other form
- **Test:** Not covered — the polyfill matters only on Hermes, and no test runs on a device or asserts a plural form

### Requirement: MOBILE-09 — Dashboard data keyed by the search term and the limit

The mobile app SHALL load the dashboard items through useAppQuery under the items list query key
`QueryKeys.items.list({ search, limit })`, which holds the current search term and the item
limit, 50 by default, so two limits never share a cache entry, fetching at most that many items
from the items service and adapting them to view models.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:41-60`, `apps/mobile/src/lib/query/queryKeys.constant.ts:36-41`, `apps/mobile/src/lib/query/queryKeys.type.ts:9-12`

#### Scenario: the user types a search term

- **GIVEN** the dashboard shows the full list
- **WHEN** the user types a term in the search bar
- **THEN** a new query runs under the key for that term and the list shows its result
- **Test:** Not covered — no mobile test changes the search text of useItems; the key factory test pins where the search sits in the key

#### Scenario: two limits

- **GIVEN** two dashboard hooks under one query client, with limits of 1 and 2
- **WHEN** both settle
- **THEN** each lists the items its own limit fetched, the items service is called once per limit, and the client holds one items list query per limit, keyed by `QueryKeys.items.list({ search, limit })`
- **Test:** `apps/mobile/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "keeps one cache entry per limit, each with its own items"

### Requirement: MOBILE-10 — The items service serves sample data

The mobile app SHALL serve the items list from an in-memory list of five sample items after a
simulated delay, returning at most the requested limit, 50 by default, with no network call.

**Evidence:** `apps/mobile/src/services/Items/items.service.ts:21-80`, `apps/mobile/src/services/Items/items.service.ts:95-115`

#### Scenario: no search term

- **GIVEN** the sample list
- **WHEN** the list is fetched with no search term
- **THEN** the sample items resolve, the first being item_001
- **Test:** `apps/mobile/src/services/Items/__tests__/items.service.test.ts` › "getItems resolves the full list when no search is given"

#### Scenario: a limit below the list size

- **GIVEN** the sample list of five items
- **WHEN** the list is fetched with a limit of 2
- **THEN** exactly two items resolve
- **Test:** `apps/mobile/src/services/Items/__tests__/items.service.test.ts` › "getItems respects the limit"

### Requirement: MOBILE-11 — Case-insensitive search

The mobile app SHALL keep only the items whose title, description or category contains the
search term, ignoring case.

**Evidence:** `apps/mobile/src/services/Items/items.service.ts:104-112`

#### Scenario: an upper-case term

- **GIVEN** the sample list holds one item about dark mode
- **WHEN** the list is fetched with the term DARK
- **THEN** that one item resolves
- **Test:** `apps/mobile/src/services/Items/__tests__/items.service.test.ts` › "getItems filters by a case-insensitive search term"

### Requirement: MOBILE-12 — One item by id

The mobile app SHALL return the sample item whose id matches, or null when no item has that id.

**Evidence:** `apps/mobile/src/services/Items/items.service.ts:121-126`

#### Scenario: a known id

- **GIVEN** the sample list
- **WHEN** item_002 is fetched
- **THEN** the item with that id resolves
- **Test:** `apps/mobile/src/services/Items/__tests__/items.service.test.ts` › "getItem returns the matching item by id"

#### Scenario: an unknown id

- **GIVEN** the sample list
- **WHEN** an id no item has is fetched
- **THEN** null resolves
- **Test:** `apps/mobile/src/services/Items/__tests__/items.service.test.ts` › "getItem returns null for an unknown id (null-guard)"

### Requirement: MOBILE-13 — Item view model mapping

The mobile app SHALL map each item record to a view model, in input order, keeping its id,
title, description, category and status, with the author's label and the initials of the first
two words of the author name, or an empty label and a question mark when there is no author.

**Evidence:** `apps/mobile/src/services/Items/Items.adapter.ts:17-23`, `apps/mobile/src/services/Items/Items.adapter.ts:51-64`

#### Scenario: a two-word author name

- **GIVEN** an item whose author is Alice Brown
- **WHEN** it is adapted
- **THEN** its initials are AB
- **Test:** `apps/mobile/src/services/Items/__tests__/Items.adapter.test.ts` › "builds initials from a two-word author name"

#### Scenario: no author

- **GIVEN** an item with no author name
- **WHEN** it is adapted
- **THEN** its initials are a question mark and its author label is empty
- **Test:** `apps/mobile/src/services/Items/__tests__/Items.adapter.test.ts` › "falls back to "?" initials when author_name is null (null-guard)"

#### Scenario: several items

- **GIVEN** two items in a given order
- **WHEN** they are adapted together
- **THEN** the view models keep that order
- **Test:** `apps/mobile/src/services/Items/__tests__/Items.adapter.test.ts` › "maps all DTOs preserving order"

### Requirement: MOBILE-14 — The item card shows the age and the status in the active language

The mobile app SHALL describe each item's age as a unit and a count, just now under one minute,
then whole minutes, hours or days, and the item card SHALL show that age as the `items.age`
message of its unit and the item's status as the `items.status` message of that status, in the
active language.

**Evidence:** `apps/mobile/src/services/Items/Items.adapter.ts:27-45`, `apps/mobile/src/services/Items/Items.adapter.ts:52`, `apps/mobile/src/services/Items/items.constant.ts:12-17`, `apps/mobile/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.tsx:59`, `apps/mobile/src/screens/ItemsDashboard/components/ItemCard/ItemCard.component.tsx:65`

#### Scenario: the age of an item

- **GIVEN** items created under a minute, forty minutes, five hours and three days ago
- **WHEN** they are adapted
- **THEN** their ages are just now with a count of zero, 40 minutes, 5 hours and 3 days, each as a unit and a count
- **Test:** `apps/mobile/src/services/Items/__tests__/Items.adapter.test.ts` › "describes the age as a unit and a count"

#### Scenario: an item created three hours ago

- **GIVEN** an active item three hours old, under the English or the Spanish language
- **WHEN** its card renders
- **THEN** its age and status read that language's `items.age.hours` message for three and `items.status.active` message
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "shows the status and the age in the active language"

### Requirement: MOBILE-15 — Dashboard totals

The mobile app SHALL show on the stats card the number of loaded items and the number of them
whose status is active, and a dash in place of each number while loading.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:62-68`, `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:34-43`

#### Scenario: the sample list has loaded

- **GIVEN** the stats card told ten items have loaded, three of them active
- **WHEN** it renders
- **THEN** it shows 10 above the total items label and 3 in the active count
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows the total and the active count once the items have loaded"

#### Scenario: the items are loading

- **GIVEN** the stats card told the items are loading
- **WHEN** it renders
- **THEN** it shows a dash in place of the total and of the active count
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows a dash in place of each count while loading"

### Requirement: MOBILE-16 — Loading state of the list

The mobile app SHALL show an activity indicator in the items list, and an ellipsis in place of
the result count, while the items query is loading.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:32-55`

#### Scenario: the first load

- **GIVEN** the dashboard has just mounted
- **WHEN** the items query is pending
- **THEN** the list shows the activity indicator and the caption shows an ellipsis
- **Test:** Not covered — "renders without returning null when loading" calls the card with react-native aliased to a pass-through mock and asserts only a non-null return, not the indicator

### Requirement: MOBILE-17 — Empty state of the list

The mobile app SHALL show the shared empty state, with the components.emptyState title and
message from the catalogs, when the items query resolves no items.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:58-59`, `apps/mobile/src/components/ui/EmptyState/EmptyState.component.tsx:18-23`

#### Scenario: a search with no match

- **GIVEN** the dashboard has loaded
- **WHEN** the user searches for a term no item contains
- **THEN** the list shows the empty state title and message
- **Test:** Not covered — "renders without returning null when empty" mocks the empty state away and asserts only a non-null return

### Requirement: MOBILE-18 — Results list and count

The mobile app SHALL render one item card per loaded item, in order, each with the author
initials, title, description, category, author label, age and status label (MOBILE-14), under a
caption holding the items.dashboard.listResults message for the item count, which states the count
once.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:34-38`, `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:61`

#### Scenario: items have loaded

- **GIVEN** the items query resolved five items
- **WHEN** the list card renders
- **THEN** five item cards show in order, under the count caption
- **Test:** Not covered — "renders without returning null with items" mocks the item card away and asserts only a non-null return

#### Scenario: the count caption

- **GIVEN** two loaded items
- **WHEN** the list card renders
- **THEN** the caption is the listResults message for two, with the count written once
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the result count once"

### Requirement: MOBILE-19 — Dashboard bottom navigation

The mobile app SHALL show a bottom tab bar with the home, items, search and settings tabs, the
home tab selected on mount, and mark a pressed tab as selected without navigating.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component.tsx:12-33`, `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:45`, `apps/mobile/src/components/ui/NavBar/NavBar.component.tsx:39-53`

#### Scenario: the user presses the search tab

- **GIVEN** the home tab is selected
- **WHEN** the user presses the search tab
- **THEN** the search tab reports itself selected and the route stays the same
- **Test:** Not covered — the DashboardNav test mocks the nav bar away and asserts only a non-null return

### Requirement: MOBILE-20 — A failed query shows the error state and raises no toast

The mobile app SHALL add no toast when a query made through useAppQuery fails, however many
components observe it; the dashboard SHALL show the error state with its generic copy in the
items list, in place of the items and the empty state, with a retry control that runs the items
query again, no result count in the list caption, and no count on the stats card (no total, no
active count, and neither of their labels).

**Evidence:** `apps/mobile/src/lib/query/useAppQuery.hook.ts:34`, `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:49`, `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:77-79`, `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:32-40`, `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:56-57`, `apps/mobile/src/screens/ItemsDashboard/ItemsDashboard.screen.tsx:49-54`, `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:32-51`

#### Scenario: a failing query

- **GIVEN** two components observing one query whose function throws
- **WHEN** the query settles in error
- **THEN** no toast is added
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "adds no toast when the query fails, however many components observe it"

#### Scenario: the dashboard fails to load

- **GIVEN** the items service rejects
- **WHEN** the dashboard hook settles
- **THEN** it reports the failure and an empty item list, and its retry calls the items service again
- **Test:** `apps/mobile/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry"

#### Scenario: the list shows the failure

- **GIVEN** the list card told the items failed to load
- **WHEN** it renders and its retry control is pressed
- **THEN** it shows the error state alert, no empty state, and the retry handler runs once
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state with a retry when the items failed to load"

#### Scenario: the caption shows no count

- **GIVEN** the list card told the items failed to load
- **WHEN** it renders
- **THEN** it shows the error state alert with its generic title, and no result count
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state and no result count when the items failed to load"

#### Scenario: the dashboard's stats card shows no total

- **GIVEN** the dashboard hook reports that the items failed to load
- **WHEN** the dashboard renders
- **THEN** the stats card shows its overview label, and no total, no total items label and no active count
- **Test:** `apps/mobile/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows no total on the stats card when the items failed to load"

#### Scenario: the stats card shows no count

- **GIVEN** the stats card told the items failed to load
- **WHEN** it renders
- **THEN** it shows its overview label and live pill, and no total, no dash, no total items label, no active count and no updated label
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows no total and no active count when the items failed to load"

### Requirement: MOBILE-21 — Error message precedence

The mobile app SHALL resolve a user-facing error message from, in order, the caller's override,
the translated message key of an AppError from packages/core when the catalog has it, the error's
own message, and the helper.error.generic copy.

**Evidence:** `apps/mobile/src/lib/query/resolveErrorMessage.helper.ts:11-31`, `apps/mobile/src/lib/query/useAppQuery.constant.ts:1`

#### Scenario: an override is given

- **GIVEN** an AppError with a known message key and an override message
- **WHEN** the message is resolved
- **THEN** the override is returned
- **Test:** `apps/mobile/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "prefers the explicit errorMessage override"

#### Scenario: a known message key

- **GIVEN** an AppError whose message key the catalog has, and no override
- **WHEN** the message is resolved
- **THEN** the translated copy is returned
- **Test:** `apps/mobile/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "resolves AppError.messageKey via i18n when no override"

#### Scenario: a message key the catalog lacks

- **GIVEN** an AppError whose message key the catalog does not have
- **WHEN** the message is resolved
- **THEN** the error's own message is returned
- **Test:** `apps/mobile/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "falls back to error.message when the key is missing from catalog"

#### Scenario: a thrown value that is not an Error

- **GIVEN** a thrown string
- **WHEN** the message is resolved
- **THEN** the generic fallback is returned
- **Test:** `apps/mobile/src/lib/query/__tests__/resolveErrorMessage.helper.test.ts` › "uses the generic fallback for a non-Error value"

### Requirement: MOBILE-22 — Mutation toasts

The mobile app SHALL add an error toast with the resolved message when a mutation made through
useAppMutation fails, and a success toast when it succeeds with a success message given, then
run the caller's own callback.

**Evidence:** `apps/mobile/src/lib/query/useAppMutation.hook.ts:45-75`

#### Scenario: a failing mutation

- **GIVEN** a mutation whose function throws and whose caller passes an override message
- **WHEN** it runs
- **THEN** an error toast with the override message is added
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows an error toast with the override message on failure"

#### Scenario: a successful mutation with a success message

- **GIVEN** a mutation that resolves and a success message
- **WHEN** it runs
- **THEN** a success toast with that message is added
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows a success toast when successMessage is provided"

#### Scenario: the caller's callback

- **GIVEN** a mutation with its own success callback
- **WHEN** it succeeds
- **THEN** the callback runs once
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "still runs the caller onSuccess callback"

### Requirement: MOBILE-23 — Toast lifetime

The mobile app SHALL drop each toast from the toast store 4 seconds after it is added, or
earlier when it is removed by its id.

**Evidence:** `apps/mobile/src/stores/toast.store.ts:27-45`

#### Scenario: no one dismisses the toast

- **GIVEN** a toast was just added
- **WHEN** 4 seconds pass
- **THEN** the toast store is empty
- **Test:** `apps/mobile/src/stores/__tests__/toast.store.test.ts` › "toast auto-dismisses after 4 seconds"

#### Scenario: the toast is removed by id

- **GIVEN** one toast in the store
- **WHEN** it is removed by its id
- **THEN** the toast store is empty
- **Test:** `apps/mobile/src/stores/__tests__/toast.store.test.ts` › "remove removes a toast by id"

### Requirement: MOBILE-24 — Query client defaults

The mobile app SHALL treat query data as fresh for 30 seconds, retry a failed query once and
never retry a failed mutation.

**Evidence:** `apps/mobile/src/lib/query/createQueryClient.helper.ts:11`, `apps/mobile/src/lib/query/createQueryClient.helper.ts:23-27`

#### Scenario: the stale time

- **GIVEN** a query client built with the defaults
- **WHEN** its query defaults are read
- **THEN** the stale time is 30000 ms
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "applies 30s stale time by default"

#### Scenario: query retries

- **GIVEN** a query client built with the defaults
- **WHEN** its query defaults are read
- **THEN** a query retries once
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "applies retry: 1 for queries"

#### Scenario: mutation retries

- **GIVEN** a query client built with the defaults
- **WHEN** its mutation defaults are read
- **THEN** a mutation never retries
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "applies retry: 0 for mutations"

### Requirement: MOBILE-25 — Every failed query and mutation is captured

The mobile app SHALL send every failed query, with its query key sanitized by packages/core
against the values of `QueryKeySegmentEnum`, so the trailing params object of a key (MOBILE-43)
is always redacted, and every failed mutation to the observability port's captureError, tagged
with the cache it came from.

**Evidence:** `apps/mobile/src/lib/query/createQueryClient.helper.ts:36`, `apps/mobile/src/lib/query/queryKeys.constant.ts:29-41`, `apps/mobile/src/lib/observability/toCaptureError.helper.ts:7-11`, `apps/mobile/src/app/_layout.tsx:26`

#### Scenario: a query key holding an identifier

- **GIVEN** a query keyed by items, an account identifier and list
- **WHEN** the query fails
- **THEN** the capture callback runs once with the error, the identifier replaced by [redacted] and the queryCache source
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure"

#### Scenario: a query keyed by a search text

- **GIVEN** a query keyed by `QueryKeys.items.list({ limit, search: 'alice' })`
- **WHEN** the query fails
- **THEN** the capture callback receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure"

#### Scenario: a typed value equal to a registered word

- **GIVEN** a query keyed by `QueryKeys.items.list({ limit, search: 'list' })`
- **WHEN** the query fails
- **THEN** the capture callback receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list search that equals a registered segment on query failure"

#### Scenario: a failing mutation

- **GIVEN** a mutation whose function throws
- **WHEN** it runs
- **THEN** the capture callback runs with the error and the mutationCache source
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure"

#### Scenario: the bridge to the port

- **GIVEN** the capture bridge built over an observability port
- **WHEN** it receives an error and its context
- **THEN** the port's captureError receives both, once
- **Test:** `apps/mobile/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError"

### Requirement: MOBILE-28 — Supabase client from the environment

The mobile app SHALL build its Supabase client from EXPO_PUBLIC_SUPABASE_URL and
EXPO_PUBLIC_SUPABASE_ANON_KEY, and fall back to placeholder values with one console warning when
either is unset.

**Evidence:** `apps/mobile/src/lib/supabase/client.adapter.ts:8-20`, `apps/mobile/src/lib/supabase/client.adapter.ts:31-34`

#### Scenario: both values set

- **GIVEN** both variables are set
- **WHEN** the client module loads
- **THEN** the client is created with them and no warning is logged
- **Test:** `apps/mobile/src/lib/supabase/__tests__/client.adapter.test.ts` › "creates the client with env credentials when present"

#### Scenario: no values set

- **GIVEN** neither variable is set
- **WHEN** the client module loads
- **THEN** the client is created with the placeholder URL and key, and one warning is logged
- **Test:** `apps/mobile/src/lib/supabase/__tests__/client.adapter.test.ts` › "falls back to placeholders and warns when env is absent"

### Requirement: MOBILE-29 — Session bootstrap from the auth gateway

The mobile app SHALL set the auth status to loading on mount, then store the session the
Supabase auth gateway returns with the status authenticated or unauthenticated, and keep both in
step with every later auth state change until unmount.

**Evidence:** `apps/mobile/src/components/AuthProvider/useAuthBootstrap.hook.ts:12-30`, `apps/mobile/src/lib/supabase/authGateway.adapter.ts:11-13`, `apps/mobile/src/app/_layout.tsx:41`

#### Scenario: before the gateway answers

- **GIVEN** the app has just launched
- **WHEN** the auth store is read
- **THEN** the status is loading and there is no session
- **Test:** `apps/mobile/src/stores/__tests__/auth.store.test.ts` › "starts in loading status with no session"

#### Scenario: the provider starts the bootstrap

- **GIVEN** an auth gateway
- **WHEN** the auth provider renders with it
- **THEN** the bootstrap runs with that gateway
- **Test:** `apps/mobile/src/components/AuthProvider/__tests__/AuthProvider.component.test.tsx` › "calls getSession on mount via bootstrap"

#### Scenario: a stored session exists

- **GIVEN** the gateway returns a session
- **WHEN** the bootstrap settles
- **THEN** the store holds that session with the status authenticated
- **Test:** Not covered — the useAuthBootstrap tests replay its steps by hand on the store and never call the hook

#### Scenario: the user signs out elsewhere

- **GIVEN** an authenticated session
- **WHEN** the gateway reports a change with no session
- **THEN** the store clears the session and the status becomes unauthenticated
- **Test:** Not covered — the useAuthBootstrap tests replay its steps by hand on the store and never call the hook

### Requirement: MOBILE-30 — Login fields validated inline

The mobile app SHALL, on submit, reject an email that does not match the address pattern and a
password shorter than 8 characters, showing each field's catalog error under that field.

**Evidence:** `apps/mobile/src/screens/Login/hooks/useLoginForm.hook.ts:15-29`, `apps/mobile/src/screens/Login/Login.constant.ts:6-15`, `apps/mobile/src/screens/Login/Login.screen.tsx:30-34`

#### Scenario: a short password

- **GIVEN** a valid email and a seven-character password
- **WHEN** the user presses the sign-in button
- **THEN** the password field shows the auth.login.errors.password copy and the email field shows none
- **Test:** Not covered — no test calls useLoginForm, and the LoginScreen test mocks it away

### Requirement: MOBILE-31 — The login screen signs no one in

The mobile app SHALL make no authentication request from the login screen: a valid submit only
puts the sign-in button in its loading state, and the screen offers no social sign-in button,
since the template has no provider for it.

**Evidence:** `apps/mobile/src/screens/Login/hooks/useLoginForm.hook.ts:49-53`, `apps/mobile/src/screens/Login/Login.screen.tsx:22`, `apps/mobile/src/screens/Login/Login.screen.tsx:60`

#### Scenario: a valid submit

- **GIVEN** a valid email and an eight-character password
- **WHEN** the user presses the sign-in button
- **THEN** the button shows its loading indicator and no gateway call is made
- **Test:** Not covered — no test calls useLoginForm

#### Scenario: the login screen renders

- **GIVEN** the login screen
- **WHEN** it renders
- **THEN** no Google sign-in button and no "or" divider are shown
- **Test:** `apps/mobile/src/screens/Login/__tests__/Login.screen.test.tsx` › "renders no social sign-in button"

### Requirement: MOBILE-32 — Password reveal toggle

The mobile app SHALL mask the password field's entry and show a reveal button labelled with the
show-password copy, switching to plain entry and the hide-password label on each press.

**Evidence:** `apps/mobile/src/components/ui/AuthField/useAuthField.hook.ts:38-42`, `apps/mobile/src/components/ui/AuthField/AuthField.component.tsx:45-60`

#### Scenario: revealing the password

- **GIVEN** a masked password field
- **WHEN** the user presses the reveal button
- **THEN** the entry shows in plain text and the button is labelled with the hide-password copy
- **Test:** Not covered — the only AuthField test asserts that the export is a function

### Requirement: MOBILE-33 — Web export fits every viewport

The mobile app's web export SHALL render the root route in a centred column at most 428 px wide,
with no horizontal overflow and every interactive control that is not fixed or sticky inside the
viewport, at 390, 768, 1280 and 1920 px wide.

**Evidence:** `apps/mobile/src/helpers/layout.style.ts:12-16`, `apps/mobile/src/screens/ItemsDashboard/ItemsDashboard.screen.tsx:37-44`

#### Scenario: the four viewport widths

- **GIVEN** the web export served on port 3001 and the opt-in mobile-web projects enabled
- **WHEN** the root route loads at each of the four widths
- **THEN** the document and body scroll widths stay within the client width plus 1 px, and no button or link lies outside it
- **Test:** `e2e/mobile-web.e2e.ts` › "no horizontal overflow and interactive controls within viewport"

#### Scenario: the column at desktop width

- **GIVEN** the web export at 1280 px wide
- **WHEN** the root route loads
- **THEN** the dashboard column is 428 px wide and centred
- **Test:** Not covered — the mobile-web e2e measures overflow and control bounds, not the column width

### Requirement: MOBILE-34 — Portrait only

The mobile app SHALL lock its native builds to portrait orientation, with no tablet layout on
iOS.

**Evidence:** `apps/mobile/app.json:7`, `apps/mobile/app.json:18`

#### Scenario: the device is rotated

- **GIVEN** the app runs in a native build
- **WHEN** the user rotates the device to landscape
- **THEN** the app stays in portrait
- **Test:** Not covered — orientation applies only in a native build, and no test reads the Expo config

### Requirement: MOBILE-35 — Dark native shell

The mobile app SHALL declare a dark native interface style, with the splash screen and the
Android adaptive icon on the #0A0B0D background.

**Evidence:** `apps/mobile/app.json:9-14`, `apps/mobile/app.json:30-36`

#### Scenario: the app launches

- **GIVEN** a native build on a device set to light appearance
- **WHEN** the app launches
- **THEN** the splash screen shows on the #0A0B0D background
- **Test:** Not covered — the native shell applies only in a native build, and no test reads the Expo config

### Requirement: MOBILE-36 — The root layout shows the toast viewport

The mobile app SHALL mount the toast viewport in the root layout, over every route, rendering each
toast of the toast store as an alert with its message and a dismiss control, labelled with the
`common.dismiss` message of the active language, that removes it.

**Evidence:** `apps/mobile/src/app/_layout.tsx:51`, `apps/mobile/src/components/ui/Toast/Toast.component.tsx:13-52`, `apps/mobile/src/components/ui/Toast/Toast.component.tsx:42`

#### Scenario: a toast is added while a route is shown

- **GIVEN** the root layout rendered with its fonts loaded
- **WHEN** an error toast is added to the toast store
- **THEN** its message is shown
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "shows a toast added to the store over the routes"

#### Scenario: the toast is dismissed

- **GIVEN** one toast in the viewport
- **WHEN** its dismiss control is pressed
- **THEN** the toast is shown in an alert, and after the press it is gone
- **Test:** `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed"

#### Scenario: the dismiss label in another language

- **GIVEN** one toast in the viewport, under the Spanish language
- **WHEN** it renders
- **THEN** its dismiss control is named with the Spanish dismiss message
- **Test:** `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "labels the dismiss control in the active language"

### Requirement: MOBILE-37 — A render crash shows the error state and is reported once

The mobile app SHALL export an `ErrorBoundary` from the root layout, which Expo Router wraps
around the layout and every route below it, rendering the error state with its generic copy on
the theme background and a retry control that re-renders the route, and reporting the error it
caught to the observability port once, through `reportBoundaryError` under
`src/lib/observability/`, however often it renders.

**Evidence:** `apps/mobile/src/app/_layout.tsx:22`, `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.tsx:14`, `apps/mobile/src/lib/observability/reportBoundaryError.helper.ts:23`, `apps/mobile/src/lib/observability/reportBoundaryError.helper.ts:26`, `apps/mobile/src/components/ui/Screen/Screen.component.tsx:16`

#### Scenario: a route crashes while rendering

- **GIVEN** a route throws while rendering
- **WHEN** the root error boundary renders and its retry control is pressed
- **THEN** the generic error title and message are shown in an alert, and the route is re-rendered once
- **Test:** `apps/mobile/src/components/RootErrorBoundary/__tests__/RootErrorBoundary.component.test.tsx` › "renders the generic error state for a render crash"
- **Test:** `apps/mobile/src/components/RootErrorBoundary/__tests__/RootErrorBoundary.component.test.tsx` › "calls retry when the retry control is pressed"

#### Scenario: the crash is reported

- **GIVEN** the root error boundary holding a caught error
- **WHEN** it renders, and renders again with the same error
- **THEN** the observability port captures that error once, with the boundary source
- **Test:** `apps/mobile/src/components/RootErrorBoundary/__tests__/RootErrorBoundary.component.test.tsx` › "reports the crash to observability once"

#### Scenario: the report helper

- **GIVEN** the boundary report helper over an observability port
- **WHEN** one error is reported twice and another once
- **THEN** the port captures each error once
- **Test:** `apps/mobile/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures an error once however often it is reported"
- **Test:** `apps/mobile/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures each distinct error"

#### Scenario: the root layout exports the boundary

- **GIVEN** the root layout module
- **WHEN** Expo Router reads its exports
- **THEN** its `ErrorBoundary` is the root error boundary
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "exports the root error boundary as its ErrorBoundary"

### Requirement: MOBILE-38 — A screen or section only positions

The mobile app SHALL keep the look of a screen, a route entry and a container outside the
component blocks in a component block (`src/components/ui/`, or a screen's own `components/`):
their NativeWind classes, StyleSheet entries and style slots carry only layout, spacing, size,
position, overflow and visibility.

**Evidence:** `eslint-local-rules/style-positioning.detect.mjs:342`, `eslint.rules.mjs:685`, `apps/mobile/src/helpers/layout.style.ts:8`, `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.tsx:10`

#### Scenario: a screen StyleSheet entry carries a colour

- **GIVEN** a mobile screen style file whose StyleSheet entry sets a text colour
- **WHEN** it is linted
- **THEN** `local/style-positions-only` reports the declaration key
- **Test:** `eslint-local-rules/index.test.mjs` › "export const S = StyleSheet.create({ title: { color: colors.text.primary, marginTop: 4 } })"

#### Scenario: a container paints its background inline

- **GIVEN** the root error boundary container with an inline background colour
- **WHEN** it is linted
- **THEN** the declaration key is reported
- **Test:** `eslint-local-rules/index.test.mjs` › "const B = () => <View style={{ backgroundColor: bg, flex: 1 }} />"

### Requirement: MOBILE-39 — Every mobile style value is a token

The mobile app SHALL take every colour of its style files and views from `@app/tokens`, and every
NativeWind class value from the tokens preset or Tailwind's scale: no raw colour, no Tailwind
palette colour and no arbitrary value.

**Evidence:** `eslint-local-rules/style-positioning.detect.mjs:721`, `apps/mobile/src/components/ui/AccentGradient/AccentGradient.style.ts:5`

#### Scenario: a style file spells a raw colour

- **GIVEN** a mobile style file holding two hex colours
- **WHEN** it is linted
- **THEN** `local/style-token-values` reports each of them
- **Test:** `eslint-local-rules/index.test.mjs` › "export const GRADIENT = ['#FF8A3D', '#FF6A1A'] as const"

### Requirement: MOBILE-40 — Text, Divider and Screen carry the look screens used to hold

The mobile app SHALL render text through the `Text` block, whose variant sets its typography and
colour, a labelled rule through the `Divider` block, and a screen's surface through the `Screen`
block, which fills its parent and paints the active theme's base background.

**Evidence:** `apps/mobile/src/components/ui/Text/Text.style.ts:9`, `apps/mobile/src/components/ui/Divider/Divider.component.tsx:7`, `apps/mobile/src/components/ui/Screen/Screen.component.tsx:16`

#### Scenario: a text variant renders

- **GIVEN** the `Text` block with the caption variant
- **WHEN** it renders
- **THEN** its style holds the caption size, line height and tertiary colour of the tokens
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "renders a variant's typography"

#### Scenario: a labelled divider renders

- **GIVEN** the `Divider` block with a label
- **WHEN** it renders
- **THEN** the label is shown between two hairline rules
- **Test:** `apps/mobile/src/components/ui/Divider/__tests__/Divider.component.test.tsx` › "renders the label between two rules"

#### Scenario: a screen surface renders

- **GIVEN** the `Screen` block under the light theme, with and without a positioning style
- **WHEN** it renders
- **THEN** both surfaces paint the light base background and keep the style they were given
- **Test:** `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background"

### Requirement: MOBILE-41 — Only the ui blocks import a UI kit

The mobile app SHALL import a UI kit or the drawing primitives the blocks wrap
(`expo-linear-gradient`, `expo-blur`, `react-native-svg`, a future `react-native-paper`) only from
a block under `src/components/ui/`, so a kit is swapped by rewriting that folder alone.

**Evidence:** `eslint-local-rules/ui-kit.detect.mjs:17`, `apps/mobile/src/components/ui/Gradient/Gradient.component.tsx:1`, `apps/mobile/src/components/ui/AccentGradient/AccentGradient.component.tsx:12`

#### Scenario: a screen-local component imports the gradient

- **GIVEN** a screen's own component that imports `expo-linear-gradient`
- **WHEN** it is linted
- **THEN** `local/ui-kit-boundary` reports the import
- **Test:** `eslint-local-rules/index.test.mjs` › "import { LinearGradient } from 'expo-linear-gradient'"

#### Scenario: the gradient renders through its block

- **GIVEN** the `AccentGradient` block around content
- **WHEN** it renders
- **THEN** it paints the light accent to the accent behind the content
- **Test:** `apps/mobile/src/components/ui/AccentGradient/__tests__/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children"

### Requirement: MOBILE-42 — Every block paints the active theme

The mobile app SHALL paint every themed colour of its blocks, the text, surfaces, borders, icons
and indicators of `src/components/ui/` and of a screen's own `components/`, from the active
theme: a StyleSheet through `createThemedStyles` and `useThemedStyles`, a view through
`useThemeTokens`, and a NativeWind colour class through the preset's `var(--c-*)` read of the
variable the root frame declares (MOBILE-05, TOKENS-12), so switching to the light theme repaints
the whole app; a colour the tokens share between the themes MAY still be read from the static
palette.

**Evidence:** `apps/mobile/src/lib/theme/createThemedStyles.helper.ts:16`, `apps/mobile/src/lib/theme/createThemedStyles.helper.ts:24`, `apps/mobile/src/lib/theme/useThemedStyles.hook.ts:7`, `apps/mobile/src/components/ui/Text/Text.component.tsx:13`, `apps/mobile/src/components/ui/Icon/Icon.component.tsx:21`, `packages/tokens/tailwind-preset.cjs:22`, `apps/mobile/src/lib/theme/useRootTheme.hook.ts:24`

#### Scenario: a text variant under the light theme

- **GIVEN** the light theme is active
- **WHEN** the `Text` block renders the caption variant
- **THEN** its colour is the light theme's tertiary text colour
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour"

#### Scenario: a class-styled block under the light theme

- **GIVEN** the light theme is active
- **WHEN** a block paints through a NativeWind colour class, such as the secondary `Button`'s `text-text-primary`
- **THEN** the class reads `var(--c-text-primary)` from the preset, and the root frame declares that variable with the light value
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset reads every themed colour from its --c- variable, declared in both themes"
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme"

#### Scenario: a themed style sheet

- **GIVEN** a style builder over a palette
- **WHEN** it is turned into themed styles and read under each theme
- **THEN** each theme's sheet holds that theme's colours, and the hook returns the active one
- **Test:** `apps/mobile/src/lib/theme/__tests__/createThemedStyles.helper.test.ts` › "builds one style sheet per theme from its palette"
- **Test:** `apps/mobile/src/lib/theme/__tests__/useThemedStyles.hook.test.ts` › "returns the sheet of the active theme"

#### Scenario: no block reads the static dark palette

- **GIVEN** every style file, constant file and view under `src/components/ui/` and under the screens' `components/`
- **WHEN** their reads of the static `colors` palette are listed
- **THEN** none of them reads a themed colour
- **Test:** `apps/mobile/src/lib/theme/__tests__/createThemedStyles.helper.test.ts` › "leaves no block reading a themed colour from the static dark palette"

### Requirement: MOBILE-43 — A query key keeps its dynamic values in a trailing params object

The mobile app SHALL build every key of `QueryKeys` from `QueryKeySegmentEnum` values followed,
when the key carries a dynamic value, by one trailing params object that holds every such value,
so that no string segment of a key is a value the user typed or the data supplied, and a
feature's `all` key is a prefix of each of its keys.

**Evidence:** `apps/mobile/src/lib/query/queryKeys.constant.ts:17`, `apps/mobile/src/lib/query/queryKeys.constant.ts:28`, `apps/mobile/src/lib/query/queryKeys.constant.ts:29-34`, `apps/mobile/src/lib/query/queryKeys.constant.ts:36-41`, `apps/mobile/src/lib/query/queryKeys.type.ts:9-12`

#### Scenario: every factory is walked

- **GIVEN** every entry of `QueryKeys`, each factory called with a probe argument of its own type
- **WHEN** the string segments of the keys they return are read
- **THEN** every factory has a probe, and each string segment is a value of `QueryKeySegmentEnum`
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum"

#### Scenario: the list search and limit and the detail id

- **GIVEN** a list search, a list limit and an item id
- **WHEN** the list and detail keys are built
- **THEN** they are `['items', 'list', { limit, search }]` and `['items', 'detail', { id }]`, and a list key with no search, or an empty one, holds the empty search beside its limit
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list search and limit and the detail id in a trailing params object"
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "keeps the limit in the list key when no search is given"

#### Scenario: the items prefix is invalidated

- **GIVEN** a cached list query and a cached detail query of the items
- **WHEN** the query client invalidates `QueryKeys.items.all`
- **THEN** both queries are invalidated
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key"

### Requirement: MOBILE-44 — The session hook returns one object while the session is unchanged

The mobile app SHALL return, from `useSession`, the same object on every read while the session
and the auth status of the auth store are unchanged, and a new object holding them after either
changes.

**Evidence:** `apps/mobile/src/hooks/useSession.hook.ts:5-9`

#### Scenario: a component re-renders

- **GIVEN** a component reading `useSession`
- **WHEN** it renders again with the store unchanged
- **THEN** it reads the same object both times
- **Test:** `apps/mobile/src/hooks/__tests__/useSession.hook.test.ts` › "returns the same object across renders while the session is unchanged"

#### Scenario: the session changes

- **GIVEN** a component reading `useSession` while signed out
- **WHEN** the store receives a session with the authenticated status
- **THEN** it reads a new object holding that session and status
- **Test:** `apps/mobile/src/hooks/__tests__/useSession.hook.test.ts` › "returns a new object holding the new session after a change"

### Requirement: MOBILE-45 — The dashboard shows no control without an action

The mobile app SHALL show on the dashboard only controls with an action: no View all button under
the list and no settings button in the header, since the template has no screen for either; the
search bar and the navigation tabs remain.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/ItemsDashboard.screen.tsx:49-67`, `apps/mobile/src/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.component.tsx:16`

#### Scenario: the dashboard renders

- **GIVEN** the dashboard screen
- **WHEN** it renders
- **THEN** no View all button is shown
- **Test:** `apps/mobile/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows no View all button"

#### Scenario: the header renders

- **GIVEN** the dashboard header
- **WHEN** it renders
- **THEN** it shows the welcome text and the title, and no settings button
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/DashboardHeader/__tests__/DashboardHeader.component.test.tsx` › "shows no settings button"

### Requirement: MOBILE-46 — The busy and retry labels come from the catalogs

The mobile app SHALL label the busy indicator of `Button`, the `LoadingSkeleton` and the async
boundary's loading region with the `common.loading` message, and SHALL show, in the async
boundary's error fallback, the `helper.error.generic` message for a thrown value that is not an
error and a retry control labelled with the `common.retry` message, every message in the active
language.

**Evidence:** `apps/mobile/src/components/ui/Button/Button.component.tsx:58`, `apps/mobile/src/components/ui/LoadingSkeleton/LoadingSkeleton.component.tsx:30`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultLoading.component.tsx:12`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:18`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:21`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:25`

#### Scenario: a busy button

- **GIVEN** a button whose action is running, under the Spanish language
- **WHEN** it renders
- **THEN** its busy indicator is named with the Spanish loading message
- **Test:** `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its busy indicator in the active language"

#### Scenario: a skeleton

- **GIVEN** a loading skeleton, under the Spanish language
- **WHEN** it renders
- **THEN** it is named with the Spanish loading message
- **Test:** `apps/mobile/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "labels the skeleton in the active language"

#### Scenario: the loading fallback

- **GIVEN** the async boundary's default loading fallback, under the Spanish language
- **WHEN** it renders
- **THEN** it is named with the Spanish loading message
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultLoading.component.test.tsx` › "labels the loading region in the active language"

#### Scenario: the error fallback

- **GIVEN** the async boundary's default error fallback for a thrown value that is not an error, under the Spanish language
- **WHEN** it renders and its retry control is pressed
- **THEN** the Spanish generic message and retry label are shown, and the boundary is reset once
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "shows the generic message and the retry label in the active language"

#### Scenario: an error is thrown

- **GIVEN** the async boundary's default error fallback for a thrown error
- **WHEN** it renders
- **THEN** the error's own message is shown
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "shows the message of a thrown error"

### Requirement: MOBILE-47 — PostHog is the default observability provider

The mobile app SHALL bind its observability port to the PostHog adapter in its composition root,
so every error, message, breadcrumb and user the app reports goes to PostHog unless that one line
binds another adapter.

**Evidence:** `apps/mobile/src/lib/observability/observability.adapter.ts:7-8`

#### Scenario: a captured error reaches PostHog

- **GIVEN** a PostHog key and the PostHog SDK replaced at its module
- **WHEN** an error is captured through the composition root
- **THEN** the client's exception capture receives it
- **Test:** `apps/mobile/src/lib/observability/__tests__/observability.adapter.test.ts` › "binds the PostHog adapter by default"

### Requirement: MOBILE-48 — The PostHog adapter maps the port through scrubPII

The mobile app SHALL send an error as a PostHog exception, a message as a PostHog log record at
the mapped level, a breadcrumb as an exception step and a user as an `identify` by id, passing
every context, breadcrumb payload and person property through the scrubPII helper of
packages/core, and SHALL reset the PostHog identity on `setUser(null)`. It SHALL make no
`identify` call and no reset for a user whose id is not a string holding a character other than
whitespace, so the identity PostHog holds stays as it was.

**Evidence:** `apps/mobile/src/lib/observability/createPostHogObservability.adapter.ts:14-79`, `apps/mobile/src/lib/observability/createPostHogObservability.constant.ts:10-19`

#### Scenario: an error

- **GIVEN** a PostHog key
- **WHEN** an error is captured with a context holding an email
- **THEN** PostHog's exception capture receives the error and the context with the email redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context"

#### Scenario: a message

- **GIVEN** a PostHog key
- **WHEN** a warning message is captured with a context holding an email
- **THEN** PostHog receives a log record whose body is the message, whose level is `warn` and
  whose attributes have the email redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level"

#### Scenario: a breadcrumb

- **GIVEN** a PostHog key
- **WHEN** a breadcrumb is added with a category and data holding an email
- **THEN** PostHog adds an exception step named by the message, with the email redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data"

#### Scenario: a user, then none

- **GIVEN** a PostHog key
- **WHEN** a user with an id and an email is set, then `null`
- **THEN** PostHog identifies the id with the email redacted, then resets the identity
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest"
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser(null) resets the identity"

#### Scenario: a blank id

- **GIVEN** a PostHog key, and a user identified by an id
- **WHEN** a user whose id is empty, only whitespace or not a string is set, with an email
- **THEN** PostHog receives no further `identify` and no reset, and the method does not throw
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies nobody for a blank id"

### Requirement: MOBILE-49 — The PostHog client is constructed only when it may run

The mobile app SHALL construct its one PostHog client only when `EXPO_PUBLIC_POSTHOG_KEY` is set:
at launch in `granted` and `memory` mode, and in `opt-in` mode only once consent is granted
(MOBILE-53, MOBILE-55), never holding more than one client; it sends to
`EXPO_PUBLIC_POSTHOG_HOST` or, without it, to the US ingestion host. Without a key it SHALL
construct none, so every observability call is a no-op and no request leaves the app.

**Evidence:** `apps/mobile/src/lib/posthog/posthogClient.constant.ts:4-11`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:57`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:82-90`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:124-126`

#### Scenario: no key

- **GIVEN** no PostHog key
- **WHEN** the client module loads and is started
- **THEN** no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not construct a client without a key"

#### Scenario: a key and a host

- **GIVEN** a key and a host
- **WHEN** the client module loads and is started again
- **THEN** one client is constructed with that key and that host
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs one client with the key and the host from the environment"

#### Scenario: a key and no host

- **GIVEN** a key and no host
- **WHEN** the client module loads
- **THEN** the client sends to `https://us.i.posthog.com`
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host"

### Requirement: MOBILE-50 — The PostHog client starts with privacy defaults

The mobile app SHALL construct PostHog, under every consent mode, with session replay off, app
lifecycle events off, console errors off, unhandled rejections captured, and uncaught exceptions
captured only on native, never in a web bundle.

**Evidence:** `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:18-37`, `apps/mobile/src/lib/posthog/posthogClient.constant.ts:22-28`, `apps/mobile/src/lib/posthog/posthogClient.constant.ts:53-57`

#### Scenario: replay and lifecycle events

- **GIVEN** a key
- **WHEN** the client is constructed
- **THEN** session replay and app lifecycle events are off
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session replay and lifecycle events off"

#### Scenario: automatic exception capture on native

- **GIVEN** a key and a native bundle
- **WHEN** the client is constructed
- **THEN** uncaught exceptions and unhandled rejections are captured and console errors are not
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures uncaught exceptions and unhandled rejections on native, not console errors"

#### Scenario: automatic exception capture on web

- **GIVEN** a key and a web bundle
- **WHEN** the client is constructed
- **THEN** uncaught exceptions are not captured and unhandled rejections are
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "leaves uncaught exception capture off in a web bundle"

#### Scenario: every consent mode

- **GIVEN** a key and each consent mode
- **WHEN** the client is constructed
- **THEN** session replay, lifecycle events and console errors are off, and unhandled rejections
  and native uncaught exceptions are captured
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the privacy defaults under every consent mode"

### Requirement: MOBILE-51 — The PostHog adapter keeps the port contract

The mobile app SHALL ship a PostHog adapter that passes the observability port contract of
packages/tooling with its SDK replaced at its module.

**Evidence:** `apps/mobile/src/lib/observability/createPostHogObservability.adapter.ts:30-79`

#### Scenario: the PostHog adapter

- **GIVEN** the PostHog adapter, with and without a key
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract"

### Requirement: MOBILE-52 — One setting chooses the PostHog consent mode

The mobile app SHALL read its PostHog consent mode from `EXPO_PUBLIC_POSTHOG_CONSENT` through its
constant file: `granted` when the value is absent or empty, and `granted`, `opt-in` or `memory`
when it names one, constructing PostHog in `granted` mode with the options it had before this
setting existed. It SHALL throw a configuration error that names the variable and the accepted
values when, with a key set, the value names anything else.

**Evidence:** `apps/mobile/src/lib/posthog/posthogClient.constant.ts:33-44`, `apps/mobile/src/lib/posthog/resolveConsentMode.helper.ts:15-26`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:43-45`

#### Scenario: no setting

- **GIVEN** a key and no consent mode
- **WHEN** the client is constructed
- **THEN** its options are exactly the ones it had before the setting existed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the granted options when no consent mode is set"

#### Scenario: `granted` named

- **GIVEN** a key and the consent mode `granted`
- **WHEN** the client is constructed
- **THEN** its options equal those of no setting
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts the granted mode with the same options as no setting"

#### Scenario: reading the value

- **GIVEN** an absent, an empty and each known value
- **WHEN** the mode is resolved
- **THEN** absent and empty read as `granted`, and each known value as itself
- **Test:** `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads an absent or empty consent mode as granted"
- **Test:** `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads each consent mode it knows"

#### Scenario: an unknown value

- **GIVEN** an unknown value
- **WHEN** the mode is resolved, and when the client module loads with a key
- **THEN** each throws an error naming `EXPO_PUBLIC_POSTHOG_CONSENT`, the value and the three
  accepted modes, and no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "throws a configuration error for an unknown consent mode"
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "refuses to load with an unknown consent mode"

### Requirement: MOBILE-53 — Each consent mode maps onto the SDK's options

The mobile app SHALL construct no PostHog client in `opt-in` mode until consent is granted,
through the consent API (MOBILE-55) or by a grant from an earlier launch held in the consent
storage of MOBILE-54, which constructs it at launch and opts it in, a failure of that opt-in
rejecting nothing and leaving it opted out; it SHALL construct it with `defaultOptIn: false` and
that consent storage as its `customStorage`, so it captures and stores nothing until it is opted
in. In `memory` mode it SHALL construct PostHog with `persistence: 'memory'`, so it captures but
keeps nothing on the device. Each mode adds nothing else to the `granted` options.

**Evidence:** `apps/mobile/src/lib/posthog/posthogClient.constant.ts:53-57`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:18-37`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:51-54`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:113-134`

#### Scenario: `opt-in` before a grant

- **GIVEN** a key, the consent mode `opt-in` and no grant from an earlier launch
- **WHEN** the client module loads
- **THEN** no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs no client in opt-in mode before a grant"

#### Scenario: `opt-in`

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the client is started, as a grant starts it
- **THEN** its options are the `granted` ones opted out by default and writing through the
  consent storage
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out, writing through the consent storage"

#### Scenario: a grant from an earlier launch

- **GIVEN** a key, the consent mode `opt-in` and a grant stored by an earlier launch
- **WHEN** the client module loads
- **THEN** one client is constructed and opted in
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "opts in at launch after a grant from an earlier launch"

#### Scenario: a launch whose opt-in fails

- **GIVEN** a key, the consent mode `opt-in`, a grant stored by an earlier launch and an SDK whose
  opt-in rejects
- **WHEN** the client module loads
- **THEN** no rejection is left unhandled
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "rejects nothing when the launch fails to opt in again"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is constructed
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: MOBILE-54 — The consent storage writes to the device only after a grant

The mobile app SHALL give PostHog, in `opt-in` mode, a storage that keeps nothing while consent is
not granted, reading no value and dropping every value it is handed; on a grant writes a grant
marker to the device's key-value storage, `keyValueStorage` of MOBILE-56, and once the device holds
it writes every later value there under its own prefix; when the device refuses the marker, keeps
the grant and every later value in memory for this launch only; reads the marker back at the next
launch; and on a revoke stops writing to the device, forgets every value it holds, waits for every
device write it already issued and then removes the marker and every key it wrote or read, going
on past a removal the device refuses, and SHALL write to the device again on a later grant.

**Evidence:** `apps/mobile/src/lib/posthog/consentStorage.adapter.ts:28-133`, `apps/mobile/src/lib/posthog/consentStorage.constant.ts:3-8`

#### Scenario: before a grant

- **GIVEN** a consent storage with no earlier grant
- **WHEN** PostHog writes a value and reads it back
- **THEN** it reads nothing back, and the device storage holds nothing
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps every value off the device before a grant"

#### Scenario: a grant

- **GIVEN** a consent storage with no earlier grant
- **WHEN** it is opened, and PostHog writes a value
- **THEN** the device storage holds the marker and the value under the storage's prefix
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes the grant marker and every later value to the device after a grant"

#### Scenario: a grant the device refuses

- **GIVEN** a consent storage whose device refuses the marker
- **WHEN** it is opened, and PostHog writes a value and reads it back
- **THEN** nothing throws, the storage reads as granted, the value reads back from memory, the
  device holds nothing and a new consent storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps the grant in memory for this launch when the device refuses it"

#### Scenario: the next launch

- **GIVEN** a grant and a value written by an earlier consent storage
- **WHEN** a new consent storage is created
- **THEN** it reads as granted and returns the stored value
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "reads a grant from an earlier launch back from the device"

#### Scenario: a revoke

- **GIVEN** a granted consent storage with values on the device
- **WHEN** it is closed, and PostHog writes another value
- **THEN** the device storage holds nothing, and the storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every value it wrote on a revoke and writes none after"

#### Scenario: a write in flight at a revoke

- **GIVEN** a granted consent storage with a device write still in flight
- **WHEN** it is closed, and the write then lands
- **THEN** the device storage holds nothing
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every key only after the writes it already issued land"

#### Scenario: a removal the device refuses

- **GIVEN** a granted consent storage with values on the device, whose device refuses the removal
  of one key
- **WHEN** it is closed
- **THEN** nothing throws, the other keys are removed and the storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "goes on removing the other keys when the device refuses one"

#### Scenario: a grant after a revoke

- **GIVEN** a consent storage granted, written to and closed, then handed a value
- **WHEN** it is opened again, and PostHog writes another value
- **THEN** the device holds the marker and the later value, and neither value of before the
  second grant
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes to the device again on a grant after a revoke"

### Requirement: MOBILE-55 — The consent API grants, revokes and reads the status

The mobile app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a key, `grant` SHALL open the consent storage, construct the client (MOBILE-49) and then
opt PostHog in; `revoke` SHALL close the consent storage, drop the client so later calls are
dropped (MOBILE-60), and opt it out, drop every event and log record it still queues and shut it
down, so nothing captured before the revoke is sent after it and its flush timers stop, a client
the launch built to restore a grant from an earlier launch included, a device storage that refuses
a removal included; a later grant SHALL construct a new client, which reads nothing the dropped one
stored; and `getStatus` SHALL read `granted` while the storage holds a grant, `denied` after a
revoke in the same launch, and `pending` otherwise. In `granted` and `memory` mode and without a
key, `getStatus` SHALL read `not-required`, and `grant` and `revoke` SHALL construct nothing and
call nothing on PostHog.

**Evidence:** `apps/mobile/src/lib/observability/createPostHogConsent.adapter.ts:25-53`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:61-69`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:82-111`, `apps/mobile/src/lib/posthog/posthogClient.constant.ts:46-48`, `apps/mobile/src/lib/observability/consent.adapter.ts:7`, `apps/mobile/src/lib/observability/index.ts:1`

#### Scenario: before a choice

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the status is read before any grant or revoke
- **THEN** it is `pending`, no client was constructed and the device holds no grant
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and constructs no client before a choice in opt-in mode"

#### Scenario: a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** consent is granted twice
- **THEN** one client is constructed, the consent storage holds a grant, PostHog is opted in and
  the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant constructs the client once, opens the consent storage, opts PostHog in and reads granted"

#### Scenario: the client's first write

- **GIVEN** a key, the consent mode `opt-in` and a client that writes to its storage as it is
  constructed
- **WHEN** consent is granted
- **THEN** the device holds that write under the consent storage's prefix
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opens the consent storage before it constructs the client, so its first write reaches the device"

#### Scenario: a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked, and an error is captured after it
- **THEN** the device storage holds nothing, PostHog is opted out, its event and log queues are
  emptied before it is shut down, it is not reset, the error never reaches PostHog and the status
  reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, drops the client, opts it out, empties its queues, shuts it down and reads denied"

#### Scenario: a revoke the device storage fails

- **GIVEN** a key, the consent mode `opt-in`, a grant and a device storage that refuses every
  removal
- **WHEN** consent is revoked, and an error is captured after it
- **THEN** nothing throws, PostHog is opted out and shut down, the error never reaches PostHog and
  the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke whose storage removals fail still stops the client and reads denied"

#### Scenario: a revoke while the launch restores an earlier grant

- **GIVEN** a key, the consent mode `opt-in` and a grant from an earlier launch, still being read
  back
- **WHEN** consent is revoked before that read ends
- **THEN** the client the launch builds is opted in and then opted out, the device holds no grant
  and the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke while the launch restores an earlier grant leaves PostHog opted out"

#### Scenario: a grant after a revoke

- **GIVEN** a key, the consent mode `opt-in`, a grant and a revoke
- **WHEN** consent is granted again
- **THEN** a second client is constructed and opted in, and the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke constructs a new client and opts it in"

#### Scenario: what the dropped client stored

- **GIVEN** a key, the consent mode `opt-in`, a grant and a client that writes its state while it
  shuts down
- **WHEN** consent is revoked and granted again
- **THEN** the new client reads nothing back from the consent storage
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke starts a client that reads nothing the dropped one stored"

#### Scenario: a mode that asks no consent

- **GIVEN** a key and the consent mode `granted`, then `memory`
- **WHEN** consent is granted, revoked and read
- **THEN** PostHog receives no consent call and the status reads `not-required`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode"

#### Scenario: no key

- **GIVEN** the consent mode `opt-in` and no key
- **WHEN** consent is granted, revoked and read
- **THEN** nothing throws, no client is constructed and the status reads `not-required`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key"

#### Scenario: the composition root

- **GIVEN** a key, the consent mode `opt-in` and the SDK replaced at its module
- **WHEN** consent is granted through the barrel's `consent`
- **THEN** PostHog is opted in
- **Test:** `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"

### Requirement: MOBILE-56 — The device keeps key-value data through one adapter

The mobile app SHALL implement the `IKeyValueStoragePort` of packages/core over AsyncStorage in
`keyValueStorage`, exported from `src/lib/storage/`, SHALL keep every value it holds on the
device through it, the theme choice under app.theme and the language choice under app.language
included, and SHALL import AsyncStorage only there, the seam the dependency registry names for
it.

**Evidence:** `apps/mobile/src/lib/storage/keyValueStorage.adapter.ts:13-22`, `apps/mobile/src/lib/storage/index.ts:1`, `apps/mobile/src/lib/theme/theme.config.ts:23`, `apps/mobile/src/lib/i18n/i18n.config.ts:32`, `.agents/contracts/dependencies.json:118-121`

#### Scenario: a value on the device

- **GIVEN** AsyncStorage replaced by its in-memory mock
- **WHEN** a value is set, read and removed through `keyValueStorage`
- **THEN** AsyncStorage holds the value, it reads back, and after the removal AsyncStorage holds
  nothing
- **Test:** `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "writes, reads and removes a value on the device storage"

#### Scenario: a missing key

- **GIVEN** AsyncStorage replaced by its in-memory mock, holding nothing
- **WHEN** a key is read through `keyValueStorage`
- **THEN** it reads `null`
- **Test:** `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "reads null for a key the device storage does not hold"

#### Scenario: the theme choice

- **GIVEN** `keyValueStorage` replaced by an in-memory storage
- **WHEN** a theme is chosen through `setTheme`
- **THEN** the storage holds it under app.theme, and NativeWind's color scheme is that theme
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "stores a chosen theme in the device storage and applies it"

#### Scenario: the language choice

- **GIVEN** `keyValueStorage` replaced by an in-memory storage
- **WHEN** a language is chosen through `setLanguage`
- **THEN** the storage holds it under app.language, and i18next switches to it
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "stores a chosen language in the device storage and switches i18next to it"

#### Scenario: the seam

- **GIVEN** every file under `apps/` and `packages/`
- **WHEN** the dependency seams are checked
- **THEN** only `keyValueStorage.adapter.ts` and its test import AsyncStorage
- **Test:** Not covered — `pnpm verify:dependency-seams` and the `local/dependency-seam` lint rule hold it, a gate and a rule rather than a test

### Requirement: MOBILE-57 — A block translates through the app's translator

The mobile app SHALL give every block one translator, `useAppTranslator()` of
`apps/mobile/src/lib/i18n/`, that implements IAppTranslator of packages/i18n over the active
i18next instance: `t` returns the message of a key in the active language with its ICU values
filled, `has` tells a key the catalog holds from a string it lacks, and `locale` is the active
language, reduced to a supported one.

**Evidence:** `apps/mobile/src/lib/i18n/useAppTranslator.hook.ts:12-15`, `apps/mobile/src/lib/i18n/useAppTranslator.hook.ts:22-33`

#### Scenario: a message with a value

- **GIVEN** a block under an i18next instance started in Spanish on the real catalogs
- **WHEN** it calls `t` with a key and an ICU value
- **THEN** it gets the Spanish message with the value in place
- **Test:** `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "formats a message of the active catalog with its values"

#### Scenario: a key the catalog lacks

- **GIVEN** the same block
- **WHEN** it calls `has` with a key of the catalog and with a string the catalog lacks
- **THEN** the first is true and the second false
- **Test:** `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "tells a key the active catalog holds from one it lacks"

#### Scenario: the active locale

- **GIVEN** the same block
- **WHEN** it reads `locale`
- **THEN** it is the Spanish language code
- **Test:** `apps/mobile/src/lib/i18n/__tests__/useAppTranslator.hook.test.tsx` › "reports the active locale"

### Requirement: MOBILE-58 — Only lib/i18n imports the i18n libraries

The mobile app SHALL import react-i18next, i18next, i18next-icu, @formatjs/intl-pluralrules and
expo-localization only in `apps/mobile/src/lib/i18n/**`; every other file, tests included,
reaches translation through `@/lib/i18n/…`, and a test of any other unit mocks that module or
renders through `renderWithI18n`, never one of those libraries.

**Evidence:** `.agents/contracts/dependencies.json:70-99`, `eslint-dependency-seam-allowlist.json:1`

#### Scenario: a block outside the seam imports react-i18next

- **GIVEN** a component, screen, hook or test outside `apps/mobile/src/lib/i18n/` that imports or
  mocks react-i18next
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-59 — The sampled screens keep their messages in both languages

The mobile app SHALL render the sign-in screen, the items dashboard with items and the error,
empty, confirmation and offline blocks with the catalog messages, in the order and with the
values, that the record in `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` holds for each
language, taken at `571d25b`, and each of those messages SHALL show the copy its language's
catalog holds.

**Evidence:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx:97-122`, `apps/mobile/src/test/__tests__/i18n.helper.test.tsx:124-204`, `apps/mobile/src/test/i18n.helper.tsx:51-60`

#### Scenario: the messages behind the text

- **GIVEN** a catalog whose every message is its own key, in English and in Spanish
- **WHEN** each sample renders with it
- **THEN** its visible text and accessible labels equal the record for that language
- **Test:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages"

#### Scenario: the copy of each language

- **GIVEN** the real English and Spanish catalogs
- **WHEN** each sample renders with one of them
- **THEN** its visible text and accessible labels are the record with every message in that
  catalog's copy
- **Test:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the copy its catalog holds, in both languages"

### Requirement: MOBILE-60 — PostHog calls made while no client exists are dropped

The mobile app's PostHog observability adapter SHALL drop every call while the app holds no
PostHog client, without a key and in `opt-in` mode before a grant and after a revoke, and SHALL
hold none of them for a later client.

**Evidence:** `apps/mobile/src/lib/observability/createPostHogObservability.adapter.ts:30-79`, `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:72-73`

#### Scenario: before a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** an error, a message, a breadcrumb, a user and a cleared user are reported, and consent is
  then granted
- **THEN** a client is constructed, and none of its capture calls, its identify or its reset
  receives anything
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant"

### Requirement: MOBILE-61 — The query hooks take and return the app's own types

The mobile app SHALL give every query and mutation one API of its own in
`apps/mobile/src/lib/query/`, the same as the web app's (apps/web WEB-63): `useAppQuery` takes
`IAppQueryOptions`, a `queryKey`, a `queryFn`, an optional `adapter` and the optional `enabled`,
`staleTime`, `retry`, `networkMode` (`online`, `always` or `offlineFirst`) and `keepPreviousData`,
each forwarded to the query, and returns `IAppQueryResult`, only `data`, `error`, `isError`,
`isLoading`, `isSuccess` and `refetch`; `useAppMutation` takes `IAppMutationOptions`, a `mutationFn`
and the optional `mutationKey`, `gcTime` and `onMutate`, `onSuccess`, `onError` and `onSettled`
callbacks, each called with one object holding the variables and the data or the error, and returns
`IAppMutationResult`, only `data`, `error`, `isError`, `isPending`, `isSuccess`, `mutate` and
`reset`. An option left out SHALL keep the query client's default, each hook SHALL return the same
result object while none of its fields changed, and no type of TanStack Query is part of either.

**Evidence:** `apps/mobile/src/lib/query/useAppQuery.type.ts:8-26`, `apps/mobile/src/lib/query/useAppQuery.type.ts:38-47`, `apps/mobile/src/lib/query/useAppQuery.hook.ts:24-54`, `apps/mobile/src/lib/query/omitUndefined.helper.ts:6-11`, `apps/mobile/src/lib/query/useAppMutation.type.ts:32-48`, `apps/mobile/src/lib/query/useAppMutation.type.ts:67-77`, `apps/mobile/src/lib/query/useAppMutation.hook.ts:35-80`

#### Scenario: a query's result

- **GIVEN** a query that resolves
- **WHEN** `useAppQuery` settles
- **THEN** its result holds exactly the fields of `IAppQueryResult`, the data among them
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "returns only the fields of the app's own query result"

#### Scenario: a held query

- **GIVEN** a query with `enabled: false`
- **WHEN** it mounts and every pending timer runs
- **THEN** its `queryFn` never runs, and it holds no data and is not loading
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "never runs the queryFn while enabled is false"

#### Scenario: a retried query

- **GIVEN** a query with `retry: 1`, on a client that retries none, whose `queryFn` fails once
- **WHEN** it settles
- **THEN** it ran twice and holds the second run's data
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "retries a failed queryFn as many times as retry says"

#### Scenario: the previous data while a new key loads

- **GIVEN** a query with `keepPreviousData` that loaded one key
- **WHEN** it moves to a key whose `queryFn` has not resolved
- **THEN** it still holds the first key's data and is not loading
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the previous key's data while the next key loads, with keepPreviousData"

#### Scenario: the freshness and the network mode

- **GIVEN** a query with a `staleTime` of a minute and `networkMode: 'always'`
- **WHEN** it settles
- **THEN** the cached query holds both options and is still fresh
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "hands staleTime and networkMode to the query"

#### Scenario: an option left out

- **GIVEN** a query that passes none of the optional options, on the app's query client
- **WHEN** it settles
- **THEN** the cached query holds every default of that client
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the client's defaults for every option it leaves out"

#### Scenario: a stable query result

- **GIVEN** a settled query
- **WHEN** its component renders again with nothing changed
- **THEN** it reads the same result object
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the same result object across a rerender while its fields are unchanged"

#### Scenario: a mutation's result

- **GIVEN** a mutation that resolves
- **WHEN** `useAppMutation` settles
- **THEN** its result holds exactly the fields of `IAppMutationResult`, the data among them
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "returns only the fields of the app's own mutation result"

#### Scenario: the caller's callbacks

- **GIVEN** a mutation with an `onSuccess` and an `onError` callback, run once to success and
  once to failure
- **WHEN** each run settles
- **THEN** `onSuccess` receives one object with the data and the variables, and `onError` one
  object with the error and the variables
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "hands the caller's callbacks one object with the outcome and the variables"

#### Scenario: before the mutation and once it settles

- **GIVEN** a mutation with an `onMutate` and an `onSettled` callback, run once to success and
  once to failure
- **WHEN** each run settles
- **THEN** `onMutate` received the variables before `mutationFn` ran, and `onSettled` the data,
  the error and the variables of each run
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "runs the caller's onMutate with the variables first, and onSettled with the outcome"

#### Scenario: the mutation key

- **GIVEN** a mutation with a `mutationKey`
- **WHEN** it runs
- **THEN** the mutation cache holds it under that key
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "caches the mutation under its mutationKey"

#### Scenario: the callbacks of one call

- **GIVEN** a mutation run with an `onSettled` for that call
- **WHEN** the call settles
- **THEN** that `onSettled` runs once
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "runs the onSettled of one mutate call once that call settles"

#### Scenario: a reset

- **GIVEN** a mutation that succeeded
- **WHEN** `reset` is called
- **THEN** it holds no data and is neither a success nor an error
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "reset clears the outcome of the last run"

#### Scenario: a stable mutation result

- **GIVEN** a mutation
- **WHEN** its component renders again with nothing changed
- **THEN** it reads the same result object
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "keeps the same result object across a rerender while its fields are unchanged"

### Requirement: MOBILE-62 — The app provides its query client, invalidates by key prefix and tells a keyed mutation runs

The mobile app SHALL give a tree the query client `createQueryClient` builds through
`AppQueryProvider` of `apps/mobile/src/lib/query/`, SHALL give every hook `useInvalidateAppQuery`,
whose function marks every query whose key starts with the `queryKey` it is handed stale, and no
other, and runs the observed ones again, and SHALL give every hook `useIsAppMutating`, true while a
mutation whose `mutationKey` equals the one it is handed runs, and false for a mutation under a
longer key and once that mutation settled.

**Evidence:** `apps/mobile/src/lib/query/AppQueryProvider.component.tsx:10-15`, `apps/mobile/src/lib/query/useInvalidateAppQuery.hook.ts:11-18`, `apps/mobile/src/lib/query/useIsAppMutating.hook.ts:9-12`, `apps/mobile/src/lib/query/createQueryClient.helper.ts:22`, `apps/mobile/src/app/_layout.tsx:40-54`

#### Scenario: the provider

- **GIVEN** `AppQueryProvider` handed a query client
- **WHEN** a hook inside it runs a query through `useAppQuery`
- **THEN** the query's data is cached in that client
- **Test:** `apps/mobile/src/lib/query/__tests__/AppQueryProvider.component.test.tsx` › "gives its tree the query client it is handed"

#### Scenario: a prefix is invalidated

- **GIVEN** a cached items list, a cached item detail and a query of another key
- **WHEN** the function of `useInvalidateAppQuery` is called with `QueryKeys.items.all`
- **THEN** both items queries are stale and the other is not
- **Test:** `apps/mobile/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "marks every query under a key prefix stale and no other"

#### Scenario: an observed query is invalidated

- **GIVEN** a component observing the items list
- **WHEN** the items prefix is invalidated
- **THEN** the list's query runs again and the component reads its new data
- **Test:** `apps/mobile/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "runs an observed query under the prefix again"

#### Scenario: a running keyed mutation

- **GIVEN** a mutation under the key `['items', 'save']` whose `mutationFn` has not resolved
- **WHEN** `useIsAppMutating` reads that key and its prefix `['items']`, and then the mutation
  resolves
- **THEN** it is true for the exact key and false for the prefix while it runs, and false for
  the key once it settled
- **Test:** `apps/mobile/src/lib/query/__tests__/useIsAppMutating.hook.test.ts` › "is true while a mutation of exactly that key runs, and false once it settles"

### Requirement: MOBILE-63 — Every store is created through createAppStore

The mobile app SHALL create every store under `apps/mobile/src/stores/` through `createAppStore`
of `apps/mobile/src/lib/store/createAppStore.helper.ts`, the same factory as the web app's
(apps/web WEB-65): its initializer receives `{ get, set }`, and its store is a hook that returns
the value its selector reads and renders again when that value changes, with `getState`,
`setState` and `getInitialState`, and a `useShallow` that returns the same object for a selection
while each of its fields is unchanged; a store created with `persist` SHALL keep the fields its
`partialize` names through the key-value storage port, `keyValueStorage` of `src/lib/storage/`,
under its `name`, and a store created later with that name SHALL start with them.

**Evidence:** `apps/mobile/src/lib/store/createAppStore.helper.ts:13-19`, `apps/mobile/src/lib/store/createAppStore.helper.ts:27-57`, `apps/mobile/src/lib/store/createAppStore.type.ts:33-45`, `apps/mobile/src/hooks/useSession.hook.ts:5-9`

#### Scenario: a selector's reader

- **GIVEN** a component reading one value of a store through a selector
- **WHEN** an action of the store changes that value
- **THEN** the component reads the new value
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "re-renders a selector's reader when its value changes"

#### Scenario: a shallow selection

- **GIVEN** a component reading an object of two fields through `useShallow`
- **WHEN** it renders again, and then another field of the store changes
- **THEN** it reads the same object each time, and a new one once a selected field changes
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the same object for a shallow selection while its fields are unchanged"

#### Scenario: the state outside React

- **GIVEN** a store whose action reads the state through `get`
- **WHEN** `setState` changes a field and the action runs
- **THEN** `getState` reads both changes, and `getInitialState` still reads the initial state
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "reads and updates the state outside React"

#### Scenario: a persisted store

- **GIVEN** a store created with `persist`, a name and a `partialize` that keeps one field, over
  an in-memory device storage
- **WHEN** both fields change, and a store is created again with that name
- **THEN** the device storage holds only the kept field under the name, and the new store starts
  with it
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the fields partialize names in the device storage, and starts from them"

### Requirement: MOBILE-64 — Only lib/query imports TanStack Query, and only createAppStore zustand

The mobile app SHALL import `@tanstack/react-query` only in `apps/mobile/src/lib/query/**` and
zustand only in `apps/mobile/src/lib/store/createAppStore.helper.ts`; every other file, the root
layout, the hooks, the stores and their tests included, reaches them through `@/lib/query/…` and
`createAppStore`, and a test of any other unit renders through `createQueryWrapper` of
`apps/mobile/src/test/query.helper.tsx` or mocks the project module.

**Evidence:** `.agents/contracts/dependencies.json:101-105`, `.agents/contracts/dependencies.json:107-110`

#### Scenario: a file outside the seams imports either library

- **GIVEN** the root layout, a hook, a store, a screen or a test outside those files that imports
  or mocks `@tanstack/react-query` or zustand
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-70 — The async boundary takes a fallback typed by its own props

The mobile app SHALL type the error fallback an async boundary takes, and its default error
fallback, with the block's own `IAsyncBoundaryFallbackProps`, the thrown value and a function
that resets the boundary, so the block's public type names no type of `react-error-boundary`,
which only `src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx` imports; when a child
throws, the boundary SHALL render that fallback with the thrown value, and its children again
once the fallback resets it.

**Evidence:** `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundary.type.ts:4`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundary.type.ts:12`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx:2`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx:13`, `apps/mobile/src/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component.tsx:10`, `.agents/contracts/dependencies.json:174-179`

#### Scenario: a child throws and the fallback resets

- **GIVEN** an async boundary with an error fallback written against its own props, around a child
  that throws once
- **WHEN** it renders and the fallback resets it
- **THEN** the fallback shows the thrown error's message, and after the reset the child renders
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset"

#### Scenario: the fallback's type

- **GIVEN** the props of the async boundary
- **WHEN** the type of its error fallback is read
- **THEN** it is a component of `IAsyncBoundaryFallbackProps`, an unknown error and a reset that
  takes nothing
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "types its error fallback with its own props"

### Requirement: MOBILE-71 — Every gradient renders through the ui Gradient block

The mobile app SHALL paint every gradient through the `Gradient` block of
`src/components/ui/Gradient/`, which takes its colour stops and optionally a start and an end
point, a style, an accessibility label and children, and renders them through
`expo-linear-gradient`; the accent gradient, the loading skeleton's shimmer and the toggle's track
SHALL render it, and only `src/components/ui/Gradient/Gradient.component.tsx` SHALL import
`expo-linear-gradient`, tests included.

**Evidence:** `apps/mobile/src/components/ui/Gradient/Gradient.component.tsx:1`, `apps/mobile/src/components/ui/Gradient/Gradient.component.tsx:15`, `apps/mobile/src/components/ui/AccentGradient/AccentGradient.component.tsx:12`, `apps/mobile/src/components/ui/LoadingSkeleton/LoadingSkeleton.component.tsx:40`, `apps/mobile/src/components/ui/Toggle/Toggle.component.tsx:31`, `.agents/contracts/dependencies.json:187-192`

#### Scenario: a gradient renders

- **GIVEN** the `Gradient` block with stops, a start and an end point, a style, a label and a child
- **WHEN** it renders
- **THEN** the gradient it draws receives those stops, points, style and label, and holds the
  child
- **Test:** `apps/mobile/src/components/ui/Gradient/__tests__/Gradient.component.test.tsx` › "hands its stops, its direction and its style to the gradient, behind its children"

#### Scenario: the blocks that paint a gradient

- **GIVEN** the accent gradient around content, a loading skeleton, and a toggle on and off
- **WHEN** each renders
- **THEN** the accent gradient paints the light accent to the accent behind the content, the
  skeleton sweeps its shimmer stops across itself, and the toggle paints its track with the accent
  gradient only while on
- **Test:** `apps/mobile/src/components/ui/AccentGradient/__tests__/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children"
- **Test:** `apps/mobile/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "sweeps its shimmer gradient across the skeleton"
- **Test:** `apps/mobile/src/components/ui/Toggle/__tests__/Toggle.component.test.tsx` › "paints its track with the accent gradient only while on"

#### Scenario: a file outside the block imports the gradient

- **GIVEN** a component, screen or test outside the `Gradient` block that imports or mocks
  `expo-linear-gradient`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-72 — The status bar renders through the ui StatusBar block

The mobile app SHALL set the status bar's glyphs through the `StatusBar` block of
`src/components/ui/StatusBar/`, whose style is its own `StatusBarStyleType`, dark or light, and
which renders it through `expo-status-bar`; the root layout SHALL render it with the style
`useRootTheme` derives (MOBILE-05), typed by that union, and only
`src/components/ui/StatusBar/StatusBar.component.tsx` SHALL import `expo-status-bar`, tests
included.

**Evidence:** `apps/mobile/src/components/ui/StatusBar/StatusBar.type.ts:2`, `apps/mobile/src/components/ui/StatusBar/StatusBar.component.tsx:1`, `apps/mobile/src/components/ui/StatusBar/StatusBar.component.tsx:8`, `apps/mobile/src/app/_layout.tsx:43`, `apps/mobile/src/lib/theme/useRootTheme.type.ts:8`, `.agents/contracts/dependencies.json:214-219`

#### Scenario: the block sets the glyphs

- **GIVEN** the `StatusBar` block with the dark and with the light style
- **WHEN** it renders
- **THEN** the status bar it draws receives that style
- **Test:** `apps/mobile/src/components/ui/StatusBar/__tests__/StatusBar.component.test.tsx` › "sets the status bar to the glyph style it is given"

#### Scenario: the block's own style type

- **GIVEN** the props of the `StatusBar` block
- **WHEN** the type of its style is read
- **THEN** it is `StatusBarStyleType`, the union of dark and light
- **Test:** `apps/mobile/src/components/ui/StatusBar/__tests__/StatusBar.component.test.tsx` › "takes its own glyph style"

#### Scenario: a file outside the block imports the status bar

- **GIVEN** a route, a theme file or a test outside the `StatusBar` block that imports or mocks
  `expo-status-bar`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-73 — A theme is applied through lib/theme

The mobile app SHALL apply a theme to NativeWind's live color scheme, without storing it, through
`applyTheme` of `src/lib/theme/colorScheme.adapter.ts`, so every theme-token consumer reads that
theme; the theme config SHALL apply the start-up theme and a chosen one through it, and a block's
or a route's test SHALL switch the theme through it, never through `nativewind`.

**Evidence:** `apps/mobile/src/lib/theme/colorScheme.adapter.ts:10`, `apps/mobile/src/lib/theme/colorScheme.adapter.ts:11`, `apps/mobile/src/lib/theme/theme.config.ts:24`, `apps/mobile/src/lib/theme/theme.config.ts:46`, `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx:67`, `apps/mobile/src/app/__tests__/layout.route.test.tsx:90`, `.agents/contracts/dependencies.json:146-154`

#### Scenario: a theme is applied

- **GIVEN** the dark theme is active
- **WHEN** `applyTheme` applies the light theme, then the dark one
- **THEN** the theme tokens read the light theme and its palette, then the dark ones
- **Test:** `apps/mobile/src/lib/theme/__tests__/colorScheme.adapter.test.ts` › "applies a theme to the live color scheme"

#### Scenario: the theme config

- **GIVEN** a light theme in the device storage
- **WHEN** the theme config starts, then the dark theme is chosen
- **THEN** it applies the light theme, then the dark one, each through `applyTheme`
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "applies the start-up theme and a chosen one through applyTheme"

#### Scenario: a block under the light theme

- **GIVEN** the light theme applied through `applyTheme`
- **WHEN** the `Text` block renders a caption and the `Screen` block a surface
- **THEN** each paints the light theme's colour
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour"
- **Test:** `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background"

#### Scenario: the root layout under the light theme

- **GIVEN** the light theme applied through `applyTheme`
- **WHEN** the root layout renders
- **THEN** the routes sit inside a view whose style holds the light theme's variables
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "wraps the routes in the variables of the active theme"

#### Scenario: a block or route test imports nativewind

- **GIVEN** a `ui/` block test or the root layout's test that imports `nativewind`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-74 — The root layout boots through lib/bootstrap

The mobile app SHALL hold the native splash screen when the root layout loads, through
`holdSplashScreen` of `src/lib/bootstrap/splashScreen.adapter.ts`, load its fonts and hide the
splash through `useAppBootstrap` of `src/lib/bootstrap/useAppBootstrap.hook.ts` (MOBILE-02), and
give its tree the device's safe area through `AppSafeAreaProvider` of
`src/lib/bootstrap/AppSafeAreaProvider.component.tsx`. Only `splashScreen.adapter.ts` SHALL import
`expo-splash-screen`, only `useAppBootstrap.constant.ts`, which names the faces, and
`useAppBootstrap.hook.ts`, which loads them, the `@expo-google-fonts` packages, and only
`AppSafeAreaProvider.component.tsx` and `ui/AuthShell` `react-native-safe-area-context`, so the
root layout imports project modules only and its test mocks project modules, never a vendor.

**Evidence:** `apps/mobile/src/lib/bootstrap/splashScreen.adapter.ts:8-10`, `apps/mobile/src/lib/bootstrap/splashScreen.adapter.ts:13-15`, `apps/mobile/src/app/_layout.tsx:24`, `apps/mobile/src/app/_layout.tsx:39`, `apps/mobile/src/lib/bootstrap/AppSafeAreaProvider.component.tsx:11-15`, `.agents/contracts/dependencies.json:124-127`, `.agents/contracts/dependencies.json:130-135`, `.agents/contracts/dependencies.json:138-144`, `.agents/contracts/dependencies.json:201-207`, `eslint-dependency-seam-allowlist.json:1`

#### Scenario: the splash screen is held, then hidden

- **GIVEN** the native splash screen
- **WHEN** `holdSplashScreen` runs, then `hideSplashScreen`
- **THEN** the splash screen is kept up once, then hidden once
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/splashScreen.adapter.test.ts` › "keeps the native splash screen up until it is hidden"
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/splashScreen.adapter.test.ts` › "hides the native splash screen"

#### Scenario: the root layout loads

- **GIVEN** the root layout's module
- **WHEN** it loads
- **THEN** it holds the splash screen through `lib/bootstrap`, once
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "holds the splash screen through lib/bootstrap as it loads"

#### Scenario: the safe area

- **GIVEN** a tree
- **WHEN** `AppSafeAreaProvider` renders around it
- **THEN** the tree renders inside the device's safe-area provider
- **Test:** `apps/mobile/src/lib/bootstrap/__tests__/AppSafeAreaProvider.component.test.tsx` › "renders its tree inside the device's safe-area provider"

#### Scenario: the root layout or its test reaches a vendor

- **GIVEN** the root layout or its test importing or mocking `expo-splash-screen`, a font package,
  `react-native-safe-area-context`, `nativewind` or `posthog-react-native`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-75 — The auth gateway is built in lib/supabase

The mobile app SHALL build its one auth gateway in `src/lib/supabase/authGateway.adapter.ts`, a
Supabase auth gateway over the very client `src/lib/supabase/client.adapter.ts` creates, and the
root layout SHALL hand that gateway to the auth provider; only the `*.adapter.ts` files of
`src/lib/supabase/` SHALL import `@app/supabase`, tests included.

**Evidence:** `apps/mobile/src/lib/supabase/authGateway.adapter.ts:11-13`, `apps/mobile/src/app/_layout.tsx:18`, `apps/mobile/src/app/_layout.tsx:41`, `.agents/contracts/dependencies.json:264-267`

#### Scenario: the gateway over the app's client

- **GIVEN** the app's Supabase client
- **WHEN** the auth gateway module loads
- **THEN** one Supabase auth gateway is created over that same client, and it is the gateway the
  module exports
- **Test:** `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "builds the auth gateway over the client the client adapter creates"

#### Scenario: the root layout renders

- **GIVEN** the gateway of `lib/supabase`
- **WHEN** the root layout renders
- **THEN** the auth provider bootstraps the session from that gateway
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "hands the auth provider the gateway lib/supabase builds"

#### Scenario: a file outside lib/supabase imports the package

- **GIVEN** the root layout or its test importing or mocking `@app/supabase`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-76 — The Supabase client is the opaque backend client

The mobile app SHALL type its Supabase client, `supabase` of `src/lib/supabase/client.adapter.ts`,
as the opaque `BackendClientType` of packages/supabase (SUPABASE-30), so no type of the app names
the Supabase client or a Supabase generic.

**Evidence:** `apps/mobile/src/lib/supabase/client.adapter.ts:31-34`, `packages/supabase/src/backendClient.type.ts:9-11`

#### Scenario: the client's type

- **GIVEN** the client adapter
- **WHEN** the type of the client it exports is read
- **THEN** it is `BackendClientType`
- **Test:** `apps/mobile/src/lib/supabase/__tests__/client.adapter.test.ts` › "types the client as the opaque backend client"

### Requirement: MOBILE-77 — The Text block takes the classes and the role a block sets

The `Text` block of `src/components/ui/Text/` SHALL hand the native text the NativeWind classes
(`className`) and the accessibility role (`accessibilityRole`) it is given, beside its variant,
its style and its line limit as before; without them it SHALL hand the native text neither.

**Evidence:** `apps/mobile/src/components/ui/Text/Text.type.ts:15`, `apps/mobile/src/components/ui/Text/Text.type.ts:21`, `apps/mobile/src/components/ui/Text/Text.component.tsx:22-28`, `apps/mobile/src/components/ui/ScreenHeader/ScreenHeader.component.tsx:42`, `apps/mobile/src/components/ui/AuthShell/AuthShell.component.tsx:44`

#### Scenario: a role

- **GIVEN** the `Text` block with the accessibility role `header`
- **WHEN** it renders
- **THEN** the text it draws carries the role `header`
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "hands its accessibility role to the native text"

#### Scenario: classes

- **GIVEN** the `Text` block with the classes `font-bold text-accent-ink`, and another with none
- **WHEN** each renders
- **THEN** the first native text receives those classes, and the second receives no `className`
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "hands the classes a block sets to the native text"

#### Scenario: a block marks its title as a header

- **GIVEN** the screen header and the auth shell, each with a title
- **WHEN** each renders
- **THEN** its title is the one text with the role `header`
- **Test:** `apps/mobile/src/components/ui/ScreenHeader/__tests__/ScreenHeader.component.test.tsx` › "marks its title as a header"
- **Test:** `apps/mobile/src/components/ui/AuthShell/__tests__/AuthShell.component.test.tsx` › "marks its title as a header"


### Requirement: MOBILE-78 — Every text renders through the Text block

The mobile app SHALL render every text of a block, a screen or a test through the `Text` block;
only files under `src/components/ui/Text/`, and the test infrastructure under `src/test/`, SHALL
import `Text` from `react-native`. The same SHALL hold for every `react-native` primitive a block
of `src/components/ui/` is named after: `Modal` is imported only under `src/components/ui/Modal/`,
and `Button` and `StatusBar` of `react-native` by no file.

**Evidence:** `apps/mobile/src/components/ui/Text/Text.component.tsx:1`, `apps/mobile/src/components/ui/Button/Button.component.tsx:63`, `apps/mobile/src/components/ui/Chip/Chip.component.tsx:36`, `apps/mobile/src/components/ui/Modal/Modal.component.tsx:1`, `apps/mobile/src/components/ui/Modal/Modal.component.tsx:5`, `.agents/contracts/dependencies.json:42`

#### Scenario: the blocks keep the text they show

- **GIVEN** the sign-in screen, the items dashboard, the error, empty and offline states and the
  confirmation dialog, rendered in both languages
- **WHEN** their visible text is read
- **THEN** it is the text recorded at the base of the i18n seam
- **Test:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages"

#### Scenario: a block's text keeps its behaviour

- **GIVEN** a toast, a busy button and an async boundary whose child throws, each rendering its
  text through the `Text` block
- **WHEN** the toast's dismiss control is pressed, the button renders, and the boundary resets
- **THEN** the toast goes, the busy indicator is labelled in the active language, and the
  boundary shows its fallback with the thrown error and then its children again
- **Test:** `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed"
- **Test:** `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its busy indicator in the active language"
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset"

#### Scenario: the native text receives what it received before

- **GIVEN** every block that renders text, in its variants, in both themes
- **WHEN** it renders before and after its text moves onto the `Text` block
- **THEN** every native text receives the same classes, role, line limit, flattened style and
  children, and the markup is the same
- **Test:** Not covered — a one-off record, in the verify report: no committed test may stand in
  for `react-native`'s `Text` outside the `Text` block (SEAM-13)

#### Scenario: a file outside the Text block imports react-native's Text

- **GIVEN** a block, a screen or a test outside `src/components/ui/Text/` that imports or mocks
  `Text` of `react-native`
- **WHEN** ESLint runs
- **THEN** the import is reported, naming the `Text` block
- **Test:** Not covered — no test of this app reads its imports; `local/wrapped-import` refuses
  such an import (harness/dependency-seams SEAM-11, SEAM-13), inside `pnpm validate`


### Requirement: MOBILE-79 — The expo-router hooks go through lib/routing

The mobile app SHALL call an `expo-router` hook, or its `router` object, only from
`src/lib/routing/`, under the app's own types, as the web's `useAppRouter` does; its routes SHALL
use `expo-router`'s layout components and types directly. The app calls no hook today, so
`src/lib/routing/` holds no module: the root layout renders `Stack`, and the root error boundary
is typed by `ErrorBoundaryProps`.

**Evidence:** `apps/mobile/src/app/_layout.tsx:5`, `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.tsx:1`, `.agents/contracts/dependencies.json:24`

#### Scenario: the root layout uses expo-router directly

- **GIVEN** the root layout, with `expo-router`'s `Stack` replaced by a stand-in in its test
- **WHEN** it renders before the bootstrap is ready, and its `ErrorBoundary` export is read
- **THEN** it renders no route, and its `ErrorBoundary` is the root error boundary
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "renders no route until the bootstrap is ready"
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "exports the root error boundary as its ErrorBoundary"

#### Scenario: a file outside lib/routing calls a hook

- **GIVEN** a screen, a hook or a block that imports `useRouter`, `useLocalSearchParams` or
  `router` from `expo-router`
- **WHEN** ESLint runs
- **THEN** the import is reported, naming `src/lib/routing/`
- **Test:** Not covered — no test of this app reads its imports; `local/wrapped-import` refuses
  such an import (harness/dependency-seams SEAM-12), inside `pnpm validate`

<!-- region sentry -->
### Requirement: MOBILE-80 — PII scrubbed before Sentry

The mobile app SHALL pass every error context, message context, breadcrumb, user and
automatically captured event through the scrubPII helper of packages/core before the Sentry SDK
receives it.

**Evidence:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:30-36`, `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:39-76`

#### Scenario: an error context with an email

- **GIVEN** a configured DSN
- **WHEN** an error is captured with a context holding an email and a screen name
- **THEN** the context handed to the Sentry SDK has the email redacted and the screen name kept
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context"

#### Scenario: the user payload

- **GIVEN** a configured DSN
- **WHEN** the user is set with an email and an id
- **THEN** the user handed to the Sentry SDK has the email redacted and the id kept
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload"

#### Scenario: an automatically captured event

- **GIVEN** the Sentry SDK was initialised by the adapter
- **WHEN** an event carrying Authorization and Cookie headers reaches its beforeSend hook
- **THEN** both headers come back redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeSend that scrubs auto-captured events"

#### Scenario: an automatically captured breadcrumb

- **GIVEN** the Sentry SDK was initialised by the adapter
- **WHEN** a breadcrumb with an email reaches its beforeBreadcrumb hook
- **THEN** the email comes back redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeBreadcrumb that scrubs auto-captured breadcrumbs"

#### Scenario: delivery from a native build

- **GIVEN** a native dev build with a DSN
- **WHEN** an error is captured
- **THEN** Sentry receives the scrubbed event
- **Test:** Not covered — every test replaces the Sentry SDK with a mock, which proves the payload the adapter hands over, not what the native SDK sends; real capture needs a native dev build

### Requirement: MOBILE-81 — Sentry off without a DSN

The mobile app SHALL initialise Sentry disabled and make every observability call a no-op when
EXPO_PUBLIC_SENTRY_DSN is unset, tagging events with EXPO_PUBLIC_APP_ENV, else development.

**Evidence:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:26-36`, `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:45`

#### Scenario: no DSN

- **GIVEN** EXPO_PUBLIC_SENTRY_DSN is unset
- **WHEN** an error is captured and a user is set
- **THEN** the Sentry SDK receives neither
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "methods no-op when the DSN is absent"

#### Scenario: no environment tag

- **GIVEN** a DSN and no EXPO_PUBLIC_APP_ENV
- **WHEN** the adapter loads
- **THEN** Sentry is initialised with the development environment
- **Test:** Not covered — no test asserts the environment passed to the Sentry init

### Requirement: MOBILE-82 — The Sentry adapter keeps the port contract

The mobile app's Sentry adapter SHALL pass the observability port contract of packages/tooling
with its SDK replaced at its module.

**Evidence:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:38-77`

#### Scenario: the Sentry adapter

- **GIVEN** the Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"
<!-- endregion sentry -->

## Open questions

- **Q1** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-app-behaviour/`: a
  failed query adds no toast and the dashboard shows its error state (MOBILE-20).
- **Q2** — Closed on 2026-11-14 by `openspec/changes/archive/2026-11-14-error-surfacing/`: the
  root layout mounts the toast viewport (MOBILE-36).
- **Q3** — Closed on 2026-11-14 by `openspec/changes/archive/2026-11-14-error-surfacing/`: the
  root layout exports `RootErrorBoundary` as its `ErrorBoundary` (MOBILE-37).
- **Q4** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-i18n/`: the relative
  time, the toast dismiss label, the retry and loading labels and the item status are read from
  the catalogs in the active language (MOBILE-14, MOBILE-36, MOBILE-46).
- **Q5** — Closed on 2026-11-16 by `openspec/changes/archive/2026-11-15-app-behaviour/`: the
  dashboard hook passes no override message (MOBILE-20).
