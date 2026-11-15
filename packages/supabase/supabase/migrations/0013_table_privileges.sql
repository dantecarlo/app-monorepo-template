-- 0013_table_privileges.sql
-- Concern: the table privileges past TRUNCATE that Supabase's default privileges give anon and
--   authenticated, and EXECUTE on the audit log's row trigger function.
-- Source of truth: packages/supabase/docs/database.md (API role privileges).
-- Idempotency: REVOKE of a privilege a role does not hold is a no-op, ALTER DEFAULT
--   PRIVILEGES ... REVOKE rewrites the same default ACL entry each run, and MAINTAIN is
--   revoked only on a server that has it.
--
-- Row-level security narrows the rows of SELECT, INSERT, UPDATE and DELETE; it has no say over
-- these:
--   TRIGGER     attaches a trigger to the table. With EXECUTE on a trigger function it reaches,
--               such as tg_audit_immutable, a signed-in user could make every write to a table
--               fail for every user, and only the table owner could drop the trigger.
--   REFERENCES  points a foreign key at the table, which checks and locks its rows.
--   MAINTAIN    (PostgreSQL 17 and later) runs VACUUM, ANALYZE, REINDEX, CLUSTER, REFRESH
--               MATERIALIZED VIEW and LOCK TABLE on it.
-- service_role keeps all three.

-- =====================================================================
-- Section 1: TRIGGER, REFERENCES and MAINTAIN — none for anon and authenticated in public
-- =====================================================================

revoke trigger, references on all tables in schema public from anon, authenticated;

-- The tables postgres creates in public later: the same per-schema revoke from the named roles
-- that removes TRUNCATE in 0010.
alter default privileges for role postgres in schema public
  revoke trigger, references on tables from anon, authenticated;

-- MAINTAIN exists from PostgreSQL 17 on; the statement would not parse on an older server.
do $$
begin
  if current_setting('server_version_num')::int >= 170000 then
    execute 'revoke maintain on all tables in schema public from anon, authenticated';
    execute 'alter default privileges for role postgres in schema public '
      'revoke maintain on tables from anon, authenticated';
  end if;
end
$$;

-- =====================================================================
-- Section 2: tg_audit_immutable — no EXECUTE for any API role
-- =====================================================================

-- 0006 grants it to authenticated and service_role. A trigger runs its function without that
-- privilege, so audit_log_immutable keeps working; a role that held it could attach the
-- function to a table of its own choosing.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth_helpers'
      and p.proname = 'tg_audit_immutable'
  ) then
    revoke execute on function auth_helpers.tg_audit_immutable()
      from public, anon, authenticated, service_role;
  end if;
end
$$;
