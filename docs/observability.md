# Observability

This document describes the observability seam shipped with this template and
how to plug a real provider (Sentry, Datadog, or any other).

---

## The seam

`IObservabilityPort` lives in `@app/core` — provider-agnostic, zero vendor
dependencies. The port exposes two methods:

- `captureError({ error, context? })` — captures an exception with optional
  structured context.
- `captureMessage?({ message, level?, context? })` — captures a diagnostic
  message at a given severity level (`ObservabilityLevelEnum`).

The template ships two built-in adapters, both in `@app/core`:

| Adapter | When to use |
|---|---|
| `createNoopObservability()` | Production default — swallowed silently, no output, no risk |
| `createConsoleObservability({ isEnabled? })` | Development — logs scrubbed payloads to `console.error` / `console.warn` |

Query and mutation errors flow like this:

```
QueryCache/MutationCache.onError
  → onCaptureError callback in createQueryClient
    → toCaptureError({ observability }) bridge
      → IObservabilityPort.captureError
        → adapter (noop | console | Sentry | Datadog | …)
```

The bridge lives in each app at
`apps/{web,mobile}/src/lib/observability/toCaptureError.helper.ts`.
The single wiring line is in:

- `apps/web/src/app/providers.tsx` — `getQueryClient()` passes
  `toCaptureError({ observability })` as `onCaptureError`.
- `apps/mobile/src/app/_layout.tsx` — module-scope `queryClient` is
  constructed with `onCaptureError: toCaptureError({ observability })`.

---

## PII contract

`scrubPII` (exported from `@app/core`) is the single redaction chokepoint.
`PII_KEYS` lists every field name that is always redacted. The console adapter
applies `scrubPII` to every context object before any output. Any custom
adapter you write **must** also call `scrubPII` on context and on any
serialized error shape before sending to an external sink.

---

## Plugging Sentry (optional, project-side)

The template does not bundle `@sentry/*`. Adding Sentry is a project decision.

### 1. Install the SDK in your project

```bash
# Next.js web
pnpm add @sentry/nextjs --filter @app/web

# Expo mobile
pnpm add @sentry/react-native --filter @app/mobile
```

### 2. Add Sentry config files (web, Next.js 15 pattern)

`apps/web/sentry.client.config.ts`:

```ts
import * as Sentry from '@sentry/nextjs'
import { scrubPII } from '@app/core'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend: (event) => scrubPII(event),
  beforeBreadcrumb: (breadcrumb) => scrubPII(breadcrumb)
})
```

Create matching `sentry.server.config.ts` and `sentry.edge.config.ts` with the
same shape but using server-side DSN env vars.

`apps/web/instrumentation.ts`:

```ts
export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export { onRequestError } from '@sentry/nextjs'
```

### 3. Implement `createSentryObservability`

Create `apps/web/src/lib/observability/createSentryObservability.adapter.ts`:

```ts
import * as Sentry from '@sentry/nextjs'
import {
  scrubPII,
  ObservabilityLevelEnum,
  type IObservabilityPort
} from '@app/core'

export const createSentryObservability = (): IObservabilityPort => ({
  captureError: ({ error, context }) => {
    Sentry.captureException(error, {
      extra: context ? scrubPII(context) : undefined
    })
  },
  captureMessage: ({ message, level, context }) => {
    const severityMap: Record<string, Sentry.SeverityLevel> = {
      [ObservabilityLevelEnum.DEBUG]: 'debug',
      [ObservabilityLevelEnum.INFO]: 'info',
      [ObservabilityLevelEnum.WARNING]: 'warning',
      [ObservabilityLevelEnum.ERROR]: 'error',
      [ObservabilityLevelEnum.FATAL]: 'fatal'
    }
    Sentry.captureMessage(message, {
      level: level ? severityMap[level] : 'info',
      extra: context ? scrubPII(context) : undefined
    })
  }
})
```

### 4. Swap the adapter (one line change)

In `apps/web/src/lib/observability/observability.adapter.ts`, replace:

```ts
export const observability: IObservabilityPort = createNoopObservability()
```

with:

```ts
export const observability: IObservabilityPort = createSentryObservability()
```

The mobile recipe is the same, substituting `@sentry/react-native` for
`@sentry/nextjs` and using the Expo-native Sentry init pattern (no
`instrumentation.ts` — use the `Sentry.init` call at the entry point instead).

---

## Datadog / other providers

The recipe is identical: implement `IObservabilityPort`, call `scrubPII` on
every context before it reaches the SDK, then swap the one line in
`observability.adapter.ts`. The core never learns the provider name.

---

## Why no bundled vendor dependency

The same philosophy as the Playwright CLI-only approach (no bundled
`@playwright/test` in the template): the template stays lean and vendor-SDK
choice belongs to the project. Install the SDK in your project, not here.
