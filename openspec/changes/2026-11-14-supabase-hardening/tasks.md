# Tasks: 2026-11-14-supabase-hardening

- [x] T1 — F22: an offline vitest test reads the migrations in name order and fails when one names a public type, table, view or function that only a later migration creates; the database guide says it guards the order · Requirements: SUPABASE-24 · Commit: 35aa956
- [x] T2 — F22: `_setup.test.sql` is folded into `rls_profile.test.sql` and the database guide, and an offline vitest test fails when a pgTAP file declares no plan or never calls finish · Requirements: none · Commit: eadc47c
- [x] T3 — F19: the 0010 migration revokes EXECUTE on `public.has_capability` from `anon`; pgTAP for `anon`, for every SECURITY DEFINER function in `public` and `auth_helpers`, and for a signed-in admin; the wrapper convention of the database guide revokes from `anon` too · Requirements: SUPABASE-17 · Commit: 2079601
- [x] T4 — F20: the 0010 migration revokes TRUNCATE from `anon` and `authenticated` on every table in `public`, and in the default privileges of `postgres` there; pgTAP for both roles, a refused truncate and a table added later · Requirements: SUPABASE-26 · Commit: 5dce6fc
- [x] T5 — F20: the 0012 migration adds a `before truncate` statement trigger on `audit_log` that raises; pgTAP for a truncate by the owner and by `service_role` · Requirements: SUPABASE-19 · Commit: 6df25c2
- [x] T6 — F21: the 0011 migration lets `authenticated` update only `display_name` on `profile`; pgTAP for every other column, the unchanged row and a self-granted role; the database guide says how a project opens another column · Requirements: SUPABASE-27, SUPABASE-14 · Commit: 723eddd
- [x] T7 — F22: `gen:types` writes to a temporary file and moves it over `src/types.ts` only when the command succeeds; the README and the `src/types.ts` header say so · Requirements: none · Commit: 6ad399e
- [x] T9 — correction after the independent verification (N1): the read-back of the profile after the refused updates compares against a snapshot taken before them, so a database whose seed rows are older still passes · Requirements: SUPABASE-27 · Commit: b034917
- [ ] T10 — correction after the independent verification (N2a): pgTAP proves a user cannot set their credit balance through an upsert · Requirements: SUPABASE-27 · Commit: —
- [ ] T11 — correction after the independent verification (N2b): pgTAP proves a truncate that names `audit_log` among other tables is refused · Requirements: SUPABASE-19 · Commit: —
- [ ] T12 — correction after the independent verification (N2c): pgTAP proves no API role may execute `tg_audit_no_truncate` · Requirements: SUPABASE-29 · Commit: —
- [ ] T13 — correction after the independent verification (N2d): `anon` and `authenticated` lose INSERT on `public.profile`, so only the service path creates a profile; pgTAP for the privilege, a user's own insert and the service role's · Requirements: SUPABASE-28 · Commit: —
- [ ] T14 — F28, found by the independent verification: the 0013 migration revokes TRIGGER, REFERENCES and MAINTAIN from `anon` and `authenticated` on every table in `public` and in the default privileges of `postgres` there, and EXECUTE on `tg_audit_immutable` from every API role; pgTAP for each · Requirements: SUPABASE-26, SUPABASE-29, SUPABASE-19 · Commit: —
- [ ] T15 — correction after the independent verification: the `## Supabase workflow` block of `AGENTS.md` regenerates the types through `pnpm --filter @app/supabase gen:types`, which keeps `src/types.ts` when the CLI fails · Requirements: none · Commit: —
- [ ] T8 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-supabase-hardening/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
