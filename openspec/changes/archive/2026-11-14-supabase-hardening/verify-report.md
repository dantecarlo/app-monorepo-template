# Verify report: 2026-11-14-supabase-hardening

> **Verified:** 2026-11-15 at `99b6eb5`

## How the database was checked

No gate has a database, and this change may start no Docker or local Supabase stack and connect to
no remote database. Every database result below comes from a throwaway PostgreSQL 18.4 cluster on
`localhost:55440`, made with `initdb` in a scratch directory outside the repository, with the
stubs the supabase-migrations verifier used
(`openspec/changes/archive/2026-11-14-supabase-migrations/verify-report.md`): `supabase_admin` as
the bootstrap superuser; `postgres` a non-superuser with `bypassrls`, `createrole` and `createdb`,
a member of the API roles and the owner of each test database; `anon` and `authenticated`
(`nologin noinherit`) and `service_role` (with `bypassrls`); the `auth` schema with `auth.users`,
`auth.uid()`, `auth.jwt()` and `auth.role()` reading `request.jwt.claims`; the `extensions` schema
with `pgcrypto` and `moddatetime`; and Supabase's default privileges in `public`: ALL on every
table, function and sequence `postgres` creates there, to the three API roles.

- **`apply.sh`** creates a fresh database, loads the stubs and the TAP stand-in as
  `supabase_admin`, then applies every migration in name order as `postgres`, one
  `psql -v ON_ERROR_STOP=1 -f` run per file, stopping at the first failure.
- **`tap-shim.sql`.** pgTAP is not installed and was not downloaded. The stand-in implements, in a
  schema `tap`, the pgTAP functions the suite calls (`plan`, `finish`, `ok`, `is`, `has_table`,
  `has_column`, `has_function`, `throws_ok` in its three- and four-argument forms, `lives_ok`,
  `pass`), with pgTAP's TAP output and comparison rules for those signatures; `throws_ok` passes
  only when the error code and message equal the expected ones. A probe of the stand-in itself
  showed `not ok` for a wrong argument list, a wrong message and a statement that does not throw.
- **`run-test.sh`** runs a test file itself, unchanged, as `postgres` through
  `psql -X -v ON_ERROR_STOP=1 -q -A -t -f`, with `search_path` `public, extensions, tap`, then
  judges the output the way pg_prove does: a plan line, no `not ok`, as many results as planned,
  and psql exit 0. A file that stops on an error is a failure.
- **`preseed.sql`** commits, before a run, the suite's seed rows with `created_at` a day old: Alice,
  Bob and Carol in `auth.users`, the profiles of Alice and Bob, and Alice's admin grant.

The stubs reproduce Supabase's roles and grants as documented, not read from a Supabase project.

## Scenarios

