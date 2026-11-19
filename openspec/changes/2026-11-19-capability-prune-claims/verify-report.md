# Verify report: 2026-11-19-capability-prune-claims

> **Verified:** 2026-11-19 at `993aea5`

## Scenarios

Every test below ran in `ATL_TEMPLATE_SELF=1 pnpm validate` at `993aea5`, or on its own with
`node --test` where that run stopped first: `verify:manifest:test` 37 of 37,
`verify:dependency-seams:test` 41 of 41, the `@app/tooling` suite 36 of 37. The one red is the
repository scenario of TOOLING-20, which T5 turned red on purpose: the web and mobile specs cite
ten Sentry files until the archive moves their Sentry requirements into apps/web/sentry and
apps/mobile/sentry.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TOOLING-17 | an entry the capability owns | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an entry the pruned capability owns goes with its package" | green |
| TOOLING-17 | a remove-dep takes the entry | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a remove-dep takes the entries of a package it removes from its last package.json" | green |
| TOOLING-17 | a kept entry whose package goes | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept entry whose package no kept package.json declares is a leak" | green |
| TOOLING-17 | a kept seam glob with no file left | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept seam glob that matches no kept file is a leak" | green |
| TOOLING-17 | a kept dependency whose entry goes | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept dependency whose entry the prune removes is a leak" | green |
| TOOLING-17 | the three prunes of this repository | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry, mobile-expo or supabase of this repository leaves the registry true" | green |
| TOOLING-18 | a test the prune deletes | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that cites a pruned test is a leak" | green |
| TOOLING-18 | an evidence or governed path | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that governs or cites a pruned file as evidence is a leak" | green |
| TOOLING-18 | the Sentry specs of this repository after an app prune | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning mobile-expo or web-next of this repository leaves no Sentry spec citing a pruned file" | green |
| TOOLING-19 | a relative path string | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that names a pruned file by a relative path is a leak" | green |
| TOOLING-19 | an orphaned environment key | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept .env.example key that only pruned files read is a leak" | green |
| TOOLING-20 | a leak inside a region | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a leak inside a region of the pruned capability is no leak" | green |
| TOOLING-20 | the sentry capability of this repository | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning the sentry capability of this repository leaves no dangling reference" | red until the archive, by design |
| SEAM-01 | a non-core entry without a seam | `scripts/verify-dependency-seams.test.mjs` › "a non-core entry without a seam is malformed" | green |
| SEAM-01 | an unknown category | `scripts/verify-dependency-seams.test.mjs` › "an entry with an unknown category is malformed" | green |
| SEAM-01 | a package listed twice | `scripts/verify-dependency-seams.test.mjs` › "a registry that names one package twice is malformed" | green |
| SEAM-01 | an entry that names its owner | `scripts/verify-dependency-seams.test.mjs` › "an entry that names its owner passes" | green |
| SEAM-01 | an owner that is not text | `scripts/verify-dependency-seams.test.mjs` › "an entry whose owner is not text is malformed" | green |
| WEB-53 | a capability file beside the config | `apps/web/__tests__/next.config.test.ts` › "applies every next-<capability>.config.ts beside it, in name order" | green |
| WEB-53 | no capability file | `apps/web/__tests__/next.config.test.ts` › "keeps the config as built when no capability file is beside it" | green |
| WEB-54 | the PostHog adapter | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract" | green |
| MOBILE-51 | the PostHog adapter | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract" | green |
| WEBSENTRY-01 | an error is captured | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError forwards the exception to Sentry", "captureError scrubs PII from the context before sending" | green |
| WEBSENTRY-01 | the user and breadcrumbs are scrubbed | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload", "addBreadcrumb scrubs PII from breadcrumb data" | green |
| WEBSENTRY-01 | no DSN | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "all methods no-op when the DSN is absent" | green |
| WEBSENTRY-02 | an event leaves the app | Not covered | — |
| WEBSENTRY-03 | the web app's own folder | `apps/web/__tests__/next-sentry.config.test.ts` › "next.config.ts applies the Sentry capability's file of the web app" | green |
| WEBSENTRY-03 | the Sentry wrapper | `apps/web/__tests__/next-sentry.config.test.ts` › "wraps the config with Sentry, uploading source maps only with a token" | green |
| MOBILESENTRY-01 | an error context with an email | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context" | green |
| MOBILESENTRY-01 | the user payload | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload" | green |
| MOBILESENTRY-01 | an automatically captured event | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeSend that scrubs auto-captured events" | green |
| MOBILESENTRY-01 | an automatically captured breadcrumb | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeBreadcrumb that scrubs auto-captured breadcrumbs" | green |
| MOBILESENTRY-01 | delivery from a native build | Not covered | — |
| MOBILESENTRY-02 | no DSN | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "methods no-op when the DSN is absent" | green |
| MOBILESENTRY-02 | no environment tag | Not covered | — |
| WEBSENTRY-04 | the Sentry adapter | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract" | green |
| MOBILESENTRY-03 | the Sentry adapter | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract" | green |

