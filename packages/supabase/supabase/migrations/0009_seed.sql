-- 0009_seed.sql
-- Concern: idempotent seed for default RBAC role_capability rows.
-- Source of truth: packages/supabase/docs/database.md (Seed idempotency).
-- Idempotency: ON CONFLICT DO NOTHING keyed on (role, capability) PK.
--   Re-running this file never duplicates or overwrites existing rows.
--
-- Seeds the minimum default mapping so a newly created admin user immediately
-- holds profile management capability. Extend per project.

insert into public.role_capability (role, capability) values
  ('admin', 'profile.manage')
on conflict (role, capability) do nothing;
