# Proposal: the web router and cache behind lib/routing and lib/cache

> **Status:** archived — 2026-11-18

## Why

Decision 51 of `docs/INIT_AND_HARNESS_PLAN.md` puts every library outside the core stack behind
one adapter of the template, and decision 58 narrows three subpaths of the core `next`:
`next/cache`, `next/navigation` and `next/image`. F.8 unit 5 put `next/image` behind `ui/Image`;
the other two still have an empty seam in `.agents/contracts/dependencies.json`, and 11 imports of
the web app are frozen for them in `eslint-dependency-seam-allowlist.json`:

- **`next/navigation`, 9.** The language switcher and the sign-in mutation call Next's
  `useRouter` (`refresh` and `replace`), and seven tests mock `next/navigation` to stand in for
  it. An eighth, `src/test/__tests__/intl.helper.test.tsx`, mocks it too; it is test
  infrastructure, so no entry lists it.
- **`next/cache`, 2.** `itemsSummary.service.ts` calls `cacheLife` and `cacheTag`, and its test
  mocks `next/cache`.

A swap of the router or of the cache today rewrites screens, ui blocks, services and tests
outside any wrapper.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "every package that is not core must be decoupled and have
  an adapter, in ui as a wrapper for example, and so think a strategy for each one; currently the
  Certifipago project already more or less does it, but evaluate and analyze and put it in the
  plan"
- 2026-11-15 (translated from Spanish): "Not only the UI libraries, but all the libraries
  themselves."
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **`lib/routing`, the app's router.** `apps/web/src/lib/routing/useAppRouter.hook.ts`, the one
  file that imports `next/navigation`, returns the app's own `IAppRouter`: `push(href)`,
  `replace(href)` and `refresh()`, nothing else of Next's router, and the same object while
  Next's router is the same, so a callback that depends on it stays stable. An `href` is an
  `AppRouteType`, a path the typed routes of `next.config.ts` check. The barrel
  `apps/web/src/lib/routing/index.ts` exports the hook and its type.
- **The callers migrated.** `useLanguageSwitcher` refreshes and `useSignIn` replaces the route
  through `useAppRouter` of `@/lib/routing`, with the behaviour they have today (WEB-13, WEB-16).
- **One router double for the tests.** `createRoutingDouble` of
  `apps/web/src/test/routing.helper.ts` gives `vi.mock('@/lib/routing')` a `useAppRouter` whose
  every method is a spy, or the spy a test passes in. The eight tests that mock
  `next/navigation` mock `@/lib/routing` through it, with the assertions they have today.
- **`lib/cache`, the cache policy of a cached function.**
  `apps/web/src/lib/cache/cachePolicy.adapter.ts`, the one file that imports `next/cache`,
  exports `applyCachePolicy({ life, tags })`: a function under `'use cache'` calls it once to set
  its life profile, one of the app's `CacheLifeEnum` profiles, and its tags. The barrel
  `apps/web/src/lib/cache/index.ts` exports it and `CacheLifeEnum`.
- **The cached summary migrated.** `getItemsSummary` sets the `minutes` profile and the
  `items-summary` tag through `applyCachePolicy`, which its test mocks; a new test of the service
  checks the policy it sets (WEB-03).
- **The seams narrowed.** In `.agents/contracts/dependencies.json`, `next/navigation` may be
  imported only by `apps/web/src/lib/routing/useAppRouter.hook.ts` and `next/cache` only by
  `apps/web/src/lib/cache/cachePolicy.adapter.ts`, type-only imports included. The 11 web entries
  of F.8 unit 6 leave the allowlist.
- **The docs.** The `lib` skill (the routing and cache seams), the `screen` and `service` skills
  (where a screen hook navigates and a cached service sets its policy), the `arch` skill's
  navigation row, `docs/code-standards.md` § 23, `docs/architecture/web.md` and
  `docs/maps/global-map.md`.

## Out of scope

- **The `expo-router` hooks on mobile**, F.8 unit 8 with the primitive-wrapper rule, and every
  other mobile file.
- **`apps/web/src/lib/supabase/**`**, F.8 unit 7, and `next/image`, which F.8 unit 5 left behind
  `ui/Image`.
- **What no caller uses.** The current pathname, the search params, `redirect`, `notFound`,
  `prefetch`, `back`, `forward`, the navigation options of `push` and `replace` (`scroll`), and
  `revalidateTag`, `revalidatePath` and `updateTag`: no file of the app calls them, so the
  wrappers do not expose them; a project that needs one adds it to `lib/routing` or `lib/cache`.
- **A custom cache-life profile.** `CacheLifeEnum` holds the seven profiles Next ships; a profile
  a project configures in `next.config.ts` adds its member there.
- **Observing the framework cache.** No test runs Next's cache; WEB-03's reuse across requests
  stays Not covered, and the build proves `applyCachePolicy` runs inside the cached function.

## Affected specs

- `openspec/specs/apps/web/spec.md`: added WEB-73, WEB-74, WEB-75; modified WEB-03.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
