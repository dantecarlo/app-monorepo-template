# Tasks: 2026-11-19-capability-prune-claims

- [ ] T1 — F52: an `owner` on every entry of `.agents/contracts/dependencies.json`; `verify:dependency-seams` accepts it and refuses one that is not text; `verify:manifest:coverage` fails an entry with no owner or with an owner the manifest does not declare · Requirements: SEAM-01 · Commit: —
- [ ] T2 — F52: `prune-boundary` drops the entries the pruned capability owns and lists the registry findings the prune leaves; the `supabase` capability removes `@app/supabase` and `@supabase/*` from the apps' `package.json` · Requirements: TOOLING-17 · Commit: —
- [ ] T3 — Q2: the region grammar in `scripts/manifest.mjs`; `verify:manifest:coverage` fails a region with an unknown owner or unbalanced markers; `prune-boundary` drops the pruned capability's regions before it judges a kept file · Requirements: TOOLING-20 · Commit: —
- [ ] T4 — F49: `prune-boundary` lists a relative path string to a pruned file and a `.env.example` key only pruned files read; the `sentry` regions of both `.env.example`, `apps/mobile/vitest.config.ts` and `pnpm-workspace.yaml` · Requirements: TOOLING-19, TOOLING-20 · Commit: —
- [ ] T5 — F49: `prune-boundary` lists a kept spec that cites a file the prune deletes; seen red on the web and mobile specs, green at the archive, which moves their Sentry requirements · Requirements: TOOLING-18 · Commit: —
- [ ] T6 — F49: `README.md`, `docs/infrastructure.md`, ADR 0001 and ADR 0002 stop naming Sentry as a provider; the Sentry rows of `docs/maps/global-map.md` move into a `sentry` region; `docs/manifest.md` documents the regions, the registry owners and the known gaps; `openspec/README.md` § 2.1 gains the new spec's row · Requirements: none · Commit: —
- [ ] T7 — `verify-report.md`, then the archive: the deltas merged, `openspec/specs/capabilities/sentry/spec.md` written and claimed by the `sentry` capability, and the folder moved to `openspec/changes/archive/2026-11-19-capability-prune-claims/` · Requirements: SENTRY-01, SENTRY-02, SENTRY-03, SENTRY-04, SENTRY-05, SENTRY-06, WEB-29, WEB-30, WEB-53, WEB-54, MOBILE-26, MOBILE-27, MOBILE-51 · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
