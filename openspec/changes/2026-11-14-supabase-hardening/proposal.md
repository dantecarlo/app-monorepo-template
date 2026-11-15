# Proposal: narrow the API roles' privileges and guard the Supabase test and type tooling

> **Status:** open

## Why

The supabase-migrations change left four follow-ups, F19 to F22 of `docs/INIT_AND_HARNESS_PLAN.md`.
On a throwaway PostgreSQL 18.4 cluster with Supabase's roles, `auth` schema and default privileges
stubbed (the default privileges give `anon`, `authenticated` and `service_role` ALL on every table,
function and sequence `postgres` creates in `public`), the base `e8a4489` shows the first three:

- **F19.** `anon` executes `public.has_capability`: its ACL is
  `{postgres=X,anon=X,authenticated=X,service_role=X}`, because
  `packages/supabase/supabase/migrations/0004_auth_helpers.sql:180` revokes the PUBLIC grant only,
  not the explicit one the default privileges give `anon`. SUPABASE-17 says only `authenticated` and
  `service_role` execute the SECURITY DEFINER helpers (open question Q6). It is the only function
  in `public` or `auth_helpers` that `anon` may execute; the four `auth_helpers` helpers grant
  `anon` nothing.
- **F20.** `anon` and `authenticated` hold TRUNCATE on all four tables of `public`. As
  `authenticated`, `truncate public.profile` empties the table: TRUNCATE ignores row-level security,
  and it fires no row trigger, so the audit log's `audit_log_immutable` trigger cannot stop it
  either.
- **F21.** As a signed-in user, `update public.profile set status = 'suspended', credit_balance =
  1000000` changes the user's own row: `profile_update_self` limits the rows, not the columns.
- **F22.** `packages/supabase/supabase/tests/_setup.test.sql` holds only comments, so its TAP output
  has no plan, which pg_prove fails ("No plan found in TAP output", reproduced with a TAP judge
  that follows pg_prove). No offline check guards the migration order SUPABASE-24 states, and
  `gen:types` redirects the CLI straight into `src/types.ts`, so a failed run leaves it empty.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"

The decisions the session applies, made before this change:

- **F19.** `anon` loses EXECUTE on `public.has_capability`, so the code matches SUPABASE-17; every
  other function in `public` and `auth_helpers` is checked for an `anon` grant the spec does not
  give.
- **F20.** TRUNCATE is revoked from `anon` and `authenticated` on every table in `public`, and
  removed for future tables through the default privileges of `postgres`. A `before truncate`
  statement trigger on the audit log raises, so even a role that holds TRUNCATE cannot empty it.
- **F21.** A signed-in user may update only the profile columns a user edits, and never `status`,
  `credit_balance`, a role, an id or a timestamp, through column privileges;
  `profile_update_self` keeps limiting the rows. Of the profile's columns only `display_name` is
  display data a user edits. `email` is not: it mirrors the user's sign-in address, which Supabase
  Auth changes only through its confirmed email-change flow (`double_confirm_changes` in
  `packages/supabase/supabase/config.toml`), and a profile update would let a user claim an
  address they never confirmed. Roles live in `public.user_role_grant`, whose writes are
  service-role only (SUPABASE-14); a test now proves that a user cannot grant themselves one.
- **F22.** `_setup.test.sql` is folded into the suite that needs it, `rls_profile.test.sql`, whose
  header already holds its impersonation pattern and whose first section is its seed. An offline
  vitest test in `packages/supabase` reads the migrations in name order and fails when one names a
  `public` type, table, view or function that only a later migration creates; another fails when a
  pgTAP file declares no plan. `gen:types` writes to a temporary file and moves it over
  `src/types.ts` only when the command succeeds.

**No applied history changes.** Migrations `0001` to `0009` may be applied on a project since #16
merged, so they stay as they are and three new migrations carry the fixes: 0010_api_privileges.sql
(F19, and F20's grants), 0011_profile_columns.sql (F21) and 0012_audit_truncate.sql (F20's
trigger). This branch has not merged, so the corrections below may still edit 0011; F28 takes a
migration of its own, 0013_table_privileges.sql.

**After the independent verification.** The verifier found no blocker and five gaps, which the
coordinator sent as one correction batch:

- **N1, caused by the change.** On a database that already holds the seed rows from an earlier day,
  the read-back of Bob's profile after the refused updates compared `created_at` to `now()` and
  failed, while the suite's header says such a database still runs. The read-back now compares the
  row with a snapshot taken before the updates.
