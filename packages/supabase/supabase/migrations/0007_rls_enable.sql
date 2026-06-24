-- 0007_rls_enable.sql
-- Concern: default-deny posture. ENABLE + FORCE ROW LEVEL SECURITY over an
--   explicit table list. No policies are added here (those live in 0008).
-- Source of truth: packages/supabase/docs/database.md (RLS: ENABLE+FORCE).
-- Idempotency: ALTER TABLE ... ENABLE/FORCE ROW LEVEL SECURITY is itself
--   idempotent; the do-loop guards on pg_class so a missing table does not abort.
--
-- WHY ENABLE AND FORCE:
--   ENABLE makes RLS apply to ordinary roles (authenticated, anon).
--   FORCE makes RLS apply ALSO to the table owner, closing the silent-bypass
--   hole if a non-superuser ever owns a table. The sanctioned privileged plane is:
--     - SECURITY DEFINER helpers owned by postgres (superuser, FORCE does not bind).
--     - service_role with BYPASSRLS for service-path writes.
--
-- The table list is EXPLICIT (not a pg_class catalog sweep) so that adding a
-- new table forces a conscious edit here AND a policy in 0008. An RLS-enabled
-- table with no policy denies everything to non-bypass roles.
--
-- IMPORTANT: between 0007 and 0008 the schema is fully locked (RLS-on, no policy).
-- Do not split these two migrations across separate deploys.

do $$
declare
  t           text;
  rls_tables  text[] := array[
    'profile',
    'role_capability',
    'user_role_grant',
    'audit_log'
  ];
begin
  foreach t in array rls_tables loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and c.relkind = 'r'
    ) then
      execute format('alter table public.%I enable row level security', t);
      execute format('alter table public.%I force  row level security', t);
    else
      raise warning 'rls_enable: public.% does not exist — skipped', t;
    end if;
  end loop;
end
$$;
