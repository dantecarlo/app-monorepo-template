-- rls_profile.test.sql
-- Concern: pgTAP assertions for schema structure, RLS posture, RBAC helper
--   presence, and the anti-recursion contract.
-- Source of truth: packages/supabase/docs/database.md (pgTAP workflow).
--
-- Run with: pnpm --filter @app/supabase test:db
--   (which executes: supabase test db --linked)
--
-- NOTE: the CLI enables pgtap on the linked project, then runs pg_prove in a
-- Docker container, so a person or a CI job with Docker runs this file. It is
-- intentionally NOT in the offline pnpm validate gate; AGENTS.md forbids an
-- agent to start Docker.
--
-- Every .sql file in this folder is a suite pg_prove runs on its own, and pg_prove fails one
-- whose output has no plan; src/__tests__/supabaseSql.test.ts checks offline that each file
-- calls plan() and finish(). The conventions every suite shares are here and in
-- packages/supabase/docs/database.md (pgTAP workflow).
--
-- TRANSACTION: the whole file runs in BEGIN / ROLLBACK, so no state persists.
--
-- IMPERSONATION: auth.uid() reads request.jwt.claims ->> 'sub'. Use:
--   set local "request.jwt.claims" to '{"sub":"<uuid>","role":"authenticated"}';
--   set local role authenticated;
-- Then `reset role` to return to the session role (postgres) for setup and teardown.
--
-- SEED: section 1 inserts the users into auth.users, their profiles and their grants as the
-- session role, before any `set local role`, with fixed UUID literals so every run reads the
-- same rows, and ON CONFLICT DO NOTHING so a database that already holds them still runs.
--
-- A BLOCKED WRITE: an UPDATE whose WHERE names a column also applies the SELECT policy, which
-- may hide the row anyway. To prove a policy or a privilege blocks a write, write with no
-- WHERE, then read the row back as the session role after `reset role`.

begin;

-- =====================================================================
-- Plan
-- =====================================================================
-- Count assertions below and update this number when adding new tests.
select plan(34);

-- =====================================================================
-- Section 1: seed test fixtures (as postgres, the session role)
-- =====================================================================

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com')
on conflict (id) do nothing;

insert into public.profile (id, email, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice'),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com',   'Bob')
on conflict (id) do nothing;

-- Grant admin role to Alice.
insert into public.user_role_grant (user_id, role) values
  ('00000000-0000-0000-0000-000000000001', 'admin')
on conflict do nothing;

-- =====================================================================
-- Section 2: structural assertions
-- =====================================================================

select has_table('public', 'profile',          'profile table exists');
select has_table('public', 'role_capability',  'role_capability table exists');
select has_table('public', 'user_role_grant',  'user_role_grant table exists');
select has_table('public', 'audit_log',        'audit_log table exists');

select has_column('public', 'profile', 'email',          'profile.email column exists');
select has_column('public', 'profile', 'credit_balance',  'profile.credit_balance column exists');

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'profile'),
  'RLS is enabled on profile'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'role_capability'),
  'RLS is enabled on role_capability'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'user_role_grant'),
  'RLS is enabled on user_role_grant'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'audit_log'),
  'RLS is enabled on audit_log'
);

-- RBAC helper presence.
select has_function('auth_helpers', 'has_capability', array['public.app_capability'],
  'auth_helpers.has_capability exists');
select has_function('auth_helpers', 'is_staff', array[]::text[],
  'auth_helpers.is_staff exists');

-- =====================================================================
-- Section 3: default-deny — unauthorized user sees 0 rows of another profile
-- =====================================================================

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;

-- Bob (no role) tries to select Alice's profile by id: profile_select hides it.
select is(
  (select count(*)::int from public.profile
   where id = '00000000-0000-0000-0000-000000000001'),
  0,
  'authenticated user cannot read another user profile row'
);

-- Bob updates every profile row with no WHERE clause. A WHERE that names a column would
-- also apply profile_select, which hides Alice's row anyway; with none, only the update
-- policy decides which rows change. Postgres raises no error and changes his own row only
-- (section 4 sets it again); read back as postgres, Alice's row is unchanged.
update public.profile set display_name = 'Hacked';

reset role;

select is(
  (select display_name from public.profile
   where id = '00000000-0000-0000-0000-000000000001'),
  'Alice',
  'unauthorized user cannot update another user profile'
);

-- =====================================================================
-- Section 4: policy grant — owner sees and updates their own profile
-- =====================================================================

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;

select is(
  (select count(*)::int from public.profile
   where id = '00000000-0000-0000-0000-000000000002'),
  1,
  'authenticated user can read own profile row'
);

-- Bob updates his own display_name.
update public.profile set display_name = 'Bob Updated'
where id = '00000000-0000-0000-0000-000000000002';

select is(
  (select display_name from public.profile
   where id = '00000000-0000-0000-0000-000000000002'),
  'Bob Updated',
  'authenticated user can update own profile row'
);

reset role;

-- =====================================================================
-- Section 5: RBAC helper presence — is_staff returns false for member user
-- =====================================================================

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;

select is(
  (select auth_helpers.is_staff()),
  false,
  'is_staff returns false for user with no active role grants'
);

reset role;

-- anon holds no USAGE on the auth_helpers schema, so it cannot name a helper.
set local "request.jwt.claims" to '{"role":"anon"}';
set local role anon;

