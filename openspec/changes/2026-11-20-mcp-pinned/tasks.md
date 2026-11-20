# Tasks: 2026-11-20-mcp-pinned

- [ ] T1 — the catalog pins each server's `version` and `entry` and runs it with `node node_modules/<package>/<entry>`; `scripts/mcp-docs.detect.mjs` refuses `npx`, a non-exact or missing version, an entry outside its package or not named by the first argument, and a command other than `node`, with a test per rule and per base check · Requirements: MCP-01 · Commit: —
- [ ] T2 — the generated block shows the devDependency line and the direct command; `pnpm verify:mcp-docs` compares both; `pnpm mcp:docs` reports pin bumps, waits and majors, prints review paths for a changed pin, reads a `node node_modules/…` server's package, and its registry reader takes each release's bin; the block refreshed from `npm view` data · Requirements: MCP-02, MCP-03, MCP-04, MCP-06, MCP-08, MCP-09 · Commit: —
- [ ] T3 — `docs/mcp.md` § "Why the commands are pinned and direct" and its prose, the `AGENTS.md` key-docs row, and decision 55 superseded by a new decision with its parity-ledger row in `docs/INIT_AND_HARNESS_PLAN.md` · Requirements: none · Commit: —
- [ ] T4 — `verify-report.md`, then the archive into `openspec/specs/harness/mcp/spec.md` and the folder moved to `openspec/changes/archive/2026-11-20-mcp-pinned/` · Requirements: MCP-01, MCP-02, MCP-03, MCP-04, MCP-06, MCP-08, MCP-09 · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
