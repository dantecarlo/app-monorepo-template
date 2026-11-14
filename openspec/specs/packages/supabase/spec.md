# packages/supabase — living spec

> **Governs:** `packages/supabase/src`, `packages/supabase/supabase/migrations`, `packages/supabase/supabase/config.toml`
> **ID prefix:** `SUPABASE`
> **Derived from:** `packages/supabase/docs/database.md`, `AGENTS.md`, `docs/code-standards.md`
> **Verified against the code:** 2026-11-14 at `9afce2d`

## Purpose

The supabase package is the default backend adapter: the anon-key browser client and the SSR
server client, the auth gateway, the Postgrest error mapper and the AppError builder, and the
database, with row-level security enabled and forced on four tables, the RBAC tables and helpers,
the append-only audit log and the seed. The ports, AppError and the message-key map belong to
packages/core, and the catalogs that translate the keys to packages/i18n.

## Requirements

### Requirement: SUPABASE-01 — Entry points expose the backend adapter

The supabase package SHALL expose from its main entry point buildSupabaseServiceError, createSupabaseClient, mapSupabaseError, createSupabaseAuthGateway and the Database type, and from its server entry point createSupabaseServerClient.

**Evidence:** `packages/supabase/src/index.ts:1`, `packages/supabase/src/index.ts:5`, `packages/supabase/package.json:8`

#### Scenario: an app imports the package

- **GIVEN** an app that depends on the supabase package
- **WHEN** it imports from the main entry point and from its server entry point
- **THEN** the main entry point gives the four factories and the Database type, and the server entry point gives the server client factory
- **Test:** Not covered — every test imports its module directly; only the consumers' typecheck reads the entry points

### Requirement: SUPABASE-02 — Clients are built over the anon key

The supabase package SHALL build its clients from a URL and an anon key the caller passes, typed by the Database schema: a browser client that satisfies the backend client provider port of packages/core, and a server client that also takes the caller's cookie methods so the user's session reaches RLS.

**Evidence:** `packages/supabase/src/client.adapter.ts:25`, `packages/supabase/src/client.adapter.ts:27`, `packages/supabase/src/server.adapter.ts:46`

#### Scenario: a browser client

- **GIVEN** a URL and an anon key read by an app from its public environment
- **WHEN** the app calls createSupabaseClient
- **THEN** it gets a Supabase client for that project, typed by the Database schema
- **Test:** Not covered — no test exercises the client factory

#### Scenario: a server client

- **GIVEN** a URL, an anon key and the request's cookie methods
- **WHEN** server code calls createSupabaseServerClient
- **THEN** it gets an SSR client that reads and writes the session through those cookie methods
- **Test:** Not covered — no test exercises the server client factory

### Requirement: SUPABASE-03 — A Postgrest error maps to a service code by HTTP status

The supabase package SHALL map an error of the Postgrest shape (a string message and code, and details and hint fields) to a service error code by its HTTP status: 403 to FORBIDDEN, 404 to NOT_FOUND, 500 and above to SERVER_ERROR, and any other status or none to UNKNOWN.

**Evidence:** `packages/supabase/src/mapSupabaseError.adapter.ts:36`, `packages/supabase/src/mapSupabaseError.adapter.ts:40`, `packages/supabase/src/mapSupabaseError.adapter.ts:48`

#### Scenario: status 403

- **GIVEN** a Postgrest error with status 403
- **WHEN** it is mapped
- **THEN** the code is FORBIDDEN
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "maps a 403 Postgrest error to FORBIDDEN"

#### Scenario: status 404

- **GIVEN** a Postgrest error with status 404
- **WHEN** it is mapped
- **THEN** the code is NOT_FOUND
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "maps a 404 Postgrest error to NOT_FOUND"

#### Scenario: status 500

- **GIVEN** a Postgrest error with status 500
- **WHEN** it is mapped
- **THEN** the code is SERVER_ERROR
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "maps a 500 Postgrest error to SERVER_ERROR"

#### Scenario: another 5xx status

- **GIVEN** a Postgrest error with status 502
- **WHEN** it is mapped
- **THEN** the code is SERVER_ERROR
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "maps any 5xx Postgrest error to SERVER_ERROR"

#### Scenario: another 4xx status

- **GIVEN** a Postgrest error with status 400
- **WHEN** it is mapped
- **THEN** the code is UNKNOWN
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "maps an unrecognised 4xx Postgrest error to UNKNOWN"

