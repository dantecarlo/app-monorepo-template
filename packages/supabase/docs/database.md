# Database conventions — @app/supabase

This document is the source of truth for every Postgres/Supabase convention
used by this adapter package. Agents and engineers must read this before
writing or modifying any migration, policy, helper function, or test.

---

## 1. @app/supabase as a default backend adapter

`packages/supabase` is the **default backend adapter** for the monorepo.
All database-level concerns live here:

- `supabase/migrations/` — numbered SQL migrations
- `supabase/tests/` — pgTAP behavioral tests
- `supabase/config.toml` — Supabase CLI project config

`packages/core` defines provider-agnostic port interfaces (`IAuthGateway`,
`IBackendClientProvider`, `IServiceErrorMapper`). It imports nothing from
`@supabase/*` or from SQL. To swap the backend, replace this entire package
with a new adapter that implements the same ports; the service layer stays
unchanged.

The clients leave this package as the opaque `BackendClientType`
(`src/backendClient.type.ts`): an app holds one and hands it to this
package's factories, but names no Supabase type and cannot reach the SDK
through it. Only `src/backendClient.adapter.ts` turns it back into the
SDK client, typed by the `Database` schema, so an adapter that reads or
writes these tables over the client is a `src/*.adapter.ts` of this package.

---

## 2. Migration conventions

### Numbering

Files are named `NNNN_domain.sql` with zero-padded four-digit prefixes.
One domain per file. Do not mix concerns.

### Order

Migrations apply in number order, so a migration uses only the types, tables
and functions it or an earlier migration creates. Postgres checks a SQL
function's argument types and body when the function is created, so the RBAC
enums and tables (`0003_rbac.sql`) come before the helpers that take
`app_capability` and read those tables (`0004_auth_helpers.sql`).

An offline test guards the order in every `pnpm validate`:
`src/__tests__/findMigrationOrderViolations.helper.test.ts` reads the
migrations in name order, the order the CLI applies them, and fails when one
names a `public.` type, table, view or function that only a later migration
creates (`src/findMigrationOrderViolations.helper.ts`). It reads code only: a name in a
comment or in a string literal outside a function body does not count. It
checks schema-qualified `public.` names; an unqualified name, or one in
another schema, is the migration author's to order.

A migration a project may have applied is never edited: a change to an applied
migration never runs again on that project. A fix goes in a new migration with
the next number.

### Mandatory header block

Every migration opens with a three-line comment block:

```sql
-- NNNN_domain.sql
-- Concern: what this file creates or modifies.
-- Source of truth: path to the doc or section that governs this domain.
-- Idempotency: which idioms are used (see below).
```

No justification trails, no "added per request" or "removed because" comments.
The file must read as if it was always correct.

### Idempotency idioms

| Scenario | Idiom |
|---|---|
| Schema / extension | `CREATE ... IF NOT EXISTS` |
| Enum type | `do $$ begin if not exists (select 1 from pg_type where typname = '...') then create type ... end if; end $$;` |
| Function | `CREATE OR REPLACE FUNCTION` |
| Table | `CREATE TABLE IF NOT EXISTS` |
| Index | `CREATE INDEX IF NOT EXISTS` |
| Policy | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| Seed row | `INSERT ... ON CONFLICT DO NOTHING` |
| Owner / grant | Guarded `do`-loop checking `pg_proc` before `ALTER FUNCTION` |

---

## 3. Schemas

### extensions

Hosts all installed Postgres extensions (`pgcrypto`, `citext`, `pg_trgm`,
`moddatetime`). Keeps `public` clean.

`config.toml` sets `extra_search_path = ["public", "extensions"]` so
`citext` and `pg_trgm` operators resolve without schema-qualifying every use.
However, trigger bodies that call `moddatetime` must use the fully-qualified
form `extensions.moddatetime(column)` to be explicit.

### auth_helpers

Hosts all SECURITY DEFINER helper functions. This schema is **not** listed in
`config.toml api.schemas`, so PostgREST never exposes it directly.

