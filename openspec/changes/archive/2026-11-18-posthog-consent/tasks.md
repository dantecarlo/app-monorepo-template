# Tasks: 2026-11-18-posthog-consent

- [x] T1 — packages/core: the consent port and its statuses, exported from the barrel · Requirements: CORE-27 · Commit: 018c554
- [x] T2 — apps/web: the consent mode setting, its resolver and the SDK options of each mode, privacy defaults under every mode · Requirements: WEB-51, WEB-55, WEB-56 · Commit: faa6d0e
- [x] T3 — apps/web: the PostHog consent adapter and the composition root, exported from the observability barrel · Requirements: WEB-57, CORE-27 · Commit: 70130f0
- [x] T4 — apps/mobile: the consent storage · Requirements: MOBILE-54 · Commit: 6710047
- [x] T5 — apps/mobile: the consent mode setting, its resolver and the SDK options of each mode, the opt-in at launch, privacy defaults under every mode · Requirements: MOBILE-50, MOBILE-52, MOBILE-53 · Commit: 5df5de9
- [x] T6 — apps/mobile: the PostHog consent adapter and the composition root, exported from the observability barrel · Requirements: MOBILE-55 · Commit: 152ab84
- [x] T7 — docs: `docs/observability.md`, both `.env.example` files, the env table of `AGENTS.md`, the architecture docs and the global map · Requirements: none · Commit: a299302
- [x] T8 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-18-posthog-consent/` as the last commit · Requirements: none · Commit: 081ca06, then the archive commit

Follow-up after the archive, 2026-11-18: the merge of origin/main brought `local/dependency-seam`
and `verify:dependency-seams`, which refuse AsyncStorage outside its seam. The requirements below
were merged into the living specs directly.

- [x] T9 — packages/core: the key-value storage port and its in-memory storage, exported from the barrel · Requirements: CORE-28 · Commit: 7a2becd
- [x] T10 — apps/mobile: the key-value storage adapter over AsyncStorage, registered as its seam · Requirements: MOBILE-56 · Commit: 3e30e90
- [x] T11 — apps/mobile: the consent storage writes through the key-value storage port, and its tests and the consent and client tests replace `@/lib/storage` · Requirements: MOBILE-54, MOBILE-55 · Commit: e43870d
- [x] T12 — the living specs, the deltas, the docs and the global map; this report's follow-up section · Requirements: none · Commit: the follow-up records commit

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
