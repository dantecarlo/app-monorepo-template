# Delta: apps/web

> **Change:** `2026-11-18-posthog-consent`

## ADDED Requirements

### Requirement: WEB-55 — One setting chooses the PostHog consent mode

The web app SHALL read its PostHog consent mode from `NEXT_PUBLIC_POSTHOG_CONSENT` through its
constant file: `granted` when the value is absent or empty, and `granted`, `opt-in` or `memory`
when it names one, initialising PostHog in `granted` mode with the options it had before this
setting existed. It SHALL throw a configuration error that names the variable and the accepted
values when, with a key set, the value names anything else, on the server too.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no setting

- **GIVEN** a key and no consent mode
- **WHEN** the client is initialised
- **THEN** its options are exactly the ones it had before the setting existed
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the granted options when no consent mode is set"

#### Scenario: `granted` named

- **GIVEN** a key and the consent mode `granted`
- **WHEN** the client is initialised
- **THEN** its options equal those of no setting
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts the granted mode with the same options as no setting"

#### Scenario: reading the value

- **GIVEN** an absent, an empty and each known value
- **WHEN** the mode is resolved
- **THEN** absent and empty read as `granted`, and each known value as itself
- **Test:** `apps/web/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads an absent or empty consent mode as granted"
- **Test:** `apps/web/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads each consent mode it knows"

#### Scenario: an unknown value

- **GIVEN** an unknown value
- **WHEN** the mode is resolved, and when the client module loads with a key in the browser and
  on the server
- **THEN** each throws an error naming `NEXT_PUBLIC_POSTHOG_CONSENT`, the value and the three
  accepted modes, and the SDK is never initialised
- **Test:** `apps/web/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "throws a configuration error for an unknown consent mode"
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "refuses to load with an unknown consent mode, on the server too"

### Requirement: WEB-56 — Each consent mode maps onto the SDK's options

The web app SHALL initialise PostHog in `opt-in` mode with `opt_out_capturing_by_default` and
`opt_out_persistence_by_default` set, so it captures nothing and stores nothing until consent is
granted, and in `memory` mode with `persistence: 'memory'`, so it captures but keeps no cookie,
local storage or session storage; each mode adds nothing else to the `granted` options.

**Evidence:** written at apply time, when the code exists.

#### Scenario: `opt-in`

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the client is initialised
- **THEN** its options are the `granted` ones with capture and persistence opted out by default
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out of capture and persistence"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is initialised
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: WEB-57 — The consent API grants, revokes and reads the status

The web app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a client, `grant` SHALL opt PostHog in without an `$opt_in` event; `revoke` SHALL opt
it out and then reset it with a new device id, which clears every value it stored and the stored
choice; and `getStatus` SHALL read `granted` after a grant, `denied` after a revoke on the same
page, and `pending` before any choice. In `granted` and `memory` mode, without a key and on the
server, `getStatus` SHALL read `not-required`, and `grant` and `revoke` SHALL call nothing on
PostHog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a choice

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the status is read before any grant or revoke
- **THEN** it is `pending` and PostHog was not opted in
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and opts nothing in before a choice in opt-in mode"

#### Scenario: a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** consent is granted
- **THEN** PostHog is opted in with no opt-in event and the status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opts PostHog in without an opt-in event and reads granted"

#### Scenario: a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked
- **THEN** PostHog is opted out, then reset with a new device id, and the status reads `denied`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke opts PostHog out, resets it with a new device id and reads denied"

#### Scenario: a mode that asks no consent

- **GIVEN** a key and the consent mode `granted`, then `memory`
- **WHEN** consent is granted, revoked and read
- **THEN** PostHog receives no consent call and the status reads `not-required`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode"

#### Scenario: no client

- **GIVEN** the consent mode `opt-in` and no key, then a key and no `window`
- **WHEN** consent is granted, revoked and read
- **THEN** nothing throws, PostHog receives nothing and the status reads `not-required`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key"
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required on the server"

#### Scenario: the composition root

- **GIVEN** a key, the consent mode `opt-in` and the SDK replaced at its module
- **WHEN** consent is granted through the barrel's `consent`
- **THEN** PostHog is opted in
- **Test:** `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"

## MODIFIED Requirements

### Requirement: WEB-51 — The PostHog client starts with privacy defaults

The web app SHALL initialise PostHog, under every consent mode, with session recording off, DOM
autocapture off (form inputs included), console errors off, unhandled errors and rejections
captured, and the URL scrub as its `before_send`.

**Evidence:** `apps/web/src/lib/posthog/posthogClient.adapter.ts:16-28`, `apps/web/src/lib/posthog/posthogClient.constant.ts:15-19`

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

#### Scenario: every consent mode

- **GIVEN** a key and each consent mode
- **WHEN** the client is initialised
- **THEN** recording, autocapture, dead clicks and console errors are off, unhandled errors and
  rejections are captured, and the URL scrub is its `before_send`
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the privacy defaults under every consent mode"