Functions in `auth_helpers` set `search_path = public, auth_helpers` and run
with `security definer`.

---

## 4. SECURITY DEFINER helper pattern

All helpers follow the same recipe (from `0004_auth_helpers.sql`):

```sql
create or replace function auth_helpers.my_helper(...)
returns ...
language sql
stable
security definer
set search_path = public, auth_helpers
as $$
  -- body
$$;
```

After creating the functions, apply the ownership / least-privilege block:

```sql
grant usage on schema auth_helpers to authenticated, service_role;

alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  grant execute on functions to public;
alter default privileges for role postgres in schema extensions
  grant execute on functions to public;

do $$
declare
  fn text;
  fns text[] := array['auth_helpers.my_helper(arg_type)', ...];
begin
  foreach fn in array fns loop
    if exists ( /* pg_proc check */ ) then
      execute format('alter function %s owner to postgres', fn);
      execute format('revoke all on function %s from public', fn);
      execute format('grant execute on function %s to authenticated, service_role', fn);
    end if;
  end loop;
end
$$;
```

**Why USAGE and EXECUTE:** USAGE on the schema lets a role resolve the
names in it, and EXECUTE on a function lets it run that function. A policy, a
view and a `BEGIN ATOMIC` SQL function resolve the names they use once, when
they are created, so a policy that calls a helper works without USAGE. A
query, a PL/pgSQL function and a SQL function with a string body resolve them
each time they run, as the role running them (the caller, for a SECURITY
INVOKER function), so `authenticated` and `service_role` need both. `anon`
gets neither and cannot name a helper.

**Why the default privileges:** Postgres gives PUBLIC EXECUTE on every new
function, and USAGE on `auth_helpers` lets `authenticated` name any function
there, so a helper added without its own grant block would be callable by
every signed-in user. That PUBLIC grant is a global default, which a
per-schema `REVOKE` cannot remove; the default is therefore revoked for every
function `postgres` creates and granted back to PUBLIC in `public` and
`extensions`. A new function in `auth_helpers` is executable by its owner
only until its grant block names its callers. A schema a project adds later
gets the same closed default: grant EXECUTE there on purpose, or add a
per-schema default as above.

**Why `owner = postgres`:** `SECURITY DEFINER` runs with the owner's
privileges. On Supabase `postgres` is not the superuser (`supabase_admin`
is): it is a non-superuser role with `BYPASSRLS`, and that attribute is what
lets the helpers read the RBAC tables past their row-level security. This is
the sanctioned privileged path.

**Note on non-Supabase Postgres:** the owner role name may differ. Replace
`postgres` with the actual privileged migration role for your environment.

### Public wrapper convention

When a helper must be callable over PostgREST (RPC), expose it via a thin
public-schema wrapper that delegates to the `auth_helpers` version:

```sql
create or replace function public.my_helper(...)
returns ...
language sql stable security definer
set search_path = public, auth_helpers
as $$
  select auth_helpers.my_helper(...)
$$;
```

The logic stays in `auth_helpers`; only the entry point is exposed.

A wrapper needs a revoke from `anon` by name. A Supabase project's default
privileges give `anon`, `authenticated` and `service_role` an explicit EXECUTE
on every function `postgres` creates in `public`, which `revoke ... from
public` does not remove:

```sql
revoke execute on function public.my_helper(...) from public, anon;
grant execute on function public.my_helper(...) to authenticated, service_role;
```

`0010_api_privileges.sql` does this for `public.has_capability`, and
`rls_profile.test.sql` fails when `anon` may execute any SECURITY DEFINER
function in `public` or `auth_helpers`.

---

## 5. DB-driven RBAC

Two tables (defined in `0003_rbac.sql`):

| Table | Purpose |
|---|---|
| `role_capability` | Static role→capability map. DB is the source of truth; a change takes effect immediately without a code deploy. |
| `user_role_grant` | Per-user role log. `revoked_at IS NULL` = active grant. Set `revoked_at = now()` to revoke (never hard-delete — history is preserved). |

