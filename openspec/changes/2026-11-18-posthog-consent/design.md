# Design: 2026-11-18-posthog-consent

## Decision

### The SDK options of each mode

Read from the installed types: `posthog-js` 1.450.0 (`PostHogConfig` of `@posthog/types` 1.425.1)
and `posthog-react-native` 4.87.0 (`PostHogOptions`, and `PostHogCoreOptions` of `@posthog/core`
1.68.0). Each mode adds only these to the `granted` options, which stay as they are today.

| Mode      | Web (`posthog-js`)                                                        | Mobile (`posthog-react-native`)                       |
| --------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| `granted` | nothing                                                                   | nothing                                               |
| `opt-in`  | `opt_out_capturing_by_default: true`, `opt_out_persistence_by_default: true` | `defaultOptIn: false`, `customStorage`: the consent storage |
| `memory`  | `persistence: 'memory'`                                                   | `persistence: 'memory'`                               |

| Consent call | Web                                                             | Mobile                                                  |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------- |
| grant        | `opt_in_capturing({ captureEventName: false })`                 | open the consent storage, then `optIn()`                |
| revoke       | `opt_out_capturing()`, then `reset({ resetDeviceID: true })`    | close the consent storage, then `optOut()` and `reset([])` |
| status       | `get_explicit_consent_status()`                                 | the consent storage's grant                             |

### Why each choice

1. **The port lives in packages/core.** Both apps implement the same contract, and a banner of
   either app depends on it, not on PostHog. It sits beside `IObservabilityPort`, the seam it
   gates, and like it holds no vendor.
2. **The API lives in each app's `src/lib/observability/`.** What it grants is what the
   observability provider captures, so it follows that folder's shape: a PostHog adapter,
   `createPostHogConsent.adapter.ts`, and a composition root, `consent.adapter.ts`, exported from
   the barrel the apps already import. Neither imports the SDK: they use the client of
   `src/lib/posthog/`.
3. **Web `opt-in` needs both opt-out options.** `opt_out_capturing_by_default` alone drops events
   but keeps persistence on; with `opt_out_persistence_by_default` the SDK disables persistence
   while consent is pending or refused (`_is_persistence_disabled` in `posthog-js`), which also
   keeps the session id out of `sessionStorage`. A grant re-enables and saves it.
4. **Mobile `opt-in` needs a consent storage.** `defaultOptIn: false` alone still writes to the
   device at construction: the SDK seeds the device id from the anonymous id and records the app
   build and version (`initAfterStorage` and `persistAppVersion` of `posthog-rn`). Persistence is
   chosen once, at construction, so `opt-in` hands PostHog a `customStorage` that keeps every
   value in memory until a grant, then writes it and every later value to AsyncStorage under its
   own prefix with a grant marker. The marker is what the next launch reads. A revoke closes the
   storage before opting out, so no later write reaches the device, and removes every key it
   wrote. AsyncStorage is a dependency the app already has.
5. **A refusal is not stored.** The rule is that nothing is stored until a grant. A web revoke
   therefore resets after opting out, and `reset` clears the stored choice with the rest; a
   mobile revoke removes everything. The status reads `denied` for the rest of that visit or
   launch and `pending` after it, so a banner asks again. A project that wants to remember a
   refusal stores it in its banner.
6. **A revoke resets the identity.** Without it the in-memory id survives the revoke and a later
   grant on the same page saves it again, joining the two. Both resets also drop the device id:
   `resetDeviceID: true` on web, and on mobile `reset([])`, which keeps no property (by default
   `posthog-react-native` keeps the device id across a reset).
7. **An unknown mode throws.** The value is checked when the client module loads with a key set.
   On web that is also true on the server, so the prerender of `next build` fails before the value
   ships; on mobile the app fails at launch. Without a key no client is built and the value is not
   read.
8. **Outside `opt-in` the status is `not-required`.** `granted` and `memory` ask no consent, and
   without a key (or on the web server) there is no client: the API changes nothing there, and a
   banner shows only on `pending`.

### What the SDKs still do before a grant

Both clients are built at load in `opt-in` mode, so each still fetches its remote config and
flags with an in-memory anonymous id. Nothing is captured and nothing is stored; the request
itself reaches PostHog.

## Options considered

- **Build no client until a grant.** It sends no request before consent, but the grant must then
  be stored by the app, and a mobile revoke cannot remove data the SDK wrote to a storage it chose
  itself. Rejected: the consent storage gives the same guarantee for what is stored with one
  client.
- **`cookieless_mode: 'on_reject'` on web.** It captures refused users without cookies, but only
  when the PostHog project enables cookieless mode; otherwise the SDK's events are ignored.
- **A warning and `granted` for an unknown value.** It would capture without consent from a
  typo in a project that chose `opt-in`.
