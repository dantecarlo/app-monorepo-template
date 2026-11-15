-- 0011_profile_columns.sql
-- Concern: what the API roles may write in a profile row: the columns a signed-in user updates,
--   and no insert.
-- Source of truth: packages/supabase/docs/database.md (Profile columns a user edits).
-- Idempotency: REVOKE and GRANT of the same privileges leave the same ACL each run.
--
-- profile_update_self (0008) limits an update to the user's own row; it cannot limit the
-- columns. Column privileges do: authenticated may set display_name, the display data a user
-- edits, and nothing else. status and credit_balance are the service path's to set, id and
-- the timestamps are the database's, and email mirrors the sign-in address, which Supabase
-- Auth changes only through its confirmed email-change flow.
--
-- Revoking the table's UPDATE also revokes every column UPDATE of the role, so a column a
-- project adds later is not updatable by authenticated until a grant names it. A new column
-- a user edits joins the list below in a migration of its own:
--   grant update (display_name, <new column>) on public.profile to authenticated;

revoke update on table public.profile from authenticated;

grant update (display_name) on table public.profile to authenticated;

-- A profile row is the service path's to create, with the values the service sets: no API role
-- but service_role may insert one, so a user cannot create their own with a credit_balance of
-- their choosing, whatever insert policy a project adds. No migration creates a profile row;
-- service_role, and a function postgres owns, keep INSERT.
revoke insert on table public.profile from anon, authenticated;
