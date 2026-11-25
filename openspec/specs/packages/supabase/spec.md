# packages/supabase — living spec

> **Governs:** `packages/supabase/src`, `packages/supabase/supabase/migrations`, `packages/supabase/supabase/config.toml`, `packages/supabase/package.json`, `scripts/supabase-test-db.mjs`
> **ID prefix:** `SUPABASE`
> **Derived from:** `packages/supabase/docs/database.md`, `AGENTS.md`, `docs/code-standards.md`
> **Verified against the code:** 2026-11-25 at `6cdbbaa`

## Purpose

The supabase package is the default backend adapter: the anon-key browser client and the SSR
server client, handed out as one opaque backend client type, the auth gateway, the Postgrest
error mapper and the AppError builder, and the database, with row-level security enabled and
forced on four tables, the API roles' privileges narrowed where row-level security does not
reach, the RBAC tables and helpers, the append-only audit log and the seed, and `test:db`, which
runs the pgTAP suites over the checkout's migrations on the target the package sets. The ports, AppError and the message-key map belong to
packages/core, and the catalogs that translate the keys to packages/i18n.

## Requirements

### Requirement: SUPABASE-01 — Entry points expose the backend adapter

The supabase package SHALL expose from its main entry point buildSupabaseServiceError, createSupabaseClient, mapSupabaseError, createSupabaseAuthGateway, the BackendClientType of its clients and the Database type, and from its server entry point createSupabaseServerClient.

**Evidence:** `packages/supabase/src/index.ts:1`, `packages/supabase/src/index.ts:6`, `packages/supabase/package.json:8`

#### Scenario: an app imports the package

- **GIVEN** an app that depends on the supabase package
- **WHEN** it imports from the main entry point and from its server entry point
- **THEN** the main entry point gives the four factories, the BackendClientType and the Database type, and the server entry point gives the server client factory
- **Test:** Not covered — every test imports its module directly; only the consumers' typecheck reads the entry points

### Requirement: SUPABASE-02 — Clients are built over the anon key

The supabase package SHALL build its clients from a URL and an anon key the caller passes, typed by the Database schema inside the package and returned as the opaque BackendClientType (SUPABASE-30): a browser client that satisfies the backend client provider port of packages/core, and a server client that also takes the caller's cookie methods so the user's session reaches RLS.

**Evidence:** `packages/supabase/src/client.adapter.ts:24-28`, `packages/supabase/src/client.adapter.ts:30-32`, `packages/supabase/src/server.adapter.ts:44-51`

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

### Requirement: SUPABASE-03 — A Postgrest error maps to a service code by HTTP status

The supabase package SHALL map an error of the Postgrest shape (a string message and code, and details and hint fields) to a service error code by its HTTP status: 403 to FORBIDDEN, 404 to NOT_FOUND, 500 and above to SERVER_ERROR, and any other status or none to UNKNOWN.

**Evidence:** `packages/supabase/src/mapSupabaseError.adapter.ts:36`, `packages/supabase/src/mapSupabaseError.adapter.ts:40`, `packages/supabase/src/mapSupabaseError.adapter.ts:48`

#### Scenario: status 403

- **GIVEN** a Postgrest error with status 403
- **WHEN** it is mapped
- **THEN** the code is FORBIDDEN
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "maps a 403 Postgrest error to FORBIDDEN"

#### Scenario: status 404

- **GIVEN** a Postgrest error with status 404
- **WHEN** it is mapped
- **THEN** the code is NOT_FOUND
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "maps a 404 Postgrest error to NOT_FOUND"

#### Scenario: status 500

- **GIVEN** a Postgrest error with status 500
- **WHEN** it is mapped
- **THEN** the code is SERVER_ERROR
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "maps a 500 Postgrest error to SERVER_ERROR"

#### Scenario: another 5xx status

- **GIVEN** a Postgrest error with status 502
- **WHEN** it is mapped
- **THEN** the code is SERVER_ERROR
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "maps any 5xx Postgrest error to SERVER_ERROR"

#### Scenario: another 4xx status

- **GIVEN** a Postgrest error with status 400
- **WHEN** it is mapped
- **THEN** the code is UNKNOWN
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "maps an unrecognised 4xx Postgrest error to UNKNOWN"

#### Scenario: no status

- **GIVEN** a Postgrest error with no status
- **WHEN** it is mapped
- **THEN** the code is UNKNOWN
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "maps a Postgrest error without a status to UNKNOWN"

### Requirement: SUPABASE-04 — A value of another shape is left unmapped

The supabase package SHALL return null from the error mapper for any value that is not of the Postgrest shape, leaving its classification to packages/core.

**Evidence:** `packages/supabase/src/mapSupabaseError.adapter.ts:47`, `packages/supabase/src/mapSupabaseError.adapter.ts:19`

#### Scenario: a plain Error

- **GIVEN** a plain Error
- **WHEN** it is mapped
- **THEN** the mapper returns null
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "returns null for a plain Error"

#### Scenario: a string

- **GIVEN** a thrown string
- **WHEN** it is mapped
- **THEN** the mapper returns null
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "returns null for a string"

#### Scenario: null

- **GIVEN** a null error
- **WHEN** it is mapped
- **THEN** the mapper returns null
- **Test:** `packages/supabase/src/__tests__/mapSupabaseError.adapter.test.ts` › "returns null for null"

### Requirement: SUPABASE-05 — Any thrown value becomes an AppError

