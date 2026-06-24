-- 0008_audit.sql
-- Concern: append-only audit_log table with metadata.reason requirement and
--   immutability trigger.
-- Source of truth: packages/supabase/docs/database.md (Append-only audit).
-- Idempotency: CREATE TABLE IF NOT EXISTS; CREATE OR REPLACE for the trigger
--   function; enum guard via do-block.
--
-- audit_action enum is defined here (adjacent to the table that uses it).
-- Immutability: tg_audit_immutable() raises an exception on any UPDATE or
--   DELETE attempt, making the table append-only at the DB level.
--   The service path is the only sanctioned INSERT path (policy in 0007).

-- =====================================================================
-- Section 1: audit_action enum
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type public.audit_action as enum (
      'profile_updated',
      'profile_suspended'
    );
  end if;
end
$$;

comment on type public.audit_action is
  'Typed audit event vocabulary. Additive values use ALTER TYPE ... ADD VALUE in a separate migration. Generic template values — extend per project.';

-- =====================================================================
-- Section 2: audit_log table
-- =====================================================================

create table if not exists public.audit_log (
  id            uuid primary key default extensions.gen_random_uuid(),
  actor_id      uuid not null references auth.users (id) on delete restrict,
  action        public.audit_action not null,
  target_table  text not null,
  target_id     uuid,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  -- Sensitive actions must carry a reason in metadata.
  constraint audit_log_reason_required_chk
    check (
      action <> 'profile_suspended'
      or (metadata ? 'reason')
    )
);

comment on table public.audit_log is
  'Append-only typed audit trail. actor_id ON DELETE RESTRICT (actors are soft-deleted; the trail is never orphaned). metadata.reason required for profile_suspended. Immutability enforced by tg_audit_immutable trigger.';

comment on column public.audit_log.actor_id is
  'The authenticated user that performed the action. ON DELETE RESTRICT so a deactivated user never orphans existing audit events.';

comment on column public.audit_log.metadata is
  'Arbitrary context for the event. profile_suspended requires metadata.reason (see audit_log_reason_required_chk constraint).';

create index if not exists audit_log_target_idx
  on public.audit_log (target_table, target_id);

create index if not exists audit_log_actor_created_idx
  on public.audit_log (actor_id, created_at desc);

-- =====================================================================
-- Section 3: immutability trigger
-- =====================================================================

create or replace function auth_helpers.tg_audit_immutable()
returns trigger
language plpgsql
security definer
set search_path = public, auth_helpers
as $$
begin
  raise exception 'audit_log is append-only: UPDATE and DELETE are not permitted';
end
$$;

comment on function auth_helpers.tg_audit_immutable() is
  'Trigger function that enforces append-only semantics on audit_log. Raises an exception on any UPDATE or DELETE attempt.';

create or replace trigger audit_log_immutable
  before update or delete on public.audit_log
  for each row
  execute function auth_helpers.tg_audit_immutable();
