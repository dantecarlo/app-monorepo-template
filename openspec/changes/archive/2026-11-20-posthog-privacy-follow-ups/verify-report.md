# Verify report: 2026-11-20-posthog-privacy-follow-ups

> **Verified:** 2026-11-20 at `fc3eae3`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| WEB-52 | a page URL with a token | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "drops the query and the fragment of a page URL" | green |
| WEB-52 | a secret in a path segment | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "replaces a path segment that reads as a secret" | red, then green |
| WEB-52 | route names, slugs and short ids | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keeps route names, word slugs and short ids in the path" | green, a pin |
| WEB-52 | an event and its person | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "scrubs every URL property of an event and of its person" | green |
| WEB-52 | heatmap data | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keys heatmap points by the scrubbed URL" | green |
| WEB-52 | other properties | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "leaves every other property untouched" | green |
| WEB-52 | a dropped event | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "passes a dropped event through as dropped" | green |
| WEB-57 | before a choice | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and loads nothing before a choice in opt-in mode" | green |
| WEB-57 | a grant | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant loads PostHog once, opts it in without an opt-in event and reads granted" | green, the flags assertion a pin |
| WEB-57 | a grant from an earlier visit | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant from an earlier visit" | green |
| WEB-57 | a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke opts PostHog out, resets it with a new device id, stops it and reads denied" | green |
| WEB-57 | no flags after a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke pauses the flags before the reset, so it requests none" | red, then green |
| WEB-57 | a call during a revoke's load | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "drops every call made after a revoke while the SDK loads" | green |
| WEB-57 | a grant while the browser blocks site data | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant while the browser blocks site data" | green |
| WEB-57 | a grant after a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grants again after a revoke with the SDK it already loaded" | green |
| WEB-57 | the flags after a grant that follows a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke resumes the flags and reloads them once" | red, then green |
| WEB-57 | a revoke and a grant during a load | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "keeps a grant made while a revoke waits for the load" | green |
| WEB-57 | a mode that asks no consent | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode" | green |
| WEB-57 | no client | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key" | green |
| WEB-57 | no client | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required on the server" | green |
| WEB-57 | the composition root | `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |
| WEB-62 | the SDK loading | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "hands the calls made while PostHog loads to it in order, scrubbed" | green |
| WEB-62 | a held call that throws | `apps/web/src/lib/posthog/__tests__/deferredClient.helper.test.ts` › "runs each held call on its own when one throws" | red, then green |
| WEB-62 | a full queue | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the oldest call when the queue is full" | green |
| WEB-62 | a failed load | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the held calls when PostHog fails to load" | green |
| WEB-62 | before a grant | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant" | green |
| WEB-85 | a switch from `granted` | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "removes what PostHog stored before at an opt-in start with no grant" | red, then green |
| WEB-85 | a recorded grant | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps what PostHog stored at an opt-in start after a grant" | green, a pin |
| WEB-85 | a mode that asks no consent | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps what PostHog stored outside opt-in mode" | green, a pin |
| WEB-85 | a cookie on a parent domain | `apps/web/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "expires the cookie PostHog set on a parent domain" | red (no unit), then green |
| WEB-85 | blocked site data | `apps/web/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "throws nothing when the browser blocks site data" | red (no unit), then green |
| MOBILE-53 | `opt-in` before a grant | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs no client in opt-in mode before a grant" | green |
| MOBILE-53 | `opt-in` | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out, writing through the consent storage" | green |
| MOBILE-53 | a grant from an earlier launch | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "opts in at launch after a grant from an earlier launch" | green |
| MOBILE-53 | a launch whose opt-in fails | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "rejects nothing when the launch fails to opt in again" | red, then green |
| MOBILE-53 | `memory` | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence" | green |
| MOBILE-54 | before a grant | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps every value off the device before a grant" | red, then green |
| MOBILE-54 | a grant | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes the grant marker and every later value to the device after a grant" | red, then green |
| MOBILE-54 | a grant the device refuses | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "keeps the grant in memory for this launch when the device refuses it" | red, then green |
| MOBILE-54 | the next launch | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "reads a grant from an earlier launch back from the device" | green |
| MOBILE-54 | a revoke | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every value it wrote on a revoke and writes none after" | green |
| MOBILE-54 | a write in flight at a revoke | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "removes every key only after the writes it already issued land" | red, then green |
| MOBILE-54 | a removal the device refuses | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "goes on removing the other keys when the device refuses one" | red, then green |
| MOBILE-54 | a grant after a revoke | `apps/mobile/src/lib/posthog/__tests__/consentStorage.adapter.test.ts` › "writes to the device again on a grant after a revoke" | red, then green |
| MOBILE-55 | before a choice | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and constructs no client before a choice in opt-in mode" | green |
| MOBILE-55 | a grant | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant constructs the client once, opens the consent storage, opts PostHog in and reads granted" | green |
| MOBILE-55 | the client's first write | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant opens the consent storage before it constructs the client, so its first write reaches the device" | red, then green |
| MOBILE-55 | a revoke | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, drops the client, opts it out, empties its queues, shuts it down and reads denied" | red, then green |
| MOBILE-55 | a revoke the device storage fails | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke whose storage removals fail still stops the client and reads denied" | red (no shutdown), then green |
| MOBILE-55 | a revoke while the launch restores an earlier grant | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke while the launch restores an earlier grant leaves PostHog opted out" | green |
| MOBILE-55 | a grant after a revoke | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke constructs a new client and opts it in" | green |
| MOBILE-55 | what the dropped client stored | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke starts a client that reads nothing the dropped one stored" | green; red against the storage of `9df3979` |
| MOBILE-55 | a mode that asks no consent | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode" | green |
| MOBILE-55 | no key | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key" | green |
| MOBILE-55 | the composition root | `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |

