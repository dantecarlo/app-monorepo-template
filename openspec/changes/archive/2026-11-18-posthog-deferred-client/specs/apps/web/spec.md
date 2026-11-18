# Delta: apps/web

> **Change:** `2026-11-18-posthog-deferred-client`

## ADDED Requirements

### Requirement: WEB-58 — PostHog calls wait for the SDK in a bounded queue, or are dropped

The web app's PostHog observability adapter SHALL scrub every payload with `scrubPII` when it is
called, and then: hand the call to the SDK at once while the SDK is loaded; while the SDK is
loading, hold it in a queue of at most `POSTHOG_PENDING_CALLS_LIMIT` calls, dropping the oldest
when the queue is full, and hand every held call to the SDK in order once it loads, or drop them
all if it fails to load; and drop it while no load has started: without a key, on the server, in
`opt-in` mode before a grant and after a revoke.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the SDK loading

- **GIVEN** a key, the consent mode `granted` and an SDK that has not loaded yet
- **WHEN** an error, a message, a breadcrumb and a user are captured with an email, and the SDK
  then loads
- **THEN** the SDK receives each of them in the order they were made, with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "hands the calls made while PostHog loads to it in order, scrubbed"

#### Scenario: a full queue

- **GIVEN** a key, the consent mode `granted` and an SDK that has not loaded yet
- **WHEN** one error more than `POSTHOG_PENDING_CALLS_LIMIT` is captured, and the SDK then loads
- **THEN** the SDK receives the last `POSTHOG_PENDING_CALLS_LIMIT` errors in order, and not the
  first
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the oldest call when the queue is full"

#### Scenario: a failed load

- **GIVEN** a key, the consent mode `granted` and an SDK whose module fails to load
- **WHEN** an error is captured before the failure and another after it
- **THEN** nothing throws and nothing is delivered
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the held calls when PostHog fails to load"

#### Scenario: before a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** an error is captured, and consent is then granted
- **THEN** the SDK loads and receives no exception
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant"

## MODIFIED Requirements

### Requirement: WEB-50 — The PostHog SDK is loaded only when it may run

The web app SHALL load `posthog-js` only through a dynamic import, in the browser and with
`NEXT_PUBLIC_POSTHOG_KEY` set: when the app starts in `granted` and `memory` mode, and in
`opt-in` mode only once consent is granted (WEB-56, WEB-57). It SHALL load and initialise the SDK
once however often it is started, sending to `NEXT_PUBLIC_POSTHOG_HOST` or, without it, to the
US ingestion host. Without a key, and on the server, it SHALL never load the SDK, so every
observability call is a no-op and no request leaves the app; and a build without a key, or in
`opt-in` mode, SHALL ship no `posthog-js` in the client chunks a page loads at start.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no key

- **GIVEN** no PostHog key
- **WHEN** the client module loads, is started and every observability method is called
- **THEN** the SDK module is never loaded and receives nothing
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "never loads PostHog without a key"

#### Scenario: a key and a host

- **GIVEN** a key and a host
- **WHEN** the client module loads in the browser and is started again
- **THEN** the SDK module is loaded once and initialised once, with that key and that host
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "loads and initialises PostHog once with the key and the host from the environment"

#### Scenario: a key and no host

- **GIVEN** a key and no host
- **WHEN** the client module loads in the browser
- **THEN** the SDK sends to `https://us.i.posthog.com`
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host"

#### Scenario: the server

- **GIVEN** a key and no `window`
- **WHEN** the client module loads and is started
- **THEN** the SDK module is never loaded
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "never loads PostHog on the server"

#### Scenario: the initial client bundle

- **GIVEN** a production build without a key, and one with a key in `opt-in` mode
- **WHEN** the chunks each prerendered page loads at start are read
- **THEN** none of them holds `posthog-js`
- **Test:** Not covered — a test replaces the SDK at its module; `verify-report.md` reads the
  built output of `next build`

### Requirement: WEB-56 — Each consent mode maps onto the SDK's options

