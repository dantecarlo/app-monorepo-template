# Verify report: 2026-11-14-supabase-migrations

> **Verified:** 2026-11-14 at `9d16386`, and at `235457d` after the correction

## How the database was checked

No gate has a database, the template links no Supabase project, and this change may start no
Docker or local Supabase stack and connect to no remote database. Every database result below
comes from a throwaway PostgreSQL 18.4 cluster on `localhost:55432`, made with `initdb` in a
scratch directory outside the repository, and these scratch files:

- **The Supabase stubs.** The final runs, from the correction on, use the independent verifier's
  stubs, which are closer to Supabase: `supabase_admin` is the bootstrap superuser; `postgres` is
  not a superuser but has `bypassrls`, `createrole` and `createdb`, is a member of the API roles
  and owns the database; `anon` and `authenticated` (`nologin noinherit`) and `service_role` (with
  `bypassrls`); the `auth` schema owned by `supabase_admin`, with USAGE for `postgres` and the
  three API roles, a minimal `auth.users (id, email, created_at)`, and `auth.uid()`, `auth.jwt()`
  and `auth.role()` reading the `request.jwt.claim.*` and `request.jwt.claims` settings the way
  Supabase defines them; the `extensions` schema owned by `postgres` with USAGE for the API roles,
  `pgcrypto` and `moddatetime` preinstalled there; USAGE on `public` for the API roles, and
  Supabase's default privileges: ALL on every table, function and sequence `postgres` creates in
  `public`, to the three API roles. The first round (`9d16386`) used stubs of my own with a
  superuser `postgres` and the same grants; the base red below and the results at `9d16386`
  held again on the verifier's stubs.
- **`apply.sh`** creates a fresh database owned by `postgres`, loads the stubs and the shim as
  `supabase_admin`, then applies every migration in name order as `postgres`, one
  `psql -v ON_ERROR_STOP=1 -f` run per file, stopping at the first failure.
- **`tap-shim.sql`.** **pgTAP is not installed and was not downloaded, so the pgTAP files were not
  executed under pgTAP.** The shim implements, in a schema `tap`, the nine pgTAP functions the
  test files call (`plan`, `finish`, `ok`, `is`, `has_table`, `has_column`, `has_function`,
  `throws_ok`, `lives_ok`), with pgTAP's TAP output and its comparison rules for those
  signatures; `throws_ok` passes only when the error message equals the expected one.
- **`run-test.sh`** runs a test file itself, unchanged, as `postgres` through
  `psql -v ON_ERROR_STOP=1 -q -At`, the way pg_prove calls psql, with `search_path`
  `public, extensions, tap`.

The stubs reproduce Supabase's roles and grants as documented, not read from a Supabase project.

## Scenarios

Every result is from `rls_profile.test.sql` run under the shim at `235457d` on a fresh database
(31 of 31 ok), except SUPABASE-24, proven by `apply.sh`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SUPABASE-23 | a signed-in user calls a helper | `packages/supabase/supabase/tests/rls_profile.test.sql` › "is_staff returns false for user with no active role grants" | green (ok 17); red before T2: the file stopped there with `ERROR:  permission denied for schema auth_helpers` |
| SUPABASE-23 | the anon role names a helper | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon cannot reach the auth_helpers schema" | green (ok 18); red when USAGE is granted to `anon` (mutation probe) |
| SUPABASE-23 | the service role's schema privilege | `packages/supabase/supabase/tests/rls_profile.test.sql` › "service_role has USAGE on the auth_helpers schema" | green (ok 26) |
| SUPABASE-23 | the anon role's schema privilege | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon has no USAGE on the auth_helpers schema" | green (ok 27); red when USAGE is granted to `anon` (mutation probe) |
| SUPABASE-24 | an empty database | Not covered — scratch probe `apply.sh` | the nine migrations apply in number order as `postgres`; red on `e3e92fc`: `0003_auth_helpers.sql` stops with `ERROR:  type public.app_capability does not exist` |
| SUPABASE-25 | a signed-in user and a helper with no grant block | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a helper added without grants is not executable by authenticated" | green (ok 28); red at `0d59a5a`, and red with the per-schema revoke as well |
| SUPABASE-25 | the anon role and a helper with no grant block | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a helper added without grants is not executable by anon" | green (ok 29); red at `0d59a5a`, and red with the per-schema revoke as well |
| SUPABASE-25 | a function added to public | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a function added to public keeps EXECUTE for PUBLIC" | green (ok 30); red when the per-schema grant back is reverted (mutation probe) |
| SUPABASE-25 | a function added to extensions | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a function added to extensions keeps EXECUTE for PUBLIC" | green (ok 31); red when the per-schema grant back is reverted (mutation probe) |
| SUPABASE-11 | another user's profile | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user cannot read another user profile row" | green (ok 13); red before T3 with have 1, want 0 |
| SUPABASE-11 | the user's own profile | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can read own profile row" | green (ok 15), before and after T3 |
| SUPABASE-12 | the user's own profile | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can update own profile row" | green (ok 16) |
| SUPABASE-12 | another user's profile | `packages/supabase/supabase/tests/rls_profile.test.sql` › "unauthorized user cannot update another user profile" | green (ok 14); red with `profile_update_self` set to `true` (have Hacked, want Alice), the case the first version missed (B1) |
| SUPABASE-21 | a user who is not staff | `packages/supabase/supabase/tests/rls_profile.test.sql` › "user who is not staff reads no audit event" | green (ok 22); red when the audit policy uses `true` (mutation probe) |
| SUPABASE-21 | a staff user | `packages/supabase/supabase/tests/rls_profile.test.sql` › "staff user reads audit events" | green (ok 23) |

