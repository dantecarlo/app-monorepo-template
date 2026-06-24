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

---

## 2. Migration conventions

### Numbering

Files are named `NNNN_domain.sql` with zero-padded four-digit prefixes.
One domain per file. Do not mix concerns.

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

All helpers follow the same recipe (from `0003_auth_helpers.sql`):

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

**Why `owner = postgres`:** `SECURITY DEFINER` runs with the owner's
privileges. Setting the owner to `postgres` (the Supabase superuser) lets the
function bypass RLS where intended. This is the sanctioned privileged path.

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

---

## 5. DB-driven RBAC

Two tables (defined in `0004_rbac.sql`):

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
- SECURITY DEFINER functions owned by `postgres` (superuser — FORCE does not
  bind superusers).
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

### Running the tests

```bash
pnpm --filter @app/supabase test:db
# expands to: supabase test db
```

This requires a running Postgres instance with pgTAP installed. On Supabase
Cloud, `supabase start` (local Docker) or a linked cloud project is needed.

**DB tests are intentionally NOT part of `pnpm validate`.** The validation
gate (`ATL_TEMPLATE_SELF=1 pnpm validate`) runs pure TypeScript checks that
do not need a live database. Wiring `test:db` into validate would require a
running stack in CI for every lint/typecheck run, which is not the convention
here.

### JWT impersonation pattern

`auth.uid()` resolves from `request.jwt.claims ->> 'sub'`. To impersonate a
user in a pgTAP test:

```sql
set local "request.jwt.claims" to '{"sub":"<uuid>","role":"authenticated"}';
set local role authenticated;

-- assertions here run as the impersonated user

reset role; -- return to superuser for setup/teardown
```

### Test file structure

Every test file:

1. Opens with `begin;`
2. Seeds fixtures as superuser (before `set local role`)
3. Calls `select plan(N)` with the exact assertion count
4. Runs structural assertions, then behavioral assertions via impersonation
5. Ends with `select * from finish(); rollback;`

See `supabase/tests/rls_profile.test.sql` for the full example.