The coverage gate's rules, which no living spec states yet (the manifest gates are among the
harness units `openspec/README.md` § 2.1 lists as not specified), ran green in
`scripts/manifest.test.mjs`: the owner engine's four cases, the region engine's five, and the gate
run as a process over a scratch git repository for a clean tree, an unclaimed file, unowned
entries and regions it cannot drop.

## Every red seen first

| Task | Test or gate | Failure seen before the code |
| ---- | ------------ | ---------------------------- |
| T1 | "an entry that names its owner passes" | expected 0 finding(s), got 3: each `owner` was a key the registry does not define |
| T1 | "an entry whose owner is not text is malformed" | the detail read "has keys the registry does not define: owner" |
| T1 | the owner engine's cases | `./manifest.mjs` exported no `analyzeRegistryOwners` |
| T1 | the gate cases for owners | the gate exited 0 over unowned entries, and its PASS line named no registry |
| T1 | `node scripts/verify-manifest-coverage.mjs` | UNOWNED ENTRIES (100) before the owners were written |
| T2 | the three registry cases | no registry finding existed |
| T2 | "a remove-dep takes the entries of a package it removes from its last package.json" | `@vendor/sdk` and `@vendor/sdk/server` listed stale, and the seam of `@vendor/sdk` |
| T2 | the registry of this repository | the `mobile-expo` prune left `@sentry/react-native` stale with its seam while its owner was `sentry`; the `supabase` prune left five dependencies unregistered in both apps' `package.json` |
| T3 | the region engine's cases | `./manifest.mjs` exported no `analyzeRegions` |
| T3 | "a leak inside a region of the pruned capability is no leak" | both files were listed |
| T4 | the path and env cases | no `path` or `env` finding existed |
| T4 | the sentry prune of this repository | five `.env.example` keys (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_APP_ENV`) and `./src/test/mocks/sentry-react-native.ts` in `apps/mobile/vitest.config.ts` |
| T5 | the two spec cases | no `spec` finding existed |
| T5 | the sentry prune of this repository | the web spec cited eight Sentry files and the mobile spec two |
| T8 | "pruning mobile-expo or web-next of this repository leaves no Sentry spec citing a pruned file" | run against the first archive (one capabilities/sentry spec, `64828b7`): the `mobile-expo` prune left it citing 2 mobile Sentry files and the `web-next` prune 8 web ones |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-19 at `993aea5` — `@app/tooling#test`, the
  TOOLING-20 repository scenario red by design until the archive; the archive records the run
  that follows it.

## Not verified

- WEBSENTRY-02, MOBILESENTRY-01 "delivery from a native build" and MOBILESENTRY-02 "no environment tag" stay
  `Not covered`, with the reasons the web and mobile specs gave them.
- No executor applies a prune yet (Stage 6, step 6.2). The proof prunes scratch worktrees with a
  scratch simulator of the verbs, the regions and the registry owners, outside the repository.
