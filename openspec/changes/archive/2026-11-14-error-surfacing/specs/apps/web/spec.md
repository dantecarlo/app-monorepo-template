# Delta: apps/web

> **Change:** `2026-11-14-error-surfacing`

## ADDED Requirements

### Requirement: WEB-37 — The root providers show the toast viewport

The web app SHALL mount the toast viewport inside the root providers, rendering every toast of the
toast store, with its message and a dismiss button that removes it, in a polite status region.

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

## MODIFIED Requirements

### Requirement: WEB-26 — Query and mutation outcomes are queued as toasts

The web app SHALL queue each failure of a query as one error toast with the resolved message,
however often the component that runs the query re-renders, each failed mutation as an error
toast with the resolved message, and a mutation's success message as a success toast, in the
toast store, which drops each toast after 4 seconds.

**Evidence:** written at apply time, when the code exists.

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
