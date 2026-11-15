# Delta: packages/supabase

> **Change:** `2026-11-14-supabase-hardening`

## ADDED Requirements

### Requirement: SUPABASE-26 — Only the service role holds the table privileges row-level security does not narrow

The supabase database SHALL give anon and authenticated no TRUNCATE, TRIGGER, REFERENCES or MAINTAIN on any table in public, on those the migrations create and on those postgres creates there later, while SELECT, INSERT, UPDATE and DELETE, whose rows the policies narrow, stay on a table added later.

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

## MODIFIED Requirements

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

### Requirement: SUPABASE-17 — The privileged helpers are out of anonymous and API reach

The supabase database SHALL let only authenticated and service_role execute the SECURITY DEFINER helpers, the public has_capability wrapper among them, and keep the auth_helpers schema out of the schemas the API serves, exposing has_capability over the API only through its public wrapper.

**Evidence:** `packages/supabase/supabase/migrations/0004_auth_helpers.sql:140`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:141`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:181`, `packages/supabase/supabase/config.toml:9`, and the revoke of the 0010 migration, written at apply time

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

### Requirement: SUPABASE-19 — The audit log is append-only

The supabase database SHALL refuse every update, delete and truncate of audit_log, whoever runs it, an update or a delete with the exception "audit_log is append-only: UPDATE and DELETE are not permitted" and a truncate with "audit_log is append-only: TRUNCATE is not permitted".

**Evidence:** `packages/supabase/supabase/migrations/0006_audit.sql:77`, `packages/supabase/supabase/migrations/0006_audit.sql:109`, and the trigger of the 0012 migration, written at apply time

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

### Requirement: SUPABASE-24 — The migrations apply in number order

The supabase database SHALL create every type, table and function a migration uses in that migration or an earlier one, so its migrations apply in number order on an empty Supabase database.

**Evidence:** `packages/supabase/supabase/migrations/0003_rbac.sql:42`, `packages/supabase/supabase/migrations/0003_rbac.sql:56`, `packages/supabase/supabase/migrations/0003_rbac.sql:70`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:53`, `packages/supabase/supabase/migrations/0004_auth_helpers.sql:62`, `packages/supabase/docs/database.md:35`

#### Scenario: an empty database

- **GIVEN** an empty database holding only what Supabase provides before a first migration
- **WHEN** every migration is applied in number order, each stopping on its first error
- **THEN** every one of them applies
- **Test:** Not covered — no gate has a database; the verify report records the run on a scratch PostgreSQL 18.4 with the Supabase pieces stubbed

#### Scenario: the package's migrations, read offline

- **GIVEN** the migration files of the package
- **WHEN** the order check reads them in name order
- **THEN** none names a public type, table, view or function that only a later migration creates
- **Test:** `packages/supabase/src/__tests__/supabaseSql.test.ts` › "the migrations name no public object that only a later migration creates"

#### Scenario: a migration names a later table

- **GIVEN** two migrations, the first naming a public table that the second creates
- **WHEN** the order check reads them
- **THEN** it reports the first migration, the table and the migration that creates it
- **Test:** `packages/supabase/src/findMigrationOrderViolations.helper.test.ts` › "reports a table a migration names before the migration that creates it"