The supabase package SHALL turn any thrown value into an AppError through the service-error builder of packages/core, with mapSupabaseError as its mapper, so a caller gets a code and a message key instead of the raw backend error.

**Evidence:** `packages/supabase/src/buildSupabaseServiceError.helper.ts:13`

#### Scenario: a Postgrest 403

- **GIVEN** a Postgrest error with status 403
- **WHEN** it is built into a service error
- **THEN** the AppError has the code FORBIDDEN and the message key helper.error.forbidden
- **Test:** `packages/supabase/src/__tests__/buildSupabaseServiceError.helper.test.ts` › "maps a Postgrest 403 to FORBIDDEN via the injected mapper"

#### Scenario: an AppError already

- **GIVEN** an AppError
- **WHEN** it is built into a service error
- **THEN** the same instance comes back
- **Test:** `packages/supabase/src/__tests__/buildSupabaseServiceError.helper.test.ts` › "passes an AppError through unchanged"

#### Scenario: an unrecognised error

- **GIVEN** a plain Error
- **WHEN** it is built into a service error
- **THEN** the AppError has the code UNKNOWN
- **Test:** `packages/supabase/src/__tests__/buildSupabaseServiceError.helper.test.ts` › "maps an unrecognised error to UNKNOWN"

#### Scenario: null

- **GIVEN** a null error
- **WHEN** it is built into a service error
- **THEN** the result is an AppError
- **Test:** `packages/supabase/src/__tests__/buildSupabaseServiceError.helper.test.ts` › "always returns an AppError instance"

### Requirement: SUPABASE-06 — getSession returns the neutral session or null

The supabase package SHALL make the auth gateway's getSession return the SDK session as the neutral auth session of packages/core (accessToken, expiresAt, userId), with expiresAt null when the SDK gives none, and null when there is no session.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:16`, `packages/supabase/src/supabaseAuth.adapter.ts:18`, `packages/supabase/src/supabaseAuth.adapter.ts:35`

#### Scenario: no session

- **GIVEN** an SDK client whose session is null
- **WHEN** the gateway's getSession runs
- **THEN** it returns null
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "getSession returns null when the SDK session is null"

#### Scenario: a session

- **GIVEN** an SDK client with a session
- **WHEN** the gateway's getSession runs
- **THEN** it returns the access token, the expiry and the user id under the neutral names
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "getSession maps the SDK session to IAuthSession"

#### Scenario: a session with no expiry

- **GIVEN** an SDK session with no expires_at
- **WHEN** the gateway's getSession runs
- **THEN** the returned expiresAt is null
- **Test:** Not covered — every test session carries an expiry

### Requirement: SUPABASE-07 — signIn returns the session or throws the SDK error

The supabase package SHALL make the auth gateway's signIn sign in with email and password and resolve the neutral session, and reject with the SDK's own error, unmapped, when the SDK reports one.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:52`, `packages/supabase/src/supabaseAuth.adapter.ts:56`, `packages/supabase/src/supabaseAuth.adapter.ts:57`

#### Scenario: valid credentials

- **GIVEN** an SDK client that signs the user in
- **WHEN** the gateway's signIn runs with an email and a password
- **THEN** it resolves the neutral session
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "signIn maps the returned session to IAuthSession"

#### Scenario: the SDK reports an error

- **GIVEN** an SDK client that answers sign-in with an error
- **WHEN** the gateway's signIn runs
- **THEN** it rejects with that error
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "signIn throws when the SDK returns an error"

### Requirement: SUPABASE-08 — Auth changes reach the subscriber until it unsubscribes

The supabase package SHALL relay every SDK auth change to the subscriber of onAuthStateChange, as the neutral session or null, and return a subscription whose unsubscribe ends the SDK subscription.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:43`, `packages/supabase/src/supabaseAuth.adapter.ts:45`

#### Scenario: a sign-in event

- **GIVEN** a subscriber of onAuthStateChange
- **WHEN** the SDK reports a sign-in with a session
- **THEN** the subscriber receives the neutral session
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "onAuthStateChange calls onChange with a mapped session"

#### Scenario: a sign-out event

- **GIVEN** a subscriber of onAuthStateChange
- **WHEN** the SDK reports a sign-out with no session
- **THEN** the subscriber receives a null session
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "onAuthStateChange calls onChange with null on sign-out"

#### Scenario: the subscriber unsubscribes

- **GIVEN** a subscription returned by onAuthStateChange
- **WHEN** its unsubscribe is called
- **THEN** the SDK subscription is unsubscribed once
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "unsubscribe delegates to the SDK subscription"

### Requirement: SUPABASE-09 — signOut signs out through the SDK

The supabase package SHALL make the auth gateway's signOut call the SDK's sign-out.

**Evidence:** `packages/supabase/src/supabaseAuth.adapter.ts:61`

#### Scenario: the user signs out

- **GIVEN** an auth gateway over an SDK client
- **WHEN** its signOut runs
- **THEN** the SDK's sign-out is called once
- **Test:** `packages/supabase/src/__tests__/supabaseAuth.adapter.test.ts` › "signOut delegates to the SDK"

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

### Requirement: SUPABASE-11 — A user reads only their own profile

The supabase database SHALL let an authenticated user read a profile row only when its id is their own user id.

**Evidence:** `packages/supabase/supabase/migrations/0008_rls_policies.sql:25`

#### Scenario: another user's profile

