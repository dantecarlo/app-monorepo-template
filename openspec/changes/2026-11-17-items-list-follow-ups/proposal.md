# Proposal: key the items list by every value it reads, and show no count beside a failed load

> **Status:** open

## Why

The verifier of `2026-11-15-app-behaviour` left two follow-ups on the dashboards' items list,
rows F37 and F38 of `docs/INIT_AND_HARNESS_PLAN.md`:

- **F37** (both apps): "when the items query fails, the caption shows "0 results" beside the
  `ErrorState`". The list card writes the count whenever the query is not loading
  (`apps/web/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:34`,
  `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.component.tsx:35`),
  and a failed query leaves the item list empty.
- **F38** (both apps): "`useItems` keys its query by `search` only, but its `queryFn` also reads
  `limit`, so two limits share one cache entry"
  (`apps/web/src/screens/ItemsDashboard/hooks/useItems.hook.ts:56-60`,
  `apps/mobile/src/screens/ItemsDashboard/hooks/useItems.hook.ts:54-58`). WEB-08 and MOBILE-09
  state the key as `QueryKeys.items.list(search)`, so the fix changes what they state.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"

## What changes

- **The list key holds every value its query reads (F38, both apps).** `QueryKeys.items.list`
  takes one params object, `{ search, limit }`, and returns
  `['items', 'list', { limit, search }]`. `limit` is required, because the query library of an
  app cannot know a screen's default and a key that left it out would hide a value the query
  reads; an absent search is written as the empty search, which the items service reads the
  same way (`if (search)`), so both share one entry. The bare `['items', 'list']` the factory
  gave for no filter goes away: it would hide the limit. The key stays under the
  `QueryKeys.items.all` prefix, and the error report still redacts its params object whole.
- **Every caller and test follows.** Both `useItems` hooks key their query by
  `QueryKeys.items.list({ limit, search })`. The factory walk of each app
  (`apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` and its mobile twin) calls
  each factory with a probe argument of its own type, and fails when a factory has none; the
  redaction tests (`apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` and its
  mobile twin) build the list key with a search. A new hook test proves that two limits get two
  cache entries.
- **No count beside a failed load (F37, both apps).** The list card shows the ellipsis while
  the items load, the result count once they have loaded, and no caption when the query
  failed, beside the `ErrorState`.
- **Docs.** The query-key line of `docs/architecture/web.md` and `docs/architecture/mobile.md`,
  the TanStack Query example of the `arch` skill and the usage note of
  `apps/web/src/lib/query/queryKeys.constant.ts` show the new shape.

## Out of scope

- The stats card, which still shows a total of 0 when the items query fails: F37 names the
  caption beside the `ErrorState`, and WEB-04 and MOBILE-15 do not state the failure case.
- The `feature`, `screen` and `service` skills, whose generic `list(contextId)` key already
  holds the only value their sample query reads.
- `docs/code-standards.md`, which shows no list key.

## Affected specs

- `openspec/specs/apps/web/spec.md`: modifies WEB-07, WEB-08, WEB-24 and WEB-45; the evidence
  lines of WEB-04, WEB-05 and WEB-06 move with the list card at archive, their words unchanged.
- `openspec/specs/apps/mobile/spec.md`: modifies MOBILE-09, MOBILE-20, MOBILE-25 and MOBILE-43;
  the evidence lines of MOBILE-16, MOBILE-17 and MOBILE-18 move with the list card at archive,
  their words unchanged.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
