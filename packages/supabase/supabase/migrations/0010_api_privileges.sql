-- 0010_api_privileges.sql
-- Concern: privileges of the API roles that Supabase's default privileges give too widely.
-- Source of truth: packages/supabase/docs/database.md (API role privileges).
-- Idempotency: REVOKE of a privilege a role does not hold is a no-op, and ALTER DEFAULT
--   PRIVILEGES ... REVOKE rewrites the same default ACL entry each run.
--
-- A Supabase project's default privileges give anon, authenticated and service_role ALL on
-- every table, function and sequence postgres creates in public. Row-level security narrows
-- the rows a table grant reaches, but not every privilege: this file revokes the ones that
-- reach past it.

-- =====================================================================
-- Section 1: the public has_capability wrapper — no EXECUTE for anon
-- =====================================================================

-- 0004 revokes the PUBLIC grant only; the explicit grant the default privileges give anon
-- stays until it is revoked by name. authenticated and service_role keep theirs.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'has_capability'
  ) then
    revoke execute on function public.has_capability(public.app_capability) from public, anon;
  end if;
end
$$;

-- =====================================================================
-- Section 2: TRUNCATE — none for anon and authenticated in public
-- =====================================================================

-- TRUNCATE ignores row-level security and fires no row trigger, so a role that holds it
-- empties a table whatever its policies and its row triggers say. service_role keeps it.
revoke truncate on all tables in schema public from anon, authenticated;

-- The tables postgres creates in public later. Supabase's grant is a per-schema default to
-- these named roles, so a per-schema revoke from the same roles removes it from that default.
alter default privileges for role postgres in schema public
  revoke truncate on tables from anon, authenticated;