- **GIVEN** a user with no role, signed in
- **WHEN** they select another user's profile by id
- **THEN** no row comes back
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user cannot read another user profile row"

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
- **THEN** the statement raises no error and that row stays unchanged
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "unauthorized user cannot update another user profile"

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
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot grant themselves a role"

#### Scenario: the grants after the refused insert

- **GIVEN** the refused insert
- **WHEN** user_role_grant is read as postgres
- **THEN** the user holds no grant
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused self-grant leaves the user with no role"

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

**Evidence:** `packages/supabase/supabase/migrations/0004_auth_helpers.sql:65`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:66`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:90`

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

The supabase database SHALL let only authenticated and service_role execute the SECURITY DEFINER helpers, the public has_capability wrapper among them, and keep the auth_helpers schema out of the schemas the API serves, exposing has_capability over the API only through its public wrapper.

**Evidence:** `packages/supabase/supabase/migrations/0004_auth_helpers.sql:140`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:141`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:181`, `packages/supabase/supabase/migrations/0010_api_privileges.sql:27`, `packages/supabase/supabase/config.toml:9`

#### Scenario: an anonymous caller

- **GIVEN** the anon role
- **WHEN** it calls the public has_capability wrapper
- **THEN** Postgres refuses it with "permission denied for function has_capability"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon cannot execute the public has_capability wrapper"

#### Scenario: every privileged function

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon on every SECURITY DEFINER function in public and auth_helpers
- **THEN** it may execute none
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon may execute no security definer function in public or auth_helpers"

#### Scenario: a signed-in admin calls the wrapper

- **GIVEN** a user with an active admin grant, signed in
- **WHEN** they call public.has_capability for profile.manage
- **THEN** it answers true
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "the public has_capability wrapper answers a signed-in admin"

#### Scenario: an API call into auth_helpers

- **GIVEN** the API's schema list
- **WHEN** a client calls an auth_helpers function over the API
- **THEN** the API does not serve that schema
- **Test:** Not covered — the API configuration is not tested

### Requirement: SUPABASE-18 — At most one active grant per user and role

The supabase database SHALL reject a second active user_role_grant row for the same user and role.

**Evidence:** `packages/supabase/supabase/migrations/0003_rbac.sql:85`, `packages/supabase/supabase/migrations/0003_rbac.sql:87`

#### Scenario: the role is granted twice

- **GIVEN** a user with an active admin grant
- **WHEN** a second active admin grant is inserted for them
- **THEN** the insert fails on the unique index
- **Test:** Not covered — no pgTAP assertion inserts a duplicate grant

### Requirement: SUPABASE-19 — The audit log is append-only

The supabase database SHALL refuse every update, delete and truncate of audit_log, whoever runs it, an update or a delete with the exception "audit_log is append-only: UPDATE and DELETE are not permitted" and a truncate with "audit_log is append-only: TRUNCATE is not permitted".

**Evidence:** `packages/supabase/supabase/migrations/0006_audit.sql:77`, `packages/supabase/supabase/migrations/0006_audit.sql:109`, `packages/supabase/supabase/migrations/0012_audit_truncate.sql:23`, `packages/supabase/supabase/migrations/0012_audit_truncate.sql:53`

#### Scenario: an update

- **GIVEN** an audit event, and the session role postgres, which owns the table
- **WHEN** the row is updated
- **THEN** the immutability exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log UPDATE raises immutability exception"

#### Scenario: a delete

- **GIVEN** an audit event, and the session role postgres, which owns the table
- **WHEN** the row is deleted
- **THEN** the immutability exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log DELETE raises immutability exception"

#### Scenario: a truncate by the owner

- **GIVEN** an audit event, and the session role postgres, which owns the table
- **WHEN** the table is truncated
- **THEN** the TRUNCATE exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log TRUNCATE raises immutability exception"

#### Scenario: a truncate by the service role

- **GIVEN** an audit event, and service_role, which holds TRUNCATE on the table
- **WHEN** it truncates the table
- **THEN** the TRUNCATE exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log TRUNCATE by service_role raises immutability exception"

#### Scenario: a truncate naming other tables too

- **GIVEN** an audit event, and service_role
- **WHEN** it truncates profile and audit_log in one statement
- **THEN** the TRUNCATE exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a truncate naming audit_log among other tables is refused"

#### Scenario: the event after the refused truncates

- **GIVEN** both refused truncates
- **WHEN** audit_log is read as postgres
- **THEN** the event is still there
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused truncates leave the audit event in place"

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
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "user who is not staff reads no audit event"

#### Scenario: a staff user

- **GIVEN** a user with an active admin grant, signed in, and an audit event
- **WHEN** they select from audit_log
- **THEN** the event comes back
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "staff user reads audit events"

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

### Requirement: SUPABASE-23 — Signed-in users and the service role reach the helpers schema

The supabase database SHALL grant USAGE on the auth_helpers schema to authenticated and service_role and to no other API role, so a query, or a PL/pgSQL or string-body SQL function, running as authenticated or service_role can call the helpers that role may execute, and anon cannot name them.