select throws_ok(
  'select auth_helpers.is_staff()',
  'permission denied for schema auth_helpers',
  'anon cannot reach the auth_helpers schema'
);

reset role;

-- =====================================================================
-- Section 6: RBAC helper — is_staff returns true for admin user
-- =====================================================================

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

select is(
  (select auth_helpers.is_staff()),
  true,
  'is_staff returns true for user with active admin role grant'
);

select is(
  (select auth_helpers.has_capability('profile.manage'::public.app_capability)),
  true,
  'has_capability returns true for admin user with profile.manage'
);

reset role;

-- =====================================================================
-- Section 7: anti-recursion contract
-- =====================================================================
-- No policy on role_capability or user_role_grant may reference any
-- auth_helpers function. Violation causes infinite recursion at query time.

select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public'
      and tablename in ('role_capability', 'user_role_grant')
      and (
        coalesce(qual, '') || coalesce(with_check, '')
      ) ~ '(has_capability|is_staff|current_user_id|current_capabilities)'
  ),
  0,
  'RBAC table policies do not call auth_helpers functions (anti-recursion contract)'
);

-- =====================================================================
-- Section 8: audit_log immutability
-- =====================================================================

-- Insert an audit event as postgres, which bypasses RLS the way the service path does.
insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
values (
  '00000000-0000-0000-0000-000000000001',
  'profile_updated',
  'profile',
  '00000000-0000-0000-0000-000000000002',
  '{}'
);

-- The audit-log policy, read as authenticated: Bob (no grant) reads no event, Alice (admin, so
-- staff) reads it. The count is limited to Alice's events so a database with other events
-- gives the same answer.
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;

select is(
  (select count(*)::int from public.audit_log
   where actor_id = '00000000-0000-0000-0000-000000000001'),
  0,
  'user who is not staff reads no audit event'
);

reset role;

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

select is(
  (select count(*)::int from public.audit_log
   where actor_id = '00000000-0000-0000-0000-000000000001'),
  1,
  'staff user reads audit events'
);

reset role;

-- Attempt to UPDATE the audit row must fail.
select throws_ok(
  $$update public.audit_log set target_table = 'hacked' where actor_id = '00000000-0000-0000-0000-000000000001'$$,
  'audit_log is append-only: UPDATE and DELETE are not permitted',
  'audit_log UPDATE raises immutability exception'
);

-- Attempt to DELETE the audit row must fail.
select throws_ok(
  $$delete from public.audit_log where actor_id = '00000000-0000-0000-0000-000000000001'$$,
  'audit_log is append-only: UPDATE and DELETE are not permitted',
  'audit_log DELETE raises immutability exception'
);

-- =====================================================================
-- Section 9: auth_helpers privileges — schema USAGE, and a helper added
-- without a grant block of its own
-- =====================================================================

select ok(
  has_schema_privilege('service_role', 'auth_helpers', 'usage'),
  'service_role has USAGE on the auth_helpers schema'
);

select ok(
  not has_schema_privilege('anon', 'auth_helpers', 'usage'),
  'anon has no USAGE on the auth_helpers schema'
);

-- postgres adds one function to each schema, with no grant of its own. In auth_helpers no API
-- role may execute it; in public and extensions it keeps the EXECUTE Postgres gives PUBLIC.
set local role postgres;

create function auth_helpers.test_helper_without_grants() returns boolean
language sql stable security definer set search_path = public, auth_helpers
as $$ select true $$;

create function public.test_function_with_default_grants() returns boolean
language sql stable as $$ select true $$;

create function extensions.test_function_with_default_grants() returns boolean
language sql stable as $$ select true $$;

reset role;

select ok(
  not has_function_privilege('authenticated', 'auth_helpers.test_helper_without_grants()', 'execute'),
  'a helper added without grants is not executable by authenticated'
);

select ok(
  not has_function_privilege('anon', 'auth_helpers.test_helper_without_grants()', 'execute'),
  'a helper added without grants is not executable by anon'
);

select ok(
  has_function_privilege('public', 'public.test_function_with_default_grants()', 'execute'),
  'a function added to public keeps EXECUTE for PUBLIC'
);

select ok(
  has_function_privilege('public', 'extensions.test_function_with_default_grants()', 'execute'),
  'a function added to extensions keeps EXECUTE for PUBLIC'
);

-- =====================================================================
-- Section 10: the privileged helpers are out of anon's reach, the public
-- wrapper among them
-- =====================================================================
-- Supabase's default privileges give anon EXECUTE on every function postgres creates in
-- public, so a SECURITY DEFINER function there needs a revoke from anon of its own.

set local "request.jwt.claims" to '{"role":"anon"}';
set local role anon;

select throws_ok(
  $$select public.has_capability('profile.manage'::public.app_capability)$$,
  'permission denied for function has_capability',
  'anon cannot execute the public has_capability wrapper'
);

reset role;

select is(
  (
    select coalesce(array_agg(n.nspname || '.' || p.proname order by 1), '{}')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'auth_helpers')
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  '{}'::text[],
  'anon may execute no security definer function in public or auth_helpers'
);

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

select is(
  (select public.has_capability('profile.manage'::public.app_capability)),
  true,
  'the public has_capability wrapper answers a signed-in admin'
);

reset role;

-- =====================================================================
-- Finish
-- =====================================================================

select * from finish();

rollback;
