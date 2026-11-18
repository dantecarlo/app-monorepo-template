# Delta: apps/mobile

> **Change:** `2026-11-18-query-store-seams`

## ADDED Requirements

### Requirement: MOBILE-61 — The query hooks take and return the app's own types

The mobile app SHALL give every query and mutation one API of its own in
`apps/mobile/src/lib/query/`, the same as the web app's (apps/web WEB-63): `useAppQuery` takes
`IAppQueryOptions`, a `queryKey`, a `queryFn`, an optional `adapter` and the optional `enabled`,
`staleTime`, `retry`, `networkMode` (`online`, `always` or `offlineFirst`) and `keepPreviousData`,
each forwarded to the query, and returns `IAppQueryResult`, only `data`, `error`, `isError`,
`isLoading`, `isSuccess` and `refetch`; `useAppMutation` takes `IAppMutationOptions`, a `mutationFn`
and the optional `mutationKey`, `gcTime` and `onMutate`, `onSuccess`, `onError` and `onSettled`
callbacks, each called with one object holding the variables and the data or the error, and returns
`IAppMutationResult`, only `data`, `error`, `isError`, `isPending`, `isSuccess`, `mutate` and
`reset`. An option left out SHALL keep the query client's default, each hook SHALL return the same
result object while none of its fields changed, and no type of TanStack Query is part of either.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a query's result

- **GIVEN** a query that resolves
- **WHEN** `useAppQuery` settles
- **THEN** its result holds exactly the fields of `IAppQueryResult`, the data among them
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "returns only the fields of the app's own query result"

#### Scenario: a held query

- **GIVEN** a query with `enabled: false`
- **WHEN** it mounts and every pending timer runs
- **THEN** its `queryFn` never runs, and it holds no data and is not loading
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "never runs the queryFn while enabled is false"

#### Scenario: a retried query

- **GIVEN** a query with `retry: 1`, on a client that retries none, whose `queryFn` fails once
- **WHEN** it settles
- **THEN** it ran twice and holds the second run's data
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "retries a failed queryFn as many times as retry says"

#### Scenario: the previous data while a new key loads

- **GIVEN** a query with `keepPreviousData` that loaded one key
- **WHEN** it moves to a key whose `queryFn` has not resolved
- **THEN** it still holds the first key's data and is not loading
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the previous key's data while the next key loads, with keepPreviousData"

#### Scenario: the freshness and the network mode

- **GIVEN** a query with a `staleTime` of a minute and `networkMode: 'always'`
- **WHEN** it settles
- **THEN** the cached query holds both options and is still fresh
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "hands staleTime and networkMode to the query"

#### Scenario: an option left out

- **GIVEN** a query that passes none of the optional options, on the app's query client
- **WHEN** it settles
- **THEN** the cached query holds every default of that client
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the client's defaults for every option it leaves out"

#### Scenario: a stable query result

- **GIVEN** a settled query
- **WHEN** its component renders again with nothing changed
- **THEN** it reads the same result object
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "keeps the same result object across a rerender while its fields are unchanged"

#### Scenario: a mutation's result

- **GIVEN** a mutation that resolves
- **WHEN** `useAppMutation` settles
- **THEN** its result holds exactly the fields of `IAppMutationResult`, the data among them
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "returns only the fields of the app's own mutation result"

#### Scenario: the caller's callbacks

- **GIVEN** a mutation with an `onSuccess` and an `onError` callback, run once to success and
  once to failure
- **WHEN** each run settles
- **THEN** `onSuccess` receives one object with the data and the variables, and `onError` one
  object with the error and the variables
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "hands the caller's callbacks one object with the outcome and the variables"

#### Scenario: before the mutation and once it settles

- **GIVEN** a mutation with an `onMutate` and an `onSettled` callback, run once to success and
  once to failure
- **WHEN** each run settles
- **THEN** `onMutate` received the variables before `mutationFn` ran, and `onSettled` the data,
  the error and the variables of each run
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "runs the caller's onMutate with the variables first, and onSettled with the outcome"

#### Scenario: the mutation key

- **GIVEN** a mutation with a `mutationKey`
- **WHEN** it runs
- **THEN** the mutation cache holds it under that key
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "caches the mutation under its mutationKey"

#### Scenario: the callbacks of one call

- **GIVEN** a mutation run with an `onSettled` for that call
- **WHEN** the call settles
- **THEN** that `onSettled` runs once
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "runs the onSettled of one mutate call once that call settles"

#### Scenario: a reset

- **GIVEN** a mutation that succeeded
- **WHEN** `reset` is called
- **THEN** it holds no data and is neither a success nor an error
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "reset clears the outcome of the last run"

#### Scenario: a stable mutation result