**Evidence:** `packages/supabase/supabase/migrations/0004_auth_helpers.sql:108`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:141`

#### Scenario: a signed-in user calls a helper

- **GIVEN** a user with no role grant, signed in
- **WHEN** they call auth_helpers.is_staff in a query
- **THEN** it answers false instead of refusing the schema
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "is_staff returns false for user with no active role grants"

#### Scenario: the anon role names a helper

- **GIVEN** the anon role
- **WHEN** it calls auth_helpers.is_staff
- **THEN** Postgres refuses it with "permission denied for schema auth_helpers"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon cannot reach the auth_helpers schema"

#### Scenario: the service role's schema privilege

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for service_role on auth_helpers
- **THEN** it holds USAGE
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "service_role has USAGE on the auth_helpers schema"

#### Scenario: the anon role's schema privilege

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon on auth_helpers
- **THEN** it holds no USAGE
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon has no USAGE on the auth_helpers schema"

### Requirement: SUPABASE-24 — The migrations apply in number order

The supabase database SHALL create every type, table and function a migration uses in that migration or an earlier one, so its migrations apply in number order on an empty Supabase database.

**Evidence:** `packages/supabase/supabase/migrations/0003_rbac.sql:42`, `packages/supabase/supabase/migrations/0003_rbac.sql:56`, `packages/supabase/supabase/migrations/0003_rbac.sql:70`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:53`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:62`, `packages/supabase/docs/database.md:35`, `packages/supabase/src/findMigrationOrderViolations.helper.ts:33`

#### Scenario: an empty database

- **GIVEN** an empty database holding only what Supabase provides before a first migration
- **WHEN** every migration is applied in number order, each stopping on its first error
- **THEN** every one of them applies
- **Test:** Not covered — no gate has a database; the verify report records the run on a scratch PostgreSQL 18.4 with the Supabase pieces stubbed

#### Scenario: the package's migrations, read offline

- **GIVEN** the migration files of the package
- **WHEN** the order check reads them in name order
- **THEN** none names a public type, table, view or function that only a later migration creates
- **Test:** `packages/supabase/src/__tests__/findMigrationOrderViolations.helper.test.ts` › "the migrations name no public object that only a later migration creates"

#### Scenario: a migration names a later table

- **GIVEN** two migrations, the first naming a public table that the second creates
- **WHEN** the order check reads them
- **THEN** it reports the first migration, the table and the migration that creates it
- **Test:** `packages/supabase/src/__tests__/findMigrationOrderViolations.helper.test.ts` › "reports a table a migration names before the migration that creates it"

### Requirement: SUPABASE-25 — A helper added to auth_helpers starts out of reach

The supabase database SHALL give a function postgres creates in the auth_helpers schema no EXECUTE for PUBLIC or any API role until a grant names its callers, while a function postgres creates in public or extensions keeps the EXECUTE Postgres gives PUBLIC.

**Evidence:** `packages/supabase/supabase/migrations/0004_auth_helpers.sql:116`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:118`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:120`

#### Scenario: a signed-in user and a helper with no grant block

- **GIVEN** the migrations applied, and a function postgres adds to auth_helpers with no grant of its own
- **WHEN** the catalog is read for authenticated on that function
- **THEN** it may not execute it
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a helper added without grants is not executable by authenticated"

#### Scenario: the anon role and a helper with no grant block

- **GIVEN** the migrations applied, and a function postgres adds to auth_helpers with no grant of its own
- **WHEN** the catalog is read for anon on that function
- **THEN** it may not execute it
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a helper added without grants is not executable by anon"

#### Scenario: a function added to public

- **GIVEN** the migrations applied, and a function postgres adds to public with no grant of its own
- **WHEN** the catalog is read for PUBLIC on that function
- **THEN** PUBLIC may execute it
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a function added to public keeps EXECUTE for PUBLIC"

#### Scenario: a function added to extensions

- **GIVEN** the migrations applied, and a function postgres adds to extensions with no grant of its own
- **WHEN** the catalog is read for PUBLIC on that function
- **THEN** PUBLIC may execute it
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a function added to extensions keeps EXECUTE for PUBLIC"

### Requirement: SUPABASE-26 — Only the service role holds the table privileges row-level security does not narrow

The supabase database SHALL give anon and authenticated no TRUNCATE, TRIGGER, REFERENCES or MAINTAIN on any table in public, on those the migrations create and on those postgres creates there later, while SELECT, INSERT, UPDATE and DELETE, whose rows the policies narrow, stay on a table added later.

**Evidence:** `packages/supabase/supabase/migrations/0010_api_privileges.sql:38`, `packages/supabase/supabase/migrations/0010_api_privileges.sql:42`, `packages/supabase/supabase/migrations/0013_table_privileges.sql:23`, `packages/supabase/supabase/migrations/0013_table_privileges.sql:27`, `packages/supabase/supabase/migrations/0013_table_privileges.sql:34`

#### Scenario: the anon role's privilege

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon on every table in public
- **THEN** it holds TRUNCATE on none
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon holds TRUNCATE on no table in public"

#### Scenario: the authenticated role's privilege

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for authenticated on every table in public
- **THEN** it holds TRUNCATE on none
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated holds TRUNCATE on no table in public"

#### Scenario: a signed-in user truncates a table

- **GIVEN** a user, signed in
- **WHEN** they truncate profile
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a signed-in user cannot truncate a table"

#### Scenario: the profiles after the refused truncate

- **GIVEN** the refused truncate
- **WHEN** profile is read as postgres
- **THEN** every profile row is still there
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused truncate leaves every profile in place"

#### Scenario: a table postgres adds later

- **GIVEN** the migrations applied, and a table postgres adds to public with no grant of its own
- **WHEN** the catalog is read for anon and authenticated on that table
- **THEN** neither holds TRUNCATE
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a table added to public gives anon and authenticated no TRUNCATE"

#### Scenario: the other privileges of a table added later

- **GIVEN** the migrations applied, and a table postgres adds to public with no grant of its own
- **WHEN** the catalog is read for the API roles on that table
- **THEN** anon and authenticated still hold SELECT, INSERT, UPDATE and DELETE, and service_role still holds TRUNCATE, TRIGGER and REFERENCES
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a table added to public keeps the other privileges Supabase gives the API roles"

#### Scenario: the anon role's other privileges

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon on every table in public
- **THEN** it holds TRIGGER, REFERENCES and MAINTAIN on none
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon holds no TRIGGER, REFERENCES or MAINTAIN on any table in public"

#### Scenario: the authenticated role's other privileges

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for authenticated on every table in public
- **THEN** it holds TRIGGER, REFERENCES and MAINTAIN on none
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated holds no TRIGGER, REFERENCES or MAINTAIN on any table in public"

#### Scenario: a signed-in user creates a trigger

- **GIVEN** a user, signed in
- **WHEN** they create a trigger on profile that runs tg_audit_immutable
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a signed-in user cannot create a trigger on a table"

#### Scenario: the other privileges of a table postgres adds later

- **GIVEN** the migrations applied, and a table postgres adds to public with no grant of its own
- **WHEN** the catalog is read for anon and authenticated on that table
- **THEN** neither holds TRIGGER, REFERENCES or MAINTAIN
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a table added to public gives anon and authenticated no TRIGGER, REFERENCES or MAINTAIN"

### Requirement: SUPABASE-27 — A user edits only the display name of their profile

The supabase database SHALL let authenticated update only the display_name column of profile, so a signed-in user never sets a profile's id, email, credit_balance, status or timestamps, nor a column a project adds until a grant names it.

**Evidence:** `packages/supabase/supabase/migrations/0011_profile_columns.sql:18`, `packages/supabase/supabase/migrations/0011_profile_columns.sql:20`, `packages/supabase/supabase/migrations/0008_rls_policies.sql:31`

#### Scenario: the column privileges

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for authenticated on every column of profile
- **THEN** it may update display_name and no other column
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated may update only the display_name column of profile"

#### Scenario: the status

- **GIVEN** a user, signed in
- **WHEN** they set the status of every profile row they may update, their own
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the status of their own profile"

#### Scenario: the credit balance

- **GIVEN** a user, signed in
- **WHEN** they set the credit_balance of their own profile
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the credit balance of their own profile"

#### Scenario: the id

- **GIVEN** a user, signed in
- **WHEN** they set the id of their own profile
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the id of their own profile"

#### Scenario: the email

- **GIVEN** a user, signed in
- **WHEN** they set the email of their own profile
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the email of their own profile"

#### Scenario: the timestamps

- **GIVEN** a user, signed in
- **WHEN** they set the created_at and updated_at of their own profile
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the timestamps of their own profile"

#### Scenario: an upsert

- **GIVEN** a user, signed in, with a profile
- **WHEN** they insert their own profile with a credit_balance, on conflict updating it
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the credit balance through an upsert"

#### Scenario: the row after the refused updates

- **GIVEN** the refused updates
- **WHEN** the user's profile is read as postgres
- **THEN** its id, email, status, credit_balance and created_at equal a snapshot taken before the updates, however old the row
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused updates leave the profile of the user unchanged"

#### Scenario: the display name

- **GIVEN** a user, signed in
- **WHEN** they update their own display name
- **THEN** the new value is stored
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can update own profile row"

### Requirement: SUPABASE-28 — Only the service path creates a profile

The supabase database SHALL give anon and authenticated no INSERT on any column of profile, so a profile row is created by service_role only, never with values a user chose.

**Evidence:** `packages/supabase/supabase/migrations/0011_profile_columns.sql:26`

#### Scenario: the insert privileges

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon and authenticated on every column of profile
- **THEN** neither may insert any column
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon and authenticated may insert no profile column"

#### Scenario: a user creates their own profile

- **GIVEN** a user with no profile, signed in
- **WHEN** they insert their own profile row with a credit_balance
- **THEN** Postgres refuses it with "permission denied for table profile"
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot create their own profile"

#### Scenario: the service path

- **GIVEN** service_role
- **WHEN** it inserts a profile row
- **THEN** the row is stored
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "the service role still creates a profile"

### Requirement: SUPABASE-29 — No API role executes the audit log's trigger functions

The supabase database SHALL let no API role execute tg_audit_immutable or tg_audit_no_truncate, so none can attach them to a table, while the triggers of audit_log still run them.

**Evidence:** `packages/supabase/supabase/migrations/0013_table_privileges.sql:57`, `packages/supabase/supabase/migrations/0012_audit_truncate.sql:44`

#### Scenario: tg_audit_immutable

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon, authenticated and service_role on tg_audit_immutable
- **THEN** none may execute it
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "no API role may execute tg_audit_immutable"

#### Scenario: tg_audit_no_truncate

- **GIVEN** the migrations applied
- **WHEN** the catalog is read for anon, authenticated and service_role on tg_audit_no_truncate
- **THEN** none may execute it
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "no API role may execute tg_audit_no_truncate"

#### Scenario: the trigger still fires

- **GIVEN** an audit event, and service_role, which may execute neither function
- **WHEN** it updates the row
- **THEN** the immutability exception is raised
- **Test:** `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log UPDATE by service_role raises immutability exception"

