# Tasks: 2026-11-15-mcp-docs-updater

- [ ] T1 — `.agents/contracts/mcp-servers.json` with Certifipago's five servers, `scripts/mcp-docs.detect.mjs`, `pnpm mcp:docs` (`scripts/update-mcp-docs.mjs`) with its test, and `docs/mcp.md` with the block from one real registry run · Requirements: MCP-02, MCP-03, MCP-04, MCP-05 · Commit: —
- [ ] T2 — `pnpm verify:mcp-docs` (`scripts/verify-mcp-docs.mjs`) with its test, both run by `validate` · Requirements: MCP-01, MCP-06, MCP-07, MCP-08 · Commit: —
- [ ] T3 — `docs/harness.md`, `docs/maps/global-map.md` and the "Key docs" table of `AGENTS.md` · Requirements: none · Commit: —
- [ ] T4 — `verify-report.md`, then the archive: the living spec `openspec/specs/harness/mcp/spec.md`, its row in `openspec/README.md` § 2.1, and the folder moved to `openspec/changes/archive/2026-11-15-mcp-docs-updater/` · Requirements: MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, MCP-06, MCP-07, MCP-08 · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
