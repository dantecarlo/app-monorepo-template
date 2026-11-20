# Observability

This document describes the observability seam shipped with this template. The
default provider is **PostHog**, wired behind a provider-agnostic port in both
apps. **Sentry** is an optional capability: the template keeps it wired as the
superset, and `/init` prunes it unless the project picks it. Swapping to
Console, Noop or another provider is a one-line change.

---

## The seam

`IObservabilityPort` lives in `@app/core` — provider-agnostic, zero vendor
dependencies. The port exposes:

- `captureError({ error, context? })` — captures an exception with optional
  structured context.
- `captureMessage?({ message, level?, context? })` — captures a diagnostic
  message at a given severity level (`ObservabilityLevelEnum`).
- `setUser?({ user })` — associates the current user (or `null` to clear) with
  subsequent events.
- `addBreadcrumb?({ message, category?, level?, data? })` — records a
  breadcrumb trail leading up to an event.

`setUser` and `addBreadcrumb` are OPTIONAL methods. Every shipped adapter
implements them, but any third-party adapter that omits them stays valid —
consumers must null-check (`observability.setUser?.(…)`).

The template ships these adapters:

| Adapter                                      | Location                                                                        | When to use                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `createPostHogObservability()`               | `apps/{web,mobile}/src/lib/observability/createPostHogObservability.adapter.ts` | **DEFAULT** — PostHog error tracking and logs                     |
| `createSentryObservability()`                | `apps/{web,mobile}/src/lib/observability/createSentryObservability.adapter.ts`  | The optional `sentry` capability — `@sentry/nextjs` / `-native`   |
| `createConsoleObservability({ isEnabled? })` | `@app/core`                                                                     | Development — logs scrubbed payloads to `console.error` / `.warn` |
| `createNoopObservability()`                  | `@app/core`                                                                     | Silent — swallows all events, zero output, zero risk              |

Query and mutation errors flow like this:

```
QueryCache/MutationCache.onError
  → onCaptureError callback in createQueryClient
    → toCaptureError({ observability }) bridge
      → IObservabilityPort.captureError
        → adapter (PostHog | Sentry | console | noop | …)
```

The bridge lives in each app at
`apps/{web,mobile}/src/lib/observability/toCaptureError.helper.ts`.
The single wiring line is in:

- `apps/web/src/app/providers.tsx` — `getQueryClient()` passes
  `toCaptureError({ observability })` as `onCaptureError`.
- `apps/mobile/src/app/_layout.tsx` — module-scope `queryClient` is
  constructed with `onCaptureError: toCaptureError({ observability })`.

---

## The composition root — swapping is one line

Each app binds the port to ONE factory in its composition root. Swapping the
provider is editing that single line — no consumer changes.

`apps/web/src/lib/observability/observability.adapter.ts`:

```ts
export const observability: IObservabilityPort =
  createPostHogObservability() // DEFAULT
// createSentryObservability()  — the sentry capability, when selected
// createConsoleObservability() — dev logging, from @app/core
// createNoopObservability()    — silent, from @app/core
```

Mobile is the same single line in
`apps/mobile/src/lib/observability/observability.adapter.ts`.

To adopt another vendor (Datadog, …): add
`apps/web/src/lib/observability/createDatadogObservability.adapter.ts`
implementing `IObservabilityPort`, run the port contract against it (below),
then swap the one const. Core never learns the vendor name.

---

## The port contract — one suite for every adapter

`@app/tooling/observability-port-contract` holds the cases every adapter
passes, whatever its provider:

- every method is safe while the provider is disabled (no key, no DSN, switched
  off), and nothing reaches the provider;
- the PII of every context, breadcrumb and user is scrubbed before it reaches
  the provider, while the rest of the payload arrives and the user id is kept;
- `setUser(null)` leaves the provider holding no user.

It imports no test runner: an adapter's test hands it Vitest's `test` and a
harness that builds the adapter with its SDK replaced at the module boundary
and reports what reached that SDK:

```ts
describe('the observability port contract', () => {
  runObservabilityPortContract({ harness: postHogHarness, test })
})
```

| Harness member          | Returns                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `create({ enabled })`   | the adapter, its provider configured or not                        |
| `delivered()`           | every payload handed to the SDK since `create`                     |
| `currentUser()`         | the user the SDK holds now, or `null`                              |
| `delivers`              | `false` only for an adapter with no provider behind it (the no-op) |

The PostHog and Sentry adapters of both apps run it, and so do the console and
no-op adapters in packages/core. It lives in packages/tooling because both apps
and core already depend on it, and core's import boundary refuses a test
runner or a test helper in its production code.

---

## PII contract

`scrubPII` (exported from `@app/core`) is the single redaction chokepoint.
`PII_KEYS` lists every field name that is always redacted. Every adapter
applies `scrubPII` to:

- `captureError` / `captureMessage` context
- `setUser` user payloads (the id is kept; email and other PII are redacted)
- `addBreadcrumb` data

The PostHog web client also drops the query string and the fragment of every
URL the SDK attaches (below), and the Sentry config files run `scrubPII` in
`beforeSend` and `beforeBreadcrumb` as a second pass. Any custom adapter you
write **must** call `scrubPII` on every payload before it reaches an external
sink; the port contract fails when it does not.

---

## PostHog (DEFAULT)

### One client per app

`apps/{web,mobile}/src/lib/posthog/posthogClient.adapter.ts` is the ONE PostHog
client of each app and the only file that imports the SDK (`posthog-js` on
web, `posthog-react-native` on mobile). Its config comes from the
environment, and it is **inert without a key**: the SDK is never loaded on web
and no client is constructed on mobile, every observability call is a no-op,
and no request leaves the app. On web the SDK is never loaded on the server
either: `posthog-js` runs in the browser only.

**The client starts only when it may run.**

| Mode                | Web: `posthog-js` is loaded                                 | Mobile: the client is constructed                              |
| ------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| `granted`, `memory` | when the app starts, in the browser                         | when the app launches                                          |
| `opt-in`            | on a grant, or at start after a grant from an earlier visit | on a grant, or at launch after a grant from an earlier launch  |
| no key              | never                                                       | never                                                          |

On web the SDK is loaded by a dynamic `import()`, so its chunk is not among
the ones a page loads at start. In a build of the template, with or without a
key, that chunk is 371,455 bytes, 121,613 gzipped, and the scripts each
prerendered page loads at start went from 1,414,313 bytes (426,674 gzipped) to
1,043,683 (305,434). `src/lib/posthog/deferredClient.helper.ts` holds the
client: a call made while the SDK loads waits in a queue of
`POSTHOG_PENDING_CALLS_LIMIT` calls (50), which drops its oldest call when
full and hands the rest to the SDK in order once it loads, each on its own,
so a held call that throws drops only itself; a call made while nothing loads
is dropped, and so are the held calls when the SDK fails to load. Every
payload is scrubbed when the call is made, before it waits.

On mobile the client is constructed synchronously, so nothing waits: a call
made while there is no client is dropped.

### How the port maps onto PostHog

| Port method      | PostHog call                                       | Why                                                                         |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `captureError`   | `captureException(error, scrubbed context)`        | PostHog error tracking groups it as an issue                                |
| `captureMessage` | `captureLog({ body, level, attributes })`          | a message at a severity is a log record; `warning` is PostHog's `warn`      |
| `addBreadcrumb`  | `addExceptionStep(message, scrubbed data)`         | PostHog's breadcrumb: the steps ride with the next captured exception       |
| `setUser`        | `identify(id, scrubbed rest)`; `reset()` on `null` | the id is the distinct id, and a blank id identifies nobody; `reset` clears the identity on sign-out          |

`captureMessage` sends a PostHog log record rather than an event, so a message
does not mint an event definition per text; the project must have PostHog Logs
enabled to see them.

### Privacy defaults

They hold under every consent mode (below).