#### Scenario: no status

- **GIVEN** a Postgrest error with no status
- **WHEN** it is mapped
- **THEN** the code is UNKNOWN
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "maps a Postgrest error without a status to UNKNOWN"

### Requirement: SUPABASE-04 — A value of another shape is left unmapped

The supabase package SHALL return null from the error mapper for any value that is not of the Postgrest shape, leaving its classification to packages/core.

**Evidence:** `packages/supabase/src/mapSupabaseError.adapter.ts:47`, `packages/supabase/src/mapSupabaseError.adapter.ts:19`

#### Scenario: a plain Error

- **GIVEN** a plain Error
- **WHEN** it is mapped
- **THEN** the mapper returns null
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "returns null for a plain Error"

#### Scenario: a string

- **GIVEN** a thrown string
- **WHEN** it is mapped
- **THEN** the mapper returns null
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "returns null for a string"

#### Scenario: null

- **GIVEN** a null error
- **WHEN** it is mapped
- **THEN** the mapper returns null
- **Test:** `packages/supabase/src/mapSupabaseError.adapter.test.ts` › "returns null for null"

### Requirement: SUPABASE-05 — Any thrown value becomes an AppError

The supabase package SHALL turn any thrown value into an AppError through the service-error builder of packages/core, with mapSupabaseError as its mapper, so a caller gets a code and a message key instead of the raw backend error.

**Evidence:** `packages/supabase/src/buildSupabaseServiceError.helper.ts:13`

#### Scenario: a Postgrest 403

- **GIVEN** a Postgrest error with status 403
- **WHEN** it is built into a service error
- **THEN** the AppError has the code FORBIDDEN and the message key helper.error.forbidden
- **Test:** `packages/supabase/src/buildSupabaseServiceError.helper.test.ts` › "maps a Postgrest 403 to FORBIDDEN via the injected mapper"

#### Scenario: an AppError already

- **GIVEN** an AppError
- **WHEN** it is built into a service error
- **THEN** the same instance comes back
- **Test:** `packages/supabase/src/buildSupabaseServiceError.helper.test.ts` › "passes an AppError through unchanged"

#### Scenario: an unrecognised error

- **GIVEN** a plain Error
- **WHEN** it is built into a service error
- **THEN** the AppError has the code UNKNOWN
- **Test:** `packages/supabase/src/buildSupabaseServiceError.helper.test.ts` › "maps an unrecognised error to UNKNOWN"

#### Scenario: null

- **GIVEN** a null error
- **WHEN** it is built into a service error
- **THEN** the result is an AppError
- **Test:** `packages/supabase/src/buildSupabaseServiceError.helper.test.ts` › "always returns an AppError instance"

### Requirement: SUPABASE-06 — getSession returns the neutral session or null

The supabase package SHALL make the auth gateway's getSession return the SDK session as the neutral auth session of packages/core (accessToken, expiresAt, userId), with expiresAt null when the SDK gives none, and null when there is no session.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:16`, `packages/supabase/src/supabaseAuth.adapter.ts:18`, `packages/supabase/src/supabaseAuth.adapter.ts:29`

#### Scenario: no session

- **GIVEN** an SDK client whose session is null
- **WHEN** the gateway's getSession runs
- **THEN** it returns null
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "getSession returns null when the SDK session is null"

#### Scenario: a session

- **GIVEN** an SDK client with a session
- **WHEN** the gateway's getSession runs
- **THEN** it returns the access token, the expiry and the user id under the neutral names
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "getSession maps the SDK session to IAuthSession"

#### Scenario: a session with no expiry

- **GIVEN** an SDK session with no expires_at
- **WHEN** the gateway's getSession runs
- **THEN** the returned expiresAt is null
- **Test:** Not covered — every test session carries an expiry

### Requirement: SUPABASE-07 — signIn returns the session or throws the SDK error

The supabase package SHALL make the auth gateway's signIn sign in with email and password and resolve the neutral session, and reject with the SDK's own error, unmapped, when the SDK reports one.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:46`, `packages/supabase/src/supabaseAuth.adapter.ts:50`, `packages/supabase/src/supabaseAuth.adapter.ts:51`

#### Scenario: valid credentials

- **GIVEN** an SDK client that signs the user in
- **WHEN** the gateway's signIn runs with an email and a password
- **THEN** it resolves the neutral session
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "signIn maps the returned session to IAuthSession"

#### Scenario: the SDK reports an error

- **GIVEN** an SDK client that answers sign-in with an error
- **WHEN** the gateway's signIn runs
- **THEN** it rejects with that error
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "signIn throws when the SDK returns an error"

### Requirement: SUPABASE-08 — Auth changes reach the subscriber until it unsubscribes

The supabase package SHALL relay every SDK auth change to the subscriber of onAuthStateChange, as the neutral session or null, and return a subscription whose unsubscribe ends the SDK subscription.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:37`, `packages/supabase/src/supabaseAuth.adapter.ts:39`

