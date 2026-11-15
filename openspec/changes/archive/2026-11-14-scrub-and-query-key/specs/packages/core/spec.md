# Delta: packages/core

> **Change:** `2026-11-14-scrub-and-query-key`

## MODIFIED Requirements

### Requirement: CORE-08 — Only registered query-key segments survive

The core package SHALL keep a query-key segment only when it is a string the caller lists in
`structuralSegments`, and replace every other segment with `[redacted]`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: registered segments

- **GIVEN** the key `['items', 'list']`, with `items` and `list` registered
- **WHEN** it is sanitized
- **THEN** both segments are kept
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "keeps the segments the caller registers"

#### Scenario: an id segment

- **GIVEN** a key holding a uuid between two registered segments
- **WHEN** it is sanitized
- **THEN** the uuid becomes `[redacted]` and the registered segments stay
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts a uuid-like dynamic segment"

#### Scenario: a segment with digits

- **GIVEN** the key `['users', 'abc123']`, with `users` registered
- **WHEN** it is sanitized
- **THEN** `abc123` becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts segments containing digits"

#### Scenario: a filter object

- **GIVEN** a key holding the object `{ role: 'admin' }`
- **WHEN** it is sanitized
- **THEN** the object becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts object filter segments"

#### Scenario: a number segment

- **GIVEN** the key `['page', 0]`, with `page` registered
- **WHEN** it is sanitized
- **THEN** the number becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts numeric segments"

#### Scenario: a letters-only value

- **GIVEN** a lowercase username such as `alice` and a camelCase value such as `itemDetail`,
  neither of them registered
- **WHEN** they are sanitized
- **THEN** both become `[redacted]`, although they have the shape of a segment written by hand
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts a letters-only segment the caller did not register"

### Requirement: CORE-23 — Only a cycle is marked circular, and each object is walked once

The core package SHALL walk each object or array once, replace it with `[circular]` where the
scrub meets it again while still walking it, and give every other place that reaches it the same
scrubbed copy, which keeps the `[circular]` markers of the place that made it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an object that holds itself

- **GIVEN** an object whose `self` key holds the object itself
- **WHEN** it is scrubbed
- **THEN** `self` holds `[circular]` and the other keys are kept
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces circular reference with "[circular]""

#### Scenario: one object under two keys

- **GIVEN** an object whose keys `a` and `b` hold the same inner object, which holds an `email`
  and an `id`, with no cycle
- **WHEN** it is scrubbed
- **THEN** `a` and `b` both hold the scrubbed inner object: the `email` redacted and the `id`
  kept
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "scrubs an object reached under two keys in both places"

#### Scenario: an array that holds itself

- **GIVEN** an array whose only element is the array itself
- **WHEN** it is scrubbed
- **THEN** the result is an array whose element is `[circular]`, and nothing throws
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces an array that holds itself with "[circular]""

#### Scenario: an object shared along many paths

- **GIVEN** an object with a getter, at the bottom of a ladder of 16 levels where each level
  holds the one below under two keys, so 65 536 paths reach it
- **WHEN** the top of the ladder is scrubbed
- **THEN** the getter is read once
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "walks a shared object once however many paths reach it"