**At most one active grant per `(user_id, role)`** is enforced by a partial
unique index `WHERE revoked_at IS NULL`.

**`is_staff()`** is derived: a user is staff if they hold at least one active
capability. It is NOT a role-string comparison.

**Writes to RBAC tables are service-role only.** A user cannot self-grant a
role.

---

## 6. RLS — ENABLE + FORCE, default-deny

Defined in `0007_rls_enable.sql` and `0008_rls_policies.sql`.

### Why ENABLE and FORCE

- `ENABLE` makes RLS apply to ordinary roles (`authenticated`, `anon`).
- `FORCE` makes RLS apply to the table owner too, closing the silent-bypass
  hole if a non-superuser ever owns a table.

The sanctioned bypass paths are:
- SECURITY DEFINER functions owned by `postgres`, which has `BYPASSRLS`
  (FORCE binds neither a role with `BYPASSRLS` nor a superuser).
- `service_role` (which has `BYPASSRLS`).

### Explicit table list

`0007_rls_enable.sql` maintains an explicit list of tables, not a `pg_class`
sweep. Adding a new table requires:

1. A new entry in the `rls_tables` array in `0007`.
2. At least one policy for it in `0008`.

An RLS-enabled table with no policy denies everything to non-bypass roles.
Do not deploy `0007` without `0008`.

### Policy naming

```
{table}_{verb}[_{qualifier}]
```

| Component | Examples |
|---|---|
| `verb` | `select`, `insert`, `update`, `delete`, or omit for `FOR ALL` |
| `qualifier` | `self`, `staff`, `service` (omit when unambiguous) |

Each policy is preceded by `DROP POLICY IF EXISTS` for idempotency.

### ANTI-RECURSION RULE (mandatory)

`auth_helpers.has_capability` and `auth_helpers.is_staff` read
`role_capability` and `user_role_grant` directly (SECURITY DEFINER bypasses
their RLS). Therefore:

> **The RLS policies on `role_capability` and `user_role_grant` MUST NOT call
> any `auth_helpers` function.**

Use direct `auth.uid()` checks or `service_role` policies only on those two
tables. Violating this rule produces infinite recursion or a planner error at
query time.

### API role privileges

A Supabase project's default privileges give `anon`, `authenticated` and
`service_role` ALL on every table, function and sequence `postgres` creates in
`public`. Row-level security narrows the rows a table privilege reaches, not
every privilege, so `0010_api_privileges.sql` and `0013_table_privileges.sql`
revoke the ones that reach past it:

- **TRUNCATE.** It ignores row-level security and fires no row trigger, so a
  role holding it empties a table whatever its policies say. `anon` and
  `authenticated` hold it on no table in `public`: it is revoked on the
  existing tables and in the default privileges of `postgres` there, so a table
  added later starts without it. `service_role` keeps it.
- **TRIGGER, REFERENCES and MAINTAIN.** TRIGGER attaches a trigger to the
  table: with EXECUTE on a trigger function it reaches, a signed-in user could
  make every write to the table fail for every user, and only the owner could
  drop the trigger. REFERENCES points a foreign key at the table, and MAINTAIN
  (PostgreSQL 17 and later) runs VACUUM, ANALYZE, REINDEX, CLUSTER and LOCK
  TABLE on it. `anon` and `authenticated` hold none of them in `public`, on
  the existing tables or in the default privileges of `postgres`; MAINTAIN is
  revoked only on a server that has it. `service_role` keeps all three.
- **EXECUTE on a SECURITY DEFINER function in `public`.** See the public
  wrapper convention in section 4: `anon` loses it by name.
- **EXECUTE on a trigger function.** A trigger runs its function without that
  privilege, so no API role needs it, and a role that held it could attach the
  function to a table of its choosing (with TRIGGER there). The audit log's two
  trigger functions grant it to no API role; a trigger function a project adds
  grants none either, and skips the `grant execute` line of the helper pattern.

