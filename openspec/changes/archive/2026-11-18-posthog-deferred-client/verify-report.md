# Verify report: 2026-11-18-posthog-deferred-client

> **Verified:** 2026-11-18 at `96554ef`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| WEB-50 | no key | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "never loads PostHog without a key" | green |
| WEB-50 | a key and a host | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "loads and initialises PostHog once with the key and the host from the environment" | green |
| WEB-50 | a key and no host | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host" | green |
| WEB-50 | the server | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "never loads PostHog on the server" | green |
| WEB-50 | the initial client bundle | Not covered by a test — the built output below | proven on three builds |
| WEB-56 | `opt-in` before a grant | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not load PostHog in opt-in mode before a grant" | green |
| WEB-56 | `opt-in` | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out of capture and persistence" | green |
| WEB-56 | a grant from an earlier visit | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "loads PostHog at start in opt-in mode after a grant from an earlier visit" | green |
| WEB-56 | `memory` | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence" | green |
| WEB-57 | before a choice | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and loads nothing before a choice in opt-in mode" | green |
| WEB-57 | a grant | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant loads PostHog once, opts it in without an opt-in event and reads granted" | green |
| WEB-57 | a grant from an earlier visit | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant from an earlier visit" | green |
| WEB-57 | a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke opts PostHog out, resets it with a new device id, stops it and reads denied" | green |
| WEB-57 | a call during a revoke's load | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "drops every call made after a revoke while the SDK loads" | green |
| WEB-57 | a grant while the browser blocks site data | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant while the browser blocks site data" | green |
| WEB-57 | a grant after a revoke | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grants again after a revoke with the SDK it already loaded" | green |
| WEB-57 | a revoke and a grant during a load | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "keeps a grant made while a revoke waits for the load" | green |
| WEB-57 | a mode that asks no consent | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode" | green |
| WEB-57 | no client | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key" | green |
| WEB-57 | no client | `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required on the server" | green |
| WEB-57 | the composition root | `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |
| WEB-62 | the SDK loading | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "hands the calls made while PostHog loads to it in order, scrubbed" | green |
| WEB-62 | a full queue | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the oldest call when the queue is full" | green |
| WEB-62 | a failed load | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the held calls when PostHog fails to load" | green |
| WEB-62 | before a grant | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant" | green |
| MOBILE-49 | no key | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not construct a client without a key" | green |
| MOBILE-49 | a key and a host | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs one client with the key and the host from the environment" | green |
| MOBILE-49 | a key and no host | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host" | green |
| MOBILE-53 | `opt-in` before a grant | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs no client in opt-in mode before a grant" | green |
| MOBILE-53 | `opt-in` | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts opt-in mode opted out, writing through the consent storage" | green |
| MOBILE-53 | a grant from an earlier launch | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "opts in at launch after a grant from an earlier launch" | green |
| MOBILE-53 | `memory` | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "starts memory mode with memory persistence" | green |
| MOBILE-55 | before a choice | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and constructs no client before a choice in opt-in mode" | green |
| MOBILE-55 | a grant | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant constructs the client once, opens the consent storage, opts PostHog in and reads granted" | green |
| MOBILE-55 | a revoke | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke closes the consent storage, drops the client, opts it out, resets it and reads denied" | green |
| MOBILE-55 | a revoke while the launch restores an earlier grant | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke while the launch restores an earlier grant leaves PostHog opted out" | green |
| MOBILE-55 | a grant after a revoke | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke constructs a new client and opts it in" | green |
| MOBILE-55 | a mode that asks no consent | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode" | green |
| MOBILE-55 | no key | `apps/mobile/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key" | green |
| MOBILE-55 | the composition root | `apps/mobile/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default" | green |
| MOBILE-60 | before a grant | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant" | green |

The observability port contract of packages/tooling ran unchanged and green against both PostHog
adapters (WEB-54, MOBILE-51); the web harness now waits for the SDK load in `create`. The tests
that pin the requirements this change leaves as they are, WEB-48, WEB-49, WEB-51, WEB-55,
MOBILE-47, MOBILE-48, MOBILE-50 and MOBILE-52, ran green, the web ones on a started client.

