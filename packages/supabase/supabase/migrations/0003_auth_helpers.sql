-- 0003_auth_helpers.sql
-- Concern: SECURITY DEFINER helpers in the private auth_helpers schema.
-- Source of truth: packages/supabase/docs/database.md (SECURITY DEFINER helper pattern).
-- Idempotency: CREATE OR REPLACE for every function; owner/grant block is guarded
--   by a do-loop that only alters if the function exists.
--
-- auth_helpers is NOT listed in config.toml api.schemas, so PostgREST never
-- exposes it directly. All helpers use:
--   language sql  stable  security definer
--   set search_path = public, auth_helpers
--
-- Ownership / least-privilege pattern (mirrors IExam 0011):
--   1. owner = postgres  → SECURITY DEFINER runs with superuser rights and
--      bypasses RLS where intended (the sanctioned privileged path).
--   2. revoke all from public  → no implicit execute grant.
--   3. grant execute to authenticated, service_role  → explicit callers only.
--
-- ANTI-RECURSION CONTRACT:
--   has_capability() and is_staff() read user_role_grant and role_capability
--   DIRECTLY (SECURITY DEFINER bypasses their RLS). The RLS policies on those
--   two tables MUST NOT call any auth_helpers function — doing so creates
--   infinite recursion. See 0007_rls_policies.sql, Section RBAC anti-recursion.

-- =====================================================================
-- Section 1: current_user_id() — identity seam
-- =====================================================================

create or replace function auth_helpers.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth_helpers
as $$
  select auth.uid()
$$;

comment on function auth_helpers.current_user_id() is
  'Thin wrapper around auth.uid(). The identity seam used by helpers and policies; centralises the auth.uid() call so the source can be swapped in one place.';

-- =====================================================================
-- Section 2: has_capability(p_cap) — single-capability check
-- =====================================================================

create or replace function auth_helpers.has_capability(p_cap public.app_capability)
returns boolean
language sql
stable
security definer
set search_path = public, auth_helpers
as $$
  select exists (
    select 1
    from public.user_role_grant g
    join public.role_capability rc on rc.role = g.role
    where g.user_id = auth.uid()
      and g.revoked_at is null
      and rc.capability = p_cap
  )
$$;

comment on function auth_helpers.has_capability(public.app_capability) is
  'True iff auth.uid() holds an active grant that maps to p_cap via role_capability. Reads RBAC tables DIRECTLY (SECURITY DEFINER — bypasses their RLS). ANTI-RECURSION: role_capability and user_role_grant policies must not call this function.';

-- =====================================================================
-- Section 3: is_staff() — derived staff plane gate
-- =====================================================================

create or replace function auth_helpers.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth_helpers
as $$
  select coalesce(
    (
      select count(*) > 0
      from public.user_role_grant g
      join public.role_capability rc on rc.role = g.role
      where g.user_id = auth.uid()
        and g.revoked_at is null
      limit 1
    ),
    false
  )
$$;

comment on function auth_helpers.is_staff() is
  'Derived staff-plane gate: true iff auth.uid() holds at least one active capability. NOT a role-string comparison (there is no staff role value). ANTI-RECURSION: RBAC table policies must not call this function.';

-- =====================================================================
-- Section 4: ownership / least-privilege block
-- =====================================================================

do $$
declare
  fn text;
  fns text[] := array[
    'auth_helpers.current_user_id()',
    'auth_helpers.has_capability(public.app_capability)',
    'auth_helpers.is_staff()'
  ];
begin
  foreach fn in array fns loop
    if exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname || '.' || p.proname = split_part(fn, '(', 1)
    ) then
      execute format('alter function %s owner to postgres', fn);
      execute format('revoke all on function %s from public', fn);
      execute format('grant execute on function %s to authenticated, service_role', fn);
    end if;
  end loop;
end
$$;

-- =====================================================================
-- Section 5: public wrapper example
-- =====================================================================
-- Demonstrates how to expose an auth_helpers function to the API layer
-- without moving the logic into the public schema.

create or replace function public.has_capability(p_cap public.app_capability)
returns boolean
language sql
stable
security definer
set search_path = public, auth_helpers
as $$
  select auth_helpers.has_capability(p_cap)
$$;

comment on function public.has_capability(public.app_capability) is
  'Public-schema wrapper that delegates to auth_helpers.has_capability. Callable over PostgREST/RPC; the privileged logic stays in auth_helpers. Pattern: one thin wrapper per helper that must be API-accessible.';
