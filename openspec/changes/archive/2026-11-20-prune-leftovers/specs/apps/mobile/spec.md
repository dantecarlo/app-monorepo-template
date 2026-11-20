# Delta: apps/mobile

> **Change:** `2026-11-20-prune-leftovers`

## ADDED Requirements

### Requirement: MOBILE-83 — The auth gateway comes from the backend the project keeps

The mobile app SHALL hand the auth provider, from its root layout, the gateway
`src/lib/auth/authGateway.adapter.ts` serves: the gateway of the first backend capability it
lists, each listed inside that capability's region, or, when the project keeps none, a no-op
gateway whose session is none and whose sign-in rejects.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no backend is kept

- **GIVEN** the no-op gateway
- **WHEN** its session is read and a sign-in is attempted through it
- **THEN** the session is none and the sign-in rejects
- **Test:** `apps/mobile/src/lib/auth/__tests__/noopAuthGateway.helper.test.ts` › "has no session and rejects a sign-in"

#### Scenario: the served gateway keeps the port

- **GIVEN** the auth gateway adapter, whatever backend the project keeps
- **WHEN** it loads
- **THEN** its gateway has every method of the `IAuthGateway` port
- **Test:** `apps/mobile/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves a gateway with every method of the auth gateway port"

<!-- region supabase -->
#### Scenario: the Supabase gateway is listed

- **GIVEN** the `supabase` capability, whose region lists the Supabase part's gateway
- **WHEN** the adapter loads
- **THEN** its gateway is the one `src/lib/supabase/authGateway.adapter.ts` builds
- **Test:** `apps/mobile/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves the gateway the supabase capability builds"
<!-- endregion supabase -->

#### Scenario: the root layout renders

- **GIVEN** the gateway of `lib/auth`
- **WHEN** the root layout renders
- **THEN** the auth provider bootstraps the session from that gateway
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "hands the auth provider the gateway lib/auth serves"

## MODIFIED Requirements

### Requirement: MOBILE-29 — Session bootstrap from the auth gateway

The mobile app SHALL set the auth status to loading on mount, then store the session the auth
gateway of its root layout returns (MOBILE-83) with the status authenticated or unauthenticated,
and keep both in step with every later auth state change until unmount.


**Evidence:** written at archive, from the code.

#### Scenario: before the gateway answers

- **GIVEN** the app has just launched
- **WHEN** the auth store is read
- **THEN** the status is loading and there is no session
- **Test:** `apps/mobile/src/stores/__tests__/auth.store.test.ts` › "starts in loading status with no session"

#### Scenario: the provider starts the bootstrap

- **GIVEN** an auth gateway
- **WHEN** the auth provider renders with it
- **THEN** the bootstrap runs with that gateway
- **Test:** `apps/mobile/src/components/AuthProvider/__tests__/AuthProvider.component.test.tsx` › "calls getSession on mount via bootstrap"

#### Scenario: a stored session exists

- **GIVEN** the gateway returns a session
- **WHEN** the bootstrap settles
- **THEN** the store holds that session with the status authenticated
- **Test:** Not covered — the useAuthBootstrap tests replay its steps by hand on the store and never call the hook

#### Scenario: the user signs out elsewhere

- **GIVEN** an authenticated session
- **WHEN** the gateway reports a change with no session
- **THEN** the store clears the session and the status becomes unauthenticated
- **Test:** Not covered — the useAuthBootstrap tests replay its steps by hand on the store and never call the hook

<!-- region supabase -->
### Requirement: MOBILE-75 — The auth gateway is built in lib/supabase

The mobile app SHALL build the Supabase auth gateway in `src/lib/supabase/authGateway.adapter.ts`,
over the very client `src/lib/supabase/client.adapter.ts` creates, or, without
`EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY`, the no-op gateway of `src/lib/auth/`,
whose sign-in rejects naming both settings; it SHALL list that gateway in the `supabase` region of
`src/lib/auth/authGateway.adapter.ts` (MOBILE-83); only the `*.adapter.ts` files of
`src/lib/supabase/` SHALL import `@app/supabase`, tests included.

**Evidence:** written at archive, from the code.

#### Scenario: the gateway over the app's client

- **GIVEN** the app's Supabase client, with both public Supabase settings
- **WHEN** the auth gateway module loads
- **THEN** one Supabase auth gateway is created over that same client, and it is the gateway the
  module exports
- **Test:** `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "builds the auth gateway over the client the client adapter creates"

#### Scenario: the Supabase settings are missing

- **GIVEN** no `EXPO_PUBLIC_SUPABASE_URL` and no `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **WHEN** the auth gateway module loads and a sign-in is attempted through it
- **THEN** no Supabase gateway is created, and the sign-in rejects with an error naming both
  settings
- **Test:** `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the Supabase settings in the rejection of a sign-in without them"

#### Scenario: a file outside lib/supabase imports the package

- **GIVEN** the root layout or its test importing or mocking `@app/supabase`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`
<!-- endregion supabase -->
