# Delta: apps/mobile

> **Change:** `2026-11-15-app-behaviour`

## ADDED Requirements

### Requirement: MOBILE-42 — Every block paints the active theme

The mobile app SHALL paint every themed colour of its blocks, the text, surfaces, borders, icons
and indicators of `src/components/ui/` and of a screen's own `components/`, from the palette of
the active theme, through `createThemedStyles` and `useThemedStyles` for a StyleSheet and
`useThemeTokens` in a view, so switching to the light theme repaints the whole app; a colour the
tokens share between the themes MAY still be read from the static palette.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a text variant under the light theme

- **GIVEN** the light theme is active
- **WHEN** the `Text` block renders the caption variant
- **THEN** its colour is the light theme's tertiary text colour
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour"

#### Scenario: a class-styled block under the light theme

- **GIVEN** the light theme is active
- **WHEN** the secondary `Button` renders a label
- **THEN** the label's colour is the light theme's primary text colour
- **Test:** `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "paints the secondary variant from the active theme"

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

## MODIFIED Requirements

### Requirement: MOBILE-05 — The root frame follows the theme

The mobile app SHALL paint the navigator background with the active theme's base background, show
dark status bar glyphs under the light theme and light glyphs under the dark one, and wrap the
routes in a view that carries the active theme's `themeVars` from packages/tokens, through
NativeWind's `vars()`.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-18 — Results list and count

The mobile app SHALL render one item card per loaded item, in order, each with the author
initials, title, description, category, author label, time display and status, under a caption
holding the items.dashboard.listResults message for the item count, which states the count once.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-20 — A failed query shows the error state and raises no toast

The mobile app SHALL add no toast when a query made through useAppQuery fails, however many
components observe it; the dashboard SHALL show the error state with its generic copy in the
items list, in place of the items and the empty state, with a retry control that runs the items
query again.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-25 — Every failed query and mutation is captured

The mobile app SHALL send every failed query, with its query key sanitized by packages/core
against the values of `QueryKeySegmentEnum`, so the trailing params object of a key (MOBILE-43)
is always redacted, and every failed mutation to the observability port's captureError, tagged
with the cache it came from.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-31 — The login screen signs no one in

The mobile app SHALL make no authentication request from the login screen: a valid submit only
puts the sign-in button in its loading state, and the screen offers no social sign-in button,
since the template has no provider for it.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-37 — A render crash shows the error state and is reported once

The mobile app SHALL export an `ErrorBoundary` from the root layout, which Expo Router wraps
around the layout and every route below it, rendering the error state with its generic copy on
the theme background and a retry control that re-renders the route, and reporting the error it
caught to the observability port once, through `reportBoundaryError` under
`src/lib/observability/`, however often it renders.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-40 — Text, Divider and Screen carry the look screens used to hold

The mobile app SHALL render text through the `Text` block, whose variant sets its typography and
colour, a labelled rule through the `Divider` block, and a screen's surface through the `Screen`
block, which fills its parent and paints the active theme's base background.

**Evidence:** written at apply time, when the code exists.

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
