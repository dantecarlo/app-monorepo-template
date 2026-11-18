# Delta: apps/mobile

> **Change:** `2026-11-18-posthog-consent`

## ADDED Requirements

### Requirement: MOBILE-52 — One setting chooses the PostHog consent mode

The mobile app SHALL read its PostHog consent mode from `EXPO_PUBLIC_POSTHOG_CONSENT` through its
constant file: `granted` when the value is absent or empty, and `granted`, `opt-in` or `memory`
when it names one, constructing PostHog in `granted` mode with the options it had before this
setting existed. It SHALL throw a configuration error that names the variable and the accepted
values when, with a key set, the value names anything else.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no setting

- **GIVEN** a key and no consent mode
- **WHEN** the client is constructed
- **THEN** its options are exactly the ones it had before the setting existed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the granted options when no consent mode is set"

#### Scenario: `granted` named

- **GIVEN** a key and the consent mode `granted`
- **WHEN** the client is constructed
- **THEN** its options equal those of no setting
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts the granted mode with the same options as no setting"

#### Scenario: reading the value

- **GIVEN** an absent, an empty and each known value
- **WHEN** the mode is resolved
- **THEN** absent and empty read as `granted`, and each known value as itself
- **Test:** `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads an absent or empty consent mode as granted"
- **Test:** `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads each consent mode it knows"

#### Scenario: an unknown value

- **GIVEN** an unknown value
- **WHEN** the mode is resolved, and when the client module loads with a key
- **THEN** each throws an error naming `EXPO_PUBLIC_POSTHOG_CONSENT`, the value and the three
  accepted modes, and no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "throws a configuration error for an unknown consent mode"
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "refuses to load with an unknown consent mode"

### Requirement: MOBILE-53 — Each consent mode maps onto the SDK's options

The mobile app SHALL construct PostHog in `opt-in` mode with `defaultOptIn: false` and the
consent storage of MOBILE-54 as its `customStorage`, so it captures nothing and stores nothing
until consent is granted, and SHALL opt it in at launch when that storage holds a grant from an
earlier launch; and in `memory` mode with `persistence: 'memory'`, so it captures but keeps
nothing on the device. Each mode adds nothing else to the `granted` options.

**Evidence:** written at apply time, when the code exists.

#### Scenario: `opt-in`

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the client is constructed
- **THEN** its options are the `granted` ones opted out by default and writing through the
  consent storage
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out, writing through the consent storage"

#### Scenario: a grant from an earlier launch

- **GIVEN** a key, the consent mode `opt-in` and a grant stored by an earlier launch
- **WHEN** the client module loads
- **THEN** the client is opted in
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "opts in at launch after a grant from an earlier launch"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is constructed
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: MOBILE-54 — The consent storage writes to the device only after a grant

The mobile app SHALL give PostHog, in `opt-in` mode, a storage that keeps every value it is
handed in memory until consent is granted; on a grant writes a grant marker, the held values and
every later value to AsyncStorage under its own prefix; reads the marker back at the next launch;
and on a revoke stops writing to the device and removes the marker and every key it wrote or
read.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a grant

- **GIVEN** a consent storage with no earlier grant
- **WHEN** PostHog writes a value and reads it back
- **THEN** it reads the value, and AsyncStorage holds nothing
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps every value off the device before a grant"

#### Scenario: a grant

- **GIVEN** a consent storage holding a value written before a grant
- **WHEN** it is opened, and PostHog writes another value
- **THEN** AsyncStorage holds the marker and both values under the storage's prefix
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes the held values and every later one to the device after a grant"

#### Scenario: the next launch

- **GIVEN** a grant and a value written by an earlier consent storage
- **WHEN** a new consent storage is created
- **THEN** it reads as granted and returns the stored value
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "reads a grant from an earlier launch back from the device"

#### Scenario: a revoke

- **GIVEN** a granted consent storage with values on the device
- **WHEN** it is closed, and PostHog writes another value
- **THEN** AsyncStorage holds nothing, and the storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every value it wrote on a revoke and writes none after"

### Requirement: MOBILE-55 — The consent API grants, revokes and reads the status

The mobile app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a client, `grant` SHALL open the consent storage and then opt PostHog in; `revoke`
SHALL close the consent storage and then opt PostHog out and reset it; and `getStatus` SHALL read
`granted` while the storage holds a grant, `denied` after a revoke in the same launch, and
`pending` otherwise. In `granted` and `memory` mode and without a key, `getStatus` SHALL read
`not-required`, and `grant` and `revoke` SHALL call nothing on PostHog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a choice

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the status is read before any grant or revoke
- **THEN** it is `pending` and PostHog was not opted in
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and opts nothing in before a choice in opt-in mode"

#### Scenario: a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** consent is granted
- **THEN** the consent storage holds a grant, PostHog is opted in and the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opens the consent storage, opts PostHog in and reads granted"

#### Scenario: a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked
- **THEN** AsyncStorage holds nothing, PostHog is opted out and reset, and the status reads
  `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, opts PostHog out, resets it and reads denied"

#### Scenario: a mode that asks no consent

- **GIVEN** a key and the consent mode `granted`, then `memory`
- **WHEN** consent is granted, revoked and read
- **THEN** PostHog receives no consent call and the status reads `not-required`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode"

#### Scenario: no key

- **GIVEN** the consent mode `opt-in` and no key
- **WHEN** consent is granted, revoked and read
- **THEN** nothing throws, no client exists and the status reads `not-required`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key"

#### Scenario: the composition root

- **GIVEN** a key, the consent mode `opt-in` and the SDK replaced at its module
- **WHEN** consent is granted through the barrel's `consent`
- **THEN** PostHog is opted in
- **Test:** `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"

## MODIFIED Requirements

### Requirement: MOBILE-50 — The PostHog client starts with privacy defaults

The mobile app SHALL construct PostHog, under every consent mode, with session replay off, app
lifecycle events off, console errors off, unhandled rejections captured, and uncaught exceptions
captured only on native, never in a web bundle.

**Evidence:** `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:10-19`, `apps/mobile/src/lib/posthog/posthogClient.constant.ts:15-28`

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

#### Scenario: every consent mode

- **GIVEN** a key and each consent mode
- **WHEN** the client is constructed
- **THEN** session replay, lifecycle events and console errors are off, and unhandled rejections
  and native uncaught exceptions are captured
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the privacy defaults under every consent mode"
