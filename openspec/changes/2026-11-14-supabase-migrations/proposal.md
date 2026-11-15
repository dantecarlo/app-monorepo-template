# Proposal: fix the order, the grants and the profile policy of the Supabase migrations

> **Status:** open

## Why

Writing the living spec of packages/supabase found five defects, follow-ups F1 to F5 of
`docs/INIT_AND_HARNESS_PLAN.md`, none of them checked against a database. A throwaway PostgreSQL
18.4 cluster with the Supabase pieces the migrations rely on stubbed (the API roles, `auth.users`,
`auth.uid()`, the `extensions` schema and Supabase's default privileges on `public`) shows four of
them on the base `e3e92fc`:

- **F1.** Applied in number order on an empty database, `0001` and `0002` apply and `0003` fails:
  `ERROR:  type public.app_capability does not exist` at
  `packages/supabase/supabase/migrations/0003_auth_helpers.sql:60`. With that type created by
  hand first, the same file fails on the next object it needs:
  `ERROR:  relation "public.user_role_grant" does not exist`. Both are created only by
  `packages/supabase/supabase/migrations/0004_rbac.sql`.
- **F2.** With the RBAC file applied before the helpers, every migration applies, and the pgTAP
  file stops at its first direct helper call as `authenticated`:
  `ERROR:  permission denied for schema auth_helpers`. The audit-log policy itself works as
  `authenticated` (a user with no grant reads 0 audit rows, an admin reads 1): Postgres resolves a
  policy's function when the policy is created and checks only EXECUTE when it runs. What fails
  is any query, and any SECURITY INVOKER function, that names a helper as that role.
- **F3.** A user with no role reads another user's profile: 1 row, while the policy's comment and
  the test section say a user reads their own.
- **F4.** The assertion "unauthorized user cannot update another user profile" fails with
  `no exception thrown`: Postgres updates no row the update policy hides and raises nothing.
- **F5.** `packages/supabase/package.json` runs `db:reset`, `gen:types` (`--local`) and `test:db`
  against the local stack `AGENTS.md` forbids, and `packages/supabase/src/types.ts` is still the
  placeholder with no tables.

**No applied history breaks.** Since a fresh database cannot get past `0003`, no database can
have applied this sequence beyond `0002`: a project that ran it holds `0001` and `0002` at most.
This change leaves those two files untouched and fixes `0003` to `0009` in place, the versions
no database can have recorded. The only database that could have passed `0003` is one where
someone created the `app_capability` type and both RBAC tables by hand first, which is not this
sequence.

The owner's words:

- 2026-11-14 (translated from Spanish): "Do this task here: “Fix Supabase migration order and
  grants (F1–F5)”"
- 2026-11-14 (translated from Spanish), answering "F3: who may read a user's profile in the
  template's database?", the owner chose the option "Only its owner": the profile select policy
  becomes `id = auth.uid()`, as its comment and its test say.

## What changes

- **F1, the order.** The RBAC file and the helpers file swap numbers: the RBAC enums and tables
  become `0003_rbac.sql` and the helpers that read them `0004_auth_helpers.sql`, so every
  migration uses only what it or an earlier one creates. `packages/supabase/docs/database.md`
  states that rule.
- **F2, the grant.** The helpers migration grants USAGE on the `auth_helpers` schema to
  `authenticated` and `service_role`, the roles it already grants EXECUTE to; `anon` gets none. A
  pgTAP assertion proves `anon` still cannot reach the schema, and two prove the audit-log policy
  as `authenticated`: a staff user reads an audit event, a user who is not staff reads none.
- **F3, the profile.** `profile_select` lets a signed-in user read only their own profile row
  (`id = (select auth.uid())`); its comment and its test say so.
- **F4, the test.** The assertion on updating another user's profile checks what Postgres does:
  the update raises nothing and the row stays unchanged.
- **F5, the scripts.** `db:push`, `gen:types` and `test:db` target the linked cloud project
  (`--linked`), as the `## Supabase workflow — Cloud only` section of `AGENTS.md` does, and
  `db:reset` goes: on the linked project it would wipe the cloud database. The README, the
  database guide and the test headers describe that workflow. `src/types.ts` keeps its placeholder
  unless real types can be generated without Docker and without a remote database; its header
  says how a project generates them.

## Out of scope

- Running the pgTAP suite in a gate: it needs a database with pgTAP, which no gate has. The
  verify report records the scratch run.
- Applying the migrations to a Supabase Cloud project, or regenerating the types against one: no
  project is linked here, and this change may not connect to one.
- Editing `0001` or `0002`, which a database may have applied.
- `docs/INIT_AND_HARNESS_PLAN.md` and `AGENTS.md`, which the session that merges this change
  updates.

## Affected specs

- `openspec/specs/packages/supabase/spec.md`: modifies SUPABASE-11, SUPABASE-12 and SUPABASE-21;
  adds SUPABASE-23 and SUPABASE-24; resolves the open questions Q1 to Q5.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
