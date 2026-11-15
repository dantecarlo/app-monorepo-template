# Proposal: Mark only a cycle as circular, and keep only registered query-key segments

> **Status:** open

## Why

Writing the living spec of packages/core found two defects in the helpers that keep personal
data out of error reports. They are F6 and F7 in `docs/INIT_AND_HARNESS_PLAN.md`, and Q1 to Q3
among the open questions of the spec:

- `scrubPII` walks an array without its cycle check
  (`packages/core/src/utils/scrubPII.helper.ts:62`), so an array that holds itself overflows the
  stack. It also never releases an object it has met (`packages/core/src/utils/scrubPII.helper.ts:67`),
  so an object reached under two keys, with no cycle, is reported as `[circular]` the second
  time and its data drops out of the report.
- `sanitizeQueryKey` keeps every letters-only segment of up to 24 characters
  (`packages/core/src/observability/sanitizeQueryKey.helper.ts:21`). The template's own
  `QueryKeys.items.list(search)` (`apps/web/src/lib/query/queryKeys.constant.ts:16`) puts the
  text a user types into the search box at such a position, so a search for a person's name
  reaches the error report as it was typed.

No pattern can tell a segment written by hand, such as `list`, from a value such as `alice`:
both have the same shape. Only the caller knows which segments it wrote, so the caller has to
say.

Certifipago, the project the template was taken from, fixed the first defect by taking each
object out of its visited set once it has walked it, so only an object met again while it is
still being walked becomes `[circular]`. That alone walks a shared object again for every path
that reaches it, which grows exponentially: the independent verification of this change
measured a React DOM node logged to the console, which reaches `scrubPII` through the Sentry
breadcrumb hook (`apps/web/sentry.client.config.ts:7`), running the tab out of memory. So the
template keeps the scrubbed copy of each object it has walked. Certifipago's `sanitizeQueryKey`
has the second defect too.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "Do this task here: “Fix scrubPII and sanitizeQueryKey
  (F6, F7)”"

## What changes

- packages/core: `scrubPII` walks each object or array once. It becomes `[circular]` where the
  scrub meets it again while still walking it, and every other place that reaches it gets the
  same scrubbed copy. The exported `scrubPII` loses its undocumented second parameter `_seen`,
  which no caller passes.
- packages/core: `sanitizeQueryKey` takes `structuralSegments`, the segments the caller writes
  by hand, and keeps a segment only when it is one of them. A segment nobody registered is
  redacted, so a missing registration costs detail in an error report and never leaks a value.
  The parameter is required, so a derived project that calls `sanitizeQueryKey({ queryKey })`
  fails its typecheck until it passes its own set, as both apps here do.
- apps/web and apps/mobile: `queryKeys.constant.ts` builds every key from the members of
  `QueryKeySegmentEnum` and exports `STRUCTURAL_QUERY_KEY_SEGMENTS`, the set of their values,
  which `createQueryClient` passes to `sanitizeQueryKey`. A segment added to the enum is
  registered by the same line.
- The skills `arch`, `service`, `security` and `screen` stop telling the reader to wrap a live
  query key in `sanitizeQueryKey`. That call takes no `key` argument, and a sanitized key would
  give every item the same cache entry, so a screen would show another item's data. They say
  instead that the query client sanitizes the key when it reports an error, and that a new
  segment goes in `QueryKeySegmentEnum`; `screen`, `service` and `feature` write the key of a
  new feature from that enum. `docs/maps/global-map.md` describes the sanitizer by what it now
  keeps, and the comment on `local/single-object-params` in `eslint.rules.mjs` stops citing
  `scrubPII(input, _seen)`.

## Out of scope

- Q4 of the packages/core spec, on the `messageKey` of `AppError`: it is not about either helper.
- Splitting the helpers into `.constant.ts` and `.type.ts` files, or moving `scrubPII` under
  `observability/`, as Certifipago's copy does: a move fixes nothing here.
- Certifipago's copies of both helpers: the exponential walk and the kept letters-only segments
  go to Certifipago's Arquitecto session as rows of the parity ledger.

## Affected specs

- `openspec/specs/packages/core/spec.md`: CORE-08 and CORE-23 modified.
- `openspec/specs/apps/web/spec.md`: WEB-24 modified.
- `openspec/specs/apps/mobile/spec.md`: MOBILE-25 modified.
