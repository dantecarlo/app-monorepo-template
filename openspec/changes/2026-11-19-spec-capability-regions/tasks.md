# Tasks: 2026-11-19-spec-capability-regions

- [x] T1 — `parseSpec` reads the union of every `Governs` line, so `verify:specs` needs one line naming a backticked path and `report:spec-drift` measures every governed path; region markers between header lines and between requirements read as nothing · Requirements: none · Commit: 5b55be4
- [x] T2 — the spec format: `openspec/README.md` § 2.1 drops the `Governs` column and § 2.2 states several `Governs` lines and a capability's part in a region it owns; the spec and delta templates and the `sdd` skill say where that part goes · Requirements: none · Commit: 9f5652f
- [ ] T3 — the TOOLING-18 repository scenarios rewritten in `packages/tooling/src/__tests__/prune-boundary.test.mjs`: seen red on today's specs and manifest, green at the archive, which moves the Sentry part · Requirements: TOOLING-18 · Commit: —
- [ ] T4 — `verify-report.md`, then the archive: the deltas merged, the Sentry part of each app spec in `sentry` regions of its header, its Purpose and its requirements; the two Sentry specs removed; the `sentry`, `web-next` and `mobile-expo` entries of `template.manifest.json` and `docs/manifest.md` updated; the Sentry rows and the exception sentence of `openspec/README.md` § 2.1 gone; the folder moved · Requirements: WEB-81, WEB-82, WEB-83, WEB-84, MOBILE-80, MOBILE-81, MOBILE-82, WEBSENTRY-01, WEBSENTRY-02, WEBSENTRY-03, WEBSENTRY-04, MOBILESENTRY-01, MOBILESENTRY-02, MOBILESENTRY-03, TOOLING-18 · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
