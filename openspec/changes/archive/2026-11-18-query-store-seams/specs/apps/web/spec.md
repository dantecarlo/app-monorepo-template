# Delta: apps/web

> **Change:** `2026-11-18-query-store-seams`

## ADDED Requirements

### Requirement: WEB-63 — The query hooks take and return the app's own types

The web app SHALL give every query and mutation one API of its own in `apps/web/src/lib/query/`:
`useAppQuery` takes `IAppQueryOptions`, a `queryKey`, a `queryFn`, an optional `adapter` and the
optional `enabled`, `staleTime`, `retry`, `networkMode` (`online`, `always` or `offlineFirst`) and
`keepPreviousData`, each forwarded to the query, and returns `IAppQueryResult`, only `data`,
`error`, `isError`, `isLoading`, `isSuccess` and `refetch`; `useAppMutation` takes
`IAppMutationOptions`, a `mutationFn` and the optional `mutationKey`, `gcTime` and `onMutate`,
`onSuccess`, `onError` and `onSettled` callbacks, each called with one object holding the variables
and the data or the error, and returns `IAppMutationResult`, only `data`, `error`, `isError`,
`isPending`, `isSuccess`, `mutate` and `reset`. An option left out SHALL keep the query client's
default, each hook SHALL return the same result object while none of its fields changed, and no type
of TanStack Query is part of either.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a query's result

- **GIVEN** a query that resolves
- **WHEN** `useAppQuery` settles
- **THEN** its result holds exactly the fields of `IAppQueryResult`, the data among them
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "returns only the fields of the app's own query result"

#### Scenario: a held query

- **GIVEN** a query with `enabled: false`
- **WHEN** it mounts and every pending timer runs
- **THEN** its `queryFn` never runs, and it holds no data and is not loading
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "never runs the queryFn while enabled is false"

#### Scenario: a retried query

- **GIVEN** a query with `retry: 1`, on a client that retries none, whose `queryFn` fails once
- **WHEN** it settles
- **THEN** it ran twice and holds the second run's data
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "retries a failed queryFn as many times as retry says"

#### Scenario: the previous data while a new key loads

- **GIVEN** a query with `keepPreviousData` that loaded one key
- **WHEN** it moves to a key whose `queryFn` has not resolved
- **THEN** it still holds the first key's data and is not loading
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the previous key's data while the next key loads, with keepPreviousData"

#### Scenario: the freshness and the network mode

- **GIVEN** a query with a `staleTime` of a minute and `networkMode: 'always'`
- **WHEN** it settles
- **THEN** the cached query holds both options and is still fresh
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "hands staleTime and networkMode to the query"

#### Scenario: an option left out

- **GIVEN** a query that passes none of the optional options, on the app's query client
- **WHEN** it settles
- **THEN** the cached query holds every default of that client
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the client's defaults for every option it leaves out"

#### Scenario: a stable query result

- **GIVEN** a settled query
- **WHEN** its component renders again with nothing changed
- **THEN** it reads the same result object
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the same result object across a rerender while its fields are unchanged"

#### Scenario: a mutation's result

- **GIVEN** a mutation that resolves
- **WHEN** `useAppMutation` settles
- **THEN** its result holds exactly the fields of `IAppMutationResult`, the data among them
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "returns only the fields of the app's own mutation result"

#### Scenario: the caller's callbacks

- **GIVEN** a mutation with an `onSuccess` and an `onError` callback, run once to success and
  once to failure
- **WHEN** each run settles
- **THEN** `onSuccess` receives one object with the data and the variables, and `onError` one
  object with the error and the variables
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "hands the caller's callbacks one object with the outcome and the variables"

#### Scenario: before the mutation and once it settles

- **GIVEN** a mutation with an `onMutate` and an `onSettled` callback, run once to success and
  once to failure
- **WHEN** each run settles
- **THEN** `onMutate` received the variables before `mutationFn` ran, and `onSettled` the data,
  the error and the variables of each run
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "runs the caller's onMutate with the variables first, and onSettled with the outcome"

#### Scenario: the mutation key

- **GIVEN** a mutation with a `mutationKey`
- **WHEN** it runs
- **THEN** the mutation cache holds it under that key
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "caches the mutation under its mutationKey"

#### Scenario: the callbacks of one call

- **GIVEN** a mutation run with an `onSettled` for that call
- **WHEN** the call settles
- **THEN** that `onSettled` runs once
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "runs the onSettled of one mutate call once that call settles"

#### Scenario: a reset

- **GIVEN** a mutation that succeeded
- **WHEN** `reset` is called
- **THEN** it holds no data and is neither a success nor an error
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "reset clears the outcome of the last run"

