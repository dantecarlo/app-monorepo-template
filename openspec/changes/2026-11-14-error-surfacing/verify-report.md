# Verify report: 2026-11-14-error-surfacing

> **Verified:** 2026-11-14 at `5cc5333`

## Scenarios

Each task wrote its scenario tests first and ran them before the code; the red column is what
that run showed. A test of behaviour the code already had is marked as such.

| Requirement | Scenario | Test | Red before the code | Result |
| ----------- | -------- | ---- | ------------------- | ------ |
| WEB-26 | a query fails | `apps/web/src/lib/query/useAppQuery.hook.test.ts` › "fires an error toast with the override message on failure" | existing test | green |
| WEB-26 | a failed query re-renders | `apps/web/src/lib/query/useAppQuery.hook.test.ts` › "queues one error toast per failure however often it re-renders" | expected one call, got 3 | green |
| WEB-26 | the query fails again | `apps/web/src/lib/query/useAppQuery.hook.test.ts` › "queues another error toast when the query fails again" | green on the old code too: a guard that the fix keeps the second failure | green |
| WEB-26 | a mutation fails or succeeds | `apps/web/src/lib/query/useAppMutation.hook.test.ts` › "shows an error toast with the override message on failure", "shows a success toast when successMessage is provided" | existing tests | green |
| WEB-26 | a toast expires | `apps/web/src/stores/toast.store.test.ts` › "toast auto-dismisses after 4 seconds" | existing test | green |
| WEB-37 | a queued error toast is shown and dismissed | `apps/web/src/app/providers.test.tsx` › "shows a queued error toast and removes it when Dismiss is pressed" | no element with the role `status`: no viewport mounted | green |
| WEB-37 | no toast is queued | `apps/web/src/components/ui/Toast/Toast.component.test.tsx` › "renders an empty live region when there are no toasts" | existing test | green |
| WEB-38 | a route crashes while rendering | `apps/web/src/app/error.test.tsx` › "renders the generic error state for a render crash", "retries the segment when Try again is pressed" | `@/app/error` does not resolve: no boundary ships | green |
| WEB-38 | the root layout crashes | `apps/web/src/app/global-error.test.tsx` › "renders the generic error state in its own document" | `@/app/global-error` does not resolve | green |
| MOBILE-20 | a failing query with an override message | `apps/mobile/src/lib/query/useAppQuery.hook.test.ts` › "fires an error toast with the override message on failure" | existing test | green |
| MOBILE-20 | a failed query re-renders | `apps/mobile/src/lib/query/useAppQuery.hook.test.ts` › "adds one error toast per failure however often it re-renders" | expected one call, got 3 | green |
| MOBILE-20 | the query fails again | `apps/mobile/src/lib/query/useAppQuery.hook.test.ts` › "adds another error toast when the query fails again" | green on the old code too, as on web | green |
| MOBILE-20 | the dashboard fails to load | Not covered | — | — |
| MOBILE-36 | a toast is added while a route is shown | `apps/mobile/src/app/_layout.test.tsx` › "shows a toast added to the store over the routes" | no element with the role `alert`: no viewport mounted; re-run red with the mount line removed after the fix | green |
| MOBILE-36 | the toast is dismissed | `apps/mobile/src/components/ui/Toast/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed" | the component already removed the toast; the test became possible with the `react-native` test double | green |
| MOBILE-37 | a route crashes while rendering | `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.test.tsx` › "renders the generic error state for a render crash", "calls retry when the retry control is pressed" | `./RootErrorBoundary.component` does not resolve | green |
| MOBILE-37 | the root layout exports the boundary | `apps/mobile/src/app/_layout.test.tsx` › "exports the root error boundary as its ErrorBoundary" | `@/components/RootErrorBoundary` does not resolve | green |

The old `useAppQuery` did queue the second failure's toast: it is deferred through a zero-delay
timer that runs after the query client's own notification timer, so the "fails again" tests wait
for the second call instead of flushing timers once.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, at `5cc5333` (turbo 24 of 24 tasks,
  10 from the cache; web 278 tests, mobile 123; `next build` compiled `error.tsx` and
  `global-error.tsx`).
- The gates after `verify:specs`, run one by one at `5cc5333`, each exit 0: `verify:specs`,
  `git-free-env:test`, `report:spec-drift:test`, `report:spec-drift` (lists apps/web and
  apps/mobile behind `9afce2d`, which the archive re-verifies), `verify:english:test`,
  `verify:english`, `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`,
  `verify:structure`, `verify:security`, `verify:theme-sync`, `docs:diagrams:check`,
  `pnpm --filter @app/i18n test`, `knip`.

## Not verified

- That Next mounts `error.tsx` and `global-error.tsx` around a route that really throws: the
  tests render the two boundaries directly, and no test or smoke runs the App Router with a
  crashing route.
- That Expo Router wraps the root layout in its exported `ErrorBoundary`: the test checks the
  export; the wrapping is `fromImport` in `expo-router/build/useScreens.js`, read, not run.
- Native rendering: mobile tests render `View`, `Text` and `Pressable` through the DOM test double,
  so the toast pill and the boundary were not seen on a device; `pnpm smoke:mobile` and
  `pnpm smoke:web` (CI-only jobs) were not run.
- MOBILE-20 "the dashboard fails to load": the sample service never rejects, as before.
