# Delta: apps/mobile

> **Change:** `2026-11-14-scrub-and-query-key`

## MODIFIED Requirements

### Requirement: MOBILE-25 — Every failed query and mutation is captured

The mobile app SHALL send every failed query, with its query key sanitized by packages/core
against the values of `QueryKeySegmentEnum`, and every failed mutation to the observability
port's captureError, tagged with the cache it came from.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a query key holding an identifier

- **GIVEN** a query keyed by items, an account identifier and list
- **WHEN** the query fails
- **THEN** the capture callback runs once with the error, the identifier replaced by [redacted] and the queryCache source
- **Test:** `apps/mobile/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure"

#### Scenario: a query keyed by a search text

- **GIVEN** a query keyed by `QueryKeys.items.list('alice')`
- **WHEN** the query fails
- **THEN** the capture callback receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/mobile/src/lib/query/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure"

#### Scenario: a failing mutation

- **GIVEN** a mutation whose function throws
- **WHEN** it runs
- **THEN** the capture callback runs with the error and the mutationCache source
- **Test:** `apps/mobile/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure"

#### Scenario: the bridge to the port

- **GIVEN** the capture bridge built over an observability port
- **WHEN** it receives an error and its context
- **THEN** the port's captureError receives both, once
- **Test:** `apps/mobile/src/lib/observability/toCaptureError.helper.test.ts` › "forwards error and context to captureError"
