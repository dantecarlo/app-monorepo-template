# Verify report: 2026-11-20-test-db-branch-migrations

> **Verified:** 2026-11-20 at `92d1c08`

## Scenarios

| Requirement | Scenario                                   | Test                                                                                                                                         | Result      |
| ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SUPABASE-31 | the checkout's migrations, in order        | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists the migrations in name order, with the version and the name the Supabase CLI records" | green       |
| SUPABASE-31 | a migration wrapped in its own transaction | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "drops the begin and commit that wrap a whole migration, and keeps a commit inside it"        | green       |
| SUPABASE-31 | a migration that only begins or only commits | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps the text of a migration that only begins or only commits"                         | green       |
| SUPABASE-31 | a file the CLI does not read as a migration | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "leaves out a file the Supabase CLI does not read as a migration"                          | green       |
| SUPABASE-31 | two files share a version | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses two migrations with the same version, naming both" | green |
| SUPABASE-31 | the migrations travel quoted               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists every migration of the checkout, each text dollar-quoted with a tag none of them can end" | green       |
| SUPABASE-31 | a version the database holds under another name | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "stops on a version the database holds under another name before it applies any migration" | green       |
| SUPABASE-31 | a ledger row with no name | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "treats a ledger row with no name as a conflict" | green |
| SUPABASE-31 | a migration the ledger lacks               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies a migration only when the database's ledger lacks its version"                    | green       |
| SUPABASE-31 | a migration that fails                     | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "runs each migration through a PL/pgSQL execute and names the one that fails"               | green       |
| SUPABASE-31 | a database with no ledger                  | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies every migration when the database has no migration ledger"                         | green       |
| SUPABASE-31 | the pgTAP file's transaction               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "puts the migrations inside each pgTAP file's transaction, right after its begin"           | green       |
| SUPABASE-31 | a pgTAP file outside a transaction         | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not open with begin, naming it"                             | green       |
| SUPABASE-31 | a pgTAP file outside a transaction         | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not end with rollback, naming it"                            | green       |
| SUPABASE-31 | a rollback only in a comment | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file whose rollback is only in a trailing comment, naming it" | green |
| SUPABASE-31 | a transaction controlled in between | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that ends its transaction before its last rollback, naming it: %s" | green |
| SUPABASE-31 | a transaction controlled in between | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses $statement between the first begin and the last rollback, naming the file" | green |
| SUPABASE-31 | a savepoint and transaction words outside the code | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps savepoints, and transaction words inside comments, strings and bodies" | green |
| SUPABASE-31 | a psql meta-command | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file with a psql meta-command, naming it: %s" | green |
| SUPABASE-31 | an opening other than a plain begin | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses any opening other than a plain begin, naming the file: %s" | green |
| SUPABASE-31 | a statement the masker cannot read | Not covered | not run |
| SUPABASE-31 | the package's pgTAP files                  | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "bundles every pgTAP file of the package"                                                    | green       |
| SUPABASE-31 | a branch's new migration on a linked project | Not covered                                                                                                                                                 | not run     |
| SUPABASE-32 | no target set                              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle when the config names no target"              | green       |
| SUPABASE-32 | the linked target                          | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle for the linked target"                         | green       |
| SUPABASE-32 | the local target                           | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --local over the bundle for the local target"                           | green       |
| SUPABASE-32 | the off target                             | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs no database test for the off target"                                                    | green       |
| SUPABASE-32 | a target it does not know                  | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a target it does not know, naming the ones it takes"                                  | green       |
| SUPABASE-32 | a null target | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a null target, naming the setting" | green |
| SUPABASE-32 | a dry run                                  | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "writes the bundle and names the command without running it on a dry run"                     | green       |
| SUPABASE-32 | a suite fails                              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails with the exit status of the CLI when a suite fails"                                     | green       |
| SUPABASE-32 | the CLI cannot start                       | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails when the Supabase CLI cannot start"                                                    | green       |
| SUPABASE-32 | a pgTAP file it cannot bundle              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs nothing when a pgTAP file cannot be bundled"                                            | green       |
| SUPABASE-32 | the local target on a real stack           | Not covered                                                                                                                                                 | not run     |

