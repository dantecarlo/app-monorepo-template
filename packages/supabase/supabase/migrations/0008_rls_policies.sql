-- 0008_rls_policies.sql
-- Concern: explicit ALLOW policies per table (default-deny was set in 0007).
-- Source of truth: packages/supabase/docs/database.md (RLS policies).
-- Idempotency: every policy is preceded by DROP POLICY IF EXISTS.
--
-- Naming: {table}_{verb}[_{qualifier}]
--   verb choices: select | insert | update | delete | (omit for FOR ALL)
--   qualifier:    self | staff | service | (omit when unambiguous)
--
-- ANTI-RECURSION RULE (mandatory — do not remove this comment):
--   role_capability and user_role_grant are READ by auth_helpers.has_capability
--   and auth_helpers.is_staff. Their OWN policies must NOT call any auth_helpers
--   function. Use direct auth.uid() checks or service_role only. Violating this
--   produces infinite recursion at query time.

-- =====================================================================
-- Section 1: profile
-- =====================================================================

-- Any authenticated user can read their own profile (or any profile once public
-- listing is needed — update this policy per project requirements).
drop policy if exists profile_select on public.profile;
create policy profile_select on public.profile
  for select to authenticated
  using (true);

-- Users may only update their own profile row.
drop policy if exists profile_update_self on public.profile;
create policy profile_update_self on public.profile
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Service role has unrestricted access (used by server-side code / edge functions).
drop policy if exists profile_service on public.profile;
create policy profile_service on public.profile
  for all to service_role
  using (true) with check (true);

-- =====================================================================
-- Section 2: audit_log
-- =====================================================================

-- Staff can read audit events. is_staff() is safe here: audit_log is not
-- read by auth_helpers, so there is no recursion risk.
drop policy if exists audit_log_select_staff on public.audit_log;
create policy audit_log_select_staff on public.audit_log
  for select to authenticated
  using (auth_helpers.is_staff());

-- Audit events are appended by the service path only (append-only table).
drop policy if exists audit_log_insert_service on public.audit_log;
create policy audit_log_insert_service on public.audit_log
  for insert to service_role
  with check (true);

-- No UPDATE or DELETE policy — default-deny means append-only.

-- =====================================================================
-- Section 3: role_capability — ANTI-RECURSION (see header)
-- =====================================================================

-- Authenticated users may read the role→capability map (the mapping is not
-- sensitive; it is the static policy of the system). NOT gated by is_staff()
-- or has_capability() — anti-recursion: those helpers read this table.
drop policy if exists role_capability_select on public.role_capability;
create policy role_capability_select on public.role_capability
  for select to authenticated
  using (true);

drop policy if exists role_capability_service on public.role_capability;
create policy role_capability_service on public.role_capability
  for all to service_role
  using (true) with check (true);

-- =====================================================================
-- Section 4: user_role_grant — ANTI-RECURSION (see header)
-- =====================================================================

-- A user may see their OWN grants via a DIRECT auth.uid() check.
-- NOT via is_staff() or has_capability() — anti-recursion: those helpers
-- read this table. All grant/revoke writes are service-role only.
drop policy if exists user_role_grant_select_self on public.user_role_grant;
create policy user_role_grant_select_self on public.user_role_grant
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists user_role_grant_service on public.user_role_grant;
create policy user_role_grant_service on public.user_role_grant
  for all to service_role
  using (true) with check (true);
