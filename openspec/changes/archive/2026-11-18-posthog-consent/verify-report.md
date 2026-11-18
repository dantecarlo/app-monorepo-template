# Verify report: 2026-11-18-posthog-consent

> **Verified:** 2026-11-18 at `a299302`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| CORE-27 | the statuses | `packages/core/src/ports/consent/__tests__/consentStatus.type.test.ts` › "names the four consent statuses" | green |
| CORE-27 | an app implements the port | `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |
| WEB-51 | recording and autocapture | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session recording and autocapture off" | green |
| WEB-51 | automatic exception capture | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures unhandled errors but not console errors" | green |
| WEB-51 | every event is scrubbed | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "runs the URL scrub before every event" | green |
| WEB-51 | every consent mode | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the privacy defaults under every consent mode" | green |
| WEB-55 | no setting | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the granted options when no consent mode is set" | green |
| WEB-55 | `granted` named | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts the granted mode with the same options as no setting" | green |
| WEB-55 | reading the value | `apps/web/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads an absent or empty consent mode as granted" | green |
| WEB-55 | reading the value | `apps/web/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads each consent mode it knows" | green |
| WEB-55 | an unknown value | `apps/web/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "throws a configuration error for an unknown consent mode" | green |
| WEB-55 | an unknown value | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "refuses to load with an unknown consent mode, on the server too" | green |
| WEB-56 | `opt-in` | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out of capture and persistence" | green |
| WEB-56 | `memory` | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence" | green |
| WEB-57 | before a choice | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and opts nothing in before a choice in opt-in mode" | green |
| WEB-57 | a grant | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opts PostHog in without an opt-in event and reads granted" | green |
| WEB-57 | a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke opts PostHog out, resets it with a new device id and reads denied" | green |
| WEB-57 | a mode that asks no consent | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode" | green |
| WEB-57 | no client | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key" | green |
| WEB-57 | no client | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required on the server" | green |
| WEB-57 | the composition root | `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |
| MOBILE-50 | replay and lifecycle events | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session replay and lifecycle events off" | green |
| MOBILE-50 | automatic exception capture on native | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures uncaught exceptions and unhandled rejections on native, not console errors" | green |
| MOBILE-50 | automatic exception capture on web | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "leaves uncaught exception capture off in a web bundle" | green |
| MOBILE-50 | every consent mode | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the privacy defaults under every consent mode" | green |
| MOBILE-52 | no setting | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps the granted options when no consent mode is set" | green |
| MOBILE-52 | `granted` named | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts the granted mode with the same options as no setting" | green |
| MOBILE-52 | reading the value | `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads an absent or empty consent mode as granted" | green |
| MOBILE-52 | reading the value | `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "reads each consent mode it knows" | green |
| MOBILE-52 | an unknown value | `apps/mobile/src/lib/posthog/__tests__/resolveConsentMode.helper.test.ts` › "throws a configuration error for an unknown consent mode" | green |
| MOBILE-52 | an unknown value | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "refuses to load with an unknown consent mode" | green |
| MOBILE-53 | `opt-in` | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out, writing through the consent storage" | green |
| MOBILE-53 | a grant from an earlier launch | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "opts in at launch after a grant from an earlier launch" | green |
| MOBILE-53 | `memory` | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence" | green |
| MOBILE-54 | before a grant | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps every value off the device before a grant" | green |
| MOBILE-54 | a grant | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes the held values and every later one to the device after a grant" | green |
| MOBILE-54 | the next launch | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "reads a grant from an earlier launch back from the device" | green |
| MOBILE-54 | a revoke | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every value it wrote on a revoke and writes none after" | green |
| MOBILE-55 | before a choice | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and opts nothing in before a choice in opt-in mode" | green |
| MOBILE-55 | a grant | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opens the consent storage, opts PostHog in and reads granted" | green |
| MOBILE-55 | a revoke | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, opts PostHog out, resets it and reads denied" | green |
| MOBILE-55 | a mode that asks no consent | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode" | green |
| MOBILE-55 | no key | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key" | green |
| MOBILE-55 | the composition root | `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |

The observability port contract suites of both PostHog adapters ran unchanged and green
(WEB-54, MOBILE-51).

## Red before green

