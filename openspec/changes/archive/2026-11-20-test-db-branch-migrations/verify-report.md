# Verify report: 2026-11-20-test-db-branch-migrations

> **Verified:** 2026-11-20 at `92d1c08`

## Scenarios

| Requirement | Scenario                                   | Test                                                                                                                                         | Result      |
| ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SUPABASE-31 | the checkout's migrations, in order        | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists the migrations in name order, with the version and the name the Supabase CLI records" | green       |
| SUPABASE-31 | a migration wrapped in its own transaction | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "drops the begin and commit that wrap a whole migration, and keeps a commit inside it"        | green       |
| SUPABASE-31 | a migration that only begins or only commits | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps the text of a migration that only begins or only commits"                         | green       |
| SUPABASE-31 | a file the CLI does not read as a migration | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "leaves out a file the Supabase CLI does not read as a migration"                          | green       |
| SUPABASE-31 | the migrations travel quoted               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists every migration of the checkout, each text dollar-quoted with a tag none of them can end" | green       |
| SUPABASE-31 | a version the database holds under another name | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "stops on a version the database holds under another name before it applies any migration" | green       |
| SUPABASE-31 | a migration the ledger lacks               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies a migration only when the database's ledger lacks its version"                    | green       |
| SUPABASE-31 | a migration that fails                     | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "runs each migration through a PL/pgSQL execute and names the one that fails"               | green       |
| SUPABASE-31 | a database with no ledger                  | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies every migration when the database has no migration ledger"                         | green       |
| SUPABASE-31 | the pgTAP file's transaction               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "puts the migrations inside each pgTAP file's transaction, right after its begin"           | green       |
| SUPABASE-31 | a pgTAP file outside a transaction         | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not open with begin, naming it"                             | green       |
| SUPABASE-31 | a pgTAP file outside a transaction         | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not end with rollback, naming it"                            | green       |
| SUPABASE-31 | the package's pgTAP files                  | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "bundles every pgTAP file of the package"                                                    | green       |
| SUPABASE-31 | a branch's new migration on a linked project | Not covered                                                                                                                                                 | not run     |
| SUPABASE-32 | no target set                              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle when the config names no target"              | green       |
| SUPABASE-32 | the linked target                          | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle for the linked target"                         | green       |
| SUPABASE-32 | the local target                           | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --local over the bundle for the local target"                           | green       |
| SUPABASE-32 | the off target                             | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs no database test for the off target"                                                    | green       |
| SUPABASE-32 | a target it does not know                  | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a target it does not know, naming the ones it takes"                                  | green       |
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

## Gate

- `pnpm validate`: not run by this change's writer: its brief keeps the shared machine to single test files
  and the package's suite, and the session that integrates it runs it.
- `pnpm --filter @app/supabase test`: exit 0, 2026-11-20, 11 files and 61 tests.
- `eslint` on every changed source and `tsc --noEmit` of `@app/supabase`: exit 0, 2026-11-20.
- `verify:specs`, `verify:english`, `verify:tests`, `verify:manifest`, `verify:manifest:coverage`,
  `verify:maps`, `verify:dependency-seams`: exit 0, 2026-11-20.
- The prune boundary of `supabase` (`findPruneLeaks` of `packages/tooling/src/prune-boundary.mjs`
  over this branch): 26 findings, none on a file of this change; all are the apps' own Supabase
  wiring, their `.env.example` keys and the app specs that cite it.

## Not verified

- The bundle's SQL running on Postgres, and both live scenarios: no gate reaches a database, the
  template links no project, and an agent may not start Docker here (`AGENTS.md`).
- The `local` target on a running stack, which is for a downstream project.
- `pnpm validate` and `knip`, which the integrating session runs.
