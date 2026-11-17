# Delta: apps/mobile

> **Change:** `2026-11-17-posthog-observability`

## ADDED Requirements

### Requirement: MOBILE-47 — PostHog is the default observability provider

The mobile app SHALL bind its observability port to the PostHog adapter in its composition root,
so every error, message, breadcrumb and user the app reports goes to PostHog unless that one line
binds another adapter.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a captured error reaches PostHog

- **GIVEN** a PostHog key and the PostHog SDK replaced at its module
- **WHEN** an error is captured through the composition root
- **THEN** the client's exception capture receives it
- **Test:** `apps/mobile/src/lib/observability/__tests__/observability.adapter.test.ts` › "binds the PostHog adapter by default"

### Requirement: MOBILE-48 — The PostHog adapter maps the port through scrubPII

The mobile app SHALL send an error as a PostHog exception, a message as a PostHog log record at
the mapped level, a breadcrumb as an exception step and a user as an `identify` by id, passing
every context, breadcrumb payload and person property through the scrubPII helper of
packages/core, and SHALL reset the PostHog identity on `setUser(null)`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an error

- **GIVEN** a PostHog key
- **WHEN** an error is captured with a context holding an email
- **THEN** PostHog's exception capture receives the error and the context with the email redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context"

#### Scenario: a message

- **GIVEN** a PostHog key
- **WHEN** a warning message is captured with a context holding an email
- **THEN** PostHog receives a log record whose body is the message, whose level is `warn` and
  whose attributes have the email redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level"

#### Scenario: a breadcrumb

- **GIVEN** a PostHog key
- **WHEN** a breadcrumb is added with a category and data holding an email
- **THEN** PostHog adds an exception step named by the message, with the email redacted
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data"

#### Scenario: a user, then none

- **GIVEN** a PostHog key
- **WHEN** a user with an id and an email is set, then `null`
- **THEN** PostHog identifies the id with the email redacted, then resets the identity
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest"
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser(null) resets the identity"

### Requirement: MOBILE-49 — The PostHog client is inert without a key

The mobile app SHALL construct its one PostHog client only when `EXPO_PUBLIC_POSTHOG_KEY` is set,
sending to `EXPO_PUBLIC_POSTHOG_HOST` or, without it, to the US ingestion host, and SHALL
otherwise expose no client, so every observability call is a no-op and no request leaves the app.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no key

- **GIVEN** no PostHog key
- **WHEN** the client module loads
- **THEN** no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not construct a client without a key"

#### Scenario: a key and a host

- **GIVEN** a key and a host
- **WHEN** the client module loads
- **THEN** one client is constructed with that key and that host
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs one client with the key and the host from the environment"

#### Scenario: a key and no host

- **GIVEN** a key and no host
- **WHEN** the client module loads
- **THEN** the client sends to `https://us.i.posthog.com`
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host"

### Requirement: MOBILE-50 — The PostHog client starts with privacy defaults

The mobile app SHALL construct PostHog with session replay off, app lifecycle events off, console
errors off, unhandled rejections captured, and uncaught exceptions captured only on native, never
in a web bundle.

**Evidence:** written at apply time, when the code exists.

#### Scenario: replay and lifecycle events

- **GIVEN** a key
- **WHEN** the client is constructed
- **THEN** session replay and app lifecycle events are off
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session replay and lifecycle events off"

#### Scenario: automatic exception capture on native

- **GIVEN** a key and a native bundle
- **WHEN** the client is constructed
- **THEN** uncaught exceptions and unhandled rejections are captured and console errors are not
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures uncaught exceptions and unhandled rejections on native, not console errors"

#### Scenario: automatic exception capture on web

- **GIVEN** a key and a web bundle
- **WHEN** the client is constructed
- **THEN** uncaught exceptions are not captured and unhandled rejections are
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "leaves uncaught exception capture off in a web bundle"

### Requirement: MOBILE-51 — Both observability adapters keep the port contract

The mobile app SHALL ship a PostHog adapter and a Sentry adapter that both pass the observability
port contract of packages/tooling with their SDK replaced at its module.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the PostHog adapter

- **GIVEN** the PostHog adapter, with and without a key
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract"

#### Scenario: the Sentry adapter

- **GIVEN** the Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"