### Requirement: SUPABASE-30 — The client leaves the package opaque

The supabase package SHALL hand out its clients as `BackendClientType`, a branded type of
`src/backendClient.type.ts` that names no Supabase type, so an app that holds a client cannot name
or reach the SDK client; only `src/backendClient.adapter.ts` SHALL turn the SDK client into a
`BackendClientType` and back, for the package's own `*.adapter.ts` files, and the auth gateway
SHALL take the client as a `BackendClientType` and reach the SDK through it.

**Evidence:** `packages/supabase/src/backendClient.type.ts:1`, `packages/supabase/src/backendClient.type.ts:9-11`, `packages/supabase/src/backendClient.adapter.ts:11-22`, `packages/supabase/src/client.adapter.ts:28`, `packages/supabase/src/server.adapter.ts:49-51`, `packages/supabase/src/supabaseAuth.adapter.ts:29-31`

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

### Requirement: SUPABASE-31 — test:db runs the pgTAP suites over the checkout's migrations

The supabase package's `test:db` SHALL apply, at the start of each pgTAP file's own transaction,
every migration of the checkout whose version the target database's ledger
(`supabase_migrations.schema_migrations`) lacks, in name order, so the file's `rollback` takes
them with it and the database ends as it was. It SHALL apply each one through a PL/pgSQL
`execute`, without a `begin` and a `commit` that wrap the whole file, and stop on the first that
fails, naming it; it SHALL apply none when the ledger holds a file's version under another name or
under none, and run nothing when two files share a version, naming both. Read with its comments,
strings, quoted identifiers and dollar-quoted bodies blanked, split as the Postgres lexer splits
them, a pgTAP file SHALL open with a plain `begin`,
end with `rollback`, run no other statement that controls the transaction (a savepoint, its
release and `rollback to` it excepted) and hold no psql meta-command; otherwise, or when it holds a quote, a `$` or a comment that
reader cannot pair, test:db SHALL run nothing, naming the file. The bundle SHALL set
`standard_conforming_strings` on, locally, right after each file's first `begin`, before the
migrations, and test:db SHALL run nothing when a file's code, quoted identifiers and dollar
bodies included, names that setting or `set_config`, runs `reset all`, or quotes an identifier
with `U&"..."`.

