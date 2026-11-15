# Delta: packages/supabase

> **Change:** `2026-11-14-supabase-migrations`

## ADDED Requirements

### Requirement: SUPABASE-23 — Signed-in users and the service role reach the helpers schema

The supabase database SHALL grant USAGE on the auth_helpers schema to authenticated and service_role and to no other API role, so a query, or a PL/pgSQL or string-body SQL function, running as authenticated or service_role can call the helpers that role may execute, and anon cannot name them.

**Evidence:** written at apply time, when the code exists.

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

### Requirement: SUPABASE-24 — The migrations apply in number order

The supabase database SHALL create every type, table and function a migration uses in that migration or an earlier one, so migrations 0001 to 0009 apply in number order on an empty Supabase database.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an empty database

- **GIVEN** an empty database holding only what Supabase provides before a first migration
- **WHEN** migrations 0001 to 0009 are applied in number order, each stopping on its first error
- **THEN** every one of them applies
- **Test:** Not covered — no gate has a database; the verify report records the run on a scratch PostgreSQL 18.4 with the Supabase pieces stubbed

## MODIFIED Requirements

### Requirement: SUPABASE-11 — A user reads only their own profile

The supabase database SHALL let an authenticated user read a profile row only when its id is their own user id.

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

### Requirement: SUPABASE-21 — Only staff read the audit log

The supabase database SHALL let an authenticated user read audit_log rows only when is_staff is true for them.

**Evidence:** written at apply time, when the code exists.

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
