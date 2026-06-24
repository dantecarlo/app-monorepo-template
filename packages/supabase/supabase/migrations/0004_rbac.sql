-- 0004_rbac.sql
-- Concern: DB-driven RBAC tables + RBAC-vocabulary enums.
-- Source of truth: packages/supabase/docs/database.md (DB-driven RBAC).
-- Idempotency: CREATE TABLE IF NOT EXISTS; CREATE INDEX IF NOT EXISTS;
--   enum guards via do-blocks (same pattern as 0002).
--
-- Tables:
--   role_capability   — static role→capability map (DB is source of truth).
--   user_role_grant   — per-user role log; revoked_at IS NULL = active grant.
--
-- RBAC vocabulary (placed here as it is RBAC-adjacent):
--   user_role     = ('member', 'admin')
--   app_capability = ('profile.manage')
--
-- ANTI-RECURSION: auth_helpers.has_capability / is_staff read these tables.
-- Their own RLS policies (0007) must not call those helpers. See 0007.

-- =====================================================================
-- Section 1: RBAC enums
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'member',
      'admin'
    );
  end if;
end
$$;

comment on type public.user_role is
  'Roles available for user_role_grant. The staff plane is DERIVED from capabilities (is_staff()), not from this enum value. Generic template values — extend per project.';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_capability') then
    create type public.app_capability as enum (
      'profile.manage'
    );
  end if;
end
$$;

comment on type public.app_capability is
  'Fine-grained capabilities mapped to roles via role_capability. Generic template value — extend per project. is_staff() = true iff the user holds at least one capability.';

-- =====================================================================
-- Section 2: role_capability
-- =====================================================================

create table if not exists public.role_capability (
  role        public.user_role not null,
  capability  public.app_capability not null,
  created_at  timestamptz not null default now(),
  primary key (role, capability)
);

comment on table public.role_capability is
  'DB-driven RBAC role→capability map. PK (role, capability). Read by auth_helpers.has_capability / is_staff (SECURITY DEFINER — bypasses RLS). ANTI-RECURSION: RLS on this table must not call the helpers (0007).';

-- =====================================================================
-- Section 3: user_role_grant
-- =====================================================================

create table if not exists public.user_role_grant (
  id          uuid primary key default extensions.gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.user_role not null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

comment on table public.user_role_grant is
  'Per-user role grant log. revoked_at IS NULL = active grant; setting it revokes in the same transaction (no hard delete — history preserved). Writes are service-role only (a user cannot self-grant). ANTI-RECURSION: RLS on this table must not call the helpers (0007).';

comment on column public.user_role_grant.revoked_at is
  'NULL = grant is active. Set to now() to revoke immediately in the same transaction. Never hard-delete — keep the audit trail.';

-- At most one active grant per (user_id, role).
create unique index if not exists user_role_grant_active_uidx
  on public.user_role_grant (user_id, role)
  where revoked_at is null;

-- Lookup index for capability resolution (user_id, active grants).
create index if not exists user_role_grant_active_lookup_idx
  on public.user_role_grant (user_id)
  where revoked_at is null;
