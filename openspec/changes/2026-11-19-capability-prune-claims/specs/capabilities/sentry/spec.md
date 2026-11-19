# Delta: capabilities/sentry

> **Change:** `2026-11-19-capability-prune-claims`
> **ID prefix:** `SENTRY`

## ADDED Requirements

### Requirement: SENTRY-01 — The web Sentry adapter scrubs PII and stays silent without a DSN

The web app's Sentry adapter, the optional provider of the `sentry` capability, SHALL send
errors, messages, breadcrumbs and the user to Sentry only when `NEXT_PUBLIC_SENTRY_DSN` is set,
passing every context, breadcrumb payload and user through `scrubPII` from packages/core first.

**Evidence:** `apps/web/src/lib/observability/createSentryObservability.adapter.ts:24-65`

#### Scenario: an error is captured

- **GIVEN** a DSN is set
- **WHEN** an error is captured with a context holding an email
- **THEN** Sentry receives the error with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError forwards the exception to Sentry"
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context before sending"

#### Scenario: the user and breadcrumbs are scrubbed

- **GIVEN** a DSN is set
- **WHEN** a user or a breadcrumb holding an email is sent
- **THEN** Sentry receives it with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload"
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "addBreadcrumb scrubs PII from breadcrumb data"

#### Scenario: no DSN

- **GIVEN** no DSN
- **WHEN** every observability method is called
- **THEN** Sentry receives nothing
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "all methods no-op when the DSN is absent"

### Requirement: SENTRY-02 — The web Sentry SDK scrubs every event in every runtime

The web app SHALL initialise Sentry in the browser, Node and edge runtimes, the last two loaded by
the instrumentation hook, enabled only when `NEXT_PUBLIC_SENTRY_DSN` is set, with every event and
breadcrumb passed through `scrubPII` before sending.

**Evidence:** `apps/web/sentry.client.config.ts:6-12`, `apps/web/sentry.server.config.ts:6-12`, `apps/web/sentry.edge.config.ts:6-12`, `apps/web/instrumentation.ts:3-10`

#### Scenario: an event leaves the app

- **GIVEN** a DSN is set
- **WHEN** the SDK sends an event or a breadcrumb holding personal data
- **THEN** the personal data is redacted
- **Test:** Not covered — no test loads the Sentry config files; `scripts/verify-security-static.mjs` only checks that the client and server configs name `scrubPII` at `beforeSend`.

### Requirement: SENTRY-03 — The web Next config is wrapped by the Sentry capability's file

The web app's `next-sentry.config.ts`, which `next.config.ts` applies as it applies every
`next-<capability>.config.ts` beside it (apps/web, WEB-53), SHALL wrap the config with
`withSentryConfig`, silent, uploading source maps only when `SENTRY_AUTH_TOKEN` is set.

**Evidence:** `apps/web/next-sentry.config.ts:12-18`

#### Scenario: the web app's own folder

- **GIVEN** the web app as the template ships it, with `@sentry/nextjs` replaced at its module
- **WHEN** its config is built
- **THEN** the Sentry capability's file is applied, and the built config is what it returned
- **Test:** `apps/web/__tests__/next-sentry.config.test.ts` › "next.config.ts applies the Sentry capability's file of the web app"

#### Scenario: the Sentry wrapper

- **GIVEN** `@sentry/nextjs` replaced at its module
- **WHEN** the Sentry capability's file wraps a config, with and without `SENTRY_AUTH_TOKEN`
- **THEN** `withSentryConfig` receives the config, `silent: true`, and source maps disabled only
  without the token
- **Test:** `apps/web/__tests__/next-sentry.config.test.ts` › "wraps the config with Sentry, uploading source maps only with a token"

### Requirement: SENTRY-04 — The mobile app scrubs PII before Sentry

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

### Requirement: SENTRY-05 — The mobile app keeps Sentry off without a DSN

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

### Requirement: SENTRY-06 — Both Sentry adapters keep the port contract

The web and mobile Sentry adapters SHALL each pass the observability port contract of
packages/tooling with their SDK replaced at its module.

**Evidence:** `apps/web/src/lib/observability/createSentryObservability.adapter.ts:26-65`, `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:38-77`

#### Scenario: the web Sentry adapter

- **GIVEN** the web Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"

#### Scenario: the mobile Sentry adapter

- **GIVEN** the mobile Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"
