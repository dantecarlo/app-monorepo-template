# Proposal: the query, store and storage seams of both apps

> **Status:** open

## Why

Decision 51 of `docs/INIT_AND_HARNESS_PLAN.md` puts every library outside the core stack behind
one adapter of the template, and F.8 unit 1 froze every import that broke its seam in
`eslint-dependency-seam-allowlist.json`. Nineteen of the 61 left belong to F.8 units 3 and 4:

- **TanStack Query, 8.** Both app roots and six tests import `@tanstack/react-query` directly,
  and the query API leaks it on its own: `useAppQuery` and `useAppMutation` take TanStack's
  `UseQueryOptions` and `UseMutationOptions` and return its `UseQueryResult` and
  `UseMutationResult`, so a swap of the query library rewrites every hook and test that reads
  them.
- **zustand, 8.** All seven stores call zustand's `create`, and the mobile `useSession` imports
  its `useShallow`, the fix F12 needed for an object selection that never settled.
- **AsyncStorage, 3.** The theme and language configs of the mobile app, and the language
  config's test, reach AsyncStorage directly, beside the key-value storage port F46 added.

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

- **The query API owns its types (unit 3).** In each app's `src/lib/query/`, `useAppQuery` takes
  `IAppQueryOptions` (a `queryKey`, a `queryFn` and the optional `adapter`) and returns
  `IAppQueryResult` (`data`, `error`, `isError`, `isLoading`, `isSuccess`, `refetch`);
  `useAppMutation` takes `IAppMutationOptions` (a `mutationFn`, an optional `gcTime`, and
  `onError` and `onSuccess` callbacks that receive one object) and returns `IAppMutationResult`
  (`data`, `error`, `isError`, `isPending`, `isSuccess`, `mutate`, `reset`). No TanStack type is
  part of either, and each hook returns only those fields. The toasts, the capture sink and the
  query keys keep their behaviour (WEB-23 to WEB-26 and WEB-45; MOBILE-20 to MOBILE-25 and
  MOBILE-43; F23 and F25).
- **A provider and an invalidation of the app's own.** `AppQueryProvider` gives a tree the
  client `createQueryClient` builds, typed `AppQueryClientType`, and `useInvalidateAppQuery`
  returns a function that marks every query under a `QueryKeys` prefix stale and runs the
  observed ones again.
- **Every query importer migrated.** The web providers and the mobile root layout render
  `AppQueryProvider`; every test outside `lib/query` renders through `createQueryWrapper` of the
  app's new `src/test/query.helper.tsx`, with the assertions it has today. Their 8 entries leave
  the allowlist.
- **One store factory per app (unit 4).** `apps/*/src/lib/store/createAppStore.helper.ts`, the
  only file that imports zustand, creates a typed store from an initializer that receives
  `{ get, set }`: the store is a hook that reads one value through a selector, with `getState`,
  `setState` and `getInitialState`, a `useShallow` that keeps an object selection stable while
  its fields are unchanged, and an optional `persist` that keeps the fields `partialize` names,
  in local storage on the web and through the key-value storage port on mobile. All seven stores
  and the mobile `useSession` move onto it, and their 8 entries leave the allowlist.
- **The device storage through its port.** The mobile theme and language configs keep the
  choice through `keyValueStorage` of `src/lib/storage/`, and the language config's test mocks
  that module; their 3 entries leave the allowlist, so only the adapter and its test import
  AsyncStorage.
- **The seams narrowed.** In `.agents/contracts/dependencies.json`, zustand's seam becomes
  `apps/*/src/lib/store/createAppStore.helper.ts`; TanStack Query keeps
  `apps/*/src/lib/query/**`, whose tests of the key factories also reach the client; the
  AsyncStorage note drops the configs it waited for. The allowlist goes from 61 entries to 42.
- **The docs and skills.** The `store` skill's scaffold emits `createAppStore`; the `service`,
  `screen`, `feature`, `arch`, `lib`, `test` and `fix-test` skills drop their TanStack and
  zustand imports; `docs/code-standards.md`, `docs/architecture/web.md` and `mobile.md` and
  `docs/maps/global-map.md` name the new files.

## Out of scope

- **The query client's own type.** `AppQueryClientType` is TanStack's `QueryClient` under a
  project name: the roots only pass it on, and the tests that read the cache keep their
  assertions. An opaque client would rewrite those assertions; nothing asks for it yet.
- **More query options.** The options are the ones a caller passes today (`queryKey`,
  `queryFn`, `gcTime`, `mutationFn` and the callbacks); `enabled`, `staleTime` or a per-call
  `onError` join `lib/query` when a caller needs them.
- **The other frozen imports**, units 5 to 8, and the `ui/` blocks another writer owns.
- **The web's local storage.** The web persists through zustand's own local storage; a web
  key-value adapter waits for a caller.

## Affected specs

- `openspec/specs/apps/web/spec.md`: added WEB-63, WEB-64, WEB-65, WEB-66.
- `openspec/specs/apps/mobile/spec.md`: added MOBILE-61, MOBILE-62, MOBILE-63, MOBILE-64;
  modified MOBILE-03, MOBILE-04, MOBILE-06, MOBILE-07, MOBILE-56.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
