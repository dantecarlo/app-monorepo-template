# Delta: apps/mobile

> **Change:** `2026-11-20-posthog-privacy-follow-ups`

## MODIFIED Requirements

### Requirement: MOBILE-53 — Each consent mode maps onto the SDK's options

The mobile app SHALL construct no PostHog client in `opt-in` mode until consent is granted,
through the consent API (MOBILE-55) or by a grant from an earlier launch held in the consent
storage of MOBILE-54, which constructs it at launch and opts it in, a failure of that opt-in
rejecting nothing and leaving it opted out; it SHALL construct it with `defaultOptIn: false` and
that consent storage as its `customStorage`, so it captures and stores nothing until it is opted
in. Every `opt-in` launch SHALL remove what posthog-react-native kept on the device when it
persisted on its own, as under `granted`: the files `.posthog-rn.json` and
`.posthog-rn-logs.json` of the document directory on a native platform, through
`expo-file-system`, which only `sdkStorage.adapter.ts` imports, and the keys of those names in the
device's key-value storage, keeping every other value and rejecting nothing; no other mode, and no
launch without a key, removes them. In `memory` mode it SHALL construct PostHog with `persistence: 'memory'`, so it captures but
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

#### Scenario: a switch from `granted`

- **GIVEN** a key, the consent mode `opt-in` and no grant from an earlier launch
- **WHEN** the client module loads
- **THEN** what PostHog stored on its own is removed, and no client is constructed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "removes what PostHog stored on its own at an opt-in launch"

#### Scenario: an `opt-in` launch after a grant

- **GIVEN** a key, the consent mode `opt-in` and a grant stored by an earlier launch
- **WHEN** the client module loads
- **THEN** the client is opted in again, and what PostHog stored on its own is removed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "removes what PostHog stored on its own at an opt-in launch after a grant"

#### Scenario: a mode that removes nothing

- **GIVEN** a key and the consent mode `granted`, then `memory`, then `opt-in` and no key
- **WHEN** the client module loads
- **THEN** nothing is removed
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps what PostHog stored outside opt-in mode and without a key"

#### Scenario: the files on a native platform

- **GIVEN** a native platform whose document directory holds both files, and a device storage that
  holds their keys, a consent storage value and an app value
- **WHEN** what PostHog stored on its own is removed
- **THEN** both files of the document directory are deleted, both keys are gone, and the other
  values stay
- **Test:** `apps/mobile/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "removes the files PostHog kept in the document directory on a native platform"

#### Scenario: no file to delete

- **GIVEN** a native platform whose document directory holds neither file
- **WHEN** what PostHog stored on its own is removed
- **THEN** no file is deleted and nothing rejects
- **Test:** `apps/mobile/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "deletes no file the document directory does not hold"

#### Scenario: a web bundle

- **GIVEN** a web bundle and a device storage that holds the keys of both files and an app value
- **WHEN** what PostHog stored on its own is removed
- **THEN** no file is read, both keys are gone and the app value stays
- **Test:** `apps/mobile/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "removes only the key-value storage in a web bundle"

#### Scenario: a removal the device refuses

- **GIVEN** a native platform whose file deletes and key removals all fail
- **WHEN** what PostHog stored on its own is removed
- **THEN** nothing rejects
- **Test:** `apps/mobile/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "rejects nothing when the device refuses a removal"

#### Scenario: `memory`

- **GIVEN** a key and the consent mode `memory`
- **WHEN** the client is constructed
- **THEN** its options are the `granted` ones with memory persistence
- **Test:** `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence"

### Requirement: MOBILE-54 — The consent storage writes to the device only after a grant

The mobile app SHALL give PostHog, in `opt-in` mode, a storage that keeps nothing while consent is
not granted, reading no value and dropping every value it is handed; on a grant removes PostHog's
two files under its prefix and every key a revoke could not remove, then writes a grant marker to
the device's key-value storage, `keyValueStorage` of MOBILE-56, and once the device holds it writes
every later value there under its own prefix; when the device refuses one of those removals or the
marker, keeps the grant and every later value in memory for this launch only, reading nothing from
the device; reads the marker back at the next launch; and on a revoke stops writing to the device,
forgets every value it holds, waits for every device write it already issued and then removes the
marker, PostHog's two files under its prefix whether or not this launch read them, and every key
it wrote or read, going on past a removal the device refuses and keeping it for the next grant,
and SHALL write to the device again on a later grant.

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

#### Scenario: PostHog's files on a revoke

- **GIVEN** a device that holds a marker and both of PostHog's files under the prefix, from an earlier launch, and a consent storage that read neither
- **WHEN** it is closed
- **THEN** the device holds neither the marker nor the files
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes the PostHog files under its prefix on a revoke, read or not"

#### Scenario: a grant on a device with no marker

- **GIVEN** a device that holds one of PostHog's files under the prefix and no marker
- **WHEN** the storage is opened
- **THEN** the file reads nothing and is gone, and the device holds the marker
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "clears the PostHog files under its prefix before a grant on a device with no marker"

#### Scenario: a key a revoke could not remove

- **GIVEN** a revoke whose device refused the removal of one of PostHog's files, and still refuses it
- **WHEN** the storage is opened, and PostHog writes another value
- **THEN** it reads as granted, the refused file reads nothing, the new value reads back from memory, and the device holds neither the marker nor the new value
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps a grant in memory while a key a revoke could not remove stays on the device"

#### Scenario: that key gone

- **GIVEN** a revoke whose device refused one removal once
- **WHEN** the storage is opened
- **THEN** the removal is made again, the file reads nothing, and the device holds the marker
- **Test:** `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes to the device again once the key a revoke could not remove goes"

