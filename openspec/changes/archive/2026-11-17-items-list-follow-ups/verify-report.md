# Verify report: 2026-11-17-items-list-follow-ups

> **Verified:** 2026-11-17 at `5590d72`

## Scenarios

Each task wrote its scenario tests first and ran them before the code; the red column is what
that run showed. A test of behaviour the code already had is marked as such.

| Requirement | Scenario | Test | Red before the code | Result |
| ----------- | -------- | ---- | ------------------- | ------ |
| WEB-07 | the items service rejects | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows the error state and queues no toast when the items query fails" | existing test | green |
| WEB-07 | the list header shows no count | `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state and no result count when the items failed to load" | a `span` holding "0 results" beside the alert | green |
| WEB-07 | Try again after a failure | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "loads the items again when Try again is pressed after a failure" | existing test | green |
| WEB-07 | the hook reports the failure | `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry" | existing test | green |
| WEB-08 | a search term is typed | `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "forwards search and limit to the service when search changes" | existing test | green |
| WEB-08 | two limits | `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "keeps one cache entry per limit, each with its own items" | the limit-2 hook listed 1 item: both hooks shared the key `['items', 'list']` | green |
| WEB-08 | the search box is labelled | `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "renders the search bar" | existing test | green |
| WEB-08 | the sample service filters the items | Not covered | — | — |
| WEB-24 | a query fails | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure" | existing test | green |
| WEB-24 | a query keyed by a search text | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure" | existing test, same output with the new key | green |
| WEB-24 | a typed value equal to a registered word | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list search that equals a registered segment on query failure" | renamed test, same output with the new key | green |
| WEB-24 | a mutation fails | `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure" | existing test | green |
| WEB-24 | the sink reaches the observability port | `apps/web/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError" | existing test | green |
| WEB-45 | every factory is walked | `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum" | existing test, now with a typed probe per factory; with the `detail` probe removed, the typecheck fails and the walk lists `items.detail` as unprobed | green |
| WEB-45 | the list search and limit and the detail id | `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list search and limit and the detail id in a trailing params object", "keeps the limit in the list key when no search is given" | the key was `['items', 'list', { filter: { limit, search } }]`, and held no empty search | green |
| WEB-45 | the items prefix is invalidated | `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key" | existing test | green |
| MOBILE-09 | the user types a search term | Not covered | — | — |
| MOBILE-09 | two limits | `apps/mobile/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "keeps one cache entry per limit, each with its own items" | the limit-2 hook listed 1 item: both hooks shared the key `['items', 'list']` | green |
| MOBILE-20 | a failing query | `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "adds no toast when the query fails, however many components observe it" | existing test | green |
| MOBILE-20 | the dashboard fails to load | `apps/mobile/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry" | existing test | green |
| MOBILE-20 | the list shows the failure | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state with a retry when the items failed to load" | existing test | green |
| MOBILE-20 | the caption shows no count | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state and no result count when the items failed to load" | the caption "0 listResults" beside the alert | green |
| MOBILE-25 | a query key holding an identifier | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure" | existing test | green |
| MOBILE-25 | a query keyed by a search text | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure" | existing test, same output with the new key | green |
| MOBILE-25 | a typed value equal to a registered word | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list search that equals a registered segment on query failure" | renamed test, same output with the new key | green |
| MOBILE-25 | a failing mutation | `apps/mobile/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure" | existing test | green |
| MOBILE-25 | the bridge to the port | `apps/mobile/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError" | existing test | green |
| MOBILE-43 | every factory is walked | `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum" | existing test, now with a typed probe per factory | green |
| MOBILE-43 | the list search and limit and the detail id | `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list search and limit and the detail id in a trailing params object", "keeps the limit in the list key when no search is given" | the key was `['items', 'list', { filter: { limit, search } }]`, and held no empty search | green |
| MOBILE-43 | the items prefix is invalidated | `apps/mobile/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key" | existing test | green |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-17, at `5590d72`. Every gate before
  `verify:specs` passed (turbo: 24 of 24 tasks of lint, typecheck, test, build and
  format:check). `verify:specs` failed as expected: the living specs still cite the six renamed
  titles ("redacts a list filter that equals a registered segment on query failure", "puts the
  list filter and the detail id in a trailing params object" and "keeps the bare list key when
  no filter is given", in each app) until the archive merges the deltas.
- Each gate after `verify:specs`, run one by one: exit 0 (`git-free-env:test`,
  `report:spec-drift:test`, `report:spec-drift`, `verify:english:test`, `verify:english`,
  `verify:instruction-entry:test`, `verify:instruction-entry`, `codex-budget:test`,
  `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`, `verify:structure`,
  `verify:security`, `verify:theme-sync:test`, `verify:theme-sync`, `mcp:docs:test`,
  `verify:mcp-docs:test`, `verify:mcp-docs`, `verify:ticket-branch:test`, `verify:skills:test`,
  `docs:diagrams:check`, the `@app/i18n` tests and `knip`).
- `ATL_TEMPLATE_SELF=1 pnpm validate` runs again after the archive.

## Not verified

- WEB-08 "the sample service filters the items" and MOBILE-09 "the user types a search term"
  stay `Not covered`, for the reasons their scenarios give.
- No screen renders two limits at once today, so the shared entry was never visible in the
  running app; the hook tests prove it under one query client.
- The stats card still shows a total of 0 when the items query fails: out of scope.
