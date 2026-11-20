# Tasks: 2026-11-20-prune-leftovers

- [ ] T1 — the registry: `@app/i18n`, `@app/cloudflare` and `@app/tokens` go with a `remove-dep` of their capability, `@app/cloudflare` belongs to `web-next`; a repository test holds the registry after seven prunes · Requirements: TOOLING-17 · Commit: —
- [ ] T2 — the web app's `src/lib/auth/`: the neutral gateway adapter, its no-op gateway and the sign-in failures; the auth service, the providers and the tests that stand in for the gateway reach it, never `src/lib/supabase/` · Requirements: WEB-85, WEB-20, WEB-46, I18N-11 · Commit: —
- [ ] T3 — the mobile app's `src/lib/auth/`: the neutral gateway adapter and its no-op gateway; the root layout and its test reach it · Requirements: MOBILE-83, MOBILE-29, MOBILE-75 · Commit: —
- [ ] T4 — the `supabase` regions: both `.env.example`, the frozen exception of `scripts/verify-tests.mjs`, the global map and the Supabase part of each app spec; a repository test holds the `supabase` prune · Requirements: TOOLING-20 · Commit: —
- [ ] T5 — the `mobile-expo` prune: the `local/wrapped-import` rule cases judged by ui blocks of their own, the mobile rows of the global map in `mobile-expo` regions, the knip workspace dropped, no spec citing a mobile config file · Requirements: TOOLING-20 · Commit: —
- [ ] T6 — the `web-next` prune: the package and harness specs hold their web evidence in `web-next` regions or cite a package test; a repository test holds the `sentry`, `mobile-expo` and `web-next` prunes · Requirements: TOOLING-01, TOOLING-20, TOKENS-12, I18N-11 · Commit: —
- [ ] T7 — the docs a Sentry prune keeps stop naming it, and `docs/manifest.md` documents the regions and the gaps as they now stand · Requirements: none · Commit: —
- [ ] T8 — `verify-report.md`, then the archive · Requirements: every requirement above · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