Every pgTAP result is from `rls_profile.test.sql` run under the stand-in at `99b6eb5`: 64 of 64 ok
on a fresh database, and 64 of 64 on a database preseeded a day earlier. The vitest results are
from `pnpm --filter @app/supabase test`, 33 of 33. "Base" is `e8a4489`, the branch point; "before
Tn" is the code just before that task.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SUPABASE-14 | a user grants themselves a role | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot grant themselves a role" | green (ok 55); green on the base, existing behaviour; red under M7 |
| SUPABASE-14 | the grants after the refused insert | `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused self-grant leaves the user with no role" | green (ok 56); red under M7 |
| SUPABASE-17 | an anonymous caller | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon cannot execute the public has_capability wrapper" | green (ok 38); red before T3 with `no exception thrown`, and under M1 |
| SUPABASE-17 | every privileged function | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon may execute no security definer function in public or auth_helpers" | green (ok 39); red before T3 with have `{public.has_capability}`, want `{}`, and under M1 |
| SUPABASE-17 | a signed-in admin calls the wrapper | `packages/supabase/supabase/tests/rls_profile.test.sql` › "the public has_capability wrapper answers a signed-in admin" | green (ok 40), before and after T3; under M2 the file stops there with `permission denied for function has_capability` |
| SUPABASE-17 | an API call into auth_helpers | Not covered — the API configuration is not tested | not run |
| SUPABASE-19 | an update | `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log UPDATE raises immutability exception" | green (ok 24) |
| SUPABASE-19 | a delete | `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log DELETE raises immutability exception" | green (ok 25) |
| SUPABASE-19 | a truncate by the owner | `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log TRUNCATE raises immutability exception" | green (ok 26); red before T5 with `no exception thrown`, and under M5 |
| SUPABASE-19 | a truncate by the service role | `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log TRUNCATE by service_role raises immutability exception" | green (ok 28), though `service_role` may not execute the trigger function; red before T5 with `no exception thrown`, and under M5 |
| SUPABASE-19 | a truncate naming other tables too | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a truncate naming audit_log among other tables is refused" | green (ok 29); red on the base and under M5 with `no exception thrown`, the profile table emptied |
| SUPABASE-19 | the event after the refused truncates | `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused truncates leave the audit event in place" | green (ok 30); red before T5 with have 0, want 1, and under M5 |
| SUPABASE-24 | an empty database | Not covered — scratch probe `apply.sh` | the thirteen migrations apply in number order as `postgres`, and a second run of all thirteen on the same database succeeds |
| SUPABASE-24 | the package's migrations, read offline | `packages/supabase/src/__tests__/supabaseSql.test.ts` › "the migrations name no public object that only a later migration creates" | green; red with a probe migration `0000_probe.sql` naming `public.profile` (reported, created in `0005_profile.sql`); the same check on the migrations of `e3e92fc` reports the F1 order (below) |
| SUPABASE-24 | a migration names a later table | `packages/supabase/src/findMigrationOrderViolations.helper.test.ts` › "reports a table a migration names before the migration that creates it" | green; red against a stub that returned no violation (`expected [] to deeply equal [ { …(3) } ]`) |
| SUPABASE-26 | the anon role's privilege | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon holds TRUNCATE on no table in public" | green (ok 41); red before T4 with the four tables listed |
| SUPABASE-26 | the authenticated role's privilege | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated holds TRUNCATE on no table in public" | green (ok 42); red before T4 with the four tables listed, and under M3 |
| SUPABASE-26 | a signed-in user truncates a table | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a signed-in user cannot truncate a table" | green (ok 43); red before T4 with `no exception thrown`, and under M3 |
| SUPABASE-26 | the profiles after the refused truncate | `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused truncate leaves every profile in place" | green (ok 44); red before T4 with have 0, want 2, and under M3 |
| SUPABASE-26 | a table postgres adds later | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a table added to public gives anon and authenticated no TRUNCATE" | green (ok 45); red before T4 |
| SUPABASE-26 | the other privileges of a table added later | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a table added to public keeps the other privileges Supabase gives the API roles" | green (ok 46), before and after T4 and T14; red under M4 |
| SUPABASE-26 | the anon role's other privileges | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon holds no TRIGGER, REFERENCES or MAINTAIN on any table in public" | green (ok 60); red before T14 with every table of `public` listed, and under M14 |
| SUPABASE-26 | the authenticated role's other privileges | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated holds no TRIGGER, REFERENCES or MAINTAIN on any table in public" | green (ok 61); red before T14 with every table of `public` listed, and under M10 and M12 |
| SUPABASE-26 | a signed-in user creates a trigger | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a signed-in user cannot create a trigger on a table" | green (ok 62); red before T14 with `no exception thrown`, and under M10, where TRIGGER passes and EXECUTE on the function refuses it with another message |
| SUPABASE-26 | the other privileges of a table postgres adds later | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a table added to public gives anon and authenticated no TRIGGER, REFERENCES or MAINTAIN" | green (ok 63); red before T14, and under M12 |
| SUPABASE-27 | the column privileges | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated may update only the display_name column of profile" | green (ok 47); red before T6 with all seven columns listed, and under M6 |
| SUPABASE-27 | the status | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the status of their own profile" | green (ok 48); red before T6 with `no exception thrown`, and under M6 |
| SUPABASE-27 | the credit balance | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the credit balance of their own profile" | green (ok 49); red before T6 with `no exception thrown`, and under M6 |
| SUPABASE-27 | the id | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the id of their own profile" | green (ok 53); red before T6, where the update's WITH CHECK refused the new id with `new row violates row-level security policy for table "profile"` instead of the column privilege, and under M6 |
| SUPABASE-27 | the email | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the email of their own profile" | green (ok 50); red before T6 with `no exception thrown`, and under M6 |
| SUPABASE-27 | the timestamps | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the timestamps of their own profile" | green (ok 51); red before T6 with `no exception thrown`, and under M6 |
| SUPABASE-27 | an upsert | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot set the credit balance through an upsert" | green (ok 52); red on the base, refused by the missing insert policy only (`new row violates row-level security policy for table "profile"`), and on the base with an own-row insert policy added, `no exception thrown`; green with that policy on the code |
| SUPABASE-27 | the row after the refused updates | `packages/supabase/supabase/tests/rls_profile.test.sql` › "the refused updates leave the profile of the user unchanged" | green (ok 54), on a fresh and on a preseeded database; red before T9 on the preseeded one (have `…|0.00|f`, want `…|0.00|t`), and under M6 (have `(…,mallory@example.com,suspended,1000000.00,"2000-01-01 …")`) |
| SUPABASE-27 | the display name | `packages/supabase/supabase/tests/rls_profile.test.sql` › "authenticated user can update own profile row" | green (ok 16), before and after T6 |
| SUPABASE-28 | the insert privileges | `packages/supabase/supabase/tests/rls_profile.test.sql` › "anon and authenticated may insert no profile column" | green (ok 57); red before T13, and under M8 |
| SUPABASE-28 | a user creates their own profile | `packages/supabase/supabase/tests/rls_profile.test.sql` › "a user cannot create their own profile" | green (ok 58); red before T13, refused by the missing insert policy (`new row violates row-level security policy for table "profile"`) instead of the privilege, and under M8 |
| SUPABASE-28 | the service path | `packages/supabase/supabase/tests/rls_profile.test.sql` › "the service role still creates a profile" | green (ok 59), before and after T13; under M9 the file stops on the service role's insert with `permission denied for table profile` |
| SUPABASE-29 | tg_audit_immutable | `packages/supabase/supabase/tests/rls_profile.test.sql` › "no API role may execute tg_audit_immutable" | green (ok 64); red before T14, and under M11 |
| SUPABASE-29 | tg_audit_no_truncate | `packages/supabase/supabase/tests/rls_profile.test.sql` › "no API role may execute tg_audit_no_truncate" | green (ok 31); red with EXECUTE granted to `authenticated`, or to `service_role` (M13); on the base the file stops there, the function absent |
| SUPABASE-29 | the trigger still fires | `packages/supabase/supabase/tests/rls_profile.test.sql` › "audit_log UPDATE by service_role raises immutability exception" | green (ok 27), before and after T14 |

**Mutation probes**, each on a fresh database at `99b6eb5` with one statement applied after the
migrations:

| Probe | Statement | Failed |
| ----- | --------- | ------ |
| M1 | grant EXECUTE on `public.has_capability` to `anon` | 38, 39 |
| M2 | revoke EXECUTE on `public.has_capability` from `authenticated` | the file stops at 40 |
| M3 | grant TRUNCATE on every table in `public` to `authenticated` | 42, 43, 44 |
| M4 | revoke every default table privilege from `authenticated` | 46 |
| M5 | drop `audit_log_no_truncate` | 26 to 30, and 44 (the two-table truncate emptied the profiles) |
| M6 | grant UPDATE on `public.profile` to `authenticated` | 47 to 51, 53, 54 (52 holds: the upsert's INSERT is refused) |
| M7 | an insert policy for `authenticated` on `user_role_grant` | 55, 56 |
| M8 | INSERT on `public.profile` and an own-row insert policy for `authenticated` | 57, 58 |
| M9 | revoke INSERT on `public.profile` from `service_role` | the file stops at 59 |
| M10 | grant TRIGGER on `public.profile` to `authenticated` | 61, 62 |
| M11 | grant EXECUTE on `tg_audit_immutable` to `authenticated` | 64 |
| M12 | default privileges of `postgres` grant TRIGGER and REFERENCES to `authenticated` | 61, 63 |
| M13 | grant EXECUTE on `tg_audit_no_truncate` to `service_role` | 31 |
| M14 | grant REFERENCES on `public.audit_log` to `anon` | 60 |

## Red, observed on the base `e8a4489`

- **F19.** `public.has_capability` held `{postgres=X,anon=X,authenticated=X,service_role=X}`, and
  as `anon` the call answered `false` instead of being refused. It was the only SECURITY DEFINER
  function in `public` or `auth_helpers` `anon` could execute: the four `auth_helpers` functions
  grant it nothing.
- **F20.** `anon` and `authenticated` held TRUNCATE on all four tables; as `authenticated`,
  `truncate public.profile` ran and left 0 rows. As `postgres` and as `service_role`,
  `truncate public.audit_log` ran.
- **F21.** As Bob, `update public.profile set status = 'suspended', credit_balance = 1000000`
  updated his row.
- **F22.** `_setup.test.sql` ran under the TAP judge with no plan line ("No plan found in TAP
  output"), and the offline test named it. With a fake `supabase` on `PATH` that exits 1, `pnpm
  run gen:types` (pnpm's shell emulator, the script copied unchanged into a scratch package)
  exited 1 and left `src/types.ts` empty. The order check, run through Node's type stripping on
  the migrations of `e3e92fc`, reported `0003_auth_helpers.sql` naming `public.app_capability`,
  `public.user_role_grant` and `public.role_capability`, which `0004_rbac.sql` creates: the order
  the supabase-migrations change fixed.
- **F28.** The default ACL for tables was `arwdDxtm` for each API role. As `authenticated`,
  `create trigger evil before update or delete on public.profile for each row execute function
  auth_helpers.tg_audit_immutable()` succeeded, and an update of the profile table as
  `service_role` then failed with "audit_log is append-only: UPDATE and DELETE are not permitted".

## gen:types

The fixed script, copied unchanged into a scratch package, run through `pnpm run gen:types` with
the shell emulator and a fake `supabase` first on `PATH`: when the fake exits 1, the run exits 1,
`src/types.ts` keeps its text and no `src/types.ts.tmp` is left; when it prints types, the run
exits 0 and `src/types.ts` holds them, with no temporary file left. The same two runs through
`sh -c` give the same results. The command `AGENTS.md` showed before T15, `supabase gen types
typescript --linked > src/types.ts`, run through `sh -c` with the failing fake, exited 1 and left
`src/types.ts` empty. No committed test covers it: the package has no Node types for a test that
spawns a shell, and the real command needs a linked project.

## Independent verification

One independent verifier read the change at `6ad399e` and found no blocker. The coordinator sent
its findings as one correction batch; the branch was rebuilt from `6ad399e` (the first version is
kept as `backup/supabase-hardening-v1`), each correction a task of its own, test first:

- **N1, caused by the change** (T9, `b034917`). On a database whose seed rows are a day old, "the
  refused updates leave the profile of the user unchanged" failed (have `…|0.00|f`, want
  `…|0.00|t`): it compared `created_at` with `now()`, while the suite's header says such a
  database still runs. Reproduced with `preseed.sql`, then fixed: the row is compared with a
  snapshot taken before the updates (`bob_before`). Green on a fresh and on a preseeded database,
  and still red under M6.
- **N2, mutations no test caught.** (a) An upsert setting `credit_balance` (T10, `d2de6b3`). (b) A
  truncate naming `audit_log` with another table (T11, `5ef3e6e`). (c) EXECUTE on
  `tg_audit_no_truncate` for an API role (T12, `1075b4c`); the assertion also covers
  `service_role`, so that SUPABASE-29 holds for every API role. (d) INSERT on every profile column
  for `authenticated`, which left only the missing insert policy between a user and a row with a
  `credit_balance` of their choosing (T13, `8e2579a`): 0011 now revokes INSERT on
  `public.profile` from `anon` and `authenticated`. No migration creates a profile row, so the
  server-side path is `service_role`, which keeps INSERT ("the service role still creates a
  profile").
- **F28, the same class as F20** (T14, `a1af3c1`). TRIGGER, REFERENCES and MAINTAIN are revoked
  from `anon` and `authenticated` on every table in `public` and in the default privileges of
  `postgres` there, MAINTAIN only on a server that has it (PostgreSQL 17 and later), and EXECUTE on
  `tg_audit_immutable` from every API role. The audit row trigger still fires for `service_role`.
- **AGENTS.md** (T15, `99b6eb5`). Its Supabase workflow block runs `pnpm --filter @app/supabase
  gen:types` instead of redirecting the CLI into `src/types.ts`.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-15, at `99b6eb5` (turbo 24 of 24 tasks,
  `@app/supabase` 33 of 33 tests; `verify:tests` 77 units; `verify:specs` PASS with this change
  open; `report:spec-drift` lists the supabase spec, which the archive re-verifies).
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-15, on the archive commit's tree, the delta
  merged into the living spec (turbo 24 of 24 tasks; `verify:specs` PASS with 0 open changes;
  `report:spec-drift` 0 of 8 specs behind their code).
- The first version of the change, at `6ad399e`, also had a run that failed only on
  `@app/web#build`, which could not fetch the Google font of `next/font/google`; the web build then
  passed alone, and `pnpm validate` exited 0 at `6ad399e`.

## Not verified

- The suite under pgTAP itself, and any run against a Supabase project: pgTAP is not installed
  here, no project is linked, and `test:db` needs Docker. A person or a CI job with Docker running
  `pnpm --filter @app/supabase test:db` on the linked project is the check that remains.
- The PostgreSQL 15 path of `0013_table_privileges.sql` and of the suite's MAINTAIN checks, which
  skip MAINTAIN below version 17: only PostgreSQL 18.4 is installed here, and `config.toml` names
  major version 15.
- On a Supabase project, tables in `public` owned by a role other than `postgres` (none of the
  migrations' tables): a revoke run as `postgres` removes only the grants `postgres` made.
- A superuser can still empty the audit log, by disabling triggers with
  `session_replication_role = replica`; on Supabase `postgres` is not a superuser.
