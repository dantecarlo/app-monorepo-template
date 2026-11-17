# Delta: apps/web

> **Change:** `2026-11-17-items-list-follow-ups`

## MODIFIED Requirements

### Requirement: WEB-07 — A failed items load shows the error state

The web app SHALL, when the items query fails, render the error state with its generic copy in
the items list, in place of the items and the empty state, with a Try again button that runs the
items query again, show no result count in the list header, and queue no toast.

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

**Evidence:** written at apply time, when the code exists.

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

### Requirement: WEB-24 — Every failed query and mutation is reported once with a scrubbed key

The web app SHALL report every failed query and mutation once, from the query cache and mutation
cache error handlers, to the observability port, passing the query key through
`sanitizeQueryKey` from packages/core with the values of `QueryKeySegmentEnum` as its structural
segments, so the trailing params object of a key (WEB-45) is always redacted, whatever it holds.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: WEB-45 — A query key keeps its dynamic values in a trailing params object

The web app SHALL build every key of `QueryKeys` from `QueryKeySegmentEnum` values followed, when
the key carries a dynamic value, by one trailing params object that holds every such value, so
that no string segment of a key is a value the user typed or the data supplied, and a feature's
`all` key is a prefix of each of its keys.

**Evidence:** written at apply time, when the code exists.

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
