# apps/mobile — living spec

> **Governs:** `apps/mobile/src`, `apps/mobile/app.json`
> **ID prefix:** `MOBILE`
> **Derived from:** `docs/architecture/mobile.md`, `docs/architecture/shared.md`, `docs/code-standards.md`, `docs/observability.md`, `docs/e2e.md`, `docs/responsive.md`, `AGENTS.md`
> **Verified against the code:** 2026-11-16 at `bc46d55`

## Purpose

The mobile app is the Expo Router client of the template. It owns two routes with no guard: the
items dashboard, backed by a sample service, and a sign-in form that validates its fields but
signs no one in. It also owns the theme and language controls and their persistence, the
light and dark themes painted from the root, a query layer that shows a failed query on its
screen, toasts a failed mutation and captures both through the observability port, and the
environment wiring of Supabase and Sentry. It leaves the error, PII-scrubbing, query-key and
auth-gateway contracts to packages/core, the catalogs and language constants to packages/i18n,
the Supabase client and auth gateway to packages/supabase, the theme values to packages/tokens,
and the web counterpart to apps/web.

## Requirements

### Requirement: MOBILE-01 — Two routes with no guard

The mobile app SHALL render the items dashboard at the root route (/) and the login screen at
/login, under one root stack that checks no session before either renders.

**Evidence:** `apps/mobile/src/app/index.tsx:7`, `apps/mobile/src/app/login.tsx:7`, `apps/mobile/src/app/_layout.tsx:69-78`

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
Montserrat fonts have loaded or failed to load.

**Evidence:** `apps/mobile/src/app/_layout.tsx:37`, `apps/mobile/src/app/_layout.tsx:56-64`

#### Scenario: fonts still loading

- **GIVEN** the app has just launched
- **WHEN** the fonts have neither loaded nor failed
- **THEN** the root layout renders nothing and the splash screen stays visible
- **Test:** Not covered — no test renders the root layout, and expo-splash-screen and expo-font act only in a native or web build

#### Scenario: a font fails to load

- **GIVEN** the app has just launched
- **WHEN** loading a font fails
- **THEN** the splash screen hides and the routes render with the fallback font
- **Test:** Not covered — no test renders the root layout

### Requirement: MOBILE-03 — Initial theme from storage, then the device

The mobile app SHALL start in the theme stored under the app.theme key, else in the device
appearance when it is light or dark, else in the dark default of packages/tokens.

**Evidence:** `apps/mobile/src/lib/theme/theme.config.ts:8-13`, `apps/mobile/src/lib/theme/theme.config.ts:25-42`

#### Scenario: a stored theme wins

- **GIVEN** the user chose light in an earlier session
- **WHEN** the app launches on a device set to dark
- **THEN** the app applies the light theme
- **Test:** Not covered — no test imports `apps/mobile/src/lib/theme/theme.config.ts`; the suite aliases AsyncStorage and nativewind to mocks (`apps/mobile/vitest.config.ts`)

#### Scenario: no stored theme and no device preference

- **GIVEN** nothing is stored and the device reports no color scheme
- **WHEN** the app launches
- **THEN** the app applies the dark theme
- **Test:** Not covered — no test calls getSafeTheme or the theme bootstrap

### Requirement: MOBILE-04 — Theme toggle persists the choice

The mobile app SHALL show the theme switch on while the light theme is active, and on a flip
store the matching theme under the app.theme key and apply it to the NativeWind color scheme.

**Evidence:** `apps/mobile/src/components/ui/ThemeToggle/useThemeToggle.hook.ts:14-18`, `apps/mobile/src/lib/theme/theme.config.ts:20-23`

#### Scenario: switching to light

- **GIVEN** the dark theme is active and the switch is off
- **WHEN** the user turns the switch on
- **THEN** light is stored and applied, and every theme-token consumer re-renders in light
- **Test:** Not covered — no test calls useThemeToggle or setTheme

### Requirement: MOBILE-05 — The root frame follows the theme

The mobile app SHALL paint the navigator background with the active theme's base background, show
dark status bar glyphs under the light theme and light glyphs under the dark one, and wrap the
routes in a view that carries the active theme's `themeVars` from packages/tokens, through
NativeWind's `vars()`.

**Evidence:** `apps/mobile/src/lib/theme/useRootTheme.hook.ts:17`, `apps/mobile/src/lib/theme/useRootTheme.hook.ts:24`, `apps/mobile/src/app/_layout.tsx:45`, `apps/mobile/src/app/_layout.tsx:70`

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

The mobile app SHALL start in the language stored under the app.language key when packages/i18n
supports it, else in the device locale reduced to its language code when supported, else in the
default language.

**Evidence:** `apps/mobile/src/lib/i18n/i18n.config.ts:18-26`, `apps/mobile/src/lib/i18n/i18n.config.ts:35-64`

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
- **Test:** Not covered — no test runs the language bootstrap; the suite mocks AsyncStorage, expo-localization and i18next

### Requirement: MOBILE-07 — Language switcher cycles and persists

