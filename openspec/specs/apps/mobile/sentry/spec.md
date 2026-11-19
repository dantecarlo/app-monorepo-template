# apps/mobile/sentry — living spec

> **Governs:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts`
> **ID prefix:** `MOBILESENTRY`
> **Derived from:** `docs/observability.md`, `docs/manifest.md`, `docs/decisions/0001-pluggable-providers.md`
> **Verified against the code:** 2026-11-19 at `58af488`

## Purpose

The Sentry part of the mobile app, the optional error-monitoring provider of the `sentry`
capability beside the PostHog default: the adapter of the observability port, which starts the
Sentry SDK at module scope. The `sentry` capability claims this spec and the `mobile-expo`
prune removes it, so either prune takes these requirements with the files they cite. It leaves
the PostHog default to apps/mobile, the observability port and the scrubPII helper to
packages/core, and the port contract to packages/tooling.

## Requirements

### Requirement: MOBILESENTRY-01 — PII scrubbed before Sentry

The mobile app SHALL pass every error context, message context, breadcrumb, user and
automatically captured event through the scrubPII helper of packages/core before the Sentry SDK
receives it.

**Evidence:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:30-36`, `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:39-76`

#### Scenario: an error context with an email

- **GIVEN** a configured DSN
- **WHEN** an error is captured with a context holding an email and a screen name
- **THEN** the context handed to the Sentry SDK has the email redacted and the screen name kept
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context"

#### Scenario: the user payload

- **GIVEN** a configured DSN
- **WHEN** the user is set with an email and an id
- **THEN** the user handed to the Sentry SDK has the email redacted and the id kept
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload"

#### Scenario: an automatically captured event

- **GIVEN** the Sentry SDK was initialised by the adapter
- **WHEN** an event carrying Authorization and Cookie headers reaches its beforeSend hook
- **THEN** both headers come back redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeSend that scrubs auto-captured events"

#### Scenario: an automatically captured breadcrumb

- **GIVEN** the Sentry SDK was initialised by the adapter
- **WHEN** a breadcrumb with an email reaches its beforeBreadcrumb hook
- **THEN** the email comes back redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeBreadcrumb that scrubs auto-captured breadcrumbs"

#### Scenario: delivery from a native build

- **GIVEN** a native dev build with a DSN
- **WHEN** an error is captured
- **THEN** Sentry receives the scrubbed event
- **Test:** Not covered — every test replaces the Sentry SDK with a mock, which proves the payload the adapter hands over, not what the native SDK sends; real capture needs a native dev build

### Requirement: MOBILESENTRY-02 — Sentry off without a DSN

The mobile app SHALL initialise Sentry disabled and make every observability call a no-op when
EXPO_PUBLIC_SENTRY_DSN is unset, tagging events with EXPO_PUBLIC_APP_ENV, else development.

**Evidence:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:26-36`, `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:45`

#### Scenario: no DSN

- **GIVEN** EXPO_PUBLIC_SENTRY_DSN is unset
- **WHEN** an error is captured and a user is set
- **THEN** the Sentry SDK receives neither
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "methods no-op when the DSN is absent"

#### Scenario: no environment tag

- **GIVEN** a DSN and no EXPO_PUBLIC_APP_ENV
- **WHEN** the adapter loads
- **THEN** Sentry is initialised with the development environment
- **Test:** Not covered — no test asserts the environment passed to the Sentry init

### Requirement: MOBILESENTRY-03 — The Sentry adapter keeps the port contract

The mobile app's Sentry adapter SHALL pass the observability port contract of packages/tooling
with its SDK replaced at its module.

**Evidence:** `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:38-77`

#### Scenario: the Sentry adapter

- **GIVEN** the Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"
