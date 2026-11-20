# Delta: apps/mobile

> **Change:** `2026-11-20-posthog-privacy-follow-ups`

## MODIFIED Requirements

### Requirement: MOBILE-53 — Each consent mode maps onto the SDK's options

The mobile app SHALL construct no PostHog client in `opt-in` mode until consent is granted,
through the consent API (MOBILE-55) or by a grant from an earlier launch held in the consent
storage of MOBILE-54, which constructs it at launch and opts it in, a failure of that opt-in
rejecting nothing and leaving it opted out; it SHALL construct it with `defaultOptIn: false` and
that consent storage as its `customStorage`, so it captures and stores nothing until it is opted
in. In `memory` mode it SHALL construct PostHog with `persistence: 'memory'`, so it captures but
keeps nothing on the device. Each mode adds nothing else to the `granted` options.

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

#### Scenario: a launch whose opt-in fails

- **GIVEN** a key, the consent mode `opt-in`, a grant stored by an earlier launch and an SDK whose
  opt-in rejects
- **WHEN** the client module loads
- **THEN** no rejection is left unhandled
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "rejects nothing when the launch fails to opt in again"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is constructed
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: MOBILE-54 — The consent storage writes to the device only after a grant

The mobile app SHALL give PostHog, in `opt-in` mode, a storage that keeps nothing while consent is
not granted, reading no value and dropping every value it is handed; on a grant writes a grant
marker to the device's key-value storage, `keyValueStorage` of MOBILE-56, and once the device holds
it writes every later value there under its own prefix; when the device refuses the marker, keeps
the grant and every later value in memory for this launch only; reads the marker back at the next
launch; and on a revoke stops writing to the device, forgets every value it holds, waits for every
device write it already issued and then removes the marker and every key it wrote or read, going
on past a removal the device refuses, and SHALL write to the device again on a later grant.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a grant

- **GIVEN** a consent storage with no earlier grant
- **WHEN** PostHog writes a value and reads it back
- **THEN** it reads nothing back, and the device storage holds nothing
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps every value off the device before a grant"

#### Scenario: a grant

- **GIVEN** a consent storage with no earlier grant
- **WHEN** it is opened, and PostHog writes a value
- **THEN** the device storage holds the marker and the value under the storage's prefix
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes the grant marker and every later value to the device after a grant"

#### Scenario: a grant the device refuses

- **GIVEN** a consent storage whose device refuses the marker
- **WHEN** it is opened, and PostHog writes a value and reads it back
- **THEN** nothing throws, the storage reads as granted, the value reads back from memory, the
  device holds nothing and a new consent storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps the grant in memory for this launch when the device refuses it"

#### Scenario: the next launch

- **GIVEN** a grant and a value written by an earlier consent storage
- **WHEN** a new consent storage is created
- **THEN** it reads as granted and returns the stored value
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "reads a grant from an earlier launch back from the device"

#### Scenario: a revoke

- **GIVEN** a granted consent storage with values on the device
- **WHEN** it is closed, and PostHog writes another value
- **THEN** the device storage holds nothing, and the storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every value it wrote on a revoke and writes none after"

#### Scenario: a write in flight at a revoke

- **GIVEN** a granted consent storage with a device write still in flight
- **WHEN** it is closed, and the write then lands
- **THEN** the device storage holds nothing
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every key only after the writes it already issued land"

#### Scenario: a removal the device refuses

- **GIVEN** a granted consent storage with values on the device, whose device refuses the removal
  of one key
- **WHEN** it is closed
- **THEN** nothing throws, the other keys are removed and the storage reads as not granted
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "goes on removing the other keys when the device refuses one"

#### Scenario: a grant after a revoke

- **GIVEN** a consent storage granted, written to and closed, then handed a value
- **WHEN** it is opened again, and PostHog writes another value
- **THEN** the device holds the marker and the later value, and neither value of before the
  second grant
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes to the device again on a grant after a revoke"

### Requirement: MOBILE-55 — The consent API grants, revokes and reads the status

The mobile app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a key, `grant` SHALL open the consent storage, construct the client (MOBILE-49) and then
opt PostHog in; `revoke` SHALL close the consent storage, drop the client so later calls are
dropped (MOBILE-60), and opt it out, drop every event and log record it still queues and shut it
down, so nothing captured before the revoke is sent after it and its flush timers stop, a client
the launch built to restore a grant from an earlier launch included, a device storage that refuses
a removal included; a later grant SHALL construct a new client, which reads nothing the dropped one
stored; and `getStatus` SHALL read `granted` while the storage holds a grant, `denied` after a
revoke in the same launch, and `pending` otherwise. In `granted` and `memory` mode and without a
key, `getStatus` SHALL read `not-required`, and `grant` and `revoke` SHALL construct nothing and
call nothing on PostHog.

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
- **THEN** the device storage holds nothing, PostHog is opted out, its event and log queues are
  emptied before it is shut down, it is not reset, the error never reaches PostHog and the status
  reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, drops the client, opts it out, empties its queues, shuts it down and reads denied"

#### Scenario: a revoke the device storage fails

- **GIVEN** a key, the consent mode `opt-in`, a grant and a device storage that refuses every
  removal
- **WHEN** consent is revoked, and an error is captured after it
- **THEN** nothing throws, PostHog is opted out and shut down, the error never reaches PostHog and
  the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke whose storage removals fail still stops the client and reads denied"

#### Scenario: a revoke while the launch restores an earlier grant

- **GIVEN** a key, the consent mode `opt-in` and a grant from an earlier launch, still being read
  back
- **WHEN** consent is revoked before that read ends
- **THEN** the client the launch builds is opted in and then opted out, the device holds no grant
  and the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke while the launch restores an earlier grant leaves PostHog opted out"

#### Scenario: a grant after a revoke

- **GIVEN** a key, the consent mode `opt-in`, a grant and a revoke
- **WHEN** consent is granted again
- **THEN** a second client is constructed and opted in, and the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke constructs a new client and opts it in"

#### Scenario: what the dropped client stored

- **GIVEN** a key, the consent mode `opt-in`, a grant and a client that writes its state while it
  shuts down
- **WHEN** consent is revoked and granted again
- **THEN** the new client reads nothing back from the consent storage
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke starts a client that reads nothing the dropped one stored"

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
