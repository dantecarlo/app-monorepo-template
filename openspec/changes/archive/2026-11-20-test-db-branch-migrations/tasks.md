# Tasks: 2026-11-20-test-db-branch-migrations

- [x] T1 — The pgTAP bundle: the checkout's migrations, the block that applies the ones the ledger lacks, each pgTAP file with the block inside its transaction · Requirements: SUPABASE-31 · Commit: 51c1ad2
- [x] T2 — The configurable runner: `runTestDb`, `scripts/supabase-test-db.mjs`, `config.testDbTarget` and the `test:db` script, claimed by the `supabase` capability · Requirements: SUPABASE-32 · Commit: 94ba18f
- [x] T3 — The docs: `database.md` § 9, the package README, the header of `rls_profile.test.sql`, the global map · Requirements: none · Commit: 92d1c08
- [x] T4 — The correction after the independent verifier: each pgTAP file read from its code (a plain begin first, rollback last, no transaction control in between, no psql meta-command), a version shared by two migrations, a ledger row with no name and a null target refused · Requirements: SUPABASE-31, SUPABASE-32 · Commit: 27f01c9
