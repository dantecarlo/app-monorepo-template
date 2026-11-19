# Verify report: 2026-11-19-capability-prune-claims

> **Verified:** 2026-11-19 at `1693f66`, the archive before this report took its proof

## Scenarios

Every test below ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `1693f66`, after the
archive: `verify:manifest:test` 37 of 37, `verify:dependency-seams:test` 41 of 41, the
`@app/tooling` suite 38 of 38, and Turborepo 24 of 24 tasks. At `993aea5`, before the archive,
the repository scenario of TOOLING-20 was red on purpose: T5 made the check, and the web and
mobile specs cited ten Sentry files until the archive moved their Sentry requirements into
apps/web/sentry and apps/mobile/sentry.

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
| TOOLING-20 | the sentry capability of this repository | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning the sentry capability of this repository leaves no dangling reference" | green after the archive; red at `993aea5` by design |
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
  TOOLING-20 repository scenario red by design until the archive.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19 at `64828b7`, the first archive, whose
  single `capabilities/sentry` spec T8 replaced.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: stopped, 2026-11-19 at `1693f66`, for a quiet window on the
  machine. Before the stop, two cases of `verify:dependency-seams:test` that start the gate as a
  child process exited `3221225794` (`0xC0000142`, the child could not start under load); the
  file alone then ran 41 of 41.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19 at `1693f66`, on the first run, with no
  `0xC0000142`.

## Proof: three prunes, before and after

Each capability was pruned in a scratch worktree (`git worktree add --detach`, then
`pnpm install --frozen-lockfile --offline`) of `0317afe`, the base, and of `1693f66` by a scratch
simulator of the planned executor: it deletes the claimed and removed files, applies the verbs,
drops the capability's regions and the registry entries it owns or a `remove-dep` takes, and
drops the capability from the manifest. Every step of `pnpm validate` then ran on its own with
`node`. A step that passes in all six runs is left out. The last row is not a validate step:
`pnpm install --lockfile-only --offline --ignore-scripts`, which asks whether the pruned workspace
still resolves.

| Gate | sentry before | sentry after | mobile-expo before | mobile-expo after | supabase before | supabase after |
| ---- | ------------- | ------------ | ------------------ | ----------------- | --------------- | -------------- |
| verify:manifest:coverage | pass | pass | pass | fail (1 stale claim) | pass | pass |
| verify:lint-rules:test | pass | fail (1 case) | fail (9 cases) | fail (9 cases) | fail (1 case) | fail (1 case) |
| verify:dependency-seams | fail (5 findings) | pass | fail (53 findings) | pass | fail (3 findings) | pass |
| `@app/tooling` test | fail (1 test) | pass | pass | pass | pass | pass |
| web build, typecheck, test | pass | pass | pass | pass | fail | fail |
| mobile typecheck, test | pass | pass | gone | gone | fail | fail |
| verify:tests | pass | pass | pass | pass | fail (1 finding) | fail (1 finding) |
| verify:specs | fail (14 findings) | pass | pass | pass | fail (20 findings) | fail (20 findings) |
| verify:maps | fail (2 dead references) | pass | fail (99) | fail (99) | fail (16) | fail (16) |
| knip | pass | pass | fail (1 unused devDependency) | fail (the same) | fail (2 unused dependencies, 4 unresolved imports) | fail (4 unresolved imports) |
| lockfile resolution | pass | fail, see below | pass | pass | fail (`@app/supabase` not in the workspace) | pass |

The `@app/tooling` failure before is the sentry test of `prune-boundary`, which named a
capability the pruned manifest no longer declares; since T2 it is skipped there.

`prune-boundary`, the new one, over the unpruned trees: `sentry` 16 leaks before (5 env keys,
1 path, 10 spec citations) and 0 after; `mobile-expo` 55 before (31 stale entries, 22 seam globs,
2 spec citations) and 2 after (the same 2 spec citations); `supabase` 27 before and 26 after (4
env keys, 6 imports, 16 spec citations).

What the after runs still find, each outside this change's edit surface or a decision for the
owner:

- **sentry, `verify:lint-rules:test`.** The rule case "a vendor SDK the old import patterns
  refused is still refused" of `eslint-local-rules/dependency-seam.cases.mjs` lints a web screen
  against the real registry and expects `@sentry/nextjs` outside its seam; once the prune takes
  the entry, the import is unregistered instead. Before this change the stale entry kept the case
  green. The case needs a package no prune removes.
- **sentry, lockfile resolution.** `ERR_PNPM_IGNORED_BUILDS` for `@sentry/cli`: the scratch tree
  was installed before its prune, and its `node_modules` still holds the CLI that the dropped
  `allowBuilds` entry used to approve. With that `node_modules` set aside the same command exits 0
  and the lockfile names no `@sentry` package. An executor that prunes an installed checkout
  meets the same error until `node_modules` goes.
- **mobile-expo, `verify:manifest:coverage`.** The kept `sentry` capability claims
  `openspec/specs/apps/mobile/sentry/spec.md`, which the `mobile-expo` prune removes, so the
  claim is stale. The class is older: before this change a `web-next` prune left six `sentry`
  claims stale (`apps/web/instrumentation.ts` and the other web root files), and after it seven.
  Either the executor drops a kept capability's claim on a path a `remove` deletes, or the app
  claims its Sentry spec and `sentry` removes it, which changes the sentence of
  `openspec/README.md` § 2.1 the owner has yet to approve.
- **mobile-expo and supabase, the rest.** Blocker B4 and the known gaps of `docs/manifest.md`: the
  lint-rule cases that read the mobile `ui/` blocks, the global map's rows, the knip
  configuration, the Supabase imports of the apps, the specs that cite the Supabase adapter tests,
  and the frozen exception of `scripts/verify-tests.mjs` for a Supabase test.

## Not verified

- WEBSENTRY-02, MOBILESENTRY-01 "delivery from a native build" and MOBILESENTRY-02 "no environment tag" stay
  `Not covered`, with the reasons the web and mobile specs gave them.
- No executor applies a prune yet (Stage 6, step 6.2). The proof prunes scratch worktrees with a
  scratch simulator of the verbs, the regions and the registry owners, outside the repository.
