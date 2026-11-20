# Delta: apps/web

> **Change:** `2026-11-20-prune-leftovers`

## ADDED Requirements

### Requirement: WEB-85 — The auth gateway comes from the backend the project keeps

The web app SHALL hand the auth provider and the auth service the gateway
`src/lib/auth/authGateway.adapter.ts` serves: the gateway of the first backend capability it
lists, each listed inside that capability's region, or, when the project keeps none, a no-op
gateway whose session is none and whose sign-in rejects with the `NOT_CONFIGURED` failure and the
`auth.error.notConfigured` key. Every sign-in failure the app names SHALL have its `auth.error`
message key in every catalog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no backend is kept

- **GIVEN** the no-op gateway
- **WHEN** its session is read and a sign-in is attempted through it
- **THEN** the session is none, and the sign-in rejects with the `NOT_CONFIGURED` failure and the
  `auth.error.notConfigured` key
- **Test:** `apps/web/src/lib/auth/__tests__/noopAuthGateway.helper.test.ts` › "has no session and rejects a sign-in with the not-configured failure"

#### Scenario: the served gateway keeps the port

- **GIVEN** the auth gateway adapter, whatever backend the project keeps
- **WHEN** the gateway is requested
- **THEN** it has every method of the `IAuthGateway` port
- **Test:** `apps/web/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves a gateway with every method of the auth gateway port"

<!-- region supabase -->
#### Scenario: the Supabase gateway is listed

- **GIVEN** the `supabase` capability, whose region lists the Supabase part's gateway
- **WHEN** the gateway is requested
- **THEN** it is the gateway `src/lib/supabase/authGateway.adapter.ts` serves
- **Test:** `apps/web/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves the gateway the supabase capability builds"
<!-- endregion supabase -->

#### Scenario: every failure has its message

- **GIVEN** the message key of every sign-in failure the app names
- **WHEN** every catalog is searched for it
- **THEN** each catalog holds a value for every key
- **Test:** `apps/web/src/lib/auth/__tests__/authGateway.constant.test.ts` › "names a message every catalog holds for each sign-in failure"

## MODIFIED Requirements

<!-- region supabase -->
### Requirement: WEB-20 — The auth gateway is a no-op without Supabase settings

The web app SHALL serve, from the Supabase part of its auth gateway (WEB-85), the no-op gateway
during server rendering and in a browser where `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset, so the session resolves to none and a sign-in rejects
with the not-configured failure (WEB-46), whose cause names both settings; otherwise one Supabase
auth gateway per browser, whose sign-in names its failures (WEB-46).


**Evidence:** written at archive, from the code.

#### Scenario: the Supabase settings are missing

- **GIVEN** a browser with no Supabase URL or anon key
- **WHEN** the gateway is requested
- **THEN** its session resolves to none, its sign-in rejects, and no Supabase gateway is created
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "returns a no-op gateway without the Supabase settings"

#### Scenario: the rejection names the missing settings

- **GIVEN** a browser with no Supabase URL or anon key
- **WHEN** a sign-in is attempted through the gateway
- **THEN** the cause of its rejection names `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the Supabase settings in the cause of a sign-in without them"

#### Scenario: the Supabase settings are present

- **GIVEN** a browser with both public Supabase settings
- **WHEN** the gateway is requested twice
- **THEN** one Supabase auth gateway is created, and the same gateway over it is returned both times
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "creates one Supabase auth gateway per browser with the settings"

#### Scenario: the page is rendered on the server

- **GIVEN** server rendering
- **WHEN** the providers mount
- **THEN** the auth provider receives the no-op gateway
- **Test:** Not covered — happy-dom always defines `window`, so no test renders the server branch.

### Requirement: WEB-46 — The auth gateway names each sign-in failure

The web app SHALL reject a sign-in through the browser's auth gateway with an `AppError` that
names the failure and carries the original rejection as its cause: `NOT_CONFIGURED` from the
no-op gateway; `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED` and `RATE_LIMITED` for the Supabase
Auth codes `invalid_credentials`, `email_not_confirmed` and `over_request_rate_limit`, each with
its `auth.error` message key; and `NETWORK_ERROR` with `helper.error.network` when Supabase cannot
be reached. Any other rejection SHALL pass through unchanged, and the auth service makes it the
generic error (WEB-13).

**Evidence:** written at archive, from the code.

#### Scenario: the Supabase settings are missing

- **GIVEN** a browser with no Supabase URL or anon key
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with the `NOT_CONFIGURED` failure and the `auth.error.notConfigured` key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "rejects a sign-in with the not-configured failure without the Supabase settings"

#### Scenario: Supabase names the failure

- **GIVEN** a Supabase gateway whose sign-in rejects with the code `invalid_credentials`, `email_not_confirmed` or `over_request_rate_limit`
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with the failure of that code, its `auth.error` key and the Supabase error as its cause
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the failure of each Supabase Auth code a sign-in rejects with"

#### Scenario: Supabase cannot be reached

- **GIVEN** a Supabase gateway whose sign-in rejects with a retryable fetch error
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with the `NETWORK_ERROR` code and the `helper.error.network` key
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a network failure when Supabase cannot be reached"

#### Scenario: a failure the gateway does not name

- **GIVEN** a Supabase gateway whose sign-in rejects with an error of another code
- **WHEN** a sign-in is attempted through the gateway
- **THEN** it rejects with that same error
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "passes any other sign-in rejection through"
<!-- endregion supabase -->
