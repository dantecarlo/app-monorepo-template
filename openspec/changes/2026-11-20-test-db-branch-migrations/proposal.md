# Proposal: test:db runs the pgTAP suites over the branch's own migrations, on a target the project sets

> **Status:** open

## Why

F57 of `docs/INIT_AND_HARNESS_PLAN.md`: `test:db` is `supabase test db --linked`
(`packages/supabase/package.json:22`), which runs pgTAP against the schema already applied to the
linked project. A branch that adds a migration and tests it fails until someone runs `db push`
against the real database, so the tests of a migration can only pass after it has shipped.
Certifipago fixed it in #878 (merge `3482afea0`): every migration of the checkout that the
database's ledger lacks is applied inside the tests' rolled-back transaction, through a `do`
block that `execute`s it, where Postgres refuses a statement that would commit.

The owner also asked that the database tests be configurable per project, and that a project may
have no Supabase at all; `/init` will ask both later (Stage 6, decision 54).

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-20 (translated from Spanish): "Finish making all the changes … Finish what's missing."
- 2026-11-20 (translated from Spanish), on the database-test setup: "must be configurable"
- 2026-11-20 (translated from Spanish), on the backend: "may or may not use Supabase; it can also
  have its own separate backend, and there we no longer put our hands"

## What changes

- **The suites run over the checkout's schema.** Before running, `test:db` copies every pgTAP
  file into a temporary bundle with a `do` block right after its opening `begin;`. The block holds
  every migration of the checkout, in name order, with the version and name the Supabase CLI
  records, its text dollar-quoted with a tag no text can end. Inside the file's own transaction it reads
  `supabase_migrations.schema_migrations` and applies, through `execute`, each migration whose
  version the ledger lacks; the file's `rollback;` takes them with it. As in #878, a `begin;` and
  `commit;` that wrap a whole file are removed first; Postgres itself refuses a `commit`,
  `rollback` or `end` left inside one; the first migration that fails stops the file, named; a
  version the ledger holds under another name stops it before anything is applied; the versions
  the ledger holds and the checkout has no file for are listed as a notice.
- **Adapted to this repository.** #878 reads the ledger and applies the files from a Node script
  over a `pg` client. The template has no `pg` dependency and its runner stays the Supabase CLI
  (`supabase test db`, `pg_prove` in Docker), so the ledger is read by the `do` block, in the same
  transaction that applies the files. The block's text is a bundle the tests build and read
  offline. #878 binds each text as a query parameter; a plain SQL file has none, so each text
  is dollar-quoted with a tag chosen so that no text can close it early. A file name the CLI does not read as a migration (`<version>_<name>.sql`) is left out,
  as the CLI leaves it out of `db push`.
- **A pgTAP file must hold its transaction.** The bundle refuses, naming it, a pgTAP file that does
  not open with `begin;` and end with `rollback;`: the migrations would outlive the run.
- **The target is a parameter.** `config.testDbTarget` of `packages/supabase/package.json` takes
  `linked` (the default, also when unset), `local` (a local Supabase stack, for a downstream
  project that chose Docker) or `off` (a project that keeps Supabase and runs no database tests).
  Any other value runs nothing and exits 1. `/init` can set the key with the manifest's
  `patch-json` verb; the harness config file of Stage 4.2 absorbs it.
- **The runner.** `pnpm --filter @app/supabase test:db` runs `scripts/supabase-test-db.mjs`,
  which wires Node's files and processes into `runTestDb` (`packages/supabase/src/`) and runs
  `supabase test db --linked|--local <bundle>` from the package. `--dry-run` writes the bundle and
  prints the command, running nothing. The wiring lives under `scripts/` because the dependency
  registry admits Node builtins in no file of `packages/supabase` outside its tests and configs.
- **Ownership.** The runner, its config key and every test belong to the `supabase` capability:
  `packages/supabase/**` is claimed already, and `scripts/supabase-test-db.mjs` joins its claims,
  so a prune of `supabase` removes them all. No core gate and no root script requires them.
- **The docs follow.** `packages/supabase/docs/database.md` § 9, the package README, the header of
  `rls_profile.test.sql` and `docs/maps/global-map.md`, inside a `supabase` region.

## Out of scope

- A `pg` client and a Docker-free runner, as #878's test-db-cloud.mjs has: a new dependency
  needs an install, and the CLI's runner is the one this repository documents.
- The live run. No Supabase project is linked to the template and an agent may not start Docker
  here (`AGENTS.md`, Supabase workflow); the owner's command is in `database.md` § 9.
- Running `local` in the template: it is for a downstream project that chose Docker.
- #878's changes to the SQL masker of the order check (`toSqlCode`: escape strings and quoted
  identifiers). They fix the offline order check, not `test:db`, and are a follow-up of their own.
- The `/init` question (Stage 6, decision 54) and the harness config file (Stage 4.2).
- A project with its own backend, or none: it has no `packages/supabase`, so it has none of this.

## Affected specs

- `openspec/specs/packages/supabase/spec.md`: added SUPABASE-31 and SUPABASE-32