| Rule | Red observed |
| ---- | ------------ |
| CORE-27 statuses | `expected undefined to deeply equal { DENIED: 'denied', …(3) }`: the barrel exported no `ConsentStatusEnum` |
| WEB-55, MOBILE-52 resolver | the module `resolveConsentMode.helper` did not exist |
| WEB-55, MOBILE-52 unknown value | `promise resolved "{ posthogClient: … }" instead of rejecting`: an unknown mode loaded |
| WEB-56 `opt-in`, `memory` | `expected { …(6) } to deeply equal { …(8) }` and `{ …(7) }`: no mode added an option |
| MOBILE-53 `opt-in`, `memory` | `expected undefined to be defined` (no consent storage) and `expected { …(4) } to strictly equal { …(5) }` |
| MOBILE-53 earlier grant | `expected "vi.fn()" to be called once, but got 0 times`: nothing opted in at launch |
| MOBILE-54 consent storage | against a write-through probe: `expected "setItem" to not be called at all, but actually been called 1 times`, and a revoke left the value on the device |
| WEB-57, MOBILE-55 consent API | `Cannot read properties of undefined (reading 'grant')`: the barrel exported no `consent`, and the adapter module did not exist |
| WEB-55, MOBILE-52 default `granted` | none: the default keeps the earlier options, so those tests pin the behaviour and passed from the start |

## The real SDK, outside the tests

A scratch run of the installed `posthog-js` 1.450.0 in happy-dom, its network stubbed, with the
options of each mode (not committed):

| Mode | After `init` and a capture | After a grant | After a revoke |
| ---- | -------------------------- | ------------- | -------------- |
| `granted` | a `ph_<key>_posthog` cookie, local and session storage; capturing | — | — |
| `opt-in` | no cookie, no local or session storage; not capturing; `pending` | the cookie, local and session storage; capturing; `granted` | no cookie, no local or session storage; not capturing; `pending` |
| `memory` | no cookie, no local or session storage; capturing | — | — |

Every mode requested the remote config and `/flags` at start, `opt-in` before any grant too.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `a299302`.
- `pnpm --filter @app/web build`: exit 0; with a key and `NEXT_PUBLIC_POSTHOG_CONSENT=opt-in`,
  exit 0; with a key and `NEXT_PUBLIC_POSTHOG_CONSENT=bogus`, exit 1, the prerender failing on
  `NEXT_PUBLIC_POSTHOG_CONSENT must be one of granted, memory, opt-in; got "bogus".`
- `pnpm --filter @app/mobile export:web`: exit 0; with a key and
  `EXPO_PUBLIC_POSTHOG_CONSENT=opt-in`, exit 0, the bundle carrying the consent storage.

## Not verified

- What `posthog-react-native` writes to the device: the app's tests replace it at its module. Its
  writes in `opt-in` mode go through the consent storage, whose test reads the device storage it
  writes to.
- A real device or browser build sending events to PostHog.

## Follow-up: the key-value storage seam

> **Verified:** 2026-11-18 at `e43870d`

The merge of origin/main into the branch brought `local/dependency-seam` and
`verify:dependency-seams`, which failed with 4 problems: the consent storage and three tests imported
AsyncStorage, whose seam was empty until F.8 unit 4. The seam is built here instead of an allowlist
entry.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| CORE-28 | a value and a missing key | `packages/core/src/ports/storage/__tests__/createMemoryKeyValueStorage.helper.test.ts` › "reads back what it was handed, and null for a key it never held" | green |
| CORE-28 | a removed key | `packages/core/src/ports/storage/__tests__/createMemoryKeyValueStorage.helper.test.ts` › "removes a key" | green |
| CORE-28 | two storages | `packages/core/src/ports/storage/__tests__/createMemoryKeyValueStorage.helper.test.ts` › "keeps the values of each storage apart" | green |
| MOBILE-56 | a value on the device | `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "writes, reads and removes a value on the device storage" | green |
| MOBILE-56 | a missing key | `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "reads null for a key the device storage does not hold" | green |
| MOBILE-56 | the seam | Not covered — `pnpm verify:dependency-seams` and `local/dependency-seam` hold it | gate green |
| MOBILE-54 | every scenario, through the port | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts`, its four tests | green |
| MOBILE-55 | a grant, a revoke, through the port | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts`, its five tests | green |

| Rule | Red observed |
| ---- | ------------ |
| CORE-28 | `TypeError: createMemoryKeyValueStorage is not a function`: the barrel exported none |
| MOBILE-56 | the module `@/lib/storage/keyValueStorage.adapter` did not exist |
| MOBILE-54, MOBILE-55, MOBILE-53 through the port | with the tests replacing `@/lib/storage`, `expected null to be 'true'` twice and `expected "vi.fn()" to be called once, but got 0 times`: the consent storage still wrote to AsyncStorage |
| The seam | `verify-dependency-seams: 4 problem(s)`, each `imports @react-native-async-storage/async-storage outside its seam` |

### Follow-up gate

- `pnpm verify:dependency-seams`: PASS, 0 problems; the theme and language configs stay on their
  frozen allowlist entries.
- GATES_PENDING
