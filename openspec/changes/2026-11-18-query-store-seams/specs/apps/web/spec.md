# Delta: apps/web

> **Change:** `2026-11-18-query-store-seams`

## ADDED Requirements

### Requirement: WEB-63 — The query hooks take and return the app's own types

The web app SHALL give every query and mutation one API of its own in `apps/web/src/lib/query/`:
`useAppQuery` takes `IAppQueryOptions`, a `queryKey`, a `queryFn` and an optional `adapter`, and
returns `IAppQueryResult`, only `data`, `error`, `isError`, `isLoading`, `isSuccess` and
`refetch`; `useAppMutation` takes `IAppMutationOptions`, a `mutationFn`, an optional `gcTime` and
`onError` and `onSuccess` callbacks, each called with one object holding the error or the data and
the variables, and returns `IAppMutationResult`, only `data`, `error`, `isError`, `isPending`,
`isSuccess`, `mutate` and `reset`. No type of TanStack Query is part of either.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a query's result

- **GIVEN** a query that resolves
- **WHEN** `useAppQuery` settles
- **THEN** its result holds exactly the fields of `IAppQueryResult`, the data among them
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "returns only the fields of the app's own query result"

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

### Requirement: WEB-64 — The app provides its query client and invalidates by key prefix

The web app SHALL give a tree the query client `createQueryClient` builds through
`AppQueryProvider` of `apps/web/src/lib/query/`, and SHALL give every hook
`useInvalidateAppQuery`, whose function marks every query whose key starts with the `queryKey` it
is handed stale, and no other, and runs the observed ones again.

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
