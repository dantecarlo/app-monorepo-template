# Delta: packages/core

> **Change:** `2026-11-17-posthog-observability`

## ADDED Requirements

### Requirement: CORE-26 — The built-in adapters keep the observability port contract

The core package SHALL ship a no-op and a console adapter that both pass the observability port
contract of packages/tooling: the no-op adapter hands nothing on, and the console adapter logs
every payload scrubbed, logs nothing while switched off, and logs a `null` user on
`setUser(null)`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the no-op adapter

- **GIVEN** the no-op adapter and a harness with no provider behind it
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "the observability port contract"

#### Scenario: the console adapter

- **GIVEN** the console adapter, switched on or off, and a harness reading the host console
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `packages/core/src/ports/observability/__tests__/createConsoleObservability.helper.test.ts` › "the observability port contract"

## MODIFIED Requirements

### Requirement: CORE-15 — A no-op observability default

The core package SHALL provide `createNoopObservability`, whose four methods accept any call,
record nothing and return `undefined`.

**Evidence:** `packages/core/src/ports/observability/createNoopObservability.helper.ts:3-8`

#### Scenario: an error is captured

- **GIVEN** the no-op adapter
- **WHEN** it captures an `Error`
- **THEN** the call returns `undefined`
- **Test:** `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "captureError is callable and returns undefined"

#### Scenario: a message is captured

- **GIVEN** the no-op adapter
- **WHEN** it captures a message
- **THEN** the call returns `undefined`
- **Test:** `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "captureMessage is callable and returns undefined"

#### Scenario: an error with context

- **GIVEN** the no-op adapter
- **WHEN** it captures an `Error` with a context
- **THEN** the call does not throw
- **Test:** `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "captureError does not throw with context"

#### Scenario: a user and a breadcrumb

- **GIVEN** the no-op adapter
- **WHEN** it sets a user, clears it and adds a breadcrumb
- **THEN** no call throws and nothing is handed on
- **Test:** `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "the observability port contract"
