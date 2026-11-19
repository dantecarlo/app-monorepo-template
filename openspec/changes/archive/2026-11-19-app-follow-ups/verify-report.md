# Verify report: 2026-11-19-app-follow-ups

> **Verified:** 2026-11-19 at `fa86098`

## Scenarios

Each task wrote its scenario tests first and ran them before the code; the red column is what
that run showed. A test of behaviour the code already had is marked as such.

| Requirement | Scenario | Test | Red before the code | Result |
| ----------- | -------- | ---- | ------------------- | ------ |
| WEB-07 | the items service rejects | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows the error state and queues no toast when the items query fails" | existing test | green |
| WEB-07 | the list header shows no count | `apps/web/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state and no result count when the items failed to load" | existing test | green |
| WEB-07 | the dashboard's stats card shows no total | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows no total on the stats card when the items query fails" | the total figure, a `p` holding "0", beside the alert | green |
| WEB-07 | the stats card shows no count | `apps/web/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows no total and no active count when the items failed to load" | the total figure, a `p` holding "0" | green |
| WEB-07 | Try again after a failure | `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "loads the items again when Try again is pressed after a failure" | existing test | green |
| WEB-07 | the hook reports the failure | `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry" | existing test | green |
| WEB-49 | an error | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context" | existing test | green |
| WEB-49 | a message | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level" | existing test | green |
| WEB-49 | a breadcrumb | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data" | existing test | green |
| WEB-49 | a user, then none | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest", "setUser(null) resets the identity" | existing tests | green |
| WEB-49 | a blank id | `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies nobody for a blank id" | `identify` received `''`, `'   '`, `'\t\n'` and `undefined`, each with the email redacted | green |
| MOBILE-15 | the sample list has loaded | `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows the total and the active count once the items have loaded" | behaviour the code already had; the scenario was not covered | green |
| MOBILE-15 | the items are loading | `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows a dash in place of each count while loading" | behaviour the code already had | green |
| MOBILE-20 | a failing query | `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "adds no toast when the query fails, however many components observe it" | existing test | green |
| MOBILE-20 | the dashboard fails to load | `apps/mobile/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry" | existing test | green |
| MOBILE-20 | the list shows the failure | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state with a retry when the items failed to load" | existing test | green |
| MOBILE-20 | the caption shows no count | `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the error state and no result count when the items failed to load" | existing test | green |
| MOBILE-20 | the dashboard's stats card shows no total | `apps/mobile/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows no total on the stats card when the items failed to load" | the total figure, a `span` holding "0" | green |
| MOBILE-20 | the stats card shows no count | `apps/mobile/src/screens/ItemsDashboard/components/StatsCard/__tests__/StatsCard.component.test.tsx` › "shows no total and no active count when the items failed to load" | the total figure, a `span` holding "0" | green |
| MOBILE-48 | an error | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureError sends the exception with the scrubbed context" | existing test | green |
| MOBILE-48 | a message | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "captureMessage sends a log record at the mapped level" | existing test | green |
| MOBILE-48 | a breadcrumb | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "addBreadcrumb adds an exception step with the scrubbed data" | existing test | green |
| MOBILE-48 | a user, then none | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies the id with the scrubbed rest", "setUser(null) resets the identity" | existing tests | green |
| MOBILE-48 | a blank id | `apps/mobile/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "setUser identifies nobody for a blank id" | `identify` received the four blank ids after `u1` | green |

The port contract of packages/tooling still passes against both PostHog adapters and both Sentry
adapters (WEB-54, MOBILE-51), each under its `the observability port contract` describe.

The two small F50 commits on this branch change no requirement, and each saw its red first:

- `53945c6` (the `posthog-react-native` alias): with the root layout test's observability mock
  removed, and the binding test's package mock removed, both files failed to load with
  `SyntaxError: Unexpected token 'typeof'`, the Flow source the package imports; with the alias,
  both pass.
- `fa86098` (the Sentry DSN variable): the new `afterAll` check failed the web file with
  `expected 'undefined' to be undefined` on a plain run, and the mobile file with
  `expected undefined to be 'https://preset@sentry.io/9'` on a run with the DSN set before it;
  with `vi.stubEnv` and `vi.unstubAllEnvs`, both files pass on a plain run and with the DSN set.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19, at `fa86098`; `report:spec-drift` lists apps/web and apps/mobile, every file it names changed on this branch, and the archive re-verifies both.

## Not verified

- The stats card on a device or in a browser: the tests render it under happy-dom, the mobile
  one with react-native aliased to its pass-through mock.
- An id PostHog itself calls hardcoded (`anonymous`, `null` and others): the guard refuses a
  blank id only, by the proposal's scope.
