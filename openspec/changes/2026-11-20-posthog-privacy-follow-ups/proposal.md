# Proposal: PostHog privacy follow-ups

> **Status:** open

## Why

Rows F56 and F54 of `docs/INIT_AND_HARNESS_PLAN.md`, every item still open in them:

- **F56, mobile revoke.** A revoke drops the client without shutting it down
  (`apps/mobile/src/lib/posthog/posthogClient.adapter.ts:80-82`). Its flush timer lives on, and
  the SDK's `reset` keeps the event and log queues (@posthog/core 1.68.0,
  src/posthog-core.ts lines 186-201), while `flush` sends a queue whatever the opt-out says
  (src/posthog-core-stateless.ts lines 1654-1690): what was captured before the revoke can still be
  sent after it.
- **F56, web start.** The deferred client runs the held calls with one `forEach`
  (`apps/web/src/lib/posthog/deferredClient.helper.ts:38`): a call that throws loses every call
  after it and rejects the start.
- **F54, web reset.** A web revoke's `reset()` reloads the flags with the new anonymous id
  (posthog-js 1.450.0, lib/src/posthog-core.js line 3506): one `/flags` request after the
  refusal. A scratch run of the real `posthog-js` counted it: one request after a plain revoke.
  The mobile reset reloads them the same way (@posthog/core, src/posthog-core.ts line 225).
- **F54, switching modes.** A project that switches from `granted` to `opt-in` leaves what
  `granted` stored where the SDK put it: on web, a cookie and local and session storage under
  `ph_<key>_…` (seen in the same scratch run), which nothing reads or removes before a grant.
- **F54, URL scrub.** `scrubUrl` drops the query and the fragment
  (`apps/web/src/lib/posthog/scrubCaptureUrls.helper.ts:16-17`), not a secret inside a path
  segment such as `/reset/<token>`.
- **F54, the mobile consent storage.** The native review warned of its write paths, a launch
  opt-in that is not handled, an open failure state and an untested re-grant. Read from
  `apps/mobile/src/lib/posthog/consentStorage.adapter.ts:21-91` and
  `apps/mobile/src/lib/posthog/posthogClient.adapter.ts:86-101`: a revoke whose device removal
  fails rejects before the client is dropped, so PostHog stays opted in; `open` sets the grant
  before its writes settle and loses the held values when one fails, so the grant rejects before
  PostHog is opted in while the status reads `granted`; the launch restore is a floating promise
  with no rejection handler; and no test grants again after a revoke.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"
- 2026-11-20 (translated from Spanish): "Finish making all the changes … Finish what's missing"

## Assumptions

The owner asked to finish the rows; these are the decisions the rows leave open, each applied as
stated and open to the owner's correction.

- **A1 — A revoke drops what the mobile client still queues.** The privacy-safe default: the
  events and log records captured before a revoke are dropped, never sent after it. The revoke
  then shuts the dropped client down, which stops its flush timers and, with nothing queued, sends
  nothing.
- **A2 — A mobile revoke no longer resets the client.** The client it drops is shut down, and the
  consent storage keeps nothing after a revoke, so a later grant constructs a client that reads
  nothing back: a new anonymous id and device id, as the reset gave, without the `/flags` request
  the reset makes.
- **A3 — A web revoke pauses the flags before its reset.** `posthog-js` reuses one SDK across a
  revoke, so its reset stays. The revoke sets `advanced_disable_flags: true` first, and the reset
  then requests no flags; a grant after a revoke sets it back and reloads the flags once. The
  scratch run of the real `posthog-js` 1.450.0 counted one `/flags` request after a plain revoke,
  none after a paused one and one after the grant that follows it.
- **A4 — The path-segment rule.** A segment that holds an `@` or `%40`, or that is 16 or more
  characters long and holds a digit, reads as a secret and becomes `:redacted`, unless it is a word
  slug: lowercase words and numbers of at most four digits joined by hyphens. Route names, word
  slugs and ids under 16 characters keep their place, so a route keeps its shape. A token of
  letters only, or shorter than 16 characters, is not caught; a long slug that mixes letters and
  digits in one word is redacted.
- **A5 — The switch to `opt-in` on web.** A start in `opt-in` mode with no recorded grant removes
  every value `posthog-js` keeps for the project key: the local and session storage keys that start
  with `ph_<key>_`, the consent key `__ph_opt_in_out_<key>`, and the cookies of those names on the
  host and on every parent domain of it. A start with a recorded grant keeps them.
- **A6 — The four warnings on the mobile consent storage.** Their text was not recorded (the plan,
  the review artifacts and the memory hold only their names), so this change reads them from the
  code as `## Why` says, and fixes each: the removals of a revoke wait for every write already
  issued and go on when the device refuses one; the launch restore catches its failure; and a
  grant after a revoke is tested at the storage.
- **A7 — A grant the device refuses holds for the launch.** When the device refuses the grant
  marker, the grant holds for this launch in memory: PostHog is opted in, nothing reaches the
  device, the status reads `granted`, and the next launch reads `pending`. It is what web does
  when the browser blocks the grant record.

## What changes

- **apps/web:** the deferred client runs each held call on its own; the URL scrub also replaces a
  path segment that reads as a secret; a revoke pauses the flags before its reset, and a grant
  after it resumes and reloads them; a start in `opt-in` mode with no recorded grant removes what
  `posthog-js` stored before.
- **apps/mobile:** the consent storage keeps nothing while consent is not granted, writes the
  grant marker before any value and keeps a refused grant in memory, and its revoke waits for the
  writes it issued and goes on past a refused removal; the consent API opens the storage before it
  constructs the client, and its revoke opts the client out, drops its queues and shuts it down;
  the launch restore catches its failure.
- **Docs:** `docs/observability.md`.

## Out of scope

- **The switch to `opt-in` on mobile.** On native, `posthog-react-native` keeps what `granted`
  stored in files of the document directory, through `expo-file-system`
  (posthog-react-native 4.87.0, dist/native-deps.js, `buildOptimisticAsyncStorage`). Removing them needs `expo-file-system`
  as a dependency of `apps/mobile` and a seam for it in `.agents/contracts/dependencies.json`,
  both outside this change's edit surfaces: an owner decision.
- **The events a web revoke finds in the request queue.** `posthog-js` batches its requests and
  sends them on a timer; `opt_out_capturing` does not empty that queue
  (posthog-js, lib/src/posthog-core.js lines 4460-4470 and 4322-4338), and no public call does, so a capture made
  in the seconds before a revoke can still leave after it. Recorded in `docs/observability.md`.
- **The architecture map's row for the URL scrub** (`docs/maps/global-map.md`), outside this
  change's edit surfaces: it still says the scrub drops the query and the fragment, which stays
  true but no longer whole.

## Affected specs

- `openspec/specs/apps/web/spec.md`: WEB-52, WEB-57 and WEB-62 modified; WEB-85 added
- `openspec/specs/apps/mobile/spec.md`: MOBILE-53, MOBILE-54 and MOBILE-55 modified
