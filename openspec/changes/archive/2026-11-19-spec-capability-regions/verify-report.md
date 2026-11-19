# Verify report: 2026-11-19-spec-capability-regions

> **Verified:** 2026-11-19 at `dd38b99`, with the archive applied on top

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| WEB-81 | an error is captured | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError forwards the exception to Sentry", "captureError scrubs PII from the context before sending" | green |
| WEB-81 | the user and breadcrumbs are scrubbed | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload", "addBreadcrumb scrubs PII from breadcrumb data" | green |
| WEB-81 | no DSN | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "all methods no-op when the DSN is absent" | green |
| WEB-82 | an event leaves the app | Not covered | — |
| WEB-83 | the web app's own folder | `apps/web/__tests__/next-sentry.config.test.ts` › "next.config.ts applies the Sentry capability's file of the web app" | green |
| WEB-83 | the Sentry wrapper | `apps/web/__tests__/next-sentry.config.test.ts` › "wraps the config with Sentry, uploading source maps only with a token" | green |
| WEB-84 | the Sentry adapter | `apps/web/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract" | green |
| MOBILE-80 | an error context with an email | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "captureError scrubs PII from the context" | green |
| MOBILE-80 | the user payload | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "setUser scrubs PII from the user payload" | green |
| MOBILE-80 | an automatically captured event | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeSend that scrubs auto-captured events" | green |
| MOBILE-80 | an automatically captured breadcrumb | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "Sentry.init registers beforeBreadcrumb that scrubs auto-captured breadcrumbs" | green |
| MOBILE-80 | delivery from a native build | Not covered | — |
| MOBILE-81 | no DSN | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "methods no-op when the DSN is absent" | green |
| MOBILE-81 | no environment tag | Not covered | — |
| MOBILE-82 | the Sentry adapter | `apps/mobile/src/lib/observability/__tests__/createSentryObservability.adapter.test.ts` › "the observability port contract" | green |
| TOOLING-18 | a test the prune deletes | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that cites a pruned test is a leak" | green |
| TOOLING-18 | an evidence or governed path | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that governs or cites a pruned file as evidence is a leak" | green |
| TOOLING-18 | the Sentry part of this repository's app specs | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry of this repository drops the Sentry part of each app spec with its region" | green |
| TOOLING-18 | an app prune of this repository, Sentry kept | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning mobile-expo or web-next of this repository leaves no sentry claim on a spec stale" | green |

The web and mobile Sentry tests ran with Vitest in each app: 13 of 13 in the two web files and
11 of 11 in the mobile file. The rows of WEB-81 to WEB-84 and MOBILE-80 to MOBILE-82 are the
scenarios of WEBSENTRY-01 to WEBSENTRY-04 and MOBILESENTRY-01 to MOBILESENTRY-03, moved unchanged.

## Every red seen first

| Rule | Test | Red before the change |
| ---- | ---- | --------------------- |
| `parseSpec` reads every `Governs` line | `scripts/verify-specs.test.mjs` › "a spec reads the union of its Governs lines, region markers between them" | `governs` was `` `pkg/vendor.ts` ``, the last line only |
| A spec needs one `Governs` line naming a path, not the last | `scripts/verify-specs.test.mjs` › "a Governs line naming no path beside one naming a path fires nothing" | 1 finding, expected 0 |
| `report:spec-drift` reads every `Governs` line | `scripts/report-spec-drift.test.mjs` › "the anchor reads the governed paths of every Governs line, in order" | `governed` was `src/vendor.ts` only |
| `report:spec-drift` measures every governed path | `scripts/report-spec-drift.test.mjs` › "a spec is measured against the paths of every Governs line" | `governed` was `vendor/` only, so `core/a.ts` was never seen |
| The Sentry part of each app spec sits in its region | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry of this repository drops the Sentry part of each app spec with its region" | at `dd38b99`, with the regions kept no app spec cited a Sentry file (`[]`, expected both) |
| No app prune leaves a sentry claim on a spec stale | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning mobile-expo or web-next of this repository leaves no sentry claim on a spec stale" | at `dd38b99`, two: `openspec/specs/apps/mobile/sentry/spec.md` after `mobile-expo`, `openspec/specs/apps/web/sentry/spec.md` after `web-next` |

Three cases pin the behaviour the parser change touches, and passed before it as after: "a spec
whose every Governs line names no backticked path fires", "region markers between the header
lines and between the requirements fire nothing" and "a requirement inside a region is checked
like any other". Between `dd38b99` and the archive, `verify:specs` failed on the TOOLING-18 test
title T3 replaced, as the task line records.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19, on the archive tree before its commit; lint
  printed warnings only, in `@app/tokens`, `@app/mobile` and `@app/web`, none in a file this change
  touches.

## Proof: three prunes, before and after

Measured with `packages/tooling/src/prune-boundary.mjs` and the coverage engine of
`scripts/manifest.mjs` on every tracked file, at `1eb2198`, the base, and on the archive: the
pruned files are the ones the capability claims or removes, its regions are dropped from every
kept file, and the capability leaves the manifest.

| Prune | prune-boundary findings, before | after | stale claims, before | after |
| ----- | ------------------------------- | ----- | -------------------- | ----- |
| `sentry` | 0 | 0 | 0 | 0 |
| `mobile-expo` | 2 | 2 | 1 | 0 |
| `web-next` | 11 | 11 | 7 | 6 |

The two `mobile-expo` findings and the eleven `web-next` ones are F65's, the same before and
after: other units' specs that cite app files (2 and 9), and the `@app/cloudflare` entry of the
registry with its seam glob after a `web-next` prune (2). The stale claim the
`mobile-expo` prune lost is the `sentry` claim on `openspec/specs/apps/mobile/sentry/spec.md`;
the one the `web-next` prune lost is the claim on `openspec/specs/apps/web/sentry/spec.md`.

`verify:specs` and `report:spec-drift` on the base and on the archive differ only in the count of
living specs, 13 before and 11 after; the new parser run on the base data prints the same bytes as
the base parser.

## Not verified

- WEB-82 "an event leaves the app", MOBILE-80 "delivery from a native build" and MOBILE-81 "no
  environment tag" stay Not covered, with the reasons their scenarios give.
- The six web root files of F64: after a `web-next` prune, the `sentry` claims on
  `apps/web/instrumentation.ts`, `apps/web/next-sentry.config.ts`, the three
  `apps/web/sentry.*.config.ts` and `apps/web/__tests__/next-sentry.config.test.ts` stay stale
  until the prune executor drops a claim on a file it removes.
- The comment on `readSpecAnchor` in `scripts/spec-drift.detect.mjs` still speaks of "its Governs
  line"; the file sat outside this change's edit surface, and its code reads the union unchanged.
