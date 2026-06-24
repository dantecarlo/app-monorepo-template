-- 0002_enums.sql
-- Concern: generic example enum types for profile status.
-- Source of truth: packages/supabase/docs/database.md (Enum conventions).
-- Idempotency: Postgres has no CREATE TYPE IF NOT EXISTS; each enum is wrapped
--   in a do-block that checks pg_type before creating. Additive values use a
--   separate ALTER TYPE ... ADD VALUE migration — never edit existing values here.

-- =====================================================================
-- Section 1: profile_status
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_status') then
    create type public.profile_status as enum (
      'active',
      'suspended'
    );
  end if;
end
$$;

comment on type public.profile_status is
  'Lifecycle state of a public.profile row. Additive values use ALTER TYPE ... ADD VALUE in a separate migration.';
