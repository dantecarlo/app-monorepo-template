# Verify report: 2026-11-18-web-routing-cache-seams

> **Verified:** 2026-11-18 at `a796698`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `a796698` (exit 0): the web suite 133 files and 505 tests, the mobile suite 86 files and 260 tests.
The type scenarios (`expectTypeOf`) are checked by `tsc --noEmit` of the web app, inside the same
run's `typecheck`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| WEB-73 | a navigation reaches Next's router | `apps/web/src/lib/routing/__tests__/useAppRouter.hook.test.ts` › "pushes and replaces a route and refreshes the current one through the Next router" | green |
| WEB-73 | only the app's own methods | `apps/web/src/lib/routing/__tests__/useAppRouter.hook.test.ts` › "exposes only push, refresh and replace, typed by the app" | green |
| WEB-73 | the router is stable | `apps/web/src/lib/routing/__tests__/useAppRouter.hook.test.ts` › "returns the same router across renders" | green |
| WEB-73 | the callers keep their navigation | `apps/web/src/screens/Login/hooks/__tests__/useSignIn.hook.test.ts` › "replaces the route with the home page and keeps no token" | green |
| WEB-73 | the callers keep their navigation | `apps/web/src/components/ui/LanguageSwitcher/__tests__/useLanguageSwitcher.hook.test.ts` › "cycling from en advances to es and writes the cookie" | green |
| WEB-74 | a policy reaches the framework cache | `apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts` › "hands its life profile and every tag to the framework cache, once each" | green |
| WEB-74 | every profile under its own name | `apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts` › "sets every profile of the app under its own name" | green |
| WEB-74 | the profiles are the app's own | `apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts` › "takes one of the seven life profiles Next ships, under the app's own type" | green |
| WEB-75 | a file outside the seams imports either subpath | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, 11 allowlist entries, none of `next/navigation` or `next/cache`) | green gate |
| WEB-03 | a second request reuses the cached summary | Not covered — the build and the served page below | prerendered, served |
| WEB-03 | the service sets its policy | `apps/web/src/services/ItemsSummary/__tests__/itemsSummary.service.test.ts` › "sets the minutes life profile and the items-summary tag once" | green |

### Red before green

| Task | Rule | Observed red |
| ---- | ---- | ------------ |
| T1 | a navigation reaches Next's router; only the app's own methods; the router is stable | vitest: `Failed to resolve import "@/lib/routing" from "src/lib/routing/__tests__/useAppRouter.hook.test.ts". Does the file exist?` |
| T1 | the seam of `next/navigation` | ESLint on `src/lib/routing` before the seam was narrowed: 2 errors, `'next/navigation' is infra (…), and only its seam may import it: no file yet`, in the hook and its test |
| T2 | the callers keep their navigation | the eight tests mocking `@/lib/routing` with the callers still on `next/navigation`: 28 tests failed, `Error: invariant expected app router to be mounted` |
| T3 | a policy reaches the framework cache; the profiles are the app's own; the service sets its policy | vitest: `Failed to resolve import "@/lib/cache"` from the adapter's test and from `itemsSummary.service.test.ts` |
| T3 | every profile under its own name | `DAYS` mapped to `cacheLife(CacheLifeEnum.HOURS)` on purpose: `expected [ [ 'hours' ], [ 'default' ], …(5) ] to deeply equal [ [ 'days' ], [ 'default' ], …(5) ]`; restored |
| T3 | the profiles are the app's own | `tsc --noEmit` with `cacheLife(life)` on the union: `TS2769: No overload matches this call`, since the typed routes' `next typegen` declares one `cacheLife` overload per profile name and none takes the union; the adapter maps each profile to its own overload |

## Runtime

- `pnpm --filter @app/web build`: exit 0; `/` and `/login` partially prerendered.
- `next start -p 3107` and `GET /`: HTTP 200 twice; the page holds the items summary card with
  its counts (`5 total`, `3 active`, `1 draft`), so `applyCachePolicy` ran inside the
  `'use cache'` function, where Next throws otherwise; the server log holds no error.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18.

## Not verified

- WEB-03's reuse across requests: no test runs Next's cache. The build and the served page prove
  the policy runs inside the cached function, not that a second request is served from it.
- WEB-75: no test of the app reads its imports; the seam rule and gate hold it.