### Requirement: MOBILE-55 — The consent API grants, revokes and reads the status

The mobile app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a key, `grant` SHALL open the consent storage, construct the client (MOBILE-49) and then
opt PostHog in; `revoke` SHALL drop the client at once, so later calls are dropped (MOBILE-60), a
call made while the storage closes included, and a launch's restore of an earlier grant still
reading it back constructs none; then opt it out, drop every event and log record it still queues
and shut it down, so nothing captured before the revoke is sent after it and its flush timers
stop, while it closes the consent storage, a device storage that refuses a removal included; a
later grant SHALL construct a new client, which reads nothing the dropped one stored and nothing an
earlier grant left under the consent prefix, a refused removal included; and `getStatus` SHALL read `granted` while the storage holds a grant, `denied` after a
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

#### Scenario: the client's first write

- **GIVEN** a key, the consent mode `opt-in` and a client that writes to its storage as it is
  constructed
- **WHEN** consent is granted
- **THEN** the device holds that write under the consent storage's prefix
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opens the consent storage before it constructs the client, so its first write reaches the device"

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

- **GIVEN** a key, the consent mode `opt-in` and a grant from an earlier launch, still being read back
- **WHEN** consent is revoked before that read ends
- **THEN** the launch constructs no client and opts nothing in, the device holds no grant and the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke while the launch restores an earlier grant keeps PostHog from starting"

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

#### Scenario: what the earlier launch stored, at a revoke during its restore

- **GIVEN** a key, the consent mode `opt-in` and a grant with both of PostHog's files from an earlier launch, still being read back
- **WHEN** consent is revoked before that read ends
- **THEN** the device holds neither the marker nor the files
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke during the launch restore removes what the earlier launch stored"

#### Scenario: a grant after that revoke

- **GIVEN** the same launch, after that revoke
- **WHEN** consent is granted
- **THEN** the new client reads nothing back from either file
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke during the launch restore reads nothing the earlier launch stored"

#### Scenario: what the earlier launch stored, at a revoke after its restore

- **GIVEN** a key, the consent mode `opt-in` and a grant with both of PostHog's files from an earlier launch, restored
- **WHEN** consent is revoked
- **THEN** the device holds neither file
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke after the launch settled removes what the earlier launch stored"

#### Scenario: a re-grant after a refused removal

- **GIVEN** a launch that restored an earlier grant and a revoke whose device refuses the removal of PostHog's events file
- **WHEN** consent is granted again
- **THEN** the new client reads nothing back from either file and the status reads `granted`
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a re-grant in the same launch after a refused removal reads nothing from before the revoke"

#### Scenario: a call while the storage closes

- **GIVEN** a key, the consent mode `opt-in`, a grant and a device that holds every removal
- **WHEN** consent is revoked, and an error is captured before the removals end
- **THEN** the status reads `denied` and the error never reaches PostHog
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a call made while the revoke closes the storage never reaches PostHog"

#### Scenario: an opt-in launch after a grant

- **GIVEN** a key, the consent mode `opt-in` and a grant with both of PostHog's files from an earlier launch
- **WHEN** the client module loads
- **THEN** the client reads both files back, and the device keeps them and the marker
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "an opt-in launch after a grant keeps the consent storage values"

#### Scenario: what a revoked earlier launch left

- **GIVEN** a key, the consent mode `opt-in` and both of PostHog's files under the prefix with no marker
- **WHEN** consent is granted
- **THEN** the new client reads nothing back from either file
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a later launch that grants reads nothing a revoked earlier launch left on the device"

#### Scenario: one file a revoked earlier grant left

- **GIVEN** a key, the consent mode `opt-in` and PostHog's events file under the prefix with no marker
- **WHEN** consent is granted
- **THEN** the new client reads nothing back from it
- **Test:** `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant reads nothing a revoked earlier grant left under the consent prefix"

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

#### Scenario: a revoke through the composition root

- **GIVEN** a key, the consent mode `opt-in`, the shared stand-in of the SDK and a grant
- **WHEN** consent is revoked through the barrel's `consent`
- **THEN** the client is shut down and the status reads `denied`
- **Test:** `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "revokes through the barrel and shuts the client down on the shared stand-in"