- **GIVEN** a mutation
- **WHEN** its component renders again with nothing changed
- **THEN** it reads the same result object
- **Test:** `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "keeps the same result object across a rerender while its fields are unchanged"

### Requirement: MOBILE-62 — The app provides its query client, invalidates by key prefix and tells a keyed mutation runs

The mobile app SHALL give a tree the query client `createQueryClient` builds through
`AppQueryProvider` of `apps/mobile/src/lib/query/`, SHALL give every hook `useInvalidateAppQuery`,
whose function marks every query whose key starts with the `queryKey` it is handed stale, and no
other, and runs the observed ones again, and SHALL give every hook `useIsAppMutating`, true while a
mutation whose `mutationKey` equals the one it is handed runs, and false for a mutation under a
longer key and once that mutation settled.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the provider

- **GIVEN** `AppQueryProvider` handed a query client
- **WHEN** a hook inside it runs a query through `useAppQuery`
- **THEN** the query's data is cached in that client
- **Test:** `apps/mobile/src/lib/query/__tests__/AppQueryProvider.component.test.tsx` › "gives its tree the query client it is handed"

#### Scenario: a prefix is invalidated

- **GIVEN** a cached items list, a cached item detail and a query of another key
- **WHEN** the function of `useInvalidateAppQuery` is called with `QueryKeys.items.all`
- **THEN** both items queries are stale and the other is not
- **Test:** `apps/mobile/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "marks every query under a key prefix stale and no other"

#### Scenario: an observed query is invalidated

- **GIVEN** a component observing the items list
- **WHEN** the items prefix is invalidated
- **THEN** the list's query runs again and the component reads its new data
- **Test:** `apps/mobile/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "runs an observed query under the prefix again"

#### Scenario: a running keyed mutation

- **GIVEN** a mutation under the key `['items', 'save']` whose `mutationFn` has not resolved
- **WHEN** `useIsAppMutating` reads that key and its prefix `['items']`, and then the mutation
  resolves
- **THEN** it is true for the exact key and false for the prefix while it runs, and false for
  the key once it settled
- **Test:** `apps/mobile/src/lib/query/__tests__/useIsAppMutating.hook.test.ts` › "is true while a mutation of exactly that key runs, and false once it settles"

### Requirement: MOBILE-63 — Every store is created through createAppStore

The mobile app SHALL create every store under `apps/mobile/src/stores/` through `createAppStore`
of `apps/mobile/src/lib/store/createAppStore.helper.ts`, the same factory as the web app's
(apps/web WEB-65): its initializer receives `{ get, set }`, and its store is a hook that returns
the value its selector reads and renders again when that value changes, with `getState`,
`setState` and `getInitialState`, and a `useShallow` that returns the same object for a selection
while each of its fields is unchanged; a store created with `persist` SHALL keep the fields its
`partialize` names through the key-value storage port, `keyValueStorage` of `src/lib/storage/`,
under its `name`, and a store created later with that name SHALL start with them.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a selector's reader

- **GIVEN** a component reading one value of a store through a selector
- **WHEN** an action of the store changes that value
- **THEN** the component reads the new value
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "re-renders a selector's reader when its value changes"

#### Scenario: a shallow selection

- **GIVEN** a component reading an object of two fields through `useShallow`
- **WHEN** it renders again, and then another field of the store changes
- **THEN** it reads the same object each time, and a new one once a selected field changes
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the same object for a shallow selection while its fields are unchanged"

#### Scenario: the state outside React

- **GIVEN** a store whose action reads the state through `get`
- **WHEN** `setState` changes a field and the action runs
- **THEN** `getState` reads both changes, and `getInitialState` still reads the initial state
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "reads and updates the state outside React"

#### Scenario: a persisted store

- **GIVEN** a store created with `persist`, a name and a `partialize` that keeps one field, over
  an in-memory device storage
- **WHEN** both fields change, and a store is created again with that name
- **THEN** the device storage holds only the kept field under the name, and the new store starts
  with it
- **Test:** `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the fields partialize names in the device storage, and starts from them"

### Requirement: MOBILE-64 — Only lib/query imports TanStack Query, and only createAppStore zustand

The mobile app SHALL import `@tanstack/react-query` only in `apps/mobile/src/lib/query/**` and
zustand only in `apps/mobile/src/lib/store/createAppStore.helper.ts`; every other file, the root
layout, the hooks, the stores and their tests included, reaches them through `@/lib/query/…` and
`createAppStore`, and a test of any other unit renders through `createQueryWrapper` of
`apps/mobile/src/test/query.helper.tsx` or mocks the project module.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a file outside the seams imports either library

- **GIVEN** the root layout, a hook, a store, a screen or a test outside those files that imports
  or mocks `@tanstack/react-query` or zustand
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

## MODIFIED Requirements

### Requirement: MOBILE-03 — Initial theme from storage, then the device

The mobile app SHALL start in the theme stored under the app.theme key of the device storage,
read through `keyValueStorage` (MOBILE-56), else in the device appearance when it is light or
dark, else in the dark default of packages/tokens.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a stored theme wins

