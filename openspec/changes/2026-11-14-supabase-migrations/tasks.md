# Tasks: 2026-11-14-supabase-migrations

- [x] T1 — F1: the RBAC migration becomes `0003_rbac.sql` and the helpers `0004_auth_helpers.sql`, so every migration uses only what it or an earlier one creates; the database guide states the rule · Requirements: SUPABASE-24 · Commit: 6bec83b
- [x] T2 — F2: the helpers migration grants USAGE on `auth_helpers` to `authenticated` and `service_role`; pgTAP assertions for `anon` and for the audit-log policy as `authenticated` · Requirements: SUPABASE-23, SUPABASE-21 · Commit: b929840
- [x] T3 — F3: `profile_select` reads only the user's own row, with its comment and its test · Requirements: SUPABASE-11 · Commit: d71d15e
- [x] T4 — F4: the assertion on updating another user's profile checks that the row stays unchanged · Requirements: SUPABASE-12 · Commit: 92fc70e
- [x] T5 — F5: the package scripts target the linked project and `db:reset` goes; the README, the database guide, the test headers and the `src/types.ts` header describe the cloud workflow · Requirements: none · Commit: 9d16386
- [x] T7 — correction after the independent verification (B1): the assertion on another user's profile updates with no WHERE clause, so only the update policy decides which rows change, and it fails when that policy is weakened · Requirements: SUPABASE-12 · Commit: aa72e61
- [ ] T8 — correction after the independent verification (B2): the docs and test headers say `test:db` runs pg_prove in Docker against the linked project, outside the offline gate; the database guide's claims on which functions resolve names as their caller and on the `postgres` role are corrected · Requirements: none · Commit: —
- [ ] T9 — correction after the independent verification (C1): a function `postgres` creates in `auth_helpers` starts with no EXECUTE for any API role, so a helper added without its own revoke block stays out of reach; pgTAP assertions for that and for the schema USAGE of `service_role` and `anon` · Requirements: SUPABASE-23, SUPABASE-25 · Commit: —
- [ ] T6 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-supabase-migrations/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
