# Delta: apps/web

> **Change:** `2026-11-19-spec-capability-regions`

The requirements below are the Sentry part of the web app, WEBSENTRY-01 to WEBSENTRY-04 of the
removed apps/web/sentry spec under the next free IDs of this spec. They sit inside a `sentry`
region, which the archive copies with them to the end of the requirements; the archive also adds
the `sentry` region of the header that holds their `Governs` line and the one of the Purpose.

## ADDED Requirements

<!-- region sentry -->
### Requirement: WEB-81 — The Sentry adapter scrubs PII and stays silent without a DSN

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

### Requirement: WEB-82 — The Sentry SDK scrubs every event in every runtime

The web app SHALL initialise Sentry in the browser, Node and edge runtimes, the last two loaded by
the instrumentation hook, enabled only when `NEXT_PUBLIC_SENTRY_DSN` is set, with every event and
breadcrumb passed through `scrubPII` before sending.

**Evidence:** `apps/web/sentry.client.config.ts:6-12`, `apps/web/sentry.server.config.ts:6-12`, `apps/web/sentry.edge.config.ts:6-12`, `apps/web/instrumentation.ts:3-10`

#### Scenario: an event leaves the app

- **GIVEN** a DSN is set
- **WHEN** the SDK sends an event or a breadcrumb holding personal data
- **THEN** the personal data is redacted
- **Test:** Not covered — no test loads the Sentry config files; `scripts/verify-security-static.mjs` only checks that the client and server configs name `scrubPII` at `beforeSend`.

### Requirement: WEB-83 — The Sentry capability's file wraps the Next config

The web app's `next-sentry.config.ts`, which `next.config.ts` applies as it applies every
`next-<capability>.config.ts` beside it (WEB-53), SHALL wrap the config with `withSentryConfig`,
silent, uploading source maps only when `SENTRY_AUTH_TOKEN` is set.

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

### Requirement: WEB-84 — The Sentry adapter keeps the port contract

The web app's Sentry adapter SHALL pass the observability port contract of packages/tooling with
its SDK replaced at its module.

**Evidence:** `apps/web/src/lib/observability/createSentryObservability.adapter.ts:26-65`

#### Scenario: the Sentry adapter

- **GIVEN** the Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"
<!-- endregion sentry -->
