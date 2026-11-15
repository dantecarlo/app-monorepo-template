# Delta: apps/mobile

> **Change:** `2026-11-14-error-surfacing`

## ADDED Requirements

### Requirement: MOBILE-36 — The root layout shows the toast viewport

The mobile app SHALL mount the toast viewport in the root layout, over every route, rendering each
toast of the toast store as an alert with its message and a dismiss control that removes it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a toast is added while a route is shown

- **GIVEN** the root layout rendered with its fonts loaded
- **WHEN** an error toast is added to the toast store
- **THEN** its message is shown
- **Test:** `apps/mobile/src/app/_layout.test.tsx` › "shows a toast added to the store over the routes"

#### Scenario: the toast is dismissed

- **GIVEN** one toast in the viewport
- **WHEN** its dismiss control is pressed
- **THEN** the toast is shown in an alert, and after the press it is gone
- **Test:** `apps/mobile/src/components/ui/Toast/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed"

### Requirement: MOBILE-37 — A render crash shows the error state

The mobile app SHALL export an `ErrorBoundary` from the root layout, which Expo Router wraps
around the layout and every route below it, rendering the error state with its generic copy on
the theme background and a retry control that re-renders the route.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a route crashes while rendering

- **GIVEN** a route throws while rendering
- **WHEN** the root error boundary renders and its retry control is pressed
- **THEN** the generic error title and message are shown in an alert, and the route is re-rendered once
- **Test:** `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.test.tsx` › "renders the generic error state for a render crash"
- **Test:** `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.test.tsx` › "calls retry when the retry control is pressed"

#### Scenario: the root layout exports the boundary

- **GIVEN** the root layout module
- **WHEN** Expo Router reads its exports
- **THEN** its `ErrorBoundary` is the root error boundary
- **Test:** `apps/mobile/src/app/_layout.test.tsx` › "exports the root error boundary as its ErrorBoundary"

## MODIFIED Requirements

### Requirement: MOBILE-20 — A failed query raises one error toast per failure

The mobile app SHALL add one error toast with the resolved message to the toast store each time a
query made through useAppQuery fails, however often the component that runs the query re-renders
while the query stays in error.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a failing query with an override message

- **GIVEN** a query whose function throws and whose caller passes an override message
- **WHEN** the query settles in error
- **THEN** an error toast with the override message is added
- **Test:** `apps/mobile/src/lib/query/useAppQuery.hook.test.ts` › "fires an error toast with the override message on failure"

#### Scenario: a failed query re-renders

- **GIVEN** a query that failed once and added its toast
- **WHEN** its component renders again while the query stays in error
- **THEN** no other toast is added
- **Test:** `apps/mobile/src/lib/query/useAppQuery.hook.test.ts` › "adds one error toast per failure however often it re-renders"

#### Scenario: the query fails again

- **GIVEN** a query that failed once and added its toast
- **WHEN** it is refetched and fails again
- **THEN** a second error toast is added
- **Test:** `apps/mobile/src/lib/query/useAppQuery.hook.test.ts` › "adds another error toast when the query fails again"

#### Scenario: the dashboard fails to load

- **GIVEN** the items service rejects
- **WHEN** the dashboard query settles in error
- **THEN** an error toast with the items.errorMessage copy is added
- **Test:** Not covered — the only useItems test asserts that the export is a function, and the sample service never rejects