**Evidence:** `packages/supabase/src/pgTapBundle.constant.ts:3`, `packages/supabase/src/pgTapBundle.constant.ts:22-58`, `packages/supabase/src/pgTapBundle.helper.ts:33-38`, `packages/supabase/src/pgTapBundle.helper.ts:74-120`, `packages/supabase/src/pgTapBundle.helper.ts:137-140`, `packages/supabase/src/pgTapBundle.helper.ts:161-193`, `packages/supabase/src/pgTapBundle.helper.ts:197-200`, `packages/supabase/src/pgTapBundle.helper.ts:211-272`, `packages/supabase/src/pgTapBundle.helper.ts:282-295`, `packages/supabase/src/pgTapCode.constant.ts:7-27`, `packages/supabase/src/pgTapCode.helper.ts:201-227`, `packages/supabase/src/testDbRun.helper.ts:71`, `packages/supabase/docs/database.md:409`, `packages/supabase/docs/database.md:438`, `packages/supabase/docs/database.md:469`, `packages/supabase/docs/database.md:476`, `packages/supabase/docs/database.md:489`

#### Scenario: the checkout's migrations, in order

- **GIVEN** migration files out of name order
- **WHEN** test:db reads them
- **THEN** it lists them in name order, each with the version and the name the Supabase CLI records
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists the migrations in name order, with the version and the name the Supabase CLI records"

#### Scenario: a migration wrapped in its own transaction

- **GIVEN** a migration that opens with `begin;` and ends with `commit;`, with a `commit;` inside
- **WHEN** test:db reads it
- **THEN** the outer pair is removed and the inner `commit;` stays, for Postgres to refuse
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "drops the begin and commit that wrap a whole migration, and keeps a commit inside it"

#### Scenario: a migration that only begins or only commits

- **GIVEN** a migration that opens with `begin;` and does not commit, and one that commits only
- **WHEN** test:db reads them
- **THEN** each keeps its text
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps the text of a migration that only begins or only commits"

#### Scenario: a file the CLI does not read as a migration

- **GIVEN** a `.sql` file of the migrations folder whose name is not `<version>_<name>.sql`
- **WHEN** test:db reads the folder
- **THEN** that file is not applied
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "leaves out a file the Supabase CLI does not read as a migration"

#### Scenario: two files share a version

- **GIVEN** two migration files with the same version
- **WHEN** test:db reads the migrations folder
- **THEN** it runs nothing, naming both files and the version
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses two migrations with the same version, naming both"

#### Scenario: the migrations travel quoted

- **GIVEN** migrations holding quotes, the block's own dollar tags, and one ending where a tag could close
- **WHEN** the block that applies them is built
- **THEN** it lists every one with its file, version and name, and quotes each text and the block with dollar tags none of the texts can end
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists every migration of the checkout, each text dollar-quoted with a tag none of them can end"

#### Scenario: a version the database holds under another name

- **GIVEN** a database whose ledger holds a file's version under another name
- **WHEN** the block runs
- **THEN** it raises, naming the file and both names, before it applies any migration
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "stops on a version the database holds under another name before it applies any migration"

#### Scenario: a ledger row with no name

