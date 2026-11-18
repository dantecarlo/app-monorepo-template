# Tasks: 2026-11-18-posthog-deferred-client

- [ ] T1 — apps/web: the deferred client and its bounded queue; `posthog-js` loaded by a dynamic import only when it may run; the observability adapter calls PostHog through it · Requirements: WEB-50, WEB-58 · Commit: —
- [ ] T2 — apps/web: `opt-in` loads the SDK only after a grant, recorded for the next visit; the consent API loads on a grant, and a revoke stops the client · Requirements: WEB-56, WEB-57 · Commit: —
- [ ] T3 — apps/mobile: the client constructed only when it may run, and the observability adapter dropping every call while there is none · Requirements: MOBILE-49, MOBILE-53, MOBILE-57 · Commit: —
- [ ] T4 — apps/mobile: the consent API constructs the client on a grant, and a revoke drops it · Requirements: MOBILE-55 · Commit: —
- [ ] T5 — docs: `docs/observability.md` and the architecture docs of both apps · Requirements: none · Commit: —
- [ ] T6 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-18-posthog-deferred-client/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
