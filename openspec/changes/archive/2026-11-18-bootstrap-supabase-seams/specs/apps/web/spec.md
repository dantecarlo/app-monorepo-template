# Delta: apps/web

> **Change:** `2026-11-18-bootstrap-supabase-seams`

## ADDED Requirements

### Requirement: WEB-80 — The Supabase clients are the opaque backend client

The web app SHALL type the clients of `src/lib/supabase/` as the opaque `BackendClientType` of
packages/supabase (SUPABASE-30): `getSupabaseClient` of `client.adapter.ts` returns one and
`createServerClient` of `server.adapter.ts` resolves to one, so no type of the app names the
Supabase client or a Supabase generic; the browser's auth gateway SHALL be built over the very
client `getSupabaseClient` creates (WEB-20).

**Evidence:** written at apply time, when the code exists.

#### Scenario: the browser client's type

- **GIVEN** the browser client adapter
- **WHEN** the type of the client it returns is read
- **THEN** it is `BackendClientType`
- **Test:** `apps/web/src/lib/supabase/__tests__/client.adapter.test.ts` › "types the client as the opaque backend client"

#### Scenario: the server client's type

- **GIVEN** the server client adapter
- **WHEN** the type of the client it resolves to is read
- **THEN** it is `BackendClientType`
- **Test:** `apps/web/src/lib/supabase/__tests__/server.adapter.test.ts` › "types the server client as the opaque backend client"

#### Scenario: the gateway over the browser client

- **GIVEN** a browser with both public Supabase settings
- **WHEN** the gateway is requested
- **THEN** the Supabase auth gateway is created over the same client the browser client adapter
  created and returns
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "hands the gateway the very client the browser client adapter creates"
