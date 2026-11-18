# Tasks: 2026-11-18-posthog-deferred-client

- [x] T1 — apps/web: the deferred client and its bounded queue; `posthog-js` loaded by a dynamic import only when it may run; `opt-in` loads it only after a grant, recorded for the next visit; the observability adapter calls PostHog through the deferred client, and the consent API loads it on a grant and stops it on a revoke · Requirements: WEB-50, WEB-56, WEB-57, WEB-62 · Commit: 708e935
- [x] T2 — apps/mobile: the client constructed only when it may run; the observability adapter drops every call while there is none; the consent API constructs it on a grant, and a revoke drops it · Requirements: MOBILE-49, MOBILE-53, MOBILE-55, MOBILE-60 · Commit: 3d6ffa2
- [x] T3 — docs: `docs/observability.md` and the architecture docs of both apps · Requirements: none · Commit: 96554ef
- [x] T4 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-18-posthog-deferred-client/` as the last commit · Requirements: none · Commit: 624a400, then the archive commit
- [x] T5 — the native review's findings: a web revoke stops the client before it waits for the load, and the status reads granted after a grant whose record the browser blocks; mobile tests pin a revoke during the launch restore and the pre-grant drop of every call · Requirements: WEB-57, WEB-62, MOBILE-55, MOBILE-60 · Commit: fbdfd6f, 15a7106

The web tasks of the proposal, T1 and T2, are one task here, and so are the mobile ones: the
client's new shape and the consent API that calls it compile only together.

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
