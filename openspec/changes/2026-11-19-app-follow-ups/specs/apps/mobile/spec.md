# Delta: apps/mobile

> **Change:** `2026-11-19-app-follow-ups`

## MODIFIED Requirements

### Requirement: MOBILE-15 — Dashboard totals

The mobile app SHALL show on the stats card the number of loaded items and the number of them
whose status is active, and a dash in place of each number while loading.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-20 — A failed query shows the error state and raises no toast

The mobile app SHALL add no toast when a query made through useAppQuery fails, however many
components observe it; the dashboard SHALL show the error state with its generic copy in the
items list, in place of the items and the empty state, with a retry control that runs the items
query again, no result count in the list caption, and no count on the stats card (no total, no
active count, and neither of their labels).

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

### Requirement: MOBILE-48 — The PostHog adapter maps the port through scrubPII

The mobile app SHALL send an error as a PostHog exception, a message as a PostHog log record at
the mapped level, a breadcrumb as an exception step and a user as an `identify` by id, passing
every context, breadcrumb payload and person property through the scrubPII helper of
packages/core, and SHALL reset the PostHog identity on `setUser(null)`. It SHALL make no
`identify` call and no reset for a user whose id is not a string holding a character other than
whitespace, so the identity PostHog holds stays as it was.

**Evidence:** written at apply time, when the code exists.

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