- **N2, mutations no test caught.** A user setting `credit_balance` through an upsert; a truncate
  that names `audit_log` among other tables; EXECUTE on `tg_audit_no_truncate` for an API role;
  and INSERT on every profile column for `authenticated`, which left only the missing insert
  policy between a user and a profile row with a `credit_balance` of their choosing. `anon` and
  `authenticated` lose INSERT on `public.profile`. No migration creates a profile row (0005 creates
  the table, 0009 seeds `role_capability`), so the server-side path that creates one is
  `service_role`, which keeps INSERT.
- **F28, the same class as F20.** Supabase's default privileges also give `anon` and
  `authenticated` TRIGGER, REFERENCES and, on PostgreSQL 17 and later, MAINTAIN on every table.
  As `authenticated`, `create trigger ... on public.profile ... execute function
  auth_helpers.tg_audit_immutable()` succeeds, because 0006 grants that function's EXECUTE to
  `authenticated`; committed, it would refuse every write to the profile table for every user,
  and only the owner could drop it. These privileges are revoked on every table in `public` and
  in the default privileges of `postgres` there, and EXECUTE on `tg_audit_immutable` from every
  API role: a trigger runs its function without that privilege.
- **AGENTS.md.** Its Supabase workflow regenerated the types with `supabase gen types ... >
  src/types.ts`, which empties the file when the CLI fails; it now runs `pnpm --filter
  @app/supabase gen:types`.

## What changes

- **F19, packages/supabase.** 0010_api_privileges.sql revokes EXECUTE on `public.has_capability`
  from `anon`. pgTAP: as `anon` the wrapper is refused; no SECURITY DEFINER function in `public` or
  `auth_helpers` is executable by `anon`; a signed-in admin still gets its answer.
- **F20, packages/supabase.** The same migration revokes TRUNCATE on every table in `public` from
  `anon` and `authenticated`, and from the tables `postgres` creates there later.
  0012_audit_truncate.sql adds `audit_log_no_truncate`, a `before truncate` statement trigger
  that raises "audit_log is append-only: TRUNCATE is not permitted". pgTAP covers both roles, a
  refused truncate, a table added later (and the privileges it keeps), and a truncate of the audit
  log by its owner and by `service_role`.
- **F21, packages/supabase.** 0011_profile_columns.sql revokes UPDATE on `public.profile` from
  `authenticated` and grants it back on `display_name` only. pgTAP: a user's update of each other
  column is refused and leaves the row unchanged, the display-name update still works, and a user
  cannot grant themselves a role.
- **F22, packages/supabase.** `_setup.test.sql` goes, its notes folded into `rls_profile.test.sql`
  and `packages/supabase/docs/database.md`; two offline vitest tests check the migration order and
  the pgTAP plans in `pnpm validate`; `gen:types` replaces `src/types.ts` only on success. The
  README and the database guide describe each change.
- **N1 and N2, packages/supabase.** The read-back of the refused profile updates compares with a
  snapshot; pgTAP adds the upsert, the truncate naming two tables, EXECUTE on
  `tg_audit_no_truncate`, and the profile insert privileges; 0011 also revokes INSERT on
  `public.profile` from `anon` and `authenticated`.
- **F28, packages/supabase.** 0013_table_privileges.sql revokes TRIGGER, REFERENCES and MAINTAIN
  (the last only on PostgreSQL 17 and later, where it exists) from `anon` and `authenticated` on
  every table in `public` and in the default privileges of `postgres` there, and EXECUTE on
  `tg_audit_immutable` from every API role. pgTAP covers both roles, a signed-in user's trigger,
  a table added later, and the audit trigger still firing for `service_role`.
- **AGENTS.md.** The Supabase workflow block regenerates the types through `gen:types`.

## Out of scope

- Running the pgTAP suite in a gate or against a Supabase project: no gate has a database, and
  this change may start no Docker and connect to no remote database. The verify report records
  the scratch run.
- The rest of `AGENTS.md` and the root `README.md`: only the Supabase workflow block of
  `AGENTS.md` changes.
- `docs/INIT_AND_HARNESS_PLAN.md`, which the session that merges this change updates.

## Affected specs

- `openspec/specs/packages/supabase/spec.md`: adds SUPABASE-26 to SUPABASE-29; modifies
  SUPABASE-14, SUPABASE-17, SUPABASE-19 and SUPABASE-24; resolves the open question Q6.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
