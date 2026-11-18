# Tasks: 2026-11-18-posthog-consent

- [x] T1 — packages/core: the consent port and its statuses, exported from the barrel · Requirements: CORE-27 · Commit: 018c554
- [x] T2 — apps/web: the consent mode setting, its resolver and the SDK options of each mode, privacy defaults under every mode · Requirements: WEB-51, WEB-55, WEB-56 · Commit: faa6d0e
- [x] T3 — apps/web: the PostHog consent adapter and the composition root, exported from the observability barrel · Requirements: WEB-57, CORE-27 · Commit: 70130f0
- [x] T4 — apps/mobile: the consent storage · Requirements: MOBILE-54 · Commit: 6710047
- [x] T5 — apps/mobile: the consent mode setting, its resolver and the SDK options of each mode, the opt-in at launch, privacy defaults under every mode · Requirements: MOBILE-50, MOBILE-52, MOBILE-53 · Commit: 5df5de9
- [ ] T6 — apps/mobile: the PostHog consent adapter and the composition root, exported from the observability barrel · Requirements: MOBILE-55 · Commit: —
- [ ] T7 — docs: `docs/observability.md`, both `.env.example` files, the env table of `AGENTS.md`, the architecture docs and the global map · Requirements: none · Commit: —
- [ ] T8 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-18-posthog-consent/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
