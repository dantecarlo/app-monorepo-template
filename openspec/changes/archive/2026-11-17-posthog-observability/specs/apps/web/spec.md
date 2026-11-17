# Delta: apps/web

> **Change:** `2026-11-17-posthog-observability`

## ADDED Requirements

### Requirement: WEB-48 — PostHog is the default observability provider

The web app SHALL bind its observability port to the PostHog adapter in its composition root, so
every error, message, breadcrumb and user the app reports goes to PostHog unless that one line
binds another adapter.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a captured error reaches PostHog

- **GIVEN** a PostHog key and the PostHog SDK replaced at its module
- **WHEN** an error is captured through the composition root
- **THEN** the SDK's exception capture receives it
- **Test:** `apps/web/src/lib/observability/__tests__/observability.adapter.test.ts` › "binds the PostHog adapter by default"

### Requirement: WEB-49 — The PostHog adapter maps the port through scrubPII

The web app SHALL send an error as a PostHog exception, a message as a PostHog log record at the
mapped level, a breadcrumb as an exception step and a user as an `identify` by id, passing every
context, breadcrumb payload and person property through `scrubPII` from packages/core, and SHALL
reset the PostHog identity on `setUser(null)`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an error

- **GIVEN** a PostHog key
- **WHEN** an error is captured with a context holding an email
- **THEN** PostHog's exception capture receives the error and the context with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context"

#### Scenario: a message

- **GIVEN** a PostHog key
- **WHEN** a warning message is captured with a context holding an email
- **THEN** PostHog receives a log record whose body is the message, whose level is `warn` and
  whose attributes have the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level"

#### Scenario: a breadcrumb

- **GIVEN** a PostHog key
- **WHEN** a breadcrumb is added with a category and data holding an email
- **THEN** PostHog adds an exception step named by the message, with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data"

#### Scenario: a user, then none

- **GIVEN** a PostHog key
- **WHEN** a user with an id and an email is set, then `null`
- **THEN** PostHog identifies the id with the email redacted, then resets the identity
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest"
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser(null) resets the identity"

### Requirement: WEB-50 — The PostHog client is inert without a key

The web app SHALL initialise its one PostHog client only in the browser and only when
`NEXT_PUBLIC_POSTHOG_KEY` is set, sending to `NEXT_PUBLIC_POSTHOG_HOST` or, without it, to the US
ingestion host, and SHALL otherwise expose no client, so every observability call is a no-op and
no request leaves the app.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no key

- **GIVEN** no PostHog key
- **WHEN** the client module loads and every observability method is called
- **THEN** the SDK is never initialised and receives nothing
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not initialise PostHog without a key"

#### Scenario: a key and a host

- **GIVEN** a key and a host
- **WHEN** the client module loads in the browser
- **THEN** the SDK is initialised once with that key and that host
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "initialises PostHog with the key and the host from the environment"

#### Scenario: a key and no host

- **GIVEN** a key and no host
- **WHEN** the client module loads in the browser
- **THEN** the SDK sends to `https://us.i.posthog.com`
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host"

#### Scenario: the server

- **GIVEN** a key and no `window`
- **WHEN** the client module loads
- **THEN** the SDK is never initialised and no client is exposed
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not initialise PostHog on the server"

### Requirement: WEB-51 — The PostHog client starts with privacy defaults

The web app SHALL initialise PostHog with session recording off, DOM autocapture off (form inputs
included), console errors off, unhandled errors and rejections captured, and the URL scrub as
its `before_send`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: recording and autocapture

- **GIVEN** a key
- **WHEN** the client is initialised
- **THEN** session recording is disabled and autocapture is off
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session recording and autocapture off"

#### Scenario: automatic exception capture

- **GIVEN** a key
- **WHEN** the client is initialised
- **THEN** unhandled errors and rejections are captured and console errors are not
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures unhandled errors but not console errors"

#### Scenario: every event is scrubbed

- **GIVEN** a key
- **WHEN** the client is initialised
- **THEN** its `before_send` is the URL scrub
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "runs the URL scrub before every event"

### Requirement: WEB-52 — Every URL leaves without its query and fragment

The web app SHALL drop, before PostHog sends an event, the query string and the fragment of every
URL, path and referrer property of the event and of the person, and of every page URL that keys
heatmap data, merging the points of two URLs that scrub to the same key.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a page URL with a token

- **GIVEN** a URL with a query and a fragment that carry a token
- **WHEN** it is scrubbed
- **THEN** both are gone and the rest of the URL is kept
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "drops the query and the fragment of a page URL"

#### Scenario: an event and its person

- **GIVEN** an event whose properties, `$set` and `$set_once` hold URLs, paths and referrers
- **WHEN** the event is scrubbed
- **THEN** each of them leaves without its query and its fragment
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "scrubs every URL property of an event and of its person"

#### Scenario: heatmap data

- **GIVEN** heatmap points keyed by two URLs that differ only in their query
- **WHEN** the event is scrubbed
- **THEN** the points sit under one scrubbed URL
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keys heatmap points by the scrubbed URL"

#### Scenario: other properties

- **GIVEN** properties that are not URL properties, one holding a URL string
- **WHEN** the event is scrubbed
- **THEN** they are untouched
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "leaves every other property untouched"

#### Scenario: a dropped event

- **GIVEN** an event an earlier hook dropped
- **WHEN** it is scrubbed
- **THEN** it stays dropped
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "passes a dropped event through as dropped"

### Requirement: WEB-53 — The Next config applies every optional capability's file

The web app SHALL build its Next.js config and then apply, in name order, the default export of
every `next-<capability>.config.ts` beside `next.config.ts`, naming no capability itself; the
Sentry capability's file wraps the config with `withSentryConfig`, silent, uploading source maps
only when `SENTRY_AUTH_TOKEN` is set.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: WEB-54 — Both observability adapters keep the port contract

The web app SHALL ship a PostHog adapter and a Sentry adapter that both pass the observability
port contract of packages/tooling with their SDK replaced at its module.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the PostHog adapter

- **GIVEN** the PostHog adapter, with and without a key
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract"

#### Scenario: the Sentry adapter

- **GIVEN** the Sentry adapter, with and without a DSN
- **WHEN** the port contract runs against it
- **THEN** every case passes
- **Test:** `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract"

## MODIFIED Requirements

### Requirement: WEB-29 — The Sentry adapter scrubs PII and stays silent without a DSN

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
