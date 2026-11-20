# Tasks: 2026-11-19-seam-open-migrations

- [ ] T1 — The registry declares its open migrations: `openMigrations` in the gate's registry shape, the open ids in `indexRegistry`, the template's `[]`, and the stale-migration finding, skipped while the allowlist cannot be read; their cases · Requirements: SEAM-16 · Commit: —
- [ ] T2 — An allowlist entry counts only under an open migration: `migration` on the entry, the shared predicate `namesOpenMigration`, the rule's exemption and the gate's shape check calling it, the F.8-prefix check of the reason gone; their gate and rule cases; the differential of the lint and the gate against the base · Requirements: SEAM-07 · Commit: —
- [ ] T3 — `docs/code-standards.md` § 23 and its § 21 row, `docs/decisions/0002-every-library-behind-an-adapter.md`, `docs/harness.md`, `docs/maps/global-map.md`, the `lib` skill and the registry's `$comment` · Requirements: none · Commit: —
- [ ] T4 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/dependency-seams/spec.md` and the folder moved to `openspec/changes/archive/2026-11-19-seam-open-migrations/` · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
