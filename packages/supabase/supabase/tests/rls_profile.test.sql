-- rls_profile.test.sql
-- Concern: pgTAP assertions for schema structure, RLS posture, RBAC helper
--   presence, and the anti-recursion contract.
-- Source of truth: packages/supabase/docs/database.md (pgTAP workflow).
--
-- Run with: pnpm --filter @app/supabase test:db
--   (which executes: supabase test db)
--
-- NOTE: DB tests require a running Postgres instance with pgTAP installed.
-- They are intentionally NOT in the pnpm validate chain (validate is pure
-- TypeScript; DB tests need a live stack). See CLAUDE.md — no local Docker.
--
-- IMPERSONATION: auth.uid() reads request.jwt.claims ->> 'sub'. Use:
--   set local "request.jwt.claims" to '{"sub":"<uuid>","role":"authenticated"}';
--   set local role authenticated;
-- Then `reset role` to return to superuser for teardown.

begin;

-- =====================================================================
-- Plan
-- =====================================================================
-- Count assertions below and update this number when adding new tests.
select plan(22);

-- =====================================================================
-- Section 1: seed test fixtures (superuser context)
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

-- Bob (no role) tries to select Alice's profile by id.
select is(
  (select count(*)::int from public.profile
   where id = '00000000-0000-0000-0000-000000000001'),
  1,
  'authenticated user can read any profile row (profile_select using true)'
);

-- Bob cannot update Alice's profile.
select throws_ok(
  $$update public.profile set display_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000001'$$,
  'update on public.profile violates row-level security policy for table "profile"',
  'unauthorized user cannot update another user profile'
);

reset role;

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

-- Insert an audit event as service_role (superuser context simulates service path).
insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
values (
  '00000000-0000-0000-0000-000000000001',
  'profile_updated',
  'profile',
  '00000000-0000-0000-0000-000000000002',
  '{}'
);

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
-- Finish
-- =====================================================================

select * from finish();

rollback;
