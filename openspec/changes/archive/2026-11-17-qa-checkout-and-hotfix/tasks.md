# Tasks: 2026-11-17-qa-checkout-and-hotfix

- [x] T1 — QA's detached checkout and unforced push: `scripts/verify-skills.mjs` holds `qa-ticket` § Step 2 to `--detach` and § Step 5 to `git push origin HEAD:<branch>`, with a case per rule in `scripts/verify-skills.test.mjs`; `qa-ticket` Steps 2 and 5, `dev-ticket` § Changes requested, and the `verify:skills:test` row of `docs/harness.md` · Requirements: TICKET-23 · Commit: dbb50bb
- [x] T2 — A hotfix ships only as its release: `scripts/verify-skills.mjs` holds `qa-ticket` § Step 6, `refine-ticket` § Group a release and `ticket-flow` § Messages to `<id> ready to merge, hotfix` and `release-ticket` § Hotfix to QA leaving it at Ready to merge, with a case per rule; `qa-ticket` Steps 6 and 7, its CONTRACT and description; `release-ticket` Step 1, § Hotfix and CONTRACT; `refine-ticket` Step 6, § Group a release and description; `ticket-flow`'s states, messages, roles, rule 4, § The architect dispatches, § Ready to merge and § Release stage; `release.template.md`; the registry entries and the `docs/harness.md` row · Requirements: TICKET-11, TICKET-15, TICKET-20, TICKET-24 · Commit: 3263af0
- [x] T3 — `verify-report.md`, then the archive: the deltas merged into `openspec/specs/harness/ticket-flow/spec.md`, the evidence lines this change moved refreshed, and the folder moved to `openspec/changes/archive/2026-11-17-qa-checkout-and-hotfix/` · Requirements: TICKET-11, TICKET-15, TICKET-20, TICKET-23, TICKET-24 · Commit: d61f44a, and the archive that moves this folder

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