SELECT, INSERT, UPDATE and DELETE stay, and a policy decides their rows; a
table that needs less, as `public.profile` does, grants less in a migration of
its own.

### Profile columns a user edits

A policy limits the rows an `UPDATE` reaches, never the columns it sets:
`profile_update_self` lets a user update their own profile row, and a column
privilege decides what they may change in it. `0011_profile_columns.sql`
revokes UPDATE on `public.profile` from `authenticated` and grants it back on
`display_name` only, so a user never sets the row's `status` or
`credit_balance` (the service path's), its `id`, `created_at` or `updated_at`
(the database's), or its `email`, which mirrors the sign-in address that
Supabase Auth changes only through its confirmed email-change flow. Roles live
in `user_role_grant`, which only `service_role` writes.

A column a project adds to `public.profile` is not updatable by
`authenticated` until a grant names it. When users edit it, grant it in a
migration of its own:

```sql
grant update (display_name, my_column) on table public.profile to authenticated;
```

An app's update names only those columns: `update profile set display_name =
...` works, and an upsert or update that also sends `status` is refused with
"permission denied for table profile".

A profile row is created on the server only. `0011_profile_columns.sql` also
revokes INSERT on `public.profile` from `anon` and `authenticated`, so a user
cannot create their own row with a `credit_balance` of their choosing, whatever
insert policy a project adds. No migration creates a profile row: the service
path does, as `service_role` or in a function `postgres` owns (a trigger on
`auth.users`, for instance), and both keep INSERT.

---

## 7. Append-only audit log

`0006_audit.sql` defines `public.audit_log`:

- `actor_id` references `auth.users ON DELETE RESTRICT` — a deactivated actor
  never orphans existing audit events.
- `audit_action` is a typed enum — no magic strings.
- A `CHECK` constraint requires `metadata.reason` for sensitive actions
  (currently `profile_suspended`).
- The `auth_helpers.tg_audit_immutable()` trigger raises an exception on any
  `UPDATE` or `DELETE`, making the table append-only at the DB level.
- That trigger is a row trigger, and `TRUNCATE` fires none, so
  `0012_audit_truncate.sql` adds `audit_log_no_truncate`, a statement trigger
  before `TRUNCATE` that raises "audit_log is append-only: TRUNCATE is not
  permitted". It stops every role that holds the privilege: `postgres`, which
  owns the table, and `service_role`. A trigger function needs no EXECUTE grant
  to fire, so `auth_helpers.tg_audit_no_truncate()` grants none, and
  `0013_table_privileges.sql` revokes the grant 0006 gives
  `auth_helpers.tg_audit_immutable()`.
- `INSERT` is service-role only (see `0008_rls_policies.sql`).

---

## 8. Seed idempotency

Seed files use `INSERT ... ON CONFLICT DO NOTHING` keyed on the real unique
constraint of each table. The conflict target must match an existing primary
key or unique index.

Never use `INSERT ... ON CONFLICT DO UPDATE` for reference data — it would
silently overwrite hand-tuned values in production.

---

## 9. pgTAP workflow

Everything in this section belongs to the `supabase` capability. A project with
its own backend, or none, has no `packages/supabase`, so it has none of it.

### Running the tests

```bash
pnpm --filter @app/supabase test:db
# runs scripts/supabase-test-db.mjs: supabase test db --linked over a bundle of supabase/tests/
```

`test:db` runs `scripts/supabase-test-db.mjs`, which wires Node into
`runTestDb` (`src/testDbRun.helper.ts`). It copies every file of
`supabase/tests/` into a fresh folder of the system's temporary directory, with
a `do` block right after the file's opening `begin;` (`bundlePgTapFiles`,
`src/pgTapBundle.helper.ts`), runs `supabase test db` over that folder from the
package, removes the folder, and exits with the CLI's status.

### The branch's own migrations

The block lists every migration of `supabase/migrations/` in name order, with
the version and the name the Supabase CLI records, each text dollar-quoted
with a tag no migration can end. Inside the pgTAP file's own transaction, it
reads the database's ledger, `supabase_migrations.schema_migrations`, and
applies through a PL/pgSQL `execute` each migration whose version the ledger
lacks. The file's `rollback;` takes them with it, so a branch's tests run over
the branch's schema without anyone pushing its migrations, and the database
ends as it was.

- A `begin;` first and a `commit;` last that wrap a whole migration are
  removed first. Postgres itself refuses a `commit`, `rollback` or `end` left
  inside one, wherever it sits ("EXECUTE of transaction commands is not
  implemented"). A statement Postgres refuses inside a transaction (`create
  index concurrently`, `vacuum`) fails the same way, and so does using an enum
  value that the same transaction added.
- The first migration that fails stops the file, with an error that names it.
- When the ledger holds a file's version under another name, as after a
  renumbering, or under no name at all, the file stops before any migration is
  applied, naming it.
- The versions the ledger holds that the checkout has no file for are listed as
  a notice.
- With no ledger at all, on a project nothing was ever pushed to, every
  migration is applied.
- A file whose name is not `<version>_<name>.sql` is left out, as `db push`
  leaves it out. Two files that share a version stop the run, both named: the
  ledger records one.

Before anything reaches the database, `test:db` reads each pgTAP file with its
comments, strings, quoted identifiers and dollar-quoted bodies blanked, by a
reader of its own in `src/pgTapCode.helper.ts` that splits them as the
Postgres lexer does: a `--` comment ends at `\n` or `\r`; `/* */` comments nest;
a double-quoted identifier doubles its `"`; a string doubles its `'`, and an
escape string (`E'...'`) also escapes with a backslash; a string continues past
whitespace that holds a newline, `--` comments included before and after it,
into the next `'`, in the same mode, so a continued escape string keeps its
backslash escapes, while whitespace with no newline ends it; a dollar quote's tag
takes letters, digits, `_` and non-ASCII characters, never a leading digit, and
a `$` right after an identifier character belongs to the identifier (`a$b$`).
The order check keeps its own reader (`src/sqlCode.helper.ts`). It stops the
run, naming the file, unless:

- its first statement is a plain `begin;` (`begin transaction;` and
  `begin work;` too). An opening with options, such as `begin isolation level
  serializable;`, or `start transaction;`, is refused as well: conservative,
  since the block runs before any of the file's own statements;
- its last statement is `rollback;`, with nothing but comments after it;
- no statement in between controls the transaction: `commit`, `end`, `abort`,
  `rollback`, `begin`, `start transaction`, `prepare transaction`,
  `commit prepared`, `rollback prepared` or `set transaction`. A `savepoint`,
  its `release` and `rollback to` a savepoint keep the transaction, and stay
  allowed;
- it holds no psql meta-command: psql reads a backslash outside quotes as one
  (`\i`, `\set`, `\gexec`), and `\i` could pull in a file that commits;
- nothing in its code, quoted identifiers and dollar-quoted bodies included,
  names `standard_conforming_strings` (in any case) or calls `set_config`, and
  no statement is `reset all`. A mention inside a comment or a string stays
  allowed.

The reader reads a plain string as Postgres does with
`standard_conforming_strings` on, where a backslash is a plain character. With
it off, `'it\'s'` is one string to Postgres and two to the reader, which could
hide a statement after it. So the bundle sets it right after the file's first
`begin;`, before the migrations block, whatever the database's or the role's
default: `set local standard_conforming_strings = on;`. The last check above
keeps the file from turning it off again.

A file the reader cannot split fails closed: a quote, a quoted identifier, a
dollar-quoted body or a comment that never closes, or a `$` that starts none of
them and is neither part of an identifier nor a parameter (`$1`), stops the run,
naming the file. Every file here keeps that shape (see Test file structure).

Not covered, the one remaining gap: a change of `standard_conforming_strings` the
file does not name, as a statement built at run time (`'standard_' ||
'conforming_strings'` run through `execute` in a `do` block) or a function the
migrations or the database already hold that sets it.

### The target

`config.testDbTarget` of `packages/supabase/package.json` says where the
suites run:

| Value    | What `test:db` does                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linked` | The default, also when the key is unset: `supabase test db --linked`, on the linked Supabase Cloud project                                                |
| `local`  | `supabase test db --local`, on a local Supabase stack, for a downstream project that chose Docker and the local stack; this template never runs it        |
| `off`    | No database test: it says so and exits 0. For a project that keeps Supabase and runs no database tests                                                    |

Any other value, `null` included, runs nothing and exits 1, naming the key and
the three. `/init` will ask
for it (Stage 6, decision 54) and can set the key with the manifest's
`patch-json` verb.

### A live run

Both targets need Docker: Supabase CLI 2.109.1 first runs `create extension if
not exists pgtap with schema extensions` on the target, then runs `pg_prove` in
the `supabase/pg_prove:3.36` Docker container for every target, `--linked`
included. For `linked`, the owner, or a CI job with Docker, runs from a checkout
whose `packages/supabase/.env` holds the project's credentials (the CLI does not
read it on its own):

```bash
cd packages/supabase
set -a; source .env; set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF"   # once per checkout
pnpm test:db --dry-run   # writes the bundle and prints the command; runs nothing
pnpm test:db
```

The dry run keeps its bundle in the temporary directory, to read the SQL that
would run; a run removes it. The bundle sits outside `supabase/tests/` and the
CLI still reaches it: its own code (`legacy.test.db` of CLI 2.109.1, read
offline) bind-mounts every path argument read-only into the `pg_prove`
container, at the same path without its drive letter, and runs `pg_prove -r`
over it. No live run has confirmed it yet.

**DB tests are intentionally NOT part of `pnpm validate`.** The validation
gate (`ATL_TEMPLATE_SELF=1 pnpm validate`) is offline: it needs no database
and no Docker. `AGENTS.md` forbids an agent to start Docker, so a person or a
CI job with Docker runs `test:db`. What `pnpm validate` checks offline is the
bundle and the runner (`src/__tests__/pgTapBundle.helper.test.ts`,
`src/__tests__/testDbRun.helper.test.ts`) against fakes; that the bundle's SQL
runs on Postgres, and both targets' live runs, no gate covers.

### JWT impersonation pattern

`auth.uid()` resolves from `request.jwt.claims ->> 'sub'`. To impersonate a
user in a pgTAP test:

```sql
set local "request.jwt.claims" to '{"sub":"<uuid>","role":"authenticated"}';
set local role authenticated;

-- assertions here run as the impersonated user

reset role; -- return to the session role (postgres) for setup/teardown
```

### Test file structure

`pg_prove` runs every `.sql` file in `supabase/tests/` as a suite of its own,
and fails a file whose output holds no plan line or a count that differs from
its plan. So a file there is always a suite, never a page of notes: the
conventions every suite shares live in this section and in the header of
`rls_profile.test.sql`. The offline test `src/__tests__/supabaseSql.test.ts`
fails, in every `pnpm validate`, on a file there that never calls `plan()` or
`finish()`.

Every test file:

1. Opens with `begin;`
2. Seeds fixtures as the session role, `postgres` (before `set local role`),
   with fixed UUID literals and `INSERT ... ON CONFLICT DO NOTHING`
3. Calls `select plan(N)` with the exact assertion count
4. Runs structural assertions, then behavioral assertions via impersonation
5. Ends with `select * from finish(); rollback;`

`test:db` refuses a file that does not open with a plain `begin;`, does not end
with `rollback;`, controls its transaction in between or holds a psql
meta-command, since the checkout's migrations run inside that transaction (see
The branch's own migrations); `src/__tests__/pgTapBundle.helper.test.ts` bundles
every file here offline, in every `pnpm validate`.

To prove that a policy or a privilege blocks a write, write with no `WHERE`:
an `UPDATE` whose `WHERE` names a column also applies the `SELECT` policy,
which may hide the row anyway. Then `reset role` and read the row back as the
session role.

See `supabase/tests/rls_profile.test.sql` for the full example.