#### Scenario: a stable mutation result

- **GIVEN** a mutation
- **WHEN** its component renders again with nothing changed
- **THEN** it reads the same result object
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "keeps the same result object across a rerender while its fields are unchanged"

### Requirement: WEB-64 — The app provides its query client, invalidates by key prefix and tells a keyed mutation runs

The web app SHALL give a tree the query client `createQueryClient` builds through `AppQueryProvider`
of `apps/web/src/lib/query/`, SHALL give every hook `useInvalidateAppQuery`, whose function marks
every query whose key starts with the `queryKey` it is handed stale, and no other, and runs the
observed ones again, and SHALL give every hook `useIsAppMutating`, true while a mutation whose
`mutationKey` equals the one it is handed runs, and false for a mutation under a longer key and once
that mutation settled.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the provider

- **GIVEN** `AppQueryProvider` handed a query client
- **WHEN** a hook inside it runs a query through `useAppQuery`
- **THEN** the query's data is cached in that client
- **Test:** `apps/web/src/lib/query/__tests__/AppQueryProvider.component.test.tsx` › "gives its tree the query client it is handed"

#### Scenario: a prefix is invalidated

- **GIVEN** a cached items list, a cached item detail and a query of another key
- **WHEN** the function of `useInvalidateAppQuery` is called with `QueryKeys.items.all`
- **THEN** both items queries are stale and the other is not
- **Test:** `apps/web/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "marks every query under a key prefix stale and no other"

#### Scenario: an observed query is invalidated

- **GIVEN** a component observing the items list
- **WHEN** the items prefix is invalidated
- **THEN** the list's query runs again and the component reads its new data
- **Test:** `apps/web/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "runs an observed query under the prefix again"

#### Scenario: a running keyed mutation

- **GIVEN** a mutation under the key `['items', 'save']` whose `mutationFn` has not resolved
- **WHEN** `useIsAppMutating` reads that key and its prefix `['items']`, and then the mutation
  resolves
- **THEN** it is true for the exact key and false for the prefix while it runs, and false for
  the key once it settled
- **Test:** `apps/web/src/lib/query/__tests__/useIsAppMutating.hook.test.ts` › "is true while a mutation of exactly that key runs, and false once it settles"

### Requirement: WEB-65 — Every store is created through createAppStore

The web app SHALL create every store under `apps/web/src/stores/` through `createAppStore` of
`apps/web/src/lib/store/createAppStore.helper.ts`, whose initializer receives `{ get, set }` and
whose store is a hook that returns the value its selector reads and renders again when that value
changes, with `getState`, `setState` and `getInitialState`, and a `useShallow` that returns the
same object for a selection while each of its fields is unchanged; a store created with `persist`
SHALL keep the fields its `partialize` names in local storage under its `name`, and a store
created later with that name SHALL start with them.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a selector's reader

- **GIVEN** a component reading one value of a store through a selector
- **WHEN** an action of the store changes that value
- **THEN** the component reads the new value
- **Test:** `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "re-renders a selector's reader when its value changes"

#### Scenario: a shallow selection

- **GIVEN** a component reading an object of two fields through `useShallow`
- **WHEN** it renders again, and then another field of the store changes
- **THEN** it reads the same object each time, and a new one once a selected field changes
- **Test:** `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the same object for a shallow selection while its fields are unchanged"

#### Scenario: the state outside React

- **GIVEN** a store whose action reads the state through `get`
- **WHEN** `setState` changes a field and the action runs
- **THEN** `getState` reads both changes, and `getInitialState` still reads the initial state
- **Test:** `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "reads and updates the state outside React"

#### Scenario: a persisted store

- **GIVEN** a store created with `persist`, a name and a `partialize` that keeps one field
- **WHEN** both fields change, and a store is created again with that name
- **THEN** local storage holds only the kept field under the name, and the new store starts
  with it
- **Test:** `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the fields partialize names in local storage, and starts from them"

### Requirement: WEB-66 — Only lib/query imports TanStack Query, and only createAppStore zustand

The web app SHALL import `@tanstack/react-query` only in `apps/web/src/lib/query/**` and zustand
only in `apps/web/src/lib/store/createAppStore.helper.ts`; every other file, the providers, the
hooks, the stores and their tests included, reaches them through `@/lib/query/…` and
`createAppStore`, and a test of any other unit renders through `createQueryWrapper` of
`apps/web/src/test/query.helper.tsx` or mocks the project module.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a file outside the seams imports either library

- **GIVEN** a provider, hook, store, screen or test outside those files that imports or mocks
  `@tanstack/react-query` or zustand
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`