| Setting                                  | Web (`posthog-js`)                                  | Mobile (`posthog-react-native`)                       |
| ---------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Session recording / replay               | off (`disable_session_recording: true`)             | off (`enableSessionReplay: false`)                    |
| Autocapture of the DOM, form inputs too  | off (`autocapture: false`, `capture_dead_clicks: false`) | none: the app mounts no `PostHogProvider` autocapture |
| App lifecycle events                     | —                                                   | off (`captureAppLifecycleEvents: false`)              |
| Console errors as exceptions             | off                                                 | off                                                   |
| Unhandled errors and rejections          | captured                                            | rejections captured; uncaught exceptions on native only |
| URLs                                     | `before_send` drops the query and the fragment, and redacts a secret path segment | the SDK attaches screen names, not URLs |

The web `before_send` is `scrubCaptureUrls`
(`apps/web/src/lib/posthog/scrubCaptureUrls.helper.ts`): every `$…url`,
`$…referrer` and `$…pathname` property of an event, of its person (`$set`,
`$set_once`) and every page URL that keys heatmap data leaves without its query
string and its fragment, which can carry an invite token, a reset token or an
email. A secret can sit in the path too (`/reset/<token>`), so the scrub also
replaces with `:redacted` every path segment that reads as one, and keeps the
scheme, the host and every other segment, so a route keeps its shape:

| A path segment                                                                              | Example                                     | Becomes     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| holds `@` or `%40`                                                                          | `/users/jane@example.com`                   | `:redacted` |
| is 16 or more characters long, holds a digit, and is not a word slug                        | a JWT, a UUID, a hex token, a card number   | `:redacted` |
| is a word slug: lowercase words and numbers of at most four digits joined by hyphens        | `/blog/what-changed-in-the-2026-release`    | kept        |
| is shorter than 16 characters, or holds no digit                                            | `/items/42`, `/settings/notifications`      | kept        | On mobile, PostHog's uncaught-exception handler defers the rethrow an
Expo web bundle's chunk loader needs, so a web bundle leaves uncaught errors to
the browser.

### Consent

One setting per app chooses how PostHog treats consent:
`NEXT_PUBLIC_POSTHOG_CONSENT` on web and `EXPO_PUBLIC_POSTHOG_CONSENT` on
mobile, read in `apps/{web,mobile}/src/lib/posthog/posthogClient.constant.ts`.
When a project picks PostHog, `/init` asks for the mode; a project that sets
none keeps `granted`, the behaviour PostHog had before the setting existed.

| Mode                | Captures              | Keeps on the device                                                                                     |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| `granted` (default) | from the start        | the SDK's ids and session: a cookie, local and session storage on web; the SDK's storage file on mobile |
| `opt-in`            | nothing until a grant | nothing until a grant; after it, what `granted` keeps and the grant record; after a revoke, nothing     |
| `memory`            | from the start        | nothing: each page load on web, and each launch on mobile, gets a new anonymous id                      |

Each mode adds only these options to the `granted` ones, named as the installed
SDK types name them:

| Mode      | Web (`posthog-js`)                                                           | Mobile (`posthog-react-native`)                             |
| --------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `granted` | none                                                                         | none                                                        |
| `opt-in`  | `opt_out_capturing_by_default: true`, `opt_out_persistence_by_default: true` | `defaultOptIn: false`, `customStorage`: the consent storage |
| `memory`  | `persistence: 'memory'`                                                      | `persistence: 'memory'`                                     |

**An unknown value is a configuration error.** It throws, naming the variable
and the three modes, when the client module loads with a key set: on web on
the server too, so the prerender of `next build` fails before the value ships;
on mobile when the app starts. Without a key no client is built and the value
is not read.