At `235457d`, on a fresh database: `apply.sh` applies `0001` to `0009` as `postgres` and exits
0; `rls_profile.test.sql` prints `1..31` and 31 `ok` lines with no `not ok`, and exits 0;
`_setup.test.sql`, which holds only comments, exits 0. Applying the nine files a second time to
the same database succeeds too, as their idempotency headers say. Probes on that database: a
user with no grant reads 0 audit rows and an admin 1 (`probe-audit-policy.sql`); an unfiltered
update by Bob changes 1 row, his own (`probe-unfiltered-update.sql`); a function `postgres` adds
to `auth_helpers` is executable by none of `anon`, `authenticated` and `service_role`, one added
to `public` or `extensions` by all three (`probe-default-privileges.sql`). The ACLs of the four
existing helpers and of `public.has_capability` are the same as before T9.

**Mutation probe.** On a fresh database at `235457d`, with `profile_select`,
`profile_update_self` and `audit_log_select_staff` set to `true`, USAGE on `auth_helpers` granted
to `anon` and EXECUTE granted back to PUBLIC by default, the test file fails exactly the seven
assertions that guard them: 13, 14, 18, 22, 27, 28 and 29. With only the per-schema grant back
reverted in `public` and `extensions`, it fails 30 and 31.

## Red, observed on the base `e3e92fc`

- **F1.** `apply.sh` on the base: `0001` and `0002` apply, `0003_auth_helpers.sql` fails at line 60
  with `ERROR:  type public.app_capability does not exist`. With that type created by hand
  first, the same file fails with `ERROR:  relation "public.user_role_grant" does not exist`.
- **F2.** With `0004_rbac.sql` applied before `0003_auth_helpers.sql`, every migration applies,
  and `rls_profile.test.sql` stops at line 149 with `ERROR:  permission denied for schema
  auth_helpers`, its first direct `auth_helpers.is_staff()` call as `authenticated`. The
  audit-log policy itself worked (a user with no grant reads 0 audit rows, an admin reads 1),
  because a policy resolves its functions when it is created.
- **F3.** "authenticated user can read any profile row (profile_select using true)" passed: a user
  with no role read another user's profile, 1 row. The corrected assertion, written before the
  policy, failed with have 1, want 0.
- **F4.** "unauthorized user cannot update another user profile" failed with
  `no exception thrown`.
