# Verify report: package-followups

> **Verified:** 2026-11-15 at `a4334a6`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| CLOUDFLARE-20 | a URL signed with the secret, before it expires | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL signImageUrl signed, before it expires" | green (green against the accept-all stub too: it guards against over-rejection) |
| CLOUDFLARE-20 | a URL either adapter signed | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL either adapter signed with its secret" | green |
| CLOUDFLARE-20 | an expired URL | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a URL whose exp has passed as expired" | green (red against the accept-all stub: `{ valid: true }`) |
| CLOUDFLARE-20 | a tampered signature | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a tampered signature as a signature mismatch" | green (red against the stub) |
| CLOUDFLARE-20 | a tampered path, query or expiry | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a tampered path as a signature mismatch" | green (red against the stub) |
| CLOUDFLARE-20 | a missing parameter | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a URL missing its exp or sig as malformed" | green (red against the stub) |
| CLOUDFLARE-20 | a signature of the wrong length | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a signature of the wrong length as malformed" | green (red against the stub) |
| CLOUDFLARE-20 | a repeated parameter, an exp that is not seconds, or no URL | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a repeated parameter, an exp that is not seconds and a string that is not a URL as malformed" | green (red against the stub) |
| CLOUDFLARE-20 | no secret | `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects every URL when no secret is configured" | green (red against the stub) |
| CLOUDFLARE-01 | a consumer imports the package | `packages/cloudflare/src/index.test.ts` › "the entry point exposes the four adapter factories and the signed-URL verifier" | green (red before `07d5251`: four exports) |
| CLOUDFLARE-06 | a wrong secret of the same length | `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects an equal-length mismatch via edge-safe constant-time compare" | green, unchanged across `8f65173` |
| CLOUDFLARE-06 | only the last character differs | `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a single trailing-character difference" | green, unchanged across `8f65173` |
| CLOUDFLARE-06 | the comparison itself | `packages/cloudflare/src/constantTimeEqual.helper.test.ts` › "isConstantTimeEqual is true for the same string only" | green (red before `8f65173`: the module did not exist) |
| CLOUDFLARE-06 | the comparison time does not depend on where the secrets differ | Not covered — timing is not observable in a unit test | not run |
| CLOUDFLARE-12 | the network is down | `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken rejects with the fetch error when siteverify cannot be reached" | green; a mutant that resolves on a fetch failure turns it red |
| CLOUDFLARE-15 | both credentials are configured | `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present" | green |
| CLOUDFLARE-15 | the exact signed URL | `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl signs the path and exp with the signing key, at a fixed time" | green before and after `0efc635` (it pins the output the move keeps) |
| CLOUDFLARE-16 | no signing key | `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl falls back to public when no signing key is set" | green (red before `908030c`: received `/img.png`) |
| CLOUDFLARE-16 | no account hash | `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl returns the raw path when no account hash is configured" | green before and after `908030c` (it pins the behaviour kept) |
| CLOUDFLARE-18 | both credentials are configured | `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present" | green |
| CLOUDFLARE-18 | the exact signed URL | `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl signs the path and exp with the secret, at a fixed time" | green before and after `0efc635` |
| TOOLING-12 | a child that started a process | `packages/tooling/src/process-tree.test.mjs` › "signalProcessTree ends a child and the process it started" | green |
| TOOLING-12 | a POSIX child that leads no group | Not covered — no test spawns a child without the options | not run |
| TOOLING-12 | the declaration names the condition | Not covered — the wording of a comment is read in review | read: `packages/tooling/src/process-tree.d.mts:6-9` |
| CORE-23 | an object that holds itself | `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces circular reference with "[circular]"" | green |
| CORE-23 | one object under two keys | `packages/core/src/utils/scrubPII.helper.test.ts` › "scrubs an object reached under two keys in both places" | green |
| CORE-23 | an array that holds itself | `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces an array that holds itself with "[circular]"" | green |
| CORE-23 | an object shared along many paths | `packages/core/src/utils/scrubPII.helper.test.ts` › "walks a shared object once however many paths reach it" | green |

Suites at `a4334a6`: packages/cloudflare 8 files, 39 tests; packages/core 10 files, 100 tests;
packages/tooling 13 tests; `eslint-local-rules/index.test.mjs` 86 tests. Typecheck and lint clean
in every workspace.

The note CORE-23 gains was checked against the code: no Sentry config of either app sets
`normalizeDepth` (`apps/web/sentry.client.config.ts:6`, `apps/web/sentry.server.config.ts:6`,
`apps/web/sentry.edge.config.ts:6`, `apps/mobile/src/lib/observability/createSentryObservability.adapter.ts:30`),
and `prepareEvent` in `@sentry/core` 10.61.0 (apps/web) and 10.75.2 (apps/mobile) defaults it to
3 and normalizes breadcrumb data, `user`, `contexts` and `extra` before `processBeforeSend` calls
`beforeSend`.

F17, outside this folder, is `6682b34`: the `package-src-alias` cases now run against packages
written to a temporary folder; seven new cases were red before it (an explicit `.ts` kept its
extension, a folder lost its index, and a missing file, a `.json` under `./src/*.ts`, an exact
key, a null target and a conditional pattern each got a fix that resolves elsewhere), and every
existing case passed before and after.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-15, at `a4334a6`. Every step before
  `verify:specs` passed (the manifest gates, `verify:lint-rules:test`, turbo 24 of 24 tasks,
  `verify:tests`, `verify:specs:test`). `verify:specs` failed on exactly one title the living
  CLOUDFLARE-12 still cites, "verifyToken does not throw an unhandled rejection on fetch
  failure", renamed by `9f9e439`; the archive replaces CLOUDFLARE-12 with this change's version.
- Every step after `verify:specs` in the `validate` script, run one by one, exit 0:
  `git-free-env:test`, `report:spec-drift:test`, `report:spec-drift` (listing packages/cloudflare,
  packages/core and packages/tooling, which the archive re-verifies), `verify:english:test`,
  `verify:english`, `verify:instruction-entry:test`, `verify:instruction-entry`,
  `codex-budget:test`, `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`,
  `verify:structure`, `verify:security`, `verify:theme-sync`, `docs:diagrams:check`, the
  `@app/i18n` test and `knip`.
- The first run, before `a4334a6`, failed at `@app/web#build`: apps/web type-checks the
  cloudflare sources with `noUncheckedIndexedAccess`, and a destructured `exp` could be
  `undefined`.

## Not verified

- A real request to Cloudflare: that Cloudflare Images refuses an unsigned URL of an image that
  requires signed URLs rests on Cloudflare's documentation, which `docs/images.md` links.
- No caller in the template serves a signed URL, so no caller calls `verifySignedImageUrl` yet;
  `docs/images.md` says where one goes.
- The POSIX branch of `signalProcessTree` on this Windows machine; its text changed, not its code.
- The timing of `isConstantTimeEqual`, which no unit test can observe.