**The mobile consent storage.** `posthog-react-native` writes its ids to the
device when it is built, even with `defaultOptIn: false`, and picks its storage
once. In `opt-in` mode it therefore persists through
`apps/mobile/src/lib/posthog/consentStorage.adapter.ts`, which keeps nothing
while consent is not granted: it reads no value and drops every value it is
handed. A grant writes the marker `posthog-consent:granted`, the key the next
launch reads, and once the device holds it every later value, under the
`posthog-consent:` prefix. When the device refuses the marker, the grant holds
for this launch in memory: PostHog is opted in, nothing reaches the device, and
the next launch reads `pending`, as a browser that blocks the web grant record
does. A revoke stops the writes, forgets every value, waits for the device
writes already issued and then removes the marker and every key, going on past
a removal the device refuses, so the revoke itself never fails on the device. That storage is `apps/mobile/src/lib/storage/keyValueStorage.adapter.ts`,
AsyncStorage behind the `IKeyValueStoragePort` of packages/core, and the only
file of the app that imports AsyncStorage apart from the theme and language
configs, which F.8 unit 4 moves onto it.

**Nothing reaches PostHog before a grant.** In `opt-in` mode the web SDK is not
loaded and the mobile client is not constructed until consent is granted, so
neither requests its remote config or its flags, and PostHog never sees the
user's IP or user agent before consent. **Feature flags are therefore
unavailable before consent in `opt-in` mode**: a project that reads a flag
there gets no value until a grant, and must not gate content on one.

**The web grant record.** Because the SDK is not loaded before a grant, it
cannot read its own stored choice at the start of the next visit. A grant
therefore also records `posthog-consent:granted` in the browser's local
storage, the key the mobile consent storage uses, after the SDK is opted in; the
next visit reads it, loads the SDK at start and the SDK's stored opt-in resumes
capture. A revoke removes it. A browser that blocks site data reads as no
grant.

**A switch to `opt-in` on web.** A project that ran under `granted` left the
SDK's ids in the browser: the `ph_<key>_posthog` cookie and local storage, and
`ph_<key>_…` session storage. Under `opt-in` no SDK loads before a grant to read
or clear them, so a start in `opt-in` mode with no recorded grant removes every
value `posthog-js` keeps for the key
(`apps/web/src/lib/posthog/sdkStorage.adapter.ts`): those local and session
storage keys, its stored consent `__ph_opt_in_out_<key>`, and its cookies on
the host and on every parent domain of it. A start with a recorded grant keeps
them, and so does every other mode.

**A switch to `opt-in` on mobile.** Under `granted` `posthog-react-native`
persists on its own: on a native platform in the files `.posthog-rn.json` and
`.posthog-rn-logs.json` of the document directory, through `expo-file-system`,
and in a web bundle under the same keys of the device's key-value storage.
Under `opt-in` it persists through the consent storage, under other keys, so
those only ever hold what another mode left: every `opt-in` launch removes them
(`apps/mobile/src/lib/posthog/sdkStorage.adapter.ts`, the one file that may
import `expo-file-system`), and a file or key the device refuses to remove
stays without failing the launch.

**A refusal is not stored.** Nothing is stored until a grant, so a revoke clears
the stored choice with the rest: the status reads `denied` for the rest of the
page load or launch, then `pending`, and a banner asks again. A project that
wants to remember a refusal keeps it in its banner.

#### The consent API

`IConsentPort` (packages/core) has three async calls: `grant()`, `revoke()` and
`getStatus()`, which returns a `ConsentStatusEnum` value: `granted`, `denied`,
`pending` or `not-required`. Each app binds it to PostHog in
`apps/{web,mobile}/src/lib/observability/consent.adapter.ts`, the consent
composition root, and its observability barrel exports it as `consent`. Only
`src/lib/posthog/` imports the SDK.

| Call          | `opt-in`, web                                                                                                                                        | `opt-in`, mobile                                                                                                  | `granted`, `memory`, no key, the web server |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `grant()`     | loads the SDK once, `opt_in_capturing({ captureEventName: false })`: no `$opt_in` event, and after a revoke `set_config({ advanced_disable_flags: false })` and `reloadFeatureFlags()`; then writes the grant record | opens the consent storage, constructs the client once, then `optIn()` | nothing |
| `revoke()`    | removes the record and stops the client at once, then `opt_out_capturing()`, `set_config({ advanced_disable_flags: true })` and `reset({ resetDeviceID: true })` on the SDK, loaded or still loading | closes the consent storage, drops the client, then `optOut()`, empties its event and log queues and `shutdown()`; a later grant constructs a new one | nothing |
| `getStatus()` | `denied` after a revoke, `granted` while the record holds a grant or after a grant on the page, else `pending`                                       | `granted` while the storage holds a grant, `denied` after a revoke, else `pending`                                | `not-required`                              |

