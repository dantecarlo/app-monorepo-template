# Delta: apps/mobile

> **Change:** `2026-11-18-posthog-deferred-client`

## ADDED Requirements

### Requirement: MOBILE-57 — PostHog calls made while no client exists are dropped

The mobile app's PostHog observability adapter SHALL drop every call while the app holds no
PostHog client, without a key and in `opt-in` mode before a grant and after a revoke, and SHALL
hold none of them for a later client.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** an error is captured, and consent is then granted
- **THEN** a client is constructed and its exception capture receives nothing
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant"

## MODIFIED Requirements

### Requirement: MOBILE-49 — The PostHog client is constructed only when it may run

The mobile app SHALL construct its one PostHog client only when `EXPO_PUBLIC_POSTHOG_KEY` is set:
at launch in `granted` and `memory` mode, and in `opt-in` mode only once consent is granted
(MOBILE-53, MOBILE-55), never holding more than one client; it sends to
`EXPO_PUBLIC_POSTHOG_HOST` or, without it, to the US ingestion host. Without a key it SHALL
construct none, so every observability call is a no-op and no request leaves the app.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no key

- **GIVEN** no PostHog key
- **WHEN** the client module loads and is started
- **THEN** no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not construct a client without a key"

#### Scenario: a key and a host

- **GIVEN** a key and a host
- **WHEN** the client module loads and is started again
- **THEN** one client is constructed with that key and that host
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs one client with the key and the host from the environment"

#### Scenario: a key and no host

- **GIVEN** a key and no host
- **WHEN** the client module loads
- **THEN** the client sends to `https://us.i.posthog.com`
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host"

### Requirement: MOBILE-53 — Each consent mode maps onto the SDK's options

The mobile app SHALL construct no PostHog client in `opt-in` mode until consent is granted,
through the consent API (MOBILE-55) or by a grant from an earlier launch held in the consent
storage of MOBILE-54, which constructs it at launch and opts it in; it SHALL construct it with
`defaultOptIn: false` and that consent storage as its `customStorage`, so it captures and stores
nothing until it is opted in. In `memory` mode it SHALL construct PostHog with
`persistence: 'memory'`, so it captures but keeps nothing on the device. Each mode adds nothing
else to the `granted` options.

**Evidence:** written at apply time, when the code exists.

#### Scenario: `opt-in` before a grant

- **GIVEN** a key, the consent mode `opt-in` and no grant from an earlier launch
- **WHEN** the client module loads
- **THEN** no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs no client in opt-in mode before a grant"

#### Scenario: `opt-in`

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the client is started, as a grant starts it
- **THEN** its options are the `granted` ones opted out by default and writing through the
  consent storage
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out, writing through the consent storage"

#### Scenario: a grant from an earlier launch

- **GIVEN** a key, the consent mode `opt-in` and a grant stored by an earlier launch
- **WHEN** the client module loads
- **THEN** one client is constructed and opted in
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "opts in at launch after a grant from an earlier launch"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is constructed
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: MOBILE-55 — The consent API grants, revokes and reads the status

The mobile app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a key, `grant` SHALL construct the client (MOBILE-49), open the consent storage and
then opt PostHog in; `revoke` SHALL close the consent storage, drop the client so later calls are
dropped (MOBILE-57), and opt it out and reset it keeping no property, the device id included, and
a later grant SHALL construct a new client; and `getStatus` SHALL read `granted` while the storage
holds a grant, `denied` after a revoke in the same launch, and `pending` otherwise. In `granted`
and `memory` mode and without a key, `getStatus` SHALL read `not-required`, and `grant` and
`revoke` SHALL construct nothing and call nothing on PostHog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a choice

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the status is read before any grant or revoke
- **THEN** it is `pending`, no client was constructed and the device holds no grant
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and constructs no client before a choice in opt-in mode"

#### Scenario: a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** consent is granted twice
- **THEN** one client is constructed, the consent storage holds a grant, PostHog is opted in and
  the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant constructs the client once, opens the consent storage, opts PostHog in and reads granted"

#### Scenario: a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked, and an error is captured after it
- **THEN** the device storage holds nothing, PostHog is opted out and reset keeping no property,
  the error never reaches PostHog and the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, drops the client, opts it out, resets it and reads denied"

#### Scenario: a grant after a revoke

- **GIVEN** a key, the consent mode `opt-in`, a grant and a revoke
- **WHEN** consent is granted again
- **THEN** a second client is constructed and opted in, and the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke constructs a new client and opts it in"

#### Scenario: a mode that asks no consent

- **GIVEN** a key and the consent mode `granted`, then `memory`
- **WHEN** consent is granted, revoked and read
- **THEN** PostHog receives no consent call and the status reads `not-required`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode"

#### Scenario: no key

- **GIVEN** the consent mode `opt-in` and no key
- **WHEN** consent is granted, revoked and read
- **THEN** nothing throws, no client is constructed and the status reads `not-required`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key"

#### Scenario: the composition root

- **GIVEN** a key, the consent mode `opt-in` and the SDK replaced at its module
- **WHEN** consent is granted through the barrel's `consent`
- **THEN** PostHog is opted in
- **Test:** `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"