#### Scenario: a sign-in event

- **GIVEN** a subscriber of onAuthStateChange
- **WHEN** the SDK reports a sign-in with a session
- **THEN** the subscriber receives the neutral session
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "onAuthStateChange calls onChange with a mapped session"

#### Scenario: a sign-out event

- **GIVEN** a subscriber of onAuthStateChange
- **WHEN** the SDK reports a sign-out with no session
- **THEN** the subscriber receives a null session
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "onAuthStateChange calls onChange with null on sign-out"

#### Scenario: the subscriber unsubscribes

- **GIVEN** a subscription returned by onAuthStateChange
- **WHEN** its unsubscribe is called
- **THEN** the SDK subscription is unsubscribed once
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "unsubscribe delegates to the SDK subscription"

### Requirement: SUPABASE-09 — signOut signs out through the SDK

The supabase package SHALL make the auth gateway's signOut call the SDK's sign-out.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:55`

#### Scenario: the user signs out

- **GIVEN** an auth gateway over an SDK client
- **WHEN** its signOut runs
- **THEN** the SDK's sign-out is called once
- **Test:** `packages/supabase/src/supabaseAuth.adapter.test.ts` › "signOut delegates to the SDK"

### Requirement: SUPABASE-10 — Row-level security is enabled and forced on every table

The supabase database SHALL enable and force row-level security on profile, role_capability, user_role_grant and audit_log, so a role with no matching policy, the table owner included, reads and writes nothing.

**Evidence:** `packages/supabase/supabase/migrations/0007_rls_enable.sql:41`, `packages/supabase/supabase/migrations/0007_rls_enable.sql:42`

#### Scenario: profile

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for profile
- **THEN** row-level security is enabled
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "RLS is enabled on profile"

#### Scenario: role_capability

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for role_capability
- **THEN** row-level security is enabled
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "RLS is enabled on role_capability"

#### Scenario: user_role_grant

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for user_role_grant
- **THEN** row-level security is enabled
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "RLS is enabled on user_role_grant"

#### Scenario: audit_log

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for audit_log
- **THEN** row-level security is enabled
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "RLS is enabled on audit_log"

#### Scenario: the owner is bound too

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for any of the four tables
- **THEN** row-level security is forced
- **Test:** Not covered — the pgTAP tests read relrowsecurity only, never relforcerowsecurity

### Requirement: SUPABASE-11 — Every authenticated user reads every profile

The supabase database SHALL let any authenticated user read every profile row, their own and other users' alike.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:25`

#### Scenario: another user's profile

- **GIVEN** a user with no role, signed in
- **WHEN** they select another user's profile by id
- **THEN** one row comes back
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can read any profile row (profile_select using true)"

#### Scenario: the user's own profile

- **GIVEN** a user, signed in
- **WHEN** they select their own profile
- **THEN** one row comes back
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can read own profile row"

### Requirement: SUPABASE-12 — A user updates only their own profile

The supabase database SHALL let an authenticated user update a profile row only when its id is their own user id, before and after the change.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:31`, `packages/supabase/supabase/migrations/0008_rls_policies.sql:32`

#### Scenario: the user's own profile

- **GIVEN** a user, signed in
- **WHEN** they update their own display name
- **THEN** the new value is stored
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can update own profile row"

#### Scenario: another user's profile

- **GIVEN** a user, signed in
- **WHEN** they update another user's profile
- **THEN** that row stays unchanged
- **Test:** Not covered — the pgTAP assertion for this case expects an exception, which a row filtered by an UPDATE policy does not raise (open question)

### Requirement: SUPABASE-13 — A user sees only their own role grants

The supabase database SHALL let an authenticated user read user_role_grant rows only where the user id is their own.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:86`

#### Scenario: another user's grants

- **GIVEN** a user, signed in, and a grant held by another user
- **WHEN** they select from user_role_grant
- **THEN** only their own grants come back
- **Test:** Not covered — no pgTAP assertion reads user_role_grant as an authenticated user

