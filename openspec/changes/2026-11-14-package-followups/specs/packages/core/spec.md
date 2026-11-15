# Delta: packages/core

> **Change:** `2026-11-14-package-followups`

## MODIFIED Requirements

### Requirement: CORE-23 — Only a cycle is marked circular, and each object is walked once

The core package SHALL walk each object or array once, replace it with `[circular]` where the
scrub meets it again while still walking it, and give every other place that reaches it the same
scrubbed copy, which keeps the `[circular]` markers of the place that made it.

**Note:** the result therefore shares each scrubbed copy wherever the input shared the object: a
graph, not a tree. A serializer with no depth limit writes a shared copy once per path that
reaches it, so a sink that serializes the result needs a depth limit of its own. The Sentry
configs of both apps leave `normalizeDepth` at Sentry's default of 3, and Sentry (`prepareEvent`
in `@sentry/core` 10.61.0 for apps/web and 10.75.2 for apps/mobile) normalizes the data of every
breadcrumb and the `user`, `contexts` and `extra` of an event to that depth before `beforeSend`
runs, which covers every place the apps put a scrubbed value.

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
