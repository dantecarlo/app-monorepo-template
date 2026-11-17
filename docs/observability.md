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
environment, and it is **inert without a key**: the client is never
initialised or constructed, `posthogClient` is `undefined`, every observability
call is a no-op, and no request leaves the app. On web the client is also
`undefined` on the server: `posthog-js` runs in the browser only.

### How the port maps onto PostHog

| Port method      | PostHog call                                       | Why                                                                         |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `captureError`   | `captureException(error, scrubbed context)`        | PostHog error tracking groups it as an issue                                |
| `captureMessage` | `captureLog({ body, level, attributes })`          | a message at a severity is a log record; `warning` is PostHog's `warn`      |
| `addBreadcrumb`  | `addExceptionStep(message, scrubbed data)`         | PostHog's breadcrumb: the steps ride with the next captured exception       |
| `setUser`        | `identify(id, scrubbed rest)`; `reset()` on `null` | the id is the distinct id; `reset` clears the identity on sign-out          |

`captureMessage` sends a PostHog log record rather than an event, so a message
does not mint an event definition per text; the project must have PostHog Logs
enabled to see them.

### Privacy defaults

| Setting                                  | Web (`posthog-js`)                                  | Mobile (`posthog-react-native`)                       |
| ---------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Session recording / replay               | off (`disable_session_recording: true`)             | off (`enableSessionReplay: false`)                    |
| Autocapture of the DOM, form inputs too  | off (`autocapture: false`, `capture_dead_clicks: false`) | none: the app mounts no `PostHogProvider` autocapture |
| App lifecycle events                     | —                                                   | off (`captureAppLifecycleEvents: false`)              |
| Console errors as exceptions             | off                                                 | off                                                   |
| Unhandled errors and rejections          | captured                                            | rejections captured; uncaught exceptions on native only |
| URLs                                     | `before_send` drops the query and the fragment      | the SDK attaches screen names, not URLs               |

The web `before_send` is `scrubCaptureUrls`
(`apps/web/src/lib/posthog/scrubCaptureUrls.helper.ts`): every `$…url`,
`$…referrer` and `$…pathname` property of an event, of its person (`$set`,
`$set_once`) and every page URL that keys heatmap data leaves without its query
string and its fragment, which can carry an invite token, a reset token or an
email. On mobile, PostHog's uncaught-exception handler defers the rethrow an
Expo web bundle's chunk loader needs, so a web bundle leaves uncaught errors to
the browser.

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

### Env keys

A PostHog project key is **public by design**: the browser and the app send it
with every event, and it can only write events. That is why it lives under
`NEXT_PUBLIC_` / `EXPO_PUBLIC_`, which `AGENTS.md` keeps free of secrets. A
PostHog **personal API key** is a secret and never belongs there.

| Key                        | Public | Purpose                                                         |
| -------------------------- | ------ | --------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | yes    | Web project key. Absent = no client, nothing sent.              |
| `NEXT_PUBLIC_POSTHOG_HOST` | yes    | Web ingestion host. Absent = `https://us.i.posthog.com`.        |
| `EXPO_PUBLIC_POSTHOG_KEY`  | yes    | Mobile project key. Absent = no client, nothing sent.           |
| `EXPO_PUBLIC_POSTHOG_HOST` | yes    | Mobile ingestion host. Absent = `https://us.i.posthog.com`.     |

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

With no PostHog key, both PostHog clients stay unbuilt and every port call is
a no-op. With no Sentry DSN, the Sentry adapters and the `sentry.*.config`
files no-op (`enabled: !!dsn`) and source-map upload is disabled (no
`SENTRY_AUTH_TOKEN`). `pnpm validate` and `pnpm build` stay green with no real
credentials. This is intentional for local dev and CI.