A revoke also drops the identity, so a later grant starts a new person with a
new device id, and every observability call after it is dropped. On web it
resets the one SDK the page keeps, with its flags paused first: the reset
reloads the flags for the new anonymous id, one `/flags` request after the
refusal otherwise, and a grant that follows resumes and reloads them once. On
mobile it shuts the client down instead, its event and log queues emptied
first, since the SDK's reset keeps them and its flush sends them whatever the
opt-out says; nothing captured before the revoke is sent after it, and the new
client a later grant constructs reads nothing back. When a revoke and a grant
overlap a web load, the later one decides.

**Where a banner plugs in.** No banner ships: it is product work. One is a
`ui/` block for the look and a container that owns the calls (`AGENTS.md`, the
LAWs), and it calls only this API, never PostHog:

```ts
import { ConsentStatusEnum } from '@app/core'

import { consent } from '@/lib/observability'

// Show the banner only while the user has not chosen.
const isAsking = (await consent.getStatus()) === ConsentStatusEnum.PENDING
// Accept: consent.grant(). Decline, or withdraw later: consent.revoke().
```

On web, read the status in the browser, after mount: on the server there is no
client and it reads `not-required`.

### Content-Security-Policy

`apps/web/next.config.ts` sends no `Content-Security-Policy` today, so nothing
blocks the PostHog host. A project that adds one must admit the ingestion host
in `connect-src`, and the host PostHog loads its remote config and extensions
from (`https://us-assets.i.posthog.com` for the US cloud) in `script-src`.

### Not covered

- **Server-side errors on web.** `posthog-js` captures in the browser only;
  capturing an error thrown in a server component, a route handler or the
  middleware needs `posthog-node`, which the template does not install. With
  Sentry selected, `onRequestError` in `instrumentation.ts` captures them.
- **Delivery from a real build.** Every test replaces the SDK at its module, so
  it proves the payload the adapter hands over, not what PostHog receives.
- **What the SDKs store under each consent mode.** The tests prove the options
  each mode hands the SDK and the calls the consent API makes; that the SDK
  then stores nothing is its documented behaviour, which no test runs. The
  mobile consent storage is the exception: its test reads the device storage
  it writes to, replaced by the in-memory storage of packages/core.
- **A switch to `memory`.** What `granted` stored stays where the SDK put it,
  on both apps: `memory` persistence neither reads nor removes it.
- **The files on a real device.** The mobile clear is tested against a
  stand-in of `expo-file-system`; that a device deletes the files is the
  package's documented behaviour, which no test runs.
- **A secret the path rule misses.** A token of letters only, or one shorter
  than 16 characters, such as a six-digit code, keeps its place; a long word
  of letters and digits in a slug is redacted.
- **Errors thrown before the web SDK loads.** The SDK's own capture of
  unhandled errors and rejections starts when its chunk has loaded; errors the
  app reports through the port before then wait in the queue.
- **The requests a web revoke finds queued.** `posthog-js` batches its
  requests and sends them on a timer, and neither `opt_out_capturing` nor any
  other public call empties that queue, so a capture made in the seconds
  before a revoke can still leave after it. The pause of the flags was counted
  in a scratch run of the real `posthog-js` 1.450.0: one `/flags` request after
  a plain revoke, none after a paused one.
- **The mobile client a revoke drops.** It is shut down with nothing queued,
  but the app-state listener the SDK registered stays until the app quits; it
  flushes an empty queue. A revoke waits up to `POSTHOG_STOP_TIMEOUT_MS` (3 s)
  for a request the client still had in flight.

### Env keys

