# Design: 2026-11-18-posthog-deferred-client

## Decision

### Web: a deferred client owns the SDK and the queue

`src/lib/posthog/` keeps one holder of the PostHog client, `posthogClient`, built by the pure
helper `createDeferredClient` (`deferredClient.helper.ts`). It has three states and four calls:

| State     | `run(call)`                           | Reached by                                     |
| --------- | ------------------------------------- | ---------------------------------------------- |
| idle      | drops the call                        | the start of every run; `stop()`; a failed load |
| loading   | queues it, dropping the oldest at the limit | `start({ load })`                        |
| ready     | calls the SDK at once                 | the load resolving; the queue is flushed first |

`start` returns the client, the load in flight, or a new load; `settled()` returns the load in
flight or the client, `undefined` while idle; `stop()` forgets the client and clears the queue.
`posthogClient.adapter.ts`, still the only file that names `posthog-js`, passes a load that runs
`import('posthog-js')` and initialises the SDK once, and starts it at module load in `granted`
and `memory` mode in the browser. The observability adapter scrubs each payload when it is
called and hands `run` a call that only forwards it, so a held call already carries a scrubbed
payload. The limit is `POSTHOG_PENDING_CALLS_LIMIT`, 50: the calls an app makes in the moment
the SDK chunk downloads are a handful, and 50 bounds a burst of failing queries without holding
more than a few kilobytes.

### Web: the grant is recorded by the app

Under `opt-in` the SDK is not loaded before a grant, so it cannot read its own stored choice at
the start of the next visit. The consent API therefore records a grant in the browser's local
storage under `posthog-consent:granted`, the key the mobile consent storage uses, and the client
module reads it at load: a recorded grant loads the SDK at start, and the SDK's own stored
opt-in resumes capture. The status reads the record, so it answers before the SDK loads. The
record is written after the SDK is opted in, so a page closed during the load leaves neither, and
a revoke removes it before resetting the SDK. Storage that throws (blocked site data) reads as no
grant and writes nothing.

A revoke waits for a load in flight before it stops the client, so a grant followed by a revoke
on the same page always ends opted out and reset, and a later grant reuses the SDK already
loaded: the module stays in memory and is initialised once.

### Mobile: the client is constructed on demand

`posthogClient.adapter.ts` keeps the client in a holder behind `getPostHogClient`,
`startPostHogClient` and `stopPostHogClient`. `granted` and `memory` start it at launch; `opt-in`
starts it on a grant, or at launch when the consent storage reads a grant from an earlier launch,
then opts it in as it did before. Construction is synchronous, so mobile needs no queue: a call
made while there is no client is dropped. A revoke closes the consent storage, drops the holder's
client, then opts that client out and resets it; a later grant constructs a new client over the
same consent storage.

## Options considered

- **Keep one client and opt it out until consent** (the 2026-11-18-posthog-consent design). It
  stores nothing, but both SDKs request their remote config and flags at start, which shows
  PostHog the user's IP and user agent before consent. The owner chose option 2.
- **Read the SDK's own stored choice on web** (`__ph_opt_in_out_<key>` in local storage). It
  answers the earlier-visit question without an app record, but couples the app to an internal
  key of `posthog-js`.
- **Queue on mobile too.** Construction is synchronous, so there is nothing to wait for; under
  `opt-in` before a grant the brief drops every call.
- **Shut the mobile client down on a revoke** (`shutdown()`). The brief's teardown is the opt-out,
  the clear and dropping the instance; `shutdown` would also flush, after a reset that already
  emptied the queue.
