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
