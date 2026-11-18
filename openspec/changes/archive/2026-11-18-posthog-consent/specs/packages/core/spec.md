# Delta: packages/core

> **Change:** `2026-11-18-posthog-consent`

## ADDED Requirements

### Requirement: CORE-27 — The consent port

The core package SHALL declare the consent port, `IConsentPort`, whose `grant`, `revoke` and
`getStatus` each return a promise, and `ConsentStatusEnum` with the statuses `granted`,
`denied`, `pending` and `not-required`, both exported from its barrel and free of any vendor.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the statuses

- **GIVEN** the core barrel
- **WHEN** `ConsentStatusEnum` is read
- **THEN** it holds exactly `granted`, `denied`, `pending` and `not-required`
- **Test:** `packages/core/src/ports/consent/__tests__/consentStatus.type.test.ts` › "names the four consent statuses"

#### Scenario: an app implements the port

- **GIVEN** the web app's consent composition root, typed as `IConsentPort`
- **WHEN** consent is granted through it
- **THEN** its provider receives the grant
- **Test:** `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"

### Requirement: CORE-28 — The key-value storage port

The core package SHALL declare the key-value storage port, `IKeyValueStoragePort`, whose
`getItem`, `setItem` and `removeItem` each take one object and return a promise, and SHALL ship
`createMemoryKeyValueStorage`, a vendor-free implementation that holds its values in memory,
each storage apart from every other, both exported from its barrel.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a value and a missing key

- **GIVEN** an in-memory storage
- **WHEN** a value is set and read back, and a key it never held is read
- **THEN** it reads the value back, and `null` for the missing key
- **Test:** `packages/core/src/ports/storage/__tests__/createMemoryKeyValueStorage.helper.test.ts` › "reads back what it was handed, and null for a key it never held"

#### Scenario: a removed key

- **GIVEN** an in-memory storage holding a value
- **WHEN** its key is removed
- **THEN** the key reads `null`
- **Test:** `packages/core/src/ports/storage/__tests__/createMemoryKeyValueStorage.helper.test.ts` › "removes a key"

#### Scenario: two storages

- **GIVEN** two in-memory storages
- **WHEN** a value is set in the first
- **THEN** the second does not hold it
- **Test:** `packages/core/src/ports/storage/__tests__/createMemoryKeyValueStorage.helper.test.ts` › "keeps the values of each storage apart"
