# Delta: packages/supabase

> **Change:** `2026-11-18-bootstrap-supabase-seams`

## ADDED Requirements

### Requirement: SUPABASE-30 — The client leaves the package opaque

The supabase package SHALL hand out its clients as `BackendClientType`, a branded type of
`src/backendClient.type.ts` that names no Supabase type, so an app that holds a client cannot name
or reach the SDK client; only `src/backendClient.adapter.ts` SHALL turn the SDK client into a
`BackendClientType` and back, for the package's own `*.adapter.ts` files, and the auth gateway
SHALL take the client as a `BackendClientType` and reach the SDK through it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the client is wrapped and unwrapped

- **GIVEN** an SDK client
- **WHEN** it is wrapped as a backend client and unwrapped again
- **THEN** the unwrapped client is the very client that was wrapped
- **Test:** `packages/supabase/src/__tests__/backendClient.adapter.test.ts` › "hands back the very client it wrapped"

#### Scenario: the type names no Supabase type

- **GIVEN** `BackendClientType` and the SDK client typed by the Database schema
- **WHEN** each is checked against the other
- **THEN** neither is assignable to the other, and the wrapper hands out `BackendClientType`
- **Test:** `packages/supabase/src/__tests__/backendClient.adapter.test.ts` › "names no Supabase type in the client it hands out"

#### Scenario: the factories' types

- **GIVEN** the browser and the server client factories
- **WHEN** the type each returns is read
- **THEN** both are `BackendClientType`
- **Test:** `packages/supabase/src/__tests__/client.adapter.test.ts` › "returns the opaque backend client"
- **Test:** `packages/supabase/src/__tests__/server.adapter.test.ts` › "returns the opaque backend client"

#### Scenario: the gateway over an opaque client

- **GIVEN** a backend client whose SDK session holds a user
- **WHEN** the auth gateway built over it reads the session
- **THEN** it returns the neutral session mapped from the SDK's (SUPABASE-06)
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "getSession maps the SDK session to IAuthSession"

## MODIFIED Requirements

### Requirement: SUPABASE-01 — Entry points expose the backend adapter

The supabase package SHALL expose from its main entry point buildSupabaseServiceError, createSupabaseClient, mapSupabaseError, createSupabaseAuthGateway, the BackendClientType of its clients and the Database type, and from its server entry point createSupabaseServerClient.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an app imports the package

- **GIVEN** an app that depends on the supabase package
- **WHEN** it imports from the main entry point and from its server entry point
- **THEN** the main entry point gives the four factories, the BackendClientType and the Database type, and the server entry point gives the server client factory
- **Test:** Not covered — every test imports its module directly; only the consumers' typecheck reads the entry points

### Requirement: SUPABASE-02 — Clients are built over the anon key

The supabase package SHALL build its clients from a URL and an anon key the caller passes, typed by the Database schema inside the package and returned as the opaque BackendClientType (SUPABASE-30): a browser client that satisfies the backend client provider port of packages/core, and a server client that also takes the caller's cookie methods so the user's session reaches RLS.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a browser client

- **GIVEN** a URL and an anon key read by an app from its public environment
- **WHEN** the app calls createSupabaseClient
- **THEN** the SDK creates a client for that project with that key, and the backend client returned is that SDK client
- **Test:** `packages/supabase/src/__tests__/client.adapter.test.ts` › "creates the client for the URL and anon key it is handed"

#### Scenario: a server client

- **GIVEN** a URL, an anon key and the request's cookie methods
- **WHEN** server code calls createSupabaseServerClient
- **THEN** the SSR SDK creates a client for that project with that key and those cookie methods, and the backend client returned is that SDK client
- **Test:** `packages/supabase/src/__tests__/server.adapter.test.ts` › "creates the SSR client over the cookie methods it is handed"
