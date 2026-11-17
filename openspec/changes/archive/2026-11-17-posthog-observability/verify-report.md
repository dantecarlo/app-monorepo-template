# Verify report: 2026-11-17-posthog-observability

> **Verified:** 2026-11-17 at `c6ad4f2`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TOOLING-01 | a workspace imports the package base by name | Not covered — no test imports the package base by name | not covered |
| TOOLING-01 | an adapter test imports the port contract by name | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract" | green |
| TOOLING-15 | an adapter that keeps the contract | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that keeps the contract passes every case" | green |
| TOOLING-15 | an adapter with no provider behind it | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that hands nothing on passes as a silent provider" | green |
| TOOLING-15 | one test per case | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "the contract registers one test per case, by its title" | green |
| TOOLING-15 | an adapter that throws while disabled | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that throws while disabled fails the disabled case" | green |
| TOOLING-15 | an adapter that hands on a raw email | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that hands on a raw email fails the scrub cases" | green |
| TOOLING-15 | an adapter that delivers nothing | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that drops what it should deliver fails the scrub cases" | green |
| TOOLING-15 | an adapter that keeps the user | `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that keeps the user after setUser(null) fails the clear case" | green |
| TOOLING-16 | an import of a pruned file | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that imports a pruned file is a leak" | green |
| TOOLING-16 | an import of a removed dependency | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that imports a removed dependency is a leak" | green |
| TOOLING-16 | imports among pruned files | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an import between two pruned files is no leak" | green |
| TOOLING-16 | an Expo plugin left behind | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an Expo plugin the prune leaves that names a removed dependency is a leak" | green |
| TOOLING-16 | the patched plugin list drifts | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a patched plugin list that drifts from app.json is a leak" | green |
| TOOLING-16 | the sentry capability of this repository | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning the sentry capability of this repository leaves no dangling reference" | green |
| CORE-15 | an error is captured | `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "captureError is callable and returns undefined" | green |
| CORE-15 | a message is captured | `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "captureMessage is callable and returns undefined" | green |
| CORE-15 | an error with context | `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "captureError does not throw with context" | green |
| CORE-15 | a user and a breadcrumb | `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "the observability port contract" | green |
| CORE-26 | the no-op adapter | `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "the observability port contract" | green |
| CORE-26 | the console adapter | `packages/core/src/ports/observability/__tests__/createConsoleObservability.helper.test.ts` › "the observability port contract" | green |
| WEB-29 | an error is captured | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError forwards the exception to Sentry" | green |
| WEB-29 | an error is captured | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context before sending" | green |
| WEB-29 | the user and breadcrumbs are scrubbed | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload" | green |
| WEB-29 | the user and breadcrumbs are scrubbed | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "addBreadcrumb scrubs PII from breadcrumb data" | green |
| WEB-29 | no DSN | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "all methods no-op when the DSN is absent" | green |
| WEB-48 | a captured error reaches PostHog | `apps/web/src/lib/observability/__tests__/observability.adapter.test.ts` › "binds the PostHog adapter by default" | green |
| WEB-49 | an error | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context" | green |
| WEB-49 | a message | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level" | green |
| WEB-49 | a breadcrumb | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data" | green |
| WEB-49 | a user, then none | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest" | green |
| WEB-49 | a user, then none | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser(null) resets the identity" | green |
| WEB-50 | no key | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not initialise PostHog without a key" | green |
| WEB-50 | a key and a host | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "initialises PostHog with the key and the host from the environment" | green |
| WEB-50 | a key and no host | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host" | green |
| WEB-50 | the server | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not initialise PostHog on the server" | green |
| WEB-51 | recording and autocapture | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session recording and autocapture off" | green |
| WEB-51 | automatic exception capture | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures unhandled errors but not console errors" | green |
| WEB-51 | every event is scrubbed | `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "runs the URL scrub before every event" | green |
| WEB-52 | a page URL with a token | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "drops the query and the fragment of a page URL" | green |
| WEB-52 | an event and its person | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "scrubs every URL property of an event and of its person" | green |
| WEB-52 | heatmap data | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keys heatmap points by the scrubbed URL" | green |
| WEB-52 | other properties | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "leaves every other property untouched" | green |
| WEB-52 | a dropped event | `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "passes a dropped event through as dropped" | green |
| WEB-53 | a capability file beside the config | `apps/web/__tests__/next.config.test.ts` › "applies every next-<capability>.config.ts beside it, in name order" | green |
| WEB-53 | no capability file | `apps/web/__tests__/next.config.test.ts` › "keeps the config as built when no capability file is beside it" | green |
| WEB-53 | the web app's own folder | `apps/web/__tests__/next-sentry.config.test.ts` › "next.config.ts applies the Sentry capability's file of the web app" | green |
| WEB-53 | the Sentry wrapper | `apps/web/__tests__/next-sentry.config.test.ts` › "wraps the config with Sentry, uploading source maps only with a token" | green |
| WEB-54 | the PostHog adapter | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract" | green |
| WEB-54 | the Sentry adapter | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract" | green |
| MOBILE-47 | a captured error reaches PostHog | `apps/mobile/src/lib/observability/__tests__/observability.adapter.test.ts` › "binds the PostHog adapter by default" | green |
| MOBILE-48 | an error | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context" | green |
| MOBILE-48 | a message | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level" | green |
| MOBILE-48 | a breadcrumb | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data" | green |
| MOBILE-48 | a user, then none | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest" | green |
| MOBILE-48 | a user, then none | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser(null) resets the identity" | green |
| MOBILE-49 | no key | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "does not construct a client without a key" | green |
| MOBILE-49 | a key and a host | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "constructs one client with the key and the host from the environment" | green |
| MOBILE-49 | a key and no host | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "falls back to the US ingestion host" | green |
| MOBILE-50 | replay and lifecycle events | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "turns session replay and lifecycle events off" | green |
| MOBILE-50 | automatic exception capture on native | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "captures uncaught exceptions and unhandled rejections on native, not console errors" | green |
| MOBILE-50 | automatic exception capture on web | `apps/mobile/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "leaves uncaught exception capture off in a web bundle" | green |
| MOBILE-51 | the PostHog adapter | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract" | green |
| MOBILE-51 | the Sentry adapter | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract" | green |

## Red before green

| Rule | The failure seen first |
| ---- | ---------------------- |
| TOOLING-15 | `ERR_MODULE_NOT_FOUND`: `packages/tooling/src/observability-port-contract.mjs` did not exist |
| TOOLING-16 | `ERR_MODULE_NOT_FOUND` for `prune-boundary.mjs`; then `the manifest declares no capability "sentry"`; then, with the capability declared over the Sentry config files and adapters only, 8 leaks on the tree of `d207f1c`: `apps/web/next.config.ts` and `apps/web/instrumentation.ts` importing `@sentry/nextjs`, `instrumentation.ts` importing `./sentry.server.config` and `./sentry.edge.config`, both observability barrels re-exporting `./createSentryObservability.adapter` and both composition roots importing it |
| CORE-15, CORE-26 | The behaviour existed, so the run passed at once; with the console adapter's `setUser` scrub removed by hand it failed with `observability port contract: setUser handed raw PII to the provider`, and the source was restored |
| WEB-49 to WEB-52 | `Failed to resolve import "@/lib/posthog/scrubCaptureUrls.helper"` and `"@/lib/observability/createPostHogObservability.adapter"` |
| WEB-48 | `expected "vi.fn()" to be called once with arguments: [ Error: boom, undefined ]`: the root was still bound to Sentry |
| WEB-53 | `TypeError: applyConfigPlugins is not a function`; `Failed to resolve import "../next-sentry.config"` |
| MOBILE-48 to MOBILE-50 | `Failed to resolve import "@/lib/posthog/posthogClient.adapter"` and `"@/lib/observability/createPostHogObservability.adapter"` |
| MOBILE-47 | `expected "vi.fn()" to be called once with arguments: [ Error: boom, undefined ]` |
| WEB-29, WEB-54 and MOBILE-51 (Sentry) | The Sentry adapters already kept the contract; their runs pin it |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-17, at `c6ad4f2`.
- `pnpm --filter @app/web build`: exit 0; the build log shows Sentry's `runAfterProductionCompile`
  hook, so `next.config.ts` applied `next-sentry.config.ts`.
- `pnpm --filter @app/mobile export:web`: exit 0 (`dist-web` deleted afterwards).
- `pnpm smoke:web`: exit 0, "HTTP 200 and marker present".
- Next's own config loader (`next/dist/server/config`) builds a config identical to the one of
  `d207f1c`, `env` left out of the comparison; on this branch `env` holds Sentry's three build
  keys (`_sentryRelease` among them), which `withSentryConfig` adds.

## Not verified

- **Delivery to PostHog or Sentry from a real build.** Every adapter test replaces its SDK at the
  module, so it proves the payload the adapter hands over, not what the provider receives.
- **Server-side capture on the web with PostHog.** `posthog-js` captures in the browser only;
  `posthog-node` is not installed (out of scope).
- **The prune itself.** The executor is planned (P5 to P7). The prune was simulated in place:
  with the eleven Sentry files deleted, `tsc --noEmit` and the whole Vitest suite of both apps
  passed (103 web files, 69 mobile files) and Next's own config loader built the config without
  Sentry; the dependencies stayed installed, since no `pnpm install` ran.
- **The holes `docs/manifest.md` lists for `sentry`**, outside this change's edit surface.
