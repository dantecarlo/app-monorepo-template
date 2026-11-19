# Delta: apps/web

> **Change:** `2026-11-19-app-follow-ups`

## MODIFIED Requirements

### Requirement: WEB-07 — A failed items load shows the error state

The web app SHALL, when the items query fails, render the error state with its generic copy in
the items list, in place of the items and the empty state, with a Try again button that runs the
items query again, show no result count in the list header and no count on the stats card (no
total, no active count, and neither of their labels), and queue no toast.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: the dashboard's stats card shows no total

- **GIVEN** the items service rejects
- **WHEN** the dashboard settles
- **THEN** the stats card shows its overview label, and no total, no "total items" label and no active count
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows no total on the stats card when the items query fails"

#### Scenario: the stats card shows no count

- **GIVEN** the stats card told the items failed to load
- **WHEN** it renders
- **THEN** it shows its overview label and live chip, and no total, no dash, no "total items" label, no active count and no "updated" label
- **Test:** `apps/web/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows no total and no active count when the items failed to load"

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

### Requirement: WEB-49 — The PostHog adapter maps the port through scrubPII

The web app SHALL send an error as a PostHog exception, a message as a PostHog log record at the
mapped level, a breadcrumb as an exception step and a user as an `identify` by id, passing every
context, breadcrumb payload and person property through `scrubPII` from packages/core, and SHALL
reset the PostHog identity on `setUser(null)`. It SHALL make no `identify` call and no reset for
a user whose id is not a string holding a character other than whitespace, so the identity
PostHog holds stays as it was.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an error

- **GIVEN** a PostHog key
- **WHEN** an error is captured with a context holding an email
- **THEN** PostHog's exception capture receives the error and the context with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context"

#### Scenario: a message

- **GIVEN** a PostHog key
- **WHEN** a warning message is captured with a context holding an email
- **THEN** PostHog receives a log record whose body is the message, whose level is `warn` and
  whose attributes have the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level"

#### Scenario: a breadcrumb

- **GIVEN** a PostHog key
- **WHEN** a breadcrumb is added with a category and data holding an email
- **THEN** PostHog adds an exception step named by the message, with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data"

#### Scenario: a user, then none

- **GIVEN** a PostHog key
- **WHEN** a user with an id and an email is set, then `null`
- **THEN** PostHog identifies the id with the email redacted, then resets the identity
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest"
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser(null) resets the identity"

#### Scenario: a blank id

- **GIVEN** a PostHog key, and a user identified by an id
- **WHEN** a user whose id is empty, only whitespace or not a string is set, with an email
- **THEN** PostHog receives no further `identify` and no reset, and the method does not throw
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies nobody for a blank id"