The mobile app SHALL show the active language code on the language switcher and, on each press,
move to the next language of packages/i18n in order, wrapping to the first, storing it under the
app.language key before switching i18next.

**Evidence:** `apps/mobile/src/components/ui/LanguageSwitcher/useLanguageSwitcher.hook.ts:12-34`, `apps/mobile/src/lib/i18n/i18n.config.ts:28-33`

#### Scenario: pressing on the last language

- **GIVEN** the active language is the last supported one
- **WHEN** the user presses the language switcher
- **THEN** the first supported language is stored and applied, and the switcher shows its code
- **Test:** Not covered — no test calls useLanguageSwitcher or setLanguage

### Requirement: MOBILE-08 — Plural rules polyfilled for Hermes

The mobile app SHALL install the Intl.PluralRules polyfill with English and Spanish locale data
before i18next and its ICU plugin initialise.

**Evidence:** `apps/mobile/src/lib/i18n/i18n.config.ts:1`, `apps/mobile/src/lib/i18n/intlPolyfill.config.ts:5-7`

#### Scenario: a plural message on Hermes

- **GIVEN** the app runs on the Hermes engine
- **WHEN** a catalog message with a plural for a count of one renders
- **THEN** the singular form shows instead of the other form
- **Test:** Not covered — the polyfill matters only on Hermes, and no test runs on a device or asserts a plural form

### Requirement: MOBILE-09 — Dashboard data keyed by the search term

The mobile app SHALL load the dashboard items through useAppQuery under the items list query key
for the current search term, fetching at most 50 items from the items service and adapting them
to view models.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:41-60`, `apps/mobile/src/lib/query/queryKeys.constant.ts:32-39`

#### Scenario: the user types a search term

- **GIVEN** the dashboard shows the full list
- **WHEN** the user types a term in the search bar
- **THEN** a new query runs under the key for that term and the list shows its result
- **Test:** Not covered — the only useItems test asserts that the export is a function

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

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:62-68`, `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:33-41`

#### Scenario: the sample list has loaded

- **GIVEN** five items, three of them active
- **WHEN** the dashboard renders
- **THEN** the stats card shows 5 total items and 3 active
- **Test:** Not covered — the StatsCard tests call it with react-native aliased to a pass-through mock and assert only a non-null return

### Requirement: MOBILE-16 — Loading state of the list

The mobile app SHALL show an activity indicator in the items list, and an ellipsis in place of
the result count, while the items query is loading.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:34-51`

#### Scenario: the first load

- **GIVEN** the dashboard has just mounted
- **WHEN** the items query is pending
- **THEN** the list shows the activity indicator and the caption shows an ellipsis
- **Test:** Not covered — "renders without returning null when loading" calls the card with react-native aliased to a pass-through mock and asserts only a non-null return, not the indicator

### Requirement: MOBILE-17 — Empty state of the list

The mobile app SHALL show the shared empty state, with the components.emptyState title and
message from the catalogs, when the items query resolves no items.

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:54-55`, `apps/mobile/src/components/ui/EmptyState/EmptyState.component.tsx:18-23`

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

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:35`, `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:57`

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

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/components/DashboardNav/DashboardNav.component.tsx:15-28`, `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:45`, `apps/mobile/src/components/ui/NavBar/NavBar.component.tsx:39-53`

#### Scenario: the user presses the search tab

- **GIVEN** the home tab is selected
- **WHEN** the user presses the search tab
- **THEN** the search tab reports itself selected and the route stays the same
- **Test:** Not covered — the DashboardNav test mocks the nav bar away and asserts only a non-null return

### Requirement: MOBILE-20 — A failed query shows the error state and raises no toast

The mobile app SHALL add no toast when a query made through useAppQuery fails, however many
components observe it; the dashboard SHALL show the error state with its generic copy in the
items list, in place of the items and the empty state, with a retry control that runs the items
query again.

**Evidence:** `apps/mobile/src/lib/query/useAppQuery.hook.ts:19`, `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:49`, `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:77-79`, `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:52-53`

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

**Evidence:** `apps/mobile/src/lib/query/useAppMutation.hook.ts:25-43`

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

**Evidence:** `apps/mobile/src/stores/toast.store.ts:26-42`

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

**Evidence:** `apps/mobile/src/lib/query/createQueryClient.helper.ts:10`, `apps/mobile/src/lib/query/createQueryClient.helper.ts:22-26`

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

**Evidence:** `apps/mobile/src/lib/query/createQueryClient.helper.ts:35`, `apps/mobile/src/lib/query/queryKeys.constant.ts:26-39`, `apps/mobile/src/lib/observability/toCaptureError.helper.ts:7-11`, `apps/mobile/src/app/_layout.tsx:39`

#### Scenario: a query key holding an identifier

- **GIVEN** a query keyed by items, an account identifier and list
- **WHEN** the query fails
- **THEN** the capture callback runs once with the error, the identifier replaced by [redacted] and the queryCache source
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure"