## After the native review

The native review of `708e935` and `3d6ffa2` approved both, with advisory findings. Three were
fixed in `fbdfd6f` and `15a7106`, each against a test that ran first:

| Finding | Red observed, or why none |
| ------- | ------------------------- |
| A revoke waited for the load in flight before it stopped the client, so the calls held during that load reached PostHog | "drops every call made after a revoke while the SDK loads": `expected "vi.fn()" to not be called at all, but actually been called 1 times`, the error captured after the revoke |
| The status read `pending` after a grant when the browser blocks site data | "reads granted after a grant while the browser blocks site data": `expected 'pending' to be 'granted'` |
| Mobile: a revoke landing while the launch restores an earlier grant could leave PostHog opted in | none: the consent storage settles its first read before either the restore or the revoke goes on, and the restore asks first, so the revoke always opts out the client the restore built; the test pins it, and asserts the restore did opt in |
| Mobile: the pre-grant drop test called one method | none, a coverage gap: the test now reports a message, a breadcrumb, a user and a cleared user too |

The native review of `fbdfd6f`, raised for item 2, approved it with three advisory findings. Two said the
interrupted load now handed its client to every caller of `start`; `68ed6e3` hands it to the stop only,
against "stop forgets the client and the held calls, during a load too" and "stop hands over the loaded
client, or none while nothing has loaded", red first (`expected { receive: [Function Mock] } to be
undefined`). The third, that a grant after a revoke might read `pending`, does not hold: the grant
clears the revoke, and "grants again after a revoke with the SDK it already loaded" reads `granted`.

Two more are row F56 of `docs/INIT_AND_HARNESS_PLAN.md`: a dropped mobile client is not shut down,
and one held web call that throws loses the calls after it.

## Red before green

Each test ran against the code of `bcbf84c` first.

| Rule | Red observed |
| ---- | ------------ |
| `opt-in`: no SDK before a grant (web) | "does not load PostHog in opt-in mode before a grant" and "reads pending and loads nothing before a choice in opt-in mode": `expected "vi.fn()" to not be called at all, but actually been called 1 times`, the SDK module loaded with the client module |
| `opt-in`: no client before a grant (mobile) | "constructs no client in opt-in mode before a grant" and "reads pending and constructs no client before a choice in opt-in mode": `expected "vi.fn()" to not be called at all, but actually been called 1 times`, the constructor |
| A grant loads or constructs exactly once | the web and mobile grant tests: `expected "vi.fn()" to not be called at all, but actually been called 1 times` before the grant, the SDK already loaded or constructed at start; "a grant after a revoke constructs a new client and opts it in": `expected "vi.fn()" to be called 2 times, but got 1 times` |
| A revoke tears the client down and clears | the web and mobile revoke tests: `expected "vi.fn()" to not be called at all, but actually been called 1 times` with `[Error: after the revoke]`, a capture after the revoke reached the SDK |
| Captures before a grant are dropped | "drops every call in opt-in mode before a grant", web and mobile: `expected "vi.fn()" to not be called at all, but actually been called 1 times` with `[Error: before consent]` |
| Under `granted`, the queue flushes in order and drops its oldest | "hands the calls made while PostHog loads to it in order, scrubbed" and "drops the oldest call when the queue is full": `Test timed out in 5000ms`, the client module could not load before the SDK it imported statically |
| A failed load drops the held calls | "drops the held calls when PostHog fails to load": the client module failed to load with the SDK, `There was an error when mocking a module` |
| Without a key, nothing is ever loaded (web) | "never loads PostHog without a key", "never loads PostHog on the server" and the consent "without a key" and "on the server" tests: `expected "vi.fn()" to not be called at all, but actually been called 1 times` |
| Without a key, nothing is constructed (mobile) | none: the old client constructed nothing without a key; the test pins it |
| The deferred client, the grant record | the modules `deferredClient.helper` and `grantRecord.adapter` did not exist |
| A grant after a revoke reuses the loaded SDK (web) | `client.get_explicit_consent_status is not a function`; the rule held on the old code, which kept one client throughout |
| A revoke and a grant overlapping a load | `expected "vi.fn()" to not be called at all, but actually been called 1 times`: the old revoke opted out at once |

## The web bundle

`pnpm --filter @app/web build`, and a script outside the repository that reads the `<script src>`
chunks of each prerendered page (`index.html`, `login.html`) and finds the chunk that holds
`posthog-js` by two strings only it carries (`__ph_opt_in_out_`, `posthog-js`).

| Build | Chunks a page loads at start (index) | Bytes, raw / gzip | The `posthog-js` chunk |
| ----- | ------------------------------------ | ----------------- | ---------------------- |
| `bcbf84c`, no key | 14 | 1,414,313 / 426,674 | `2vzmm04ain3x-.js`, 374,461 / 122,873, among them |
| `708e935`, no key | 13 | 1,043,683 / 305,434 | `3-k0h-lnl_teh.js`, 371,455 / 121,613, not among them |
| `708e935`, a key, `opt-in` | 13 | 1,043,627 / 305,439 | `3-k0h-lnl_teh.js`, not among them |
| `708e935`, a key, `granted` | 13 | 1,043,664 / 305,443 | `3-k0h-lnl_teh.js`, not among them; loaded after start |

`login.html` loads the same 13 chunks less the route's own, and none of them holds the SDK. In
every build the SDK chunk is referenced only by the two client chunks that hold
`posthogClient.adapter.ts` (the app's tree and its error tree), through the dynamic import, and
by no page's HTML. The initial scripts of a page shrank by 370,630 bytes, 121,240 gzipped.

## The real SDK, outside the tests

A scratch run of the installed `posthog-js` 1.450.0 through the app's own modules
(`@/lib/observability`, `@/lib/posthog/posthogClient.adapter`) in happy-dom, with `fetch`,
`XMLHttpRequest` and `sendBeacon` replaced by a recorder and every injected script read back; not
committed.

| Run | Requests to a PostHog host | Kept in the browser | Status |
| --- | -------------------------- | ------------------- | ------ |
| `granted`, the control | `array/<key>/config`, `/flags`, `config.js` and the exception extension, at start | the `ph_<key>_posthog` cookie, local and session storage | — |
| `opt-in`, before a grant, after an error, a message, a breadcrumb and a user, and 3 s | none, and no request of any kind | nothing | `pending` |
| `opt-in`, after a grant | config, `/flags`, `config.js` and the extension | the cookie, local and session storage, the SDK's opt-in and `posthog-consent:granted` | `granted` |
| `opt-in`, after a revoke and a capture | one `/flags`, from the reset's flag reload | nothing | `denied` |
| `opt-in`, the next visit, with the storage of the grant | the SDK loaded at start: config, `/flags`, `config.js` and the extension | what the grant kept | `granted`, opted in and capturing |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-18, at `96554ef`. `verify:specs` failed
  with 9 problems, each a living-spec citation of a test title this change renamed (6 web, 3
  mobile), expected until the archive. Every step before it passed (`turbo run lint typecheck
  test build format:check`: 24 of 24 tasks), and each later step, run one by one, exited 0. The
  run after the archive: exit 0, 2026-11-18, `verify:specs` PASS with 0 open changes.
- `pnpm --filter @app/web build`: exit 0, also with a key in `opt-in` and in `granted` mode.
- `pnpm --filter @app/mobile export:web`: exit 0; `apps/mobile/dist-web` deleted after.
- `pnpm smoke:web`: exit 0, `HTTP 200 and marker present`.

## Not verified

- A real browser or device sending events to PostHog: the scratch run stubs the network, and
  every test replaces the SDK at its module.
- What `posthog-react-native` does over the network: its construction is what the tests observe;
  before a grant there is no instance to make a request.
- The request a web revoke makes: the reset reloads the flags once with the new anonymous id. It
  was so before this change too; suppressing it changes the revoke, an owner call.