- **GIVEN** the user chose light in an earlier session
- **WHEN** the app launches on a device set to dark
- **THEN** the app applies the light theme
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "starts in the theme the device storage holds"

#### Scenario: no stored theme and no device preference

- **GIVEN** nothing is stored and the device reports no color scheme
- **WHEN** the app launches
- **THEN** the app applies the dark theme
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "starts in the dark default when nothing is stored and the device has no appearance"

### Requirement: MOBILE-04 — Theme toggle persists the choice

The mobile app SHALL show the theme switch on while the light theme is active, and on a flip
store the matching theme under the app.theme key, through `keyValueStorage` (MOBILE-56), and
apply it to the NativeWind color scheme.

**Evidence:** written at apply time, when the code exists.

#### Scenario: switching to light

- **GIVEN** the dark theme is active and the switch is off
- **WHEN** the user turns the switch on
- **THEN** light is stored and applied, and every theme-token consumer re-renders in light
- **Test:** Not covered — no test calls useThemeToggle; `setTheme`, which the switch calls, is
  tested alone in MOBILE-56

### Requirement: MOBILE-06 — Initial language from storage, then the device

The mobile app SHALL start in the language stored under the app.language key of the device
storage, read through `keyValueStorage` (MOBILE-56), when packages/i18n supports it, else in the
device locale reduced to its language code when supported, else in the default language.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a regional tag maps to its language

- **GIVEN** no language is stored
- **WHEN** the language is resolved from the tag en-US
- **THEN** a supported language is returned
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "normalizes BCP-47 tag to a supported language"

#### Scenario: an unsupported device language

- **GIVEN** no language is stored
- **WHEN** the language is resolved from an unsupported tag
- **THEN** the default language is returned
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "falls back to default for an unsupported language tag"

#### Scenario: no device language at all

- **GIVEN** no language is stored
- **WHEN** the device reports no language code
- **THEN** the default language is returned
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "returns the default language for null input"

#### Scenario: a stored language wins

- **GIVEN** the user picked a supported language in an earlier session
- **WHEN** the app launches on a device in the other language
- **THEN** i18next starts in the stored language
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "starts i18next in the language the device storage holds"

### Requirement: MOBILE-07 — Language switcher cycles and persists

The mobile app SHALL show the active language code on the language switcher and, on each press,
move to the next language of packages/i18n in order, wrapping to the first, storing it under the
app.language key, through `keyValueStorage` (MOBILE-56), before switching i18next.

**Evidence:** written at apply time, when the code exists.

#### Scenario: pressing on the last language

- **GIVEN** the active language is the last supported one
- **WHEN** the user presses the language switcher
- **THEN** the first supported language is stored and applied, and the switcher shows its code
- **Test:** Not covered — no test calls useLanguageSwitcher; `setLanguage`, which the switcher
  calls, is tested alone in MOBILE-56

### Requirement: MOBILE-56 — The device keeps key-value data through one adapter

The mobile app SHALL implement the `IKeyValueStoragePort` of packages/core over AsyncStorage in
`keyValueStorage`, exported from `src/lib/storage/`, SHALL keep every value it holds on the
device through it, the theme choice under app.theme and the language choice under app.language
included, and SHALL import AsyncStorage only there, the seam the dependency registry names for
it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a value on the device

- **GIVEN** AsyncStorage replaced by its in-memory mock
- **WHEN** a value is set, read and removed through `keyValueStorage`
- **THEN** AsyncStorage holds the value, it reads back, and after the removal AsyncStorage holds
  nothing
- **Test:** `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "writes, reads and removes a value on the device storage"

#### Scenario: a missing key

- **GIVEN** AsyncStorage replaced by its in-memory mock, holding nothing
- **WHEN** a key is read through `keyValueStorage`
- **THEN** it reads `null`
- **Test:** `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "reads null for a key the device storage does not hold"

#### Scenario: the theme choice

- **GIVEN** `keyValueStorage` replaced by an in-memory storage
- **WHEN** a theme is chosen through `setTheme`
- **THEN** the storage holds it under app.theme, and NativeWind's color scheme is that theme
- **Test:** `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "stores a chosen theme in the device storage and applies it"

#### Scenario: the language choice

- **GIVEN** `keyValueStorage` replaced by an in-memory storage
- **WHEN** a language is chosen through `setLanguage`
- **THEN** the storage holds it under app.language, and i18next switches to it
- **Test:** `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "stores a chosen language in the device storage and switches i18next to it"

#### Scenario: the seam

- **GIVEN** every file under `apps/` and `packages/`
- **WHEN** the dependency seams are checked
- **THEN** only `keyValueStorage.adapter.ts` and its test import AsyncStorage
- **Test:** Not covered — `pnpm verify:dependency-seams` and the `local/dependency-seam` lint rule hold it, a gate and a rule rather than a test
