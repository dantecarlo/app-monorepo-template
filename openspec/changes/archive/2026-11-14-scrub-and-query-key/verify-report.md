# Verify report: scrub-and-query-key

> **Verified:** 2026-11-14 at `94cc114`

## Scenarios

| Requirement | Scenario                            | Test                                                                                                                   | Result |
| ----------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| CORE-08     | registered segments                 | `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "keeps the segments the caller registers"          | green  |
| CORE-08     | an id segment                       | `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts a uuid-like dynamic segment"              | green  |
| CORE-08     | a segment with digits               | `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts segments containing digits"               | green  |
| CORE-08     | a filter object                     | `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts object filter segments"                   | green  |
| CORE-08     | a number segment                    | `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts numeric segments"                         | green  |
| CORE-08     | a letters-only value                | `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts a letters-only segment the caller did not register" | green (red before `7fec107`: `alice` and `itemDetail` kept) |
| CORE-23     | an object that holds itself         | `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces circular reference with "[circular]""                     | green  |
| CORE-23     | one object under two keys           | `packages/core/src/utils/scrubPII.helper.test.ts` › "scrubs an object reached under two keys in both places"          | green (red before `02635b3`: `b` was `[circular]`) |
| CORE-23     | an array that holds itself          | `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces an array that holds itself with "[circular]""            | green (red before `02635b3`: `RangeError`) |
| CORE-23     | an object shared along many paths   | `packages/core/src/utils/scrubPII.helper.test.ts` › "walks a shared object once however many paths reach it"          | green (red at `02635b3`: 65 536 reads) |
| WEB-24      | a query fails                       | `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure" | green |
| WEB-24      | a query keyed by a search text      | `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure" | green (red before `7fec107`: `alice` kept) |
| WEB-24      | a mutation fails                    | `apps/web/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure" | green |
| WEB-24      | the sink reaches the observability port | `apps/web/src/lib/observability/toCaptureError.helper.test.ts` › "forwards error and context to captureError"      | green  |
| MOBILE-25   | a query key holding an identifier   | `apps/mobile/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure" | green |
| MOBILE-25   | a query keyed by a search text      | `apps/mobile/src/lib/query/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure" | green (red before `7fec107`: `alice` kept) |
| MOBILE-25   | a failing mutation                  | `apps/mobile/src/lib/query/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure" | green |
| MOBILE-25   | the bridge to the port              | `apps/mobile/src/lib/observability/toCaptureError.helper.test.ts` › "forwards error and context to captureError"    | green  |

Suites at `94cc114`: packages/core 10 files, 100 tests; apps/web 78 files, 274 tests; apps/mobile
54 files, 118 tests. Typecheck and lint clean in all three.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-14. Turbo ran 24 of 24 tasks green and
  `verify:tests` passed; `verify:specs` failed on exactly two titles that the living CORE-08
  still cites, "keeps short lowercase structural segments" (renamed to "keeps the segments the
  caller registers") and "redacts segments that exceed the structural length limit" (deleted:
  no length rule remains, and an unregistered segment of any length is redacted). The archive
  replaces CORE-08 with this change's version, which cites neither.
- Every step after `verify:specs` in the `validate` script, run one by one, exit 0:
  `git-free-env:test`, `report:spec-drift:test`, `verify:english:test`, `verify:english`,
  `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`, `verify:structure`,
  `verify:security`, `verify:theme-sync`, `docs:diagrams:check`, `knip`, and the
  `@app/i18n` test.

## Independent verification

A fresh-context verifier read the whole change folder against `46f282d`, attacked both helpers
and returned one blocker. B1: taking each object out of the visited set once walked, as
`02635b3` did after Certifipago's copy, walked a shared object again for every path to it. A
React DOM node scrubbed as a console breadcrumb ran out of memory at a tree depth of 8 in
production React. `94cc114` keeps the scrubbed copy of each walked object; the recheck, limited
to B1, measured 1 ms at that depth and 0 ms on a 22-level ladder, and found every remaining
output difference from the base to be one F6 asks for. Its advisory note, that a shared copy
keeps the `[circular]` markers of the place that made it, is now part of CORE-23.

Non-blocking findings it raised and their outcome: the comments and skills no longer say a bare
string is always redacted (a bare string equal to an enum value is kept); the proposal now names
the removed `_seen` parameter and the required `structuralSegments`, which breaks a derived
project's `sanitizeQueryKey({ queryKey })` at typecheck; the `eslint.rules.mjs` comment no
longer cites `scrubPII(input, _seen)`.

## Not verified

- Certifipago's copies of both helpers, which this change does not touch; they go to its
  Arquitecto as rows of the parity ledger.
- The apps in a running browser or device: the capture path is covered by the query client
  tests, which use the real TanStack Query cache, not a rendered app.