- **GIVEN** a database whose ledger holds a file's version with no name
- **WHEN** the block runs
- **THEN** it raises as for another name, before it applies any migration
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "treats a ledger row with no name as a conflict"

#### Scenario: a migration the ledger lacks

- **GIVEN** a database whose ledger lacks the version of a file
- **WHEN** the block runs
- **THEN** it applies that file and skips every file whose version the ledger holds
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies a migration only when the database's ledger lacks its version"

#### Scenario: a migration that fails

- **GIVEN** a pending migration that Postgres refuses, such as one with a `commit;` inside
- **WHEN** the block applies it through `execute`
- **THEN** the file stops with an error that names the migration and Postgres's reason
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "runs each migration through a PL/pgSQL execute and names the one that fails"

#### Scenario: a database with no ledger

- **GIVEN** a database with no `supabase_migrations.schema_migrations`
- **WHEN** the block runs
- **THEN** it applies every migration of the checkout and reads no ledger
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies every migration when the database has no migration ledger"

#### Scenario: the pgTAP file's transaction

- **GIVEN** a pgTAP file that opens with `begin;` and ends with `rollback;`
- **WHEN** test:db bundles it
- **THEN** the block sits right after its `begin;` and the rest of the file is unchanged
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "puts the migrations inside each pgTAP file's transaction, right after its begin"

#### Scenario: a pgTAP file outside a transaction

- **GIVEN** a pgTAP file that does not open with `begin;`, or one that does not end with `rollback;`
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not open with begin, naming it"
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not end with rollback, naming it"

#### Scenario: a rollback only in a comment

- **GIVEN** a pgTAP file whose only `rollback;` sits in a comment after a `commit;`, with LF or CRLF line ends
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file whose rollback is only in a trailing comment, naming it"

#### Scenario: a transaction controlled in between

- **GIVEN** a pgTAP file that runs `commit`, `end`, `abort`, `rollback`, `begin`, `start transaction`, `prepare transaction`, `commit prepared` or `set transaction` between its first `begin;` and its last `rollback;`
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file and the statement
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that ends its transaction before its last rollback, naming it: %s"
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses $statement between the first begin and the last rollback, naming the file"

#### Scenario: a savepoint and transaction words outside the code

- **GIVEN** a pgTAP file with a savepoint, its release, `rollback to` it, and transaction words in comments, strings and a `do` body
- **WHEN** test:db bundles the files
- **THEN** it bundles the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps savepoints, and transaction words inside comments, strings and bodies"

#### Scenario: a psql meta-command

- **GIVEN** a pgTAP file with `\i`, `\set` or `\gexec`
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file with a psql meta-command, naming it: %s"

#### Scenario: an opening other than a plain begin

- **GIVEN** a pgTAP file that opens with `begin isolation level serializable;` or `start transaction;`
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file: conservative, since the block runs first
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses any opening other than a plain begin, naming the file: %s"

#### Scenario: a commit after a form a simpler reader misreads

- **GIVEN** a pgTAP file whose `commit;` follows an escape string with `\'`, `--`, `'` or `/*` inside a quoted identifier, a `$` inside identifiers, a `--` comment ended by a lone CR, or a non-ASCII dollar tag
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file and the commit
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses a commit hidden from a masker that misreads Postgres, naming the file: %s"

#### Scenario: a string continued past a newline

- **GIVEN** a pgTAP file with an escape string followed by whitespace that holds a newline, with or without a `--` comment before or after it, then `'\' '; commit;`
- **WHEN** test:db bundles the files
- **THEN** it reads one escape string, as Postgres does, sees the commit and refuses, naming the file; whitespace with no newline ends the string, and a plain string continued past a newline still bundles
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses a commit after an escape string continued past a newline, naming the file: %s"
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "continues a string only past whitespace that holds a newline, as Postgres does: %s"

#### Scenario: a file the reader cannot pair

- **GIVEN** a pgTAP file with a string, an escape string, a quoted identifier, a dollar-quoted body or a nested comment that never closes, or a `$` that pairs with nothing
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses a quote, a dollar sign or a comment it cannot pair, naming the file: %s"

#### Scenario: what Postgres reads as one token

- **GIVEN** a pgTAP file with a `commit;` inside a nested comment, and one with escape strings, doubled quotes, quoted identifiers, `a$b$`, `$1`, a non-ASCII dollar tag and a comment ended by CRLF
- **WHEN** test:db bundles the files
- **THEN** it bundles both
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "reads what Postgres reads as one token, nested comments included: %s"

#### Scenario: the order check's reader stays as it was

- **GIVEN** the order check's reader, `toSqlCode` over `SQL_NON_CODE_TOKEN_PATTERN`
- **WHEN** it reads the six forms
- **THEN** its pattern and its output on the six forms are what they were before the pgTAP reader
- **Test:** `packages/supabase/src/__tests__/sqlCode.helper.test.ts` › "reads the forms the pgTAP check reads on its own exactly as before"

#### Scenario: standard strings forced on

- **GIVEN** a pgTAP file that opens with `begin;`
- **WHEN** test:db bundles it
- **THEN** the bundle holds `set local standard_conforming_strings = on;` once, after the `begin;` and before the migrations block and the file's own statements
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "forces standard_conforming_strings on right after the begin, before the migrations"

#### Scenario: a file that could turn standard strings off

- **GIVEN** a pgTAP file that sets `standard_conforming_strings`, in any case, calls `set_config`, plainly, through a quoted name or inside a `do` body, or runs `reset all`
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that could turn standard_conforming_strings off, naming it: %s"