A PostHog project key is **public by design**: the browser and the app send it
with every event, and it can only write events. That is why it lives under
`NEXT_PUBLIC_` / `EXPO_PUBLIC_`, which `AGENTS.md` keeps free of secrets. A
PostHog **personal API key** is a secret and never belongs there.

| Key                           | Public | Purpose                                                        |
| ----------------------------- | ------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`     | yes    | Web project key. Absent = no client, nothing sent.             |
| `NEXT_PUBLIC_POSTHOG_HOST`    | yes    | Web ingestion host. Absent = `https://us.i.posthog.com`.       |
| `EXPO_PUBLIC_POSTHOG_KEY`     | yes    | Mobile project key. Absent = no client, nothing sent.          |
| `EXPO_PUBLIC_POSTHOG_HOST`    | yes    | Mobile ingestion host. Absent = `https://us.i.posthog.com`.    |
| `NEXT_PUBLIC_POSTHOG_CONSENT` | yes    | Web consent mode: `granted` (absent), `opt-in` or `memory`.    |
| `EXPO_PUBLIC_POSTHOG_CONSENT` | yes    | Mobile consent mode: `granted` (absent), `opt-in` or `memory`. |

An EU project sets the host to `https://eu.i.posthog.com`; `us.posthog.com` is
the PostHog app and accepts no events.

---

## Sentry — the optional `sentry` capability

The `sentry` capability of `template.manifest.json` owns every Sentry file, so
`/init` prunes it by deleting files and dropping two dependency records:

- **claims** the web root files: `apps/web/instrumentation.ts`,
  `apps/web/next-sentry.config.ts`, `apps/web/sentry.client.config.ts`,
  `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts` and
  `apps/web/__tests__/next-sentry.config.test.ts`;
- **removes** what sits inside the apps' `src/`, which `web-next` and
  `mobile-expo` own: both `createSentryObservability.adapter.ts` with their
  tests, and `apps/mobile/src/test/mocks/sentry-react-native.ts`;
- **drops** `@sentry/nextjs` and `@sentry/react-native`, and sets
  `expo.plugins` of `apps/mobile/app.json` to the list without
  `@sentry/react-native/expo`.

