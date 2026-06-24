-- 0005_profile.sql
-- Concern: generic example domain table (profile, 1:1 with auth.users).
-- Source of truth: packages/supabase/docs/database.md (Generic example schema).
-- Idempotency: CREATE TABLE IF NOT EXISTS; trigger creation is guarded via
--   CREATE OR REPLACE TRIGGER (Postgres 14+) — falls back to DROP + CREATE.
--
-- Demonstrates:
--   * citext column for case-insensitive email lookups.
--   * numeric(12,2) as an example monetary / balance column.
--   * moddatetime trigger for automatic updated_at maintenance.
--     Trigger calls extensions.moddatetime — schema-qualified because
--     extra_search_path places extensions after public; be explicit.

create table if not exists public.profile (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           extensions.citext unique,
  display_name    text,
  credit_balance  numeric(12,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profile is
  'Generic example domain table (1:1 auth.users). Demonstrates citext email, numeric(12,2) balance, and moddatetime updated_at. Extend with project-specific columns.';

comment on column public.profile.email is
  'Case-insensitive email via citext (extensions schema). Unique constraint enforces one profile per address.';

comment on column public.profile.credit_balance is
  'Example numeric(12,2) monetary column. Precision and scale should be adjusted per project requirements.';

-- moddatetime trigger: automatically sets updated_at = now() on every UPDATE.
-- Must reference extensions.moddatetime (schema-qualified) because the function
-- lives in the extensions schema, not in public.
create or replace trigger profile_set_updated_at
  before update on public.profile
  for each row
  execute function extensions.moddatetime(updated_at);