The web app SHALL load no SDK in `opt-in` mode until consent is granted, through the consent API
(WEB-57) or by a grant recorded on an earlier visit, which loads it at start; it SHALL then
initialise PostHog with `opt_out_capturing_by_default` and `opt_out_persistence_by_default` set,
so it captures and stores nothing until it is opted in. In `memory` mode it SHALL initialise
PostHog with `persistence: 'memory'`, so it captures but keeps no cookie, local storage or session
storage. Each mode adds nothing else to the `granted` options.

**Evidence:** written at apply time, when the code exists.

#### Scenario: `opt-in` before a grant

- **GIVEN** a key, the consent mode `opt-in` and no recorded grant
- **WHEN** the client module loads in the browser
- **THEN** the SDK module is not loaded
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not load PostHog in opt-in mode before a grant"

#### Scenario: `opt-in`

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the client is started, as a grant starts it
- **THEN** its options are the `granted` ones with capture and persistence opted out by default
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out of capture and persistence"

#### Scenario: a grant from an earlier visit

- **GIVEN** a key, the consent mode `opt-in` and a grant recorded by an earlier visit
- **WHEN** the client module loads in the browser
- **THEN** the SDK module is loaded and initialised
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "loads PostHog at start in opt-in mode after a grant from an earlier visit"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is initialised
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: WEB-57 — The consent API grants, revokes and reads the status

The web app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a key in the browser, `grant` SHALL load the SDK (WEB-50), opt it in without an
`$opt_in` event and then record the grant in the browser's local storage; `revoke` SHALL wait for
a load in flight, remove that record, stop the client so later calls are dropped (WEB-58), and
opt a loaded SDK out and then reset it with a new device id, which clears every value it stored
and its stored choice, and a later grant SHALL opt the same SDK in again; when a revoke and a
grant overlap a load, the later one SHALL decide; and `getStatus` SHALL read `granted` while the
record holds a grant, `denied` after a revoke on the same page, and `pending` otherwise. In `granted` and `memory` mode, without a key and on the server, `getStatus`
SHALL read `not-required`, and `grant` and `revoke` SHALL load nothing and call nothing on
PostHog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a choice

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the status is read before any grant or revoke
- **THEN** it is `pending` and the SDK module was not loaded
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and loads nothing before a choice in opt-in mode"

#### Scenario: a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** consent is granted twice
- **THEN** the SDK module is loaded and initialised once, PostHog is opted in with no opt-in
  event, the grant is recorded and the status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant loads PostHog once, opts it in without an opt-in event and reads granted"

#### Scenario: a grant from an earlier visit

- **GIVEN** a key, the consent mode `opt-in` and a grant recorded by an earlier visit
- **WHEN** the status is read
- **THEN** it is `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant from an earlier visit"

#### Scenario: a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked, and an error is captured after it
- **THEN** PostHog is opted out, then reset with a new device id, the record is gone, the error
  never reaches PostHog and the status reads `denied`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke opts PostHog out, resets it with a new device id, stops it and reads denied"

#### Scenario: a grant after a revoke

- **GIVEN** a key, the consent mode `opt-in`, a grant and a revoke
- **WHEN** consent is granted again
- **THEN** PostHog is opted in again, the SDK module was loaded and initialised once, and the
  status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grants again after a revoke with the SDK it already loaded"

#### Scenario: a revoke and a grant during a load

- **GIVEN** a key, the consent mode `opt-in` and a grant recorded by an earlier visit, so the SDK
  loads at start
- **WHEN** consent is revoked and then granted before the load ends
- **THEN** PostHog is not opted out, the grant stays recorded and the status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "keeps a grant made while a revoke waits for the load"

#### Scenario: a mode that asks no consent

- **GIVEN** a key and the consent mode `granted`, then `memory`
- **WHEN** consent is granted, revoked and read
- **THEN** PostHog receives no consent call and the status reads `not-required`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode"

#### Scenario: no client

- **GIVEN** the consent mode `opt-in` and no key, then a key and no `window`
- **WHEN** consent is granted, revoked and read
- **THEN** nothing throws, the SDK module is never loaded and the status reads `not-required`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key"
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required on the server"

#### Scenario: the composition root

- **GIVEN** a key, the consent mode `opt-in` and the SDK replaced at its module
- **WHEN** consent is granted through the barrel's `consent`
- **THEN** PostHog is opted in
- **Test:** `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"