#### Scenario: a mention in a comment or a string

- **GIVEN** a pgTAP file that names the setting, `set_config` or `reset all` only in a comment or a string
- **WHEN** test:db bundles the files
- **THEN** it bundles the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps a pgTAP file that mentions the setting only in a comment or a string: %s"

#### Scenario: a Unicode-escape identifier

- **GIVEN** a pgTAP file that quotes an identifier with `U&"..."` or `u&"..."`, escaped (`U&"s\0065t_config"`), with a `UESCAPE` clause, or plain
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file, while a `U&'...'` string and `U&` inside a comment, a string or a plain quoted identifier still bundle
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses any U&"..." identifier, whose escapes could spell a refused name, naming the file: %s"
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "keeps U& in a string, a comment, a U& string or inside a quoted identifier: %s"

#### Scenario: the reader's two views

- **GIVEN** a pgTAP file
- **WHEN** `toPgTapCode` reads it
- **THEN** its code view blanks every comment, string, quoted identifier and dollar body, its searchable view only the comments and strings, both keep every offset, and an unclosed token or a stray `$` reads as nothing
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "blanks every comment, string, quoted identifier and dollar body, keeping each offset"
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "keeps the quoted identifiers and dollar bodies in the view a mention is searched in"
- **Test:** `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "reads nothing when a token never closes or a $ pairs with nothing"

#### Scenario: a change built at run time

- **GIVEN** a pgTAP file that changes `standard_conforming_strings` without naming it, as `execute` of `'standard_' || 'conforming_strings'`, or a function of the migrations or the database that sets it
- **WHEN** test:db bundles the files
- **THEN** the reader could read a later string differently from Postgres
- **Test:** Not covered — no reading of the file sees a name it builds at run time or a function it calls; the one remaining gap, on the owner's word

### Requirement: SUPABASE-32 — The test:db target is configurable

The supabase package's `test:db` SHALL read its target from `config.testDbTarget` of
`packages/supabase/package.json`: `linked`, the default when the key is unset, runs the bundled
suites with `supabase test db --linked`; `local` runs them with `supabase test db --local`; `off`
runs no database test and exits 0; any other value, `null` included, runs nothing and exits 1,
naming the key and the three. A
run SHALL exit with the CLI's status and remove the bundle; with `--dry-run` it SHALL write the
bundle and name the command without running it.

**Evidence:** `packages/supabase/package.json:22`, `packages/supabase/package.json:24-26`, `packages/supabase/src/testDbRun.constant.ts:3-10`, `packages/supabase/src/testDbRun.constant.ts:17-22`, `packages/supabase/src/testDbRun.helper.ts:55-69`, `packages/supabase/src/testDbRun.helper.ts:74-95`, `scripts/supabase-test-db.mjs:63-65`, `scripts/supabase-test-db.mjs:70-73`

#### Scenario: no target set

- **GIVEN** a package.json whose config names no target
- **WHEN** test:db runs
- **THEN** it runs `supabase test db --linked` over the bundle, removes it and exits with the CLI's status
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle when the config names no target"

#### Scenario: the linked target

- **GIVEN** the target `linked`
- **WHEN** test:db runs
- **THEN** it runs `supabase test db --linked` over the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle for the linked target"

#### Scenario: the local target

- **GIVEN** the target `local`
- **WHEN** test:db runs
- **THEN** it runs `supabase test db --local` over the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --local over the bundle for the local target"

#### Scenario: the off target

- **GIVEN** the target `off`
- **WHEN** test:db runs
- **THEN** it reads no SQL file, writes no bundle, runs no CLI, says so and exits 0
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs no database test for the off target"

#### Scenario: a target it does not know

- **GIVEN** a target other than `linked`, `local` and `off`
- **WHEN** test:db runs
- **THEN** it runs nothing and exits 1, naming the value and the three targets
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a target it does not know, naming the ones it takes"

#### Scenario: a null target

- **GIVEN** `config.testDbTarget` set to `null`
- **WHEN** test:db runs
- **THEN** it runs nothing and exits 1, naming the key and the three targets
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a null target, naming the setting"

#### Scenario: a dry run

- **GIVEN** the flag `--dry-run`
- **WHEN** test:db runs
- **THEN** it writes the bundle, keeps it, names it and the command, runs no CLI and exits 0
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "writes the bundle and names the command without running it on a dry run"

#### Scenario: a suite fails

- **GIVEN** a CLI run that exits with a failing status
- **WHEN** test:db runs
- **THEN** it exits with that status and removes the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails with the exit status of the CLI when a suite fails"

#### Scenario: the CLI cannot start

- **GIVEN** a machine where the Supabase CLI cannot start
- **WHEN** test:db runs
- **THEN** it exits 1, naming the reason, and removes the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails when the Supabase CLI cannot start"

#### Scenario: a pgTAP file it cannot bundle

- **GIVEN** a pgTAP file that does not open with `begin;`
- **WHEN** test:db runs
- **THEN** it writes no bundle, runs no CLI and exits 1, naming the file
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs nothing when a pgTAP file cannot be bundled"

#### Scenario: the local target on a real stack

- **GIVEN** a downstream project with a running local Supabase stack
- **WHEN** it runs test:db with the target `local`
- **THEN** the suites run on that stack
- **Test:** Not covered — the template runs no Docker and no local stack (`AGENTS.md`, Supabase workflow)