### Requirement: SUPABASE-14 — Writes to the RBAC and audit tables are service-role only

The supabase database SHALL hold write policies on role_capability, user_role_grant and audit_log for service_role only, so no authenticated user can grant themselves a role or write an audit event.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:74`, `packages/supabase/supabase/migrations/0008_rls_policies.sql:91`, `packages/supabase/supabase/migrations/0008_rls_policies.sql:55`

#### Scenario: a user grants themselves a role

- **GIVEN** a user, signed in
- **WHEN** they insert a user_role_grant row for themselves
- **THEN** row-level security rejects the insert
- **Test:** Not covered — no pgTAP assertion writes to the RBAC or audit tables as an authenticated user

### Requirement: SUPABASE-15 — RBAC table policies call no helper

The supabase database SHALL keep every policy on role_capability and user_role_grant free of calls to the auth_helpers functions, which read those two tables, so a policy check never recurses.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:69`, `packages/supabase/supabase/migrations/0008_rls_policies.sql:86`

#### Scenario: the policies are inspected

- **GIVEN** the migrations applied
- **WHEN** the policies of role_capability and user_role_grant are searched for a helper name
- **THEN** none is found
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "RBAC table policies do not call auth_helpers functions (anti-recursion contract)"

### Requirement: SUPABASE-16 — Capabilities resolve from active grants

The supabase database SHALL resolve the caller's capabilities from their active role grants only, those with no revoked_at: has_capability is true when such a grant maps to the capability, and is_staff is true when such a grant maps to any capability.

**Evidence:** `packages/supabase/supabase/migrations/0003_auth_helpers.sql:57`, `packages/supabase/supabase/migrations/0003_auth_helpers.sql:58`, `packages/supabase/supabase/migrations/0003_auth_helpers.sql:82`

#### Scenario: a user with no grant

- **GIVEN** a user with no role grant, signed in
- **WHEN** they call is_staff
- **THEN** it is false
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "is_staff returns false for user with no active role grants"

#### Scenario: an admin

- **GIVEN** a user with an active admin grant, signed in
- **WHEN** they call is_staff
- **THEN** it is true
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "is_staff returns true for user with active admin role grant"

#### Scenario: a revoked grant

- **GIVEN** a user whose only grant has a revoked_at
- **WHEN** they call is_staff
- **THEN** it is false
- **Test:** Not covered — no fixture revokes a grant

### Requirement: SUPABASE-17 — The privileged helpers are out of anonymous and API reach

The supabase database SHALL let only authenticated and service_role execute the SECURITY DEFINER helpers, and keep the auth_helpers schema out of the schemas the API serves, exposing has_capability over the API only through its public wrapper.

**Evidence:** `packages/supabase/supabase/migrations/0003_auth_helpers.sql:113`, `packages/supabase/supabase/migrations/0003_auth_helpers.sql:114`, `packages/supabase/supabase/migrations/0003_auth_helpers.sql:154`, `packages/supabase/supabase/config.toml:9`

#### Scenario: an anonymous caller

- **GIVEN** the anon role
- **WHEN** it calls a helper
- **THEN** execution is refused
- **Test:** Not covered — no pgTAP assertion calls a helper as anon

#### Scenario: an API call into auth_helpers

- **GIVEN** the API's schema list
- **WHEN** a client calls an auth_helpers function over the API
- **THEN** the API does not serve that schema
- **Test:** Not covered — the API configuration is not tested

### Requirement: SUPABASE-18 — At most one active grant per user and role

The supabase database SHALL reject a second active user_role_grant row for the same user and role.

**Evidence:** `packages/supabase/supabase/migrations/0004_rbac.sql:82`, `packages/supabase/supabase/migrations/0004_rbac.sql:84`

#### Scenario: the role is granted twice

- **GIVEN** a user with an active admin grant
- **WHEN** a second active admin grant is inserted for them
- **THEN** the insert fails on the unique index
- **Test:** Not covered — no pgTAP assertion inserts a duplicate grant

### Requirement: SUPABASE-19 — The audit log is append-only

The supabase database SHALL refuse every update and every delete of an audit_log row, whoever runs it, with the exception "audit_log is append-only: UPDATE and DELETE are not permitted".

**Evidence:** `packages/supabase/supabase/migrations/0006_audit.sql:77`, `packages/supabase/supabase/migrations/0006_audit.sql:109`

