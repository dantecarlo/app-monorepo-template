# Observability

This document describes the observability seam shipped with this template. The
default provider is **Sentry**, wired behind a provider-agnostic port. Swapping
to Console, Noop, or any other provider (Datadog, …) is a one-line change.

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

`setUser` and `addBreadcrumb` are OPTIONAL methods. Existing adapters (noop,
console) implement them too, but any third-party adapter that omits them stays
valid — consumers must null-check (`observability.setUser?.(…)`).

The template ships built-in adapters:

| Adapter | Location | When to use |
|---|---|---|
| `createSentryObservability()` | `apps/{web,mobile}/src/lib/observability/createSentryObservability.adapter.ts` | **DEFAULT** — real capture via `@sentry/nextjs` (web) / `@sentry/react-native` (mobile) |
| `createConsoleObservability({ isEnabled? })` | `@app/core` | Development — logs scrubbed payloads to `console.error` / `console.warn` |
| `createNoopObservability()` | `@app/core` | Silent — swallows all events, zero output, zero risk |

Query and mutation errors flow like this:

```
QueryCache/MutationCache.onError
  → onCaptureError callback in createQueryClient
    → toCaptureError({ observability }) bridge
      → IObservabilityPort.captureError
        → adapter (Sentry | console | noop | …)
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

Each app exposes a per-port composition root that binds the singleton to ONE
factory. Swapping the provider is editing that single line — no consumer
changes.

`apps/web/src/lib/observability/observability.adapter.ts`:

```ts
export const observability: IObservabilityPort = createSentryObservability() // DEFAULT
// export const observability: IObservabilityPort = createConsoleObservability() // dev logging
// export const observability: IObservabilityPort = createNoopObservability()    // silent
```

Mobile is the same single line in
`apps/mobile/src/lib/observability/observability.adapter.ts`.

To adopt Datadog (or any other vendor): add
`apps/web/src/lib/observability/createDatadogObservability.adapter.ts`
implementing `IObservabilityPort`, then swap the one const. Core never learns
the vendor name.

---

## PII contract

`scrubPII` (exported from `@app/core`) is the single redaction chokepoint.
`PII_KEYS` lists every field name that is always redacted. Every adapter
applies `scrubPII` to:

- `captureError` / `captureMessage` context
- `setUser` user payloads (id is kept; email and other PII are redacted)
- `addBreadcrumb` data

The Sentry config files (`sentry.client/server/edge.config.ts`) additionally
run `scrubPII` in `beforeSend` and `beforeBreadcrumb` as a defence-in-depth
second pass. Any custom adapter you write **must** also call `scrubPII` on
every payload before it reaches an external sink.

---

## Sentry wiring (DEFAULT, already in place)

### Web (`@sentry/nextjs`)

- `apps/web/sentry.client.config.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts` — `Sentry.init` with `enabled: !!dsn` and
  `beforeSend`/`beforeBreadcrumb` → `scrubPII`.
- `apps/web/instrumentation.ts` — `register()` imports the server/edge config
  per `NEXT_RUNTIME`; re-exports `onRequestError`.
- `apps/web/next.config.ts` — wrapped in `withSentryConfig(withNextIntl(…))`
  with `silent: true` and `sourcemaps.disable: !process.env.SENTRY_AUTH_TOKEN`.

### Mobile (`@sentry/react-native`)

- The adapter calls `Sentry.init` at module scope (no `instrumentation.ts` on
  mobile). The Expo config plugin `@sentry/react-native/expo` is registered in
  `apps/mobile/app.json`.
- Real capture requires a native dev build — it will not initialise in Expo
  Go. The lazy/no-op-without-DSN pattern keeps `expo export`, the Hermes
  smoke, and vitest green without the native module.

### Env keys

| Key | Public | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | yes | Web DSN. Absent = Sentry disabled (build/validate stay green). |
| `SENTRY_AUTH_TOKEN` | NO | Deploy-time only. Gates source-map upload. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_APP_ENV` | yes | Optional Sentry environment tag (defaults to `development`). |
| `EXPO_PUBLIC_SENTRY_DSN` | yes | Mobile DSN. Absent = Sentry disabled. |
| `EXPO_PUBLIC_APP_ENV` | yes | Optional mobile environment tag. |

---

## Graceful degradation

With NO Sentry DSN set, the Sentry adapter and the `sentry.*.config` files all
no-op (`enabled: !!dsn`), source-map upload is disabled (no
`SENTRY_AUTH_TOKEN`), and `pnpm validate` / `pnpm build` stay green with no
real credentials. This is intentional for local dev and CI.
