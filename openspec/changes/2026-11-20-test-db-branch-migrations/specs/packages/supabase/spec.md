# Delta: packages/supabase

> **Change:** `2026-11-20-test-db-branch-migrations`

## ADDED Requirements

### Requirement: SUPABASE-31 — test:db runs the pgTAP suites over the checkout's migrations

The supabase package's `test:db` SHALL apply, at the start of each pgTAP file's own transaction,
every migration of the checkout whose version the target database's ledger
(`supabase_migrations.schema_migrations`) lacks, in name order, so the file's `rollback` takes
them with it and the database ends as it was. It SHALL apply each one through a PL/pgSQL
`execute`, without a `begin` and a `commit` that wrap the whole file, and stop on the first that
fails, naming it; it SHALL apply none when the ledger holds a file's version under another name;
and it SHALL run nothing when a pgTAP file does not open with `begin` and end with `rollback`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the checkout's migrations, in order

- **GIVEN** migration files out of name order
- **WHEN** test:db reads them
- **THEN** it lists them in name order, each with the version and the name the Supabase CLI records
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists the migrations in name order, with the version and the name the Supabase CLI records"

#### Scenario: a migration wrapped in its own transaction

- **GIVEN** a migration that opens with `begin;` and ends with `commit;`, with a `commit;` inside
- **WHEN** test:db reads it
- **THEN** the outer pair is removed and the inner `commit;` stays, for Postgres to refuse
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "drops the begin and commit that wrap a whole migration, and keeps a commit inside it"

#### Scenario: a migration that only begins or only commits

- **GIVEN** a migration that opens with `begin;` and does not commit, and one that commits only
- **WHEN** test:db reads them
- **THEN** each keeps its text
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps the text of a migration that only begins or only commits"

#### Scenario: a file the CLI does not read as a migration

- **GIVEN** a `.sql` file of the migrations folder whose name is not `<version>_<name>.sql`
- **WHEN** test:db reads the folder
- **THEN** that file is not applied
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "leaves out a file the Supabase CLI does not read as a migration"

#### Scenario: the migrations travel encoded

- **GIVEN** migrations holding quotes and dollar-quoted bodies
- **WHEN** the block that applies them is built
- **THEN** it lists every one with its file, version and name, its text base64-encoded and never raw
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists every migration of the checkout with its text encoded, never raw"

#### Scenario: a version the database holds under another name

- **GIVEN** a database whose ledger holds a file's version under another name
- **WHEN** the block runs
- **THEN** it raises, naming the file and both names, before it applies any migration
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "stops on a version the database holds under another name before it applies any migration"

#### Scenario: a migration the ledger lacks

- **GIVEN** a database whose ledger lacks the version of a file
- **WHEN** the block runs
- **THEN** it applies that file and skips every file whose version the ledger holds
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies a migration only when the database's ledger lacks its version"

#### Scenario: a migration that fails

- **GIVEN** a pending migration that Postgres refuses, such as one with a `commit;` inside
- **WHEN** the block applies it through `execute`
- **THEN** the file stops with an error that names the migration and Postgres's reason
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "runs each migration through a PL/pgSQL execute and names the one that fails"

#### Scenario: a database with no ledger

- **GIVEN** a database with no `supabase_migrations.schema_migrations`
- **WHEN** the block runs
- **THEN** it applies every migration of the checkout and reads no ledger
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies every migration when the database has no migration ledger"

#### Scenario: the pgTAP file's transaction

- **GIVEN** a pgTAP file that opens with `begin;` and ends with `rollback;`
- **WHEN** test:db bundles it
- **THEN** the block sits right after its `begin;` and the rest of the file is unchanged
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "puts the migrations inside each pgTAP file's transaction, right after its begin"

#### Scenario: a pgTAP file outside a transaction

- **GIVEN** a pgTAP file that does not open with `begin;`, or one that does not end with `rollback;`
- **WHEN** test:db bundles the files
- **THEN** it refuses, naming the file
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not open with begin, naming it"
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not end with rollback, naming it"

#### Scenario: the package's pgTAP files

- **GIVEN** the pgTAP files and the migrations of the package
- **WHEN** test:db bundles them
- **THEN** every pgTAP file is bundled
- **Test:** `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "bundles every pgTAP file of the package"

#### Scenario: a branch's new migration on a linked project

- **GIVEN** a linked project whose ledger lacks a migration the branch adds, and a test of it
- **WHEN** the owner runs test:db
- **THEN** the test passes and the project's schema and ledger are as they were
- **Test:** Not covered — no gate reaches a database and the template links no project; `packages/supabase/docs/database.md` § 9 holds the owner's command

### Requirement: SUPABASE-32 — The test:db target is configurable

The supabase package's `test:db` SHALL read its target from `config.testDbTarget` of
`packages/supabase/package.json`: `linked`, the default when the key is unset, runs the bundled
suites with `supabase test db --linked`; `local` runs them with `supabase test db --local`; `off`
runs no database test and exits 0; any other value runs nothing and exits 1, naming the three. A
run SHALL exit with the CLI's status and remove the bundle; with `--dry-run` it SHALL write the
bundle and name the command without running it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no target set

- **GIVEN** a package.json whose config names no target
- **WHEN** test:db runs
- **THEN** it runs `supabase test db --linked` over the bundle, removes it and exits with the CLI's status
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle when the config names no target"

#### Scenario: the linked target

- **GIVEN** the target `linked`
- **WHEN** test:db runs
- **THEN** it runs `supabase test db --linked` over the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle for the linked target"

#### Scenario: the local target

- **GIVEN** the target `local`
- **WHEN** test:db runs
- **THEN** it runs `supabase test db --local` over the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --local over the bundle for the local target"

#### Scenario: the off target

- **GIVEN** the target `off`
- **WHEN** test:db runs
- **THEN** it reads no SQL file, writes no bundle, runs no CLI, says so and exits 0
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs no database test for the off target"

#### Scenario: a target it does not know

- **GIVEN** a target other than `linked`, `local` and `off`
- **WHEN** test:db runs
- **THEN** it runs nothing and exits 1, naming the value and the three targets
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a target it does not know, naming the ones it takes"

#### Scenario: a dry run

- **GIVEN** the flag `--dry-run`
- **WHEN** test:db runs
- **THEN** it writes the bundle, keeps it, names it and the command, runs no CLI and exits 0
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "writes the bundle and names the command without running it on a dry run"

#### Scenario: a suite fails

- **GIVEN** a CLI run that exits with a failing status
- **WHEN** test:db runs
- **THEN** it exits with that status and removes the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails with the exit status of the CLI when a suite fails"

#### Scenario: the CLI cannot start

- **GIVEN** a machine where the Supabase CLI cannot start
- **WHEN** test:db runs
- **THEN** it exits 1, naming the reason, and removes the bundle
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails when the Supabase CLI cannot start"

#### Scenario: a pgTAP file it cannot bundle

- **GIVEN** a pgTAP file that does not open with `begin;`
- **WHEN** test:db runs
- **THEN** it writes no bundle, runs no CLI and exits 1, naming the file
- **Test:** `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs nothing when a pgTAP file cannot be bundled"

#### Scenario: the local target on a real stack

- **GIVEN** a downstream project with a running local Supabase stack
- **WHEN** it runs test:db with the target `local`
- **THEN** the suites run on that stack
- **Test:** Not covered — the template runs no Docker and no local stack (`AGENTS.md`, Supabase workflow)
