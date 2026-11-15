-- 0012_audit_truncate.sql
-- Concern: the audit log refuses TRUNCATE, whoever holds the privilege.
-- Source of truth: packages/supabase/docs/database.md (Append-only audit log).
-- Idempotency: CREATE OR REPLACE for the trigger function and the trigger; the owner block
--   is guarded by a pg_proc check, as in 0006.
--
-- audit_log_immutable (0006) is a row trigger, and TRUNCATE fires no row trigger. A
-- statement trigger before TRUNCATE closes that path for every role that holds the
-- privilege: postgres, which owns the table, and service_role. It needs no EXECUTE grant:
-- Postgres checks EXECUTE on a trigger function when the trigger is created, not when it
-- fires.

-- =====================================================================
-- Section 1: the trigger function
-- =====================================================================

create or replace function auth_helpers.tg_audit_no_truncate()
returns trigger
language plpgsql
set search_path = public, auth_helpers
as $$
begin
  raise exception 'audit_log is append-only: TRUNCATE is not permitted';
end
$$;

comment on function auth_helpers.tg_audit_no_truncate() is
  'Statement trigger function that refuses TRUNCATE on audit_log, which the row trigger tg_audit_immutable cannot see.';

-- =====================================================================
-- Section 2: ownership — no EXECUTE for any API role
-- =====================================================================

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth_helpers'
      and p.proname = 'tg_audit_no_truncate'
  ) then
    alter function auth_helpers.tg_audit_no_truncate() owner to postgres;
    revoke all on function auth_helpers.tg_audit_no_truncate() from public;
  end if;
end
$$;

-- =====================================================================
-- Section 3: the trigger
-- =====================================================================

create or replace trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement
  execute function auth_helpers.tg_audit_no_truncate();
