# Proposal: PostHog starts only when it may run

> **Status:** archived — 2026-11-18

## Why

Rows F54 and F48 of `docs/INIT_AND_HARNESS_PLAN.md`. Under `opt-in`, both apps build their
PostHog client when the app starts (`apps/web/src/lib/posthog/posthogClient.adapter.ts:56-59`,
`apps/mobile/src/lib/posthog/posthogClient.adapter.ts:73-79`), and both SDKs then request their
remote config and `/flags` before any consent: no event is sent and nothing is stored, but each
request shows PostHog the user's IP and user agent (the real-SDK check of
`openspec/changes/archive/2026-11-18-posthog-consent/verify-report.md`). And the web app imports
`posthog-js` statically, so it ships in the initial client bundle of every route even without a
key: one chunk of 374,461 bytes before compression, 122,873 gzipped, in a build of `bcbf84c`.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"
- 2026-11-18 (translated from Spanish), answering "should I add a consent mode for PostHog's cookie, and have `/init` ask about it, or leave it as is?": "Yes, add it if it is requested, if you want PostHog, and continue with the plan"
- 2026-11-18 (translated from Spanish), answering whether `opt-in` should start the PostHog client only after consent, so that nothing reaches PostHog before it (option 2, "start the client only when the user grants consent"), or stay as it is: "Option 2"

The parent session's decisions for this change, applied as stated:

- **Web:** `src/lib/posthog/` loads `posthog-js` with a dynamic `import()`: with a key under
  `granted` or `memory` at start, in the browser only; under `opt-in` only after a grant; without
  a key never. A build without a key, or under `opt-in` before a grant, ships no `posthog-js` in
  the initial client bundle, proven on the built output.
- **Mobile:** under `opt-in` the client is constructed only after a grant, so until then no
  request leaves the app. The consent storage of F46 stays the store the client uses once it
  exists. A revoke tears the client down: it opts out, clears what was stored and drops the
  instance.
- **Before the client exists, the observability adapter is safe to call.** Under `opt-in` before
  a grant every call is dropped and nothing is queued. Under `granted` and `memory` on web the
  SDK loads asynchronously, so calls made before it resolves wait in a small bounded queue, sized
  by a named constant, that drops its oldest entry when full and is flushed in order once the SDK
  loads. Every payload is still scrubbed with `scrubPII` before it reaches the SDK.
- **The consent API keeps its shape**, `IConsentPort`: a grant starts the client, a revoke stops
  it and clears, and the status reads as before.

> **Amended after the native review, 2026-11-18:** WEB-57 now has a revoke stop the client before it
> waits for a load, and read `granted` after a grant whose record the browser blocks; MOBILE-55
> and MOBILE-60 gained a scenario and a wider one. See `verify-report.md` § After the native
> review.

## What changes

- **apps/web:** `src/lib/posthog/` gains a deferred client, the holder of the one SDK client and
  of the bounded queue, and the SDK is loaded through it; the observability adapter calls PostHog
  through it. Under `opt-in` the consent API loads the SDK on a grant and records the grant in the
  browser's local storage, so the next visit loads it at start; a revoke removes the record and
  stops the client.
- **apps/mobile:** `src/lib/posthog/` constructs the client at launch under `granted` and
  `memory`, and under `opt-in` only on a grant or after a grant from an earlier launch; the
  observability adapter drops every call while there is no client; a revoke drops the client and
  a later grant constructs a new one.
- **Docs:** `docs/observability.md` (when each mode starts the client, that feature flags are
  unavailable before consent under `opt-in`, the bundle note of F48), and the architecture docs of
  both apps.

## Out of scope

- **The other findings of F54:** what `granted` stored is not cleared when a project switches to
  `opt-in`, the secret inside a URL path segment, and the review warnings on the mobile consent
  storage. This change only moves when the client starts.
- **Deferring `posthog-react-native` in the mobile bundle.** The brief asks for the construction
  to wait, not the module; a native bundle has no initial download to shrink.
- **Errors thrown before the web SDK loads.** The SDK's own capture of unhandled errors starts
  when it loads; errors the app reports through the port before then wait in the queue.

## Affected specs

> Renumbered at merge, 2026-11-18: this change added WEB-58 and MOBILE-57, and `2026-11-18-i18n-seam`
> took both IDs first, so they are WEB-62 and MOBILE-60 here and in the living specs.

- `openspec/specs/apps/web/spec.md`: WEB-50, WEB-56 and WEB-57 modified; WEB-62 added
- `openspec/specs/apps/mobile/spec.md`: MOBILE-49, MOBILE-53 and MOBILE-55 modified; MOBILE-60 added
