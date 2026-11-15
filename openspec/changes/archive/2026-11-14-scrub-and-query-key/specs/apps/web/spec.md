# Delta: apps/web

> **Change:** `2026-11-14-scrub-and-query-key`

## MODIFIED Requirements

### Requirement: WEB-24 — Every failed query and mutation is reported once with a scrubbed key

The web app SHALL report every failed query and mutation once, from the query cache and mutation
cache error handlers, to the observability port, passing the query key through
`sanitizeQueryKey` from packages/core with the values of `QueryKeySegmentEnum` as its structural
segments.

**Evidence:** written at apply time, when the code exists.

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