#### Scenario: an update

- **GIVEN** an audit event, and a superuser session
- **WHEN** the row is updated
- **THEN** the immutability exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log UPDATE raises immutability exception"

#### Scenario: a delete

- **GIVEN** an audit event, and a superuser session
- **WHEN** the row is deleted
- **THEN** the immutability exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log DELETE raises immutability exception"

### Requirement: SUPABASE-20 — A suspension event carries a reason

The supabase database SHALL reject an audit_log row whose action is profile_suspended unless its metadata holds a reason key.

**Evidence:** `packages/supabase/supabase/migrations/0006_audit.sql:46`, `packages/supabase/supabase/migrations/0006_audit.sql:47`

#### Scenario: a suspension without a reason

- **GIVEN** the service path
- **WHEN** it inserts a profile_suspended event with empty metadata
- **THEN** the check constraint rejects the row
- **Test:** Not covered — no pgTAP assertion inserts a profile_suspended event

### Requirement: SUPABASE-21 — Only staff read the audit log

The supabase database SHALL let an authenticated user read audit_log rows only when is_staff is true for them.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:49`

#### Scenario: a user who is not staff

- **GIVEN** a user with no role grant, signed in, and an audit event
- **WHEN** they select from audit_log
- **THEN** no row comes back
- **Test:** Not covered — no pgTAP assertion reads audit_log as an authenticated user

### Requirement: SUPABASE-22 — The admin role holds profile.manage by default

The supabase database SHALL seed the role-capability map with admin mapped to profile.manage, leaving an existing row untouched when the seed runs again.

**Evidence:** `packages/supabase/supabase/migrations/0009_seed.sql:11`, `packages/supabase/supabase/migrations/0009_seed.sql:12`

#### Scenario: an admin checks the capability

- **GIVEN** the migrations applied, and a user with an active admin grant, signed in
- **WHEN** they call has_capability for profile.manage
- **THEN** it is true
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "has_capability returns true for admin user with profile.manage"

#### Scenario: the seed runs twice

- **GIVEN** the admin to profile.manage row already present
- **WHEN** the seed runs again
- **THEN** the map still holds one such row
- **Test:** Not covered — no pgTAP assertion reruns the seed

## Open questions

- **Q1** — Likely defect: `packages/supabase/supabase/migrations/0003_auth_helpers.sql:45`
  declares a parameter of type `public.app_capability` and its body reads `public.user_role_grant`
  (`packages/supabase/supabase/migrations/0003_auth_helpers.sql:54`), but the type is created only
  at `packages/supabase/supabase/migrations/0004_rbac.sql:39` and the tables after it, so the
  migrations applied in number order on an empty database should fail at 0003;
  `packages/supabase/docs/database.md:147` describes the same order. Not checked against a live
  database. The database requirements describe the state after all nine migrations.
- **Q2** — Nothing grants `authenticated` USAGE on the `auth_helpers` schema that
  `packages/supabase/supabase/migrations/0001_extensions.sql:20` creates, yet the audit-log policy
  at `packages/supabase/supabase/migrations/0008_rls_policies.sql:49` calls
  `auth_helpers.is_staff()` as that role, as do the tests at
  `packages/supabase/supabase/tests/rls_profile.test.sql:146`; Postgres refuses a function call
  without USAGE on its schema. Not checked against a live database.
- **Q3** — The comment at `packages/supabase/supabase/migrations/0008_rls_policies.sql:20` says a
  user reads their own profile, but the policy at
  `packages/supabase/supabase/migrations/0008_rls_policies.sql:25` lets every signed-in user read
  every profile; the test section header at
  `packages/supabase/supabase/tests/rls_profile.test.sql:88` says "0 rows" while line 99 asserts
  one. SUPABASE-11 states the code.
- **Q4** — `packages/supabase/supabase/tests/rls_profile.test.sql:103` expects an error when a
  user updates another user's profile, but Postgres skips the rows the policy at
  `packages/supabase/supabase/migrations/0008_rls_policies.sql:31` filters out without raising
  one, so that assertion should fail when it runs. SUPABASE-12 marks that scenario not covered.
- **Q5** — `AGENTS.md:182` forbids the local stack and `AGENTS.md:205` generates types with
  `--linked`, but `packages/supabase/package.json:22` uses `--local`; and
  `packages/supabase/src/types.ts:13` is still the placeholder with no tables, although the
  migrations define four.