`packages/tooling/src/__tests__/prune-boundary.test.mjs` fails when a file the
prune keeps still imports a file it deletes or a dependency it removes, or when
`app.json` would keep a plugin of a removed dependency. That is why
`next.config.ts` names no capability: it applies the default export of every
`next-<capability>.config.ts` beside it, and Sentry's is
`next-sentry.config.ts`. What the prune cannot reach yet is listed in
[manifest.md § onAbsent holes](manifest.md#onabsent-holes-blocker-b4).

### Sentry wiring, when selected

**Web (`@sentry/nextjs`)**

- `apps/web/sentry.client.config.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts` — `Sentry.init` with `enabled: !!dsn` and
  `beforeSend` / `beforeBreadcrumb` → `scrubPII`.
- `apps/web/instrumentation.ts` — `register()` imports the server or edge
  config per `NEXT_RUNTIME`, and re-exports `onRequestError`. It holds only
  Sentry code, so the capability owns it whole; Next.js runs without one.
- `apps/web/next-sentry.config.ts` — wraps the config in `withSentryConfig`
  with `silent: true` and `sourcemaps.disable: !process.env.SENTRY_AUTH_TOKEN`.

**Mobile (`@sentry/react-native`)**

- The adapter calls `Sentry.init` at module scope (no `instrumentation.ts` on
  mobile). The Expo config plugin `@sentry/react-native/expo` is registered in
  `apps/mobile/app.json`.
- Real capture requires a native dev build — it will not initialise in Expo
  Go. The no-op-without-DSN pattern keeps `expo export`, the Hermes smoke and
  vitest green without the native module.

**To make Sentry the provider**, bind `createSentryObservability()` in both
composition roots.

### Sentry env keys

| Key                      | Public | Purpose                                                          |
| ------------------------ | ------ | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | yes    | Web DSN. Absent = Sentry disabled (build/validate stay green).   |
| `SENTRY_AUTH_TOKEN`      | NO     | Deploy-time only. Gates source-map upload. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_APP_ENV`    | yes    | Optional Sentry environment tag (defaults to `development`).     |
| `EXPO_PUBLIC_SENTRY_DSN` | yes    | Mobile DSN. Absent = Sentry disabled.                            |
| `EXPO_PUBLIC_APP_ENV`    | yes    | Optional mobile environment tag.                                 |

---

## Adding Sentry

For a project whose `/init` dropped the `sentry` capability. The template
repository keeps every file below; copy them from it rather than retyping.

1. **Install the SDKs**: `pnpm --filter @app/web add @sentry/nextjs` and, in
   `apps/mobile`, `npx expo install @sentry/react-native`. Allow the
   `@sentry/cli` build in `pnpm-workspace.yaml` (`allowBuilds`).
2. **Web config files**, at the root of `apps/web`:
   - `sentry.client.config.ts`, `sentry.server.config.ts` and
     `sentry.edge.config.ts`, each:

     ```ts
     import { scrubPII } from '@app/core'
     import * as Sentry from '@sentry/nextjs'

     const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

     Sentry.init({
       beforeBreadcrumb: (breadcrumb) => scrubPII(breadcrumb),
       beforeSend: (event) => scrubPII(event),
       dsn,
       enabled: !!dsn,
       environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'development'
     })
     ```

   - `instrumentation.ts`:

     ```ts
     import * as Sentry from '@sentry/nextjs'

     export const register = async (): Promise<void> => {
       if (process.env.NEXT_RUNTIME === 'nodejs') {
         await import('./sentry.server.config')
       }
       if (process.env.NEXT_RUNTIME === 'edge') {
         await import('./sentry.edge.config')
       }
     }

     export const onRequestError = Sentry.captureRequestError
     ```

   - `next-sentry.config.ts`, which `next.config.ts` applies because it sits
     beside it:

     ```ts
     // eslint-disable-next-line no-restricted-imports -- framework config entry point, like next.config.ts
     import { withSentryConfig } from '@sentry/nextjs'
     import type { NextConfig } from 'next'

     const withSentry = ({ config }: { config: NextConfig }): NextConfig =>
       withSentryConfig(config, {
         silent: true,
         sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }
       })

     export default withSentry
     ```

3. **The adapters**: `createSentryObservability.adapter.ts` in each app's
   `src/lib/observability/`, mapping `captureError` → `captureException`,
   `captureMessage` → `captureMessage`, `addBreadcrumb` → `addBreadcrumb` and
   `setUser` → `setUser`, every payload through `scrubPII`, every method a
   no-op without a DSN. The mobile one calls `Sentry.init` at module scope with
   the same `beforeSend` / `beforeBreadcrumb` scrub.
4. **Mobile native wiring**: add `@sentry/react-native/expo` to `expo.plugins`
   in `apps/mobile/app.json`, and alias `@sentry/react-native` to a no-op mock
   in `apps/mobile/vitest.config.ts`, as the template's
   `src/test/mocks/sentry-react-native.ts` does.
5. **Env keys**: the Sentry table above, in both `.env.example` files.
6. **Tests**: each adapter's test runs the port contract with its SDK mocked
   at the module boundary (`vi.mock('@sentry/nextjs', …)`).
7. **Bind it**: swap the composition root line to `createSentryObservability()`
   in both apps, or keep PostHog and leave Sentry unbound.
8. **Re-add the manifest capability** if the project still runs `/init`, then
   run `pnpm validate`.

---

## Graceful degradation

With no PostHog key, the web app never loads `posthog-js` and the mobile app
constructs no client, every port call is a no-op and the consent API reads
`not-required`. With no Sentry DSN, the Sentry adapters and the `sentry.*.config`
files no-op (`enabled: !!dsn`) and source-map upload is disabled (no
`SENTRY_AUTH_TOKEN`). `pnpm validate` and `pnpm build` stay green with no real
credentials. This is intentional for local dev and CI.