Each test was seen red before its code: the 13 bundle tests and the 9 runner tests against stubs
that returned nothing, and the quoting rule twice more, once with a tag check that ignored where
a text's end meets the closing tag and once with the block's tag left unchecked.

The wiring of `scripts/supabase-test-db.mjs` was run offline, with no `supabase` on `PATH`:
`--dry-run` wrote a 69 147-byte bundle of `rls_profile.test.sql` whose `do` block sits right
after its `begin;` and lists the 13 migrations; `pnpm --filter @app/supabase test:db --dry-run`
passed the flag through; a run without the CLI exited 1 with "the Supabase CLI could not start:
spawnSync supabase ENOENT" and removed its bundle; an unknown flag exited 1.

## Correction after the independent verifier, 2026-11-20

The verifier found two blockers: a `rollback;` inside a trailing comment passed the check, with
LF and CRLF, and a `commit;` or `end;` between the first `begin;` and the last `rollback;`
passed it; in both, the migrations would be committed. The fix, at `27f01c9`, reads each pgTAP
file with `SQL_NON_CODE_TOKEN_PATTERN` of `src/sqlCode.constant.ts` blanking its comments,
strings and dollar-quoted bodies to spaces, offsets kept, then requires a plain `begin;` first,
`rollback;` last and no transaction-control statement in between, and refuses any psql
meta-command. With it: two migrations sharing a version are refused, both named; a ledger row
with no name is a conflict; a `null` target is refused, naming the key.

Seen red before the fix: 19 tests, each for its stated reason (the two probes and their CRLF
case, nine transaction-control statements, three meta-commands, the shared version, the
`is distinct from` and `%L` conflict text, and the null target). Three tests passed before and
after, pinning behaviour the stricter check keeps: a savepoint with transaction words in
comments, strings and a `do` body, and the refusal of `begin isolation level serializable;`
and `start transaction;` openings, which stay refused as a conservative choice.

Whether the CLI sees a bundle outside `supabase/tests/` was read offline from the installed
CLI 2.109.1 (`~/scoop/apps/supabase/current/supabase.exe`, its bundled `legacy.test.db`): every
path argument is bind-mounted read-only into the `pg_prove` container at its own path without
the drive letter, and `pg_prove -r` runs over it, so the bundle under the system's temporary
directory is visible. `supabase test db --help`, run with every HTTP request sent to a dead
local proxy, says only "Paths to test files or directories". No live run has confirmed it.

## Gate

- `pnpm validate`: not run by this change's writer: its brief keeps the shared machine to single test files
  and the package's suite, and the session that integrates it runs it.
- `pnpm --filter @app/supabase test`: exit 0, 2026-11-20, 11 files and 61 tests; after the
  correction, 11 files and 82 tests.
- `eslint` on every changed source and `tsc --noEmit` of `@app/supabase`: exit 0, 2026-11-20.
- `verify:specs`, `verify:english`, `verify:tests`, `verify:manifest`, `verify:manifest:coverage`,
  `verify:maps`, `verify:dependency-seams`: exit 0, 2026-11-20.
- The prune boundary of `supabase` (`findPruneLeaks` of `packages/tooling/src/prune-boundary.mjs`
  over this branch): 26 findings, none on a file of this change; all are the apps' own Supabase
  wiring, their `.env.example` keys and the app specs that cite it.

## Not verified

- What the masker does not read: an escape string with a quote inside it and a double-quoted
  identifier holding `--` can hide a statement on their line from the pgTAP check.
- The bundle's SQL running on Postgres, and both live scenarios: no gate reaches a database, the
  template links no project, and an agent may not start Docker here (`AGENTS.md`).
- The `local` target on a running stack, which is for a downstream project.
- `pnpm validate` and `knip`, which the integrating session runs.
