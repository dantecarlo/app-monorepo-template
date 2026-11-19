# Delta: apps/web

> **Change:** `2026-11-19-capability-prune-claims`

## MODIFIED Requirements

### Requirement: WEB-53 — The Next config applies every optional capability's file

The web app SHALL build its Next.js config and then apply, in name order, the default export of
every `next-<capability>.config.ts` beside `next.config.ts`, naming no capability itself.

**Evidence:** `apps/web/next.config.ts:52-89`

#### Scenario: a capability file beside the config

- **GIVEN** a folder with two `next-<capability>.config.ts` files and one other file
- **WHEN** the config plugins of that folder are applied to a config
- **THEN** both change it, in name order, and the other file is not loaded
- **Test:** `apps/web/__tests__/next.config.test.ts` › "applies every next-<capability>.config.ts beside it, in name order"

#### Scenario: no capability file

- **GIVEN** a folder with no `next-<capability>.config.ts`
- **WHEN** the config plugins of that folder are applied
- **THEN** the config is returned as built
- **Test:** `apps/web/__tests__/next.config.test.ts` › "keeps the config as built when no capability file is beside it"

### Requirement: WEB-54 — The PostHog adapter keeps the port contract

The web app SHALL ship a PostHog adapter that passes the observability port contract of
packages/tooling with its SDK replaced at its module.

**Evidence:** `apps/web/src/lib/observability/createPostHogObservability.adapter.ts:29-73`

#### Scenario: the PostHog adapter

- **GIVEN** the PostHog adapter, with and without a key
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract"

## REMOVED Requirements

### Requirement: WEB-29 — The Sentry adapter scrubs PII and stays silent without a DSN

**Reason:** moved, whole, to capabilities/sentry as SENTRY-01, a spec the `sentry` capability
claims, so the capability's prune takes the requirement with the test it cites.

### Requirement: WEB-30 — The Sentry SDK scrubs every event in every runtime

**Reason:** moved, whole, to capabilities/sentry as SENTRY-02, so the capability's prune takes the
requirement with the files it cites.
