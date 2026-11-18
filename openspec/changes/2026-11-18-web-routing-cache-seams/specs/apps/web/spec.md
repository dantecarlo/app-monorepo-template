# Delta: apps/web

> **Change:** `2026-11-18-web-routing-cache-seams`

## ADDED Requirements

### Requirement: WEB-73 — A client block navigates through the app's router

The web app SHALL give a client block its router through `useAppRouter` of
`src/lib/routing/`, typed by the app's own `IAppRouter`: `push(href)` navigates to a route of the
app adding a history entry, `replace(href)` navigates replacing the current one, and `refresh()`
renders the current route again on the server, each handed to Next's router with that one
argument; it SHALL expose only those three methods, and return the same router across renders
while Next's router is the same. An `href` is an `AppRouteType`, a path the typed routes of
`next.config.ts` check. The sign-in mutation replaces the route and the language switcher
refreshes it through this router (WEB-13, WEB-16).

**Evidence:** written at apply time, when the code exists.

#### Scenario: a navigation reaches Next's router

- **GIVEN** the app's router over a Next router whose methods are spies
- **WHEN** a block pushes `/login`, replaces the route with `/` and refreshes
- **THEN** Next's `push` receives `/login` once, its `replace` receives `/` once, and its
  `refresh` runs once with no argument
- **Test:** `apps/web/src/lib/routing/__tests__/useAppRouter.hook.test.ts` › "pushes and replaces a route and refreshes the current one through the Next router"

#### Scenario: only the app's own methods

- **GIVEN** the app's router over a Next router that also has `prefetch`, `back` and `forward`
- **WHEN** its methods are listed and its type is read
- **THEN** it has `push`, `refresh` and `replace` only, and its type is `IAppRouter`
- **Test:** `apps/web/src/lib/routing/__tests__/useAppRouter.hook.test.ts` › "exposes only push, refresh and replace, typed by the app"

#### Scenario: the router is stable

- **GIVEN** a block that reads the app's router
- **WHEN** it renders again with the same Next router
- **THEN** it receives the same router object
- **Test:** `apps/web/src/lib/routing/__tests__/useAppRouter.hook.test.ts` › "returns the same router across renders"

#### Scenario: the callers keep their navigation

- **GIVEN** the sign-in mutation and the language switcher, with `@/lib/routing` mocked through
  `createRoutingDouble` of `apps/web/src/test/routing.helper.ts`
- **WHEN** a sign-in succeeds, and when the language button is pressed
- **THEN** the route is replaced with `/` once, and the router refreshes once
- **Test:** `apps/web/src/screens/Login/hooks/__tests__/useSignIn.hook.test.ts` › "replaces the route with the home page and keeps no token"
- **Test:** `apps/web/src/components/ui/LanguageSwitcher/__tests__/useLanguageSwitcher.hook.test.ts` › "cycling from en advances to es and writes the cookie"

### Requirement: WEB-74 — A cached function sets its cache policy through lib/cache

The web app SHALL set the life profile and the tags of a function under `'use cache'` through
`applyCachePolicy({ life, tags })` of `src/lib/cache/`, which the function calls once while it
runs: `life` is one of the app's `CacheLifeEnum` profiles, the seven Next ships (`default`,
`seconds`, `minutes`, `hours`, `days`, `weeks` and `max`), and `tags` the strings an on-demand
revalidation purges the result by; it SHALL hand the profile to Next's `cacheLife` once and every
tag to Next's `cacheTag` in one call.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a policy reaches the framework cache

- **GIVEN** `next/cache` replaced at its module by spies
- **WHEN** `applyCachePolicy` runs with the `hours` profile and two tags
- **THEN** `cacheLife` receives `hours` once and `cacheTag` receives both tags in one call
- **Test:** `apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts` › "hands its life profile and every tag to the framework cache, once each"

#### Scenario: every profile under its own name

- **GIVEN** `next/cache` replaced at its module by spies
- **WHEN** `applyCachePolicy` runs once with each profile of `CacheLifeEnum`
- **THEN** `cacheLife` receives each profile's own name, in that order
- **Test:** `apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts` › "sets every profile of the app under its own name"

#### Scenario: the profiles are the app's own

- **GIVEN** the app's `CacheLifeEnum`
- **WHEN** its values and the type `applyCachePolicy` takes are read
- **THEN** they are the seven profiles Next ships, and the policy names no type of `next/cache`
- **Test:** `apps/web/src/lib/cache/__tests__/cachePolicy.adapter.test.ts` › "takes one of the seven life profiles Next ships, under the app's own type"

### Requirement: WEB-75 — Only lib/routing imports next/navigation, and only lib/cache next/cache

The web app SHALL import `next/navigation` only in `apps/web/src/lib/routing/useAppRouter.hook.ts`
and `next/cache` only in `apps/web/src/lib/cache/cachePolicy.adapter.ts`, type-only imports
included; every other file, tests included, reaches them through `@/lib/routing` and
`@/lib/cache`, and a test of any other unit mocks that module, the router through
`createRoutingDouble` of `apps/web/src/test/routing.helper.ts`, never the framework's.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a file outside the seams imports either subpath

- **GIVEN** a component, hook, service, screen or test outside those files that imports or mocks
  `next/navigation` or `next/cache`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

## MODIFIED Requirements

### Requirement: WEB-03 — The items summary is cached across requests

The web app SHALL cache the items summary result across requests with the `minutes` cache-life
profile under the `items-summary` cache tag, which `getItemsSummary` sets once per run through
`applyCachePolicy` of `src/lib/cache/` (WEB-74).

**Evidence:** written at apply time, when the code exists.

#### Scenario: a second request reuses the cached summary

- **GIVEN** a request has computed the items summary
- **WHEN** another request renders the summary within the cache-life profile
- **THEN** the cached result is served until it expires or its tag is revalidated
- **Test:** Not covered — no test runs Next's cache; the service test mocks `@/lib/cache`, and
  `next build` prerenders the home route, which runs `applyCachePolicy` inside the cached
  function.

#### Scenario: the service sets its policy

- **GIVEN** `@/lib/cache` with `applyCachePolicy` replaced by a spy
- **WHEN** the items summary is computed
- **THEN** the policy it receives, once, is the `minutes` profile and the `items-summary` tag
- **Test:** `apps/web/src/services/ItemsSummary/__tests__/itemsSummary.service.test.ts` › "sets the minutes life profile and the items-summary tag once"