- **F5.** Of the four `supabase` scripts of `packages/supabase/package.json`, `db:reset` and
  `test:db` named no target (the CLI's default is the local stack), `gen:types` passed
  `--local`, and `db:push` named none. After T5 the three that remain pass `--linked`.

## Independent verification

One independent verifier, with the stubs this report now uses, found two blockers and one defect
the change caused. Each was fixed in its own task, test first:

- **B1 — the F4 assertion did not protect SUPABASE-12** (T7, `aa72e61`). With
  `profile_update_self` set to `using (true) with check (true)`, "unauthorized user cannot update
  another user profile" still passed at `9d16386`, while an unfiltered update by Bob changed 2 rows
  and Alice's became `Hacked`: the test's `WHERE id = …` names a column, so Postgres also applied
  `profile_select`, which hides Alice's row. Reproduced here, then fixed: the update has no WHERE
  clause, so only the update policy decides, and Alice's row is read back as `postgres`. Red
  against that weakened policy (have Hacked, want Alice), green on the code; test 16 still holds,
  as section 4 sets Bob's row again.
- **B2 — the docs implied `test:db` needs no Docker** (T8, `0d59a5a`). The bundle of Supabase CLI
  2.109.1 (`supabase.exe`, read, not run) runs `create extension if not exists pgtap with schema
  extensions` on the target, drops `pgtap` afterwards when it was not installed before, and runs
  `pg_prove` in the `supabase/pg_prove:3.36` container for every target, `--linked` included.
  The README, `packages/supabase/docs/database.md` and both test headers now say that `test:db` needs Docker, runs
  against the linked project and stays out of the offline `pnpm validate` gate, so a person or a
  CI job with Docker runs it. The database guide and the migration comments also no longer say
  that a SECURITY INVOKER function always resolves names as its caller (a `BEGIN ATOMIC` function
  resolves them when it is created, like a policy; a PL/pgSQL or string-body SQL function when it
  runs), nor that `postgres` is the Supabase superuser (it is a non-superuser with `bypassrls`).
- **C1 — the USAGE grant made a future helper reachable** (T9, `235457d`). At `0d59a5a` a
  function `postgres` adds to `auth_helpers` with no grant block is executable by `authenticated`
  and `anon` through the PUBLIC default (tests 28 and 29 red). The fix the verifier named,
  `alter default privileges for role postgres in schema auth_helpers revoke execute on functions
  from public`, was tried first and changes nothing: tests 28 and 29 stay red and no default ACL
  row is written, because PUBLIC's EXECUTE is a global default, which a per-schema REVOKE cannot
  remove. The helpers migration instead revokes it for every function `postgres` creates and
  grants it back to PUBLIC per schema in `public` and `extensions`, which keep the behaviour they
  had (tests 30 and 31). Supabase's own default grants live in `public` only, so `auth_helpers`
  holds none to cover.

## Types

`src/types.ts` keeps its placeholder. `supabase gen types typescript --db-url` against the
scratch database, with CLI 2.109.1, printed `Connecting to localhost 55432` and then failed with
`failed to connect to the docker API`: it generates through a Docker container, whose daemon is
not running here and may not be started. `--local` needs the local stack and `--linked` a cloud
project. A project generates the file with `pnpm --filter @app/supabase gen:types` once its
migrations are on the linked project.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-14, at `235457d`. Every step before
  `verify:specs` passed (turbo 24 of 24 tasks, `@app/supabase` 21 of 21 tests; `verify:tests`
  77 units). `verify:specs` failed on one problem, the one this change expects until its
  archive: `openspec/specs/packages/supabase/spec.md:299: no test titled "authenticated user can
  read any profile row (profile_select using true)"`, a title T3 removed because the behaviour
  it named is gone. The steps after it, run one by one: `git-free-env:test`,
  `report:spec-drift:test`, `report:spec-drift`, `verify:english:test`, `verify:english`,
  `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`, `verify:structure`,
  `verify:security`, `verify:theme-sync`, `docs:diagrams:check`, `pnpm --filter @app/i18n test`
  and `knip`: exit 0 each. The same held at `9d16386`.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, on the archive commit's tree, the delta
  merged into the living spec (turbo 24 of 24 tasks; `verify:specs` PASS with 0 open changes;
  `report:spec-drift` 0 of 8 specs behind their code).

## Not verified

- The pgTAP files under pgTAP itself, and any run against a Supabase project: pgTAP is not
  installed here, no project is linked, and `test:db` needs Docker. A person or a CI job with
  Docker running `pnpm --filter @app/supabase test:db` on the linked project is the check that
  remains.
- `supabase db push --linked`: it needs a linked project.
- On a Supabase project whose `postgres` holds a global default EXECUTE grant of its own, the
  revoke from PUBLIC would not cover it; the stubs, like Supabase's documented setup, hold none.
  Tests 28 and 29 would show it.
- Found on the way, outside F1 to F5 and left as open question Q6: with Supabase's default
  privileges, `anon` keeps EXECUTE on `public.has_capability`, because `revoke all ... from
  public` does not remove the explicit grant the default privileges give `anon`; SUPABASE-17 says
  only `authenticated` and `service_role` execute the helpers. As `anon` the call answers
  `false`, since `auth.uid()` is null. The verifier's other findings (TRUNCATE grants,
  self-service status and credit edits, `_setup.test.sql` with no plan) are follow-ups, not fixed
  here.
