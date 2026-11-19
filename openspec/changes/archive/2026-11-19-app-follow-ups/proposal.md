# Proposal: show no counts on the stats card beside a failed load, and identify no blank id

> **Status:** archived — 2026-11-19

## Why

Two follow-ups of `docs/INIT_AND_HARNESS_PLAN.md` touch what the app specs state:

- **F43** (both apps): "when the items query fails, the stats card still shows a total of 0
  beside the `ErrorState` (F37 fixed only the list caption)". The stats card writes the counts
  whenever the query is not loading
  (`apps/web/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:27-37`,
  `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/StatsCard.component.tsx:31-46`),
  and neither dashboard hands it the failure
  (`apps/web/src/screens/ItemsDashboard/ItemsDashboard.screen.tsx:123-127`,
  `apps/mobile/src/screens/ItemsDashboard/ItemsDashboard.screen.tsx:49-53`). F37
  (`2026-11-17-items-list-follow-ups`) gave the list card the rule: the ellipsis while the items
  load, the count once they have loaded, and no caption when the query failed.
- **F50** (both apps): "test ergonomics the native review and the writer found:
  `posthog-react-native` cannot load under the mobile vitest setup (a shared alias would replace
  two per-test mocks), the Sentry adapter test leaks an env var, and `identify` takes an id it
  does not guard". The PostHog adapters hand `user.id` to `identify` as it comes
  (`apps/web/src/lib/observability/createPostHogObservability.adapter.ts:56-65`,
  `apps/mobile/src/lib/observability/createPostHogObservability.adapter.ts:58-70`). The two
  SDKs disagree on a blank id: posthog-js refuses an empty one and logs, while
  `posthog-react-native` falls back to the anonymous id and still sends the `$identify` event
  with the person properties on it.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"

## What changes

- **No counts on the stats card beside a failed load (F43, both apps).** Each dashboard hands
  the stats card the failure of the items query, as it already hands it to the list card. The
  stats card shows a dash in place of each count while the items load, the total and the active
  count once they have loaded, and, when the query failed, none of them: no total figure and its
  "total items" label, and no row of the active count and the "updated" label, whose words
  would describe counts the card no longer shows. Its header (the overview label and the live
  chip) stays.
- **A blank id identifies nobody (F50, both apps).** The PostHog adapter's `setUser` makes no
  `identify` call, and no `reset`, for a user whose id is not a string with a character other
  than whitespace: the identity PostHog holds stays as it was. Every other id is handed on as
  it is, so the port contract's "its id kept" still holds.
- **The mobile stats card's counts get render tests.** MOBILE-15's scenario was not covered;
  the new tests render the card loaded and loading.
- **F50's two other items change no requirement**, so they are small commits on this branch,
  test first, recorded by their commits: a shared `posthog-react-native` alias in
  `apps/mobile/vitest.config.ts`, and the Sentry adapter tests restoring the DSN variable they
  stub.

## Out of scope

- The live chip of the stats card, which reads "Live" beside a failed load too: F43 names the
  total, and no requirement states what the chip means.
- PostHog's own list of ids it calls hardcoded (`anonymous`, `null`, `undefined` and others),
  which posthog-js refuses and `posthog-react-native` does not: a project names its own ids, and
  F50 names a guard on the id, not a list of forbidden ones.
- The observability port contract of packages/tooling, which gains no case: the guard is the
  PostHog adapters' mapping of the port onto `identify`, and the Sentry, console and no-op
  adapters hand no id to an `identify`.
- `docs/observability.md`, whose `setUser` row (line 178) describes the mapping: it sits outside
  the edit surface of the session that builds this change, and is left to the session that
  integrates the branch.

## Affected specs

- `openspec/specs/apps/web/spec.md`: modifies WEB-07 and WEB-49.
- `openspec/specs/apps/mobile/spec.md`: modifies MOBILE-15, MOBILE-20 and MOBILE-48.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