Each red was seen for its stated reason before its fix: the held call's error rejected the
start; the reset token stayed in the path; `set_config` was never called; the `posthog-js` values
stayed at the opt-in start; the consent storage read a value back before a grant, wrote a held
value after it, rejected on a refused marker and a refused removal, removed a key before a write
already issued landed, and wrote a value held after a revoke on the next grant; the revoke called
no `setPersistedProperty` and no `shutdown`; the client's first write was dropped because the
grant constructed it before it opened the storage; and, with the `.catch` taken out, the launch
restore left one unhandled rejection. The two tests of the new `sdkStorage.adapter.ts` failed on
the missing unit first; the parent-domain one was then mutation-checked: with the expiry on the
host only, it fails.

The scenario "a revoke the device storage fails" went half green with T5: the storage stopped
rejecting, so the revoke went on to opt the client out; it failed on the missing shutdown until
T6. The scenario "what the dropped client stored" was green when written, after T5; with the
consent storage of `9df3979` put back it fails, the new client reading the ids the dropped one
wrote.

## Checks

- `pnpm --filter @app/web test`: 134 files, 522 tests, green, 2026-11-20, after T4.
- `pnpm --filter @app/mobile test`: 91 files, 291 tests, green, 2026-11-20, after T6.
- `tsc --noEmit` in `apps/web` and in `apps/mobile`: exit 0.
- `eslint` over `src/lib/posthog` and `src/lib/observability` of both apps: exit 0, no new
  warning.
- `pnpm verify:tests`, `pnpm verify:english`: PASS.
- **A real-SDK scratch run** of `posthog-js` 1.450.0 under happy-dom, outside the repository,
  counted the `/flags` requests: one after a plain revoke, none after a revoke that pauses the
  flags first, one after the grant that resumes them. A second run listed what `granted` keeps
  for a key: the `ph_<key>_posthog` cookie and local storage, and `ph_<key>_posthog`,
  `ph_<key>_primary_window_exists` and `ph_<key>_session_registered_properties` in session
  storage.

## Gate

- `pnpm validate`: not run by this unit; the brief leaves it to the parent, one branch at a time
  on a shared machine.

## Not verified

- **What the SDKs send.** Every test replaces the SDK at its module; the shutdown of the dropped
  mobile client and its emptied queues are proven as the calls the adapter makes, and the SDK's
  behaviour behind them is read from the source of `@posthog/core` 1.68.0, which no test runs.
- **The switch to `opt-in` on mobile**, out of scope: see the proposal.
- **The web request queue at a revoke**, out of scope: see the proposal.
