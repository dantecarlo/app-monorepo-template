# Delta: apps/mobile

> **Change:** `2026-11-17-items-list-follow-ups`

## MODIFIED Requirements

### Requirement: MOBILE-09 — Dashboard data keyed by the search term and the limit

The mobile app SHALL load the dashboard items through useAppQuery under the items list query key
`QueryKeys.items.list({ search, limit })`, which holds the current search term and the item
limit, 50 by default, so two limits never share a cache entry, fetching at most that many items
from the items service and adapting them to view models.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: MOBILE-20 — A failed query shows the error state and raises no toast

The mobile app SHALL add no toast when a query made through useAppQuery fails, however many
components observe it; the dashboard SHALL show the error state with its generic copy in the
items list, in place of the items and the empty state, with a retry control that runs the items
query again, and no result count in the list caption.

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

### Requirement: MOBILE-43 — A query key keeps its dynamic values in a trailing params object

The mobile app SHALL build every key of `QueryKeys` from `QueryKeySegmentEnum` values followed,
when the key carries a dynamic value, by one trailing params object that holds every such value,
so that no string segment of a key is a value the user typed or the data supplied, and a
feature's `all` key is a prefix of each of its keys.

**Evidence:** written at apply time, when the code exists.

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
