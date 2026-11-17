# Tasks: 2026-11-17-posthog-observability

- [x] T1 — packages/tooling: the observability port contract suite and its entry point · Requirements: TOOLING-01, TOOLING-15 · Commit: ac593af
- [x] T2 — packages/core: the no-op and console adapters run the port contract · Requirements: CORE-15, CORE-26 · Commit: 1567607
- [x] T3 — apps/web: the PostHog client and its URL scrub, the PostHog adapter, the composition root bound to it, the barrel without a provider, both adapters running the port contract · Requirements: WEB-29, WEB-48, WEB-49, WEB-50, WEB-51, WEB-52, WEB-54 · Commit: 74e97f9
- [x] T4 — apps/mobile: the PostHog client, the PostHog adapter, the composition root bound to it, the barrel without a provider, both adapters running the port contract · Requirements: MOBILE-47, MOBILE-48, MOBILE-49, MOBILE-50, MOBILE-51 · Commit: 2bc270e
- [x] T5 — packages/tooling and the manifest: the prune boundary check, the `sentry` capability, `web-next` claiming its root files by name; `next.config.ts` applying every `next-<capability>.config.ts`, the Sentry wrapper in `next-sentry.config.ts` · Requirements: TOOLING-16, WEB-53 · Commit: 6e42e5c
- [x] T6 — docs and skills: `docs/observability.md` with PostHog as the default and the "Adding Sentry" guide, the env tables, the architecture docs, the global map, `docs/manifest.md`, the security skill · Requirements: none · Commit: c6ad4f2
- [x] T7 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-17-posthog-observability/` as the last commit · Requirements: none · Commit: 276489d

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