#### Scenario: a query keyed by a search text

- **GIVEN** a query keyed by `QueryKeys.items.list('alice')`
- **WHEN** the query fails
- **THEN** the capture callback receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure"

#### Scenario: a typed value equal to a registered word

- **GIVEN** a query keyed by `QueryKeys.items.list('list')`
- **WHEN** the query fails
- **THEN** the capture callback receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list filter that equals a registered segment on query failure"

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

### Requirement: MOBILE-26 — PII scrubbed before Sentry

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

### Requirement: MOBILE-27 — Sentry off without a DSN

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

### Requirement: MOBILE-28 — Supabase client from the environment

The mobile app SHALL build its Supabase client from EXPO_PUBLIC_SUPABASE_URL and
EXPO_PUBLIC_SUPABASE_ANON_KEY, and fall back to placeholder values with one console warning when
either is unset.

**Evidence:** `apps/mobile/src/lib/supabase/client.adapter.ts:5-17`, `apps/mobile/src/lib/supabase/client.adapter.ts:26`

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

**Evidence:** `apps/mobile/src/components/AuthProvider/useAuthBootstrap.hook.ts:12-30`, `apps/mobile/src/app/_layout.tsx:42`, `apps/mobile/src/app/_layout.tsx:69`

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

**Evidence:** `apps/mobile/src/screens/Login/hooks/useLoginForm.hook.ts:15-29`, `apps/mobile/src/screens/Login/Login.constant.ts:4-13`, `apps/mobile/src/screens/Login/Login.screen.tsx:31-35`

#### Scenario: a short password

- **GIVEN** a valid email and a seven-character password
- **WHEN** the user presses the sign-in button
- **THEN** the password field shows the auth.login.errors.password copy and the email field shows none
- **Test:** Not covered — no test calls useLoginForm, and the LoginScreen test mocks it away

### Requirement: MOBILE-31 — The login screen signs no one in

The mobile app SHALL make no authentication request from the login screen: a valid submit only
puts the sign-in button in its loading state, and the screen offers no social sign-in button,
since the template has no provider for it.

**Evidence:** `apps/mobile/src/screens/Login/hooks/useLoginForm.hook.ts:49-53`, `apps/mobile/src/screens/Login/Login.screen.tsx:23`, `apps/mobile/src/screens/Login/Login.screen.tsx:61`

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

**Evidence:** `apps/mobile/src/app/_layout.tsx:79`, `apps/mobile/src/components/ui/Toast/Toast.component.tsx:13-52`, `apps/mobile/src/components/ui/Toast/Toast.component.tsx:42`

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

**Evidence:** `apps/mobile/src/app/_layout.tsx:35`, `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.tsx:14`, `apps/mobile/src/lib/observability/reportBoundaryError.helper.ts:23`, `apps/mobile/src/lib/observability/reportBoundaryError.helper.ts:26`, `apps/mobile/src/components/ui/Screen/Screen.component.tsx:16`

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

**Evidence:** `eslint-local-rules/style-positioning.detect.mjs:342`, `eslint.rules.mjs:702`, `apps/mobile/src/helpers/layout.style.ts:8`, `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.tsx:10`

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

**Evidence:** `eslint-local-rules/ui-kit.detect.mjs:17`, `apps/mobile/src/components/ui/AccentGradient/AccentGradient.component.tsx:8`

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

**Evidence:** `apps/mobile/src/lib/query/queryKeys.constant.ts:14`, `apps/mobile/src/lib/query/queryKeys.constant.ts:25`, `apps/mobile/src/lib/query/queryKeys.constant.ts:26-30`, `apps/mobile/src/lib/query/queryKeys.constant.ts:32-39`

#### Scenario: every factory is walked

- **GIVEN** every entry of `QueryKeys`, each factory called with a probe value
- **WHEN** the string segments of the keys they return are read
- **THEN** each one is a value of `QueryKeySegmentEnum`
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum"

#### Scenario: the list filter and the detail id

- **GIVEN** a list filter and an item id
- **WHEN** the list and detail keys are built
- **THEN** they are `['items', 'list', { filter }]` and `['items', 'detail', { id }]`, and the list key with no filter stays `['items', 'list']`
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list filter and the detail id in a trailing params object"
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "keeps the bare list key when no filter is given"

#### Scenario: the items prefix is invalidated

- **GIVEN** a cached list query and a cached detail query of the items
- **WHEN** the query client invalidates `QueryKeys.items.all`
- **THEN** both queries are invalidated
- **Test:** `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key"

### Requirement: MOBILE-44 — The session hook returns one object while the session is unchanged

The mobile app SHALL return, from `useSession`, the same object on every read while the session
and the auth status of the auth store are unchanged, and a new object holding them after either
changes.

**Evidence:** `apps/mobile/src/hooks/useSession.hook.ts:7-10`

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

**Evidence:** `apps/mobile/src/screens/ItemsDashboard/ItemsDashboard.screen.tsx:49-66`, `apps/mobile/src/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.component.tsx:19`

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
