# Delta: apps/mobile

> **Change:** `2026-11-19-capability-prune-claims`

## MODIFIED Requirements

### Requirement: MOBILE-51 — The PostHog adapter keeps the port contract

The mobile app SHALL ship a PostHog adapter that passes the observability port contract of
packages/tooling with its SDK replaced at its module.

**Evidence:** `apps/mobile/src/lib/observability/createPostHogObservability.adapter.ts:30-79`

#### Scenario: the PostHog adapter

- **GIVEN** the PostHog adapter, with and without a key
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract"

## REMOVED Requirements

### Requirement: MOBILE-26 — PII scrubbed before Sentry

**Reason:** moved, whole, to apps/mobile/sentry as MOBILESENTRY-01, a spec the `sentry`
capability claims and the `mobile-expo` prune removes, so either prune takes the requirement with
the tests it cites.

### Requirement: MOBILE-27 — Sentry off without a DSN

**Reason:** moved, whole, to apps/mobile/sentry as MOBILESENTRY-02, so either prune takes the
requirement with the test it cites.
