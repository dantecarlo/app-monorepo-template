# Verify report: 2026-11-20-mcp-pinned

> **Verified:** 2026-11-20 at `8e7555b`

## Scenarios

Every test ran green at `8e7555b`: `pnpm verify:mcp-docs:test` 36 of 36 (20 before the change)
and `pnpm mcp:docs:test` 11 of 11 (6 before the change).

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| MCP-01 | an entry runs npx | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that runs npx is refused" | green |
| MCP-01 | an entry has no version | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no version is refused" | green |
| MCP-01 | a version that is not exact | `scripts/verify-mcp-docs.test.mjs` › "a catalog version that is a range, latest or a tag is refused" | green |
| MCP-01 | the first argument does not name the entry | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose first argument does not name its entry is refused" | green |
| MCP-01 | an entry that leaves its package | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose entry leaves its package is refused" | green |
| MCP-01 | a command other than node | `scripts/verify-mcp-docs.test.mjs` › "a catalog npm server whose command is not node is refused" | green |
| MCP-01 | an entry passes its own arguments to the server | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with server args after its entry passes" | green |
| MCP-01 | an entry names a doc that is gone | `scripts/verify-mcp-docs.test.mjs` › "a catalog doc that does not exist is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a missing catalog is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog that is not JSON is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog with no servers array is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that is not an object is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry without its fields is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog package that is not an npm name is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no docs list is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a server listed twice in the catalog is refused" | green |
| MCP-02 | a project adds a server of its own | `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server outside the catalog is listed" | green |
| MCP-02 | a project server launched from node_modules | `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server launched from node_modules is listed with its package" | green |
| MCP-02 | a server that is not an npm package | `scripts/update-mcp-docs.test.mjs` › "a non-npm command is listed as not on npm" | green |
| MCP-03 | one pin changed | `scripts/update-mcp-docs.test.mjs` › "a changed pin rewrites its row and prints the review paths" | green |
| MCP-04 | a second run on a later day | `scripts/update-mcp-docs.test.mjs` › "an unchanged version writes nothing" | green |
| MCP-06 | a server added to the catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog server missing from the block fails" | green |
| MCP-06 | a server removed from the catalog | `scripts/verify-mcp-docs.test.mjs` › "a block server the catalog no longer has fails" | green |
| MCP-06 | a server only in .mcp.json | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server missing from the block fails" | green |
| MCP-06 | a .mcp.json server the block already lists | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server the block lists passes, on npm or not" | green |
| MCP-06 | a package or a capability changed | `scripts/verify-mcp-docs.test.mjs` › "a package that differs from the catalog fails" | green |
| MCP-06 | a package or a capability changed | `scripts/verify-mcp-docs.test.mjs` › "a capability that differs from the catalog fails" | green |
| MCP-06 | a pin or a command changed | `scripts/verify-mcp-docs.test.mjs` › "a block whose pinned version differs from the catalog fails" | green |
| MCP-06 | a pin or a command changed | `scripts/verify-mcp-docs.test.mjs` › "a block whose command differs from the catalog fails" | green |
| MCP-06 | a .mcp.json the gate cannot read | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json that is not JSON is refused" | green |
| MCP-06 | a .mcp.json the gate cannot read | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json with no mcpServers object is refused" | green |
| MCP-06 | the gate as a process | `scripts/verify-mcp-docs.test.mjs` › "the gate exits 1 and names the server the block is missing" | green |
| MCP-08 | an old version the updater wrote | `scripts/verify-mcp-docs.test.mjs` › "a block the updater wrote passes, whatever versions it holds" | green |
| MCP-08 | a Windows checkout | `scripts/verify-mcp-docs.test.mjs` › "a block checked out with CRLF line endings passes" | green |
| MCP-08 | no request leaves the gate | `scripts/verify-mcp-docs.test.mjs` › "the gate makes no network request" | green |
| MCP-08 | a green states what it judged | `scripts/verify-mcp-docs.test.mjs` › "the gate exits 0 over a block the updater wrote and states what it judged" | green |
| MCP-09 | a release old enough to pin | `scripts/update-mcp-docs.test.mjs` › "a newer release is reported as a pin bump once it is 1,440 minutes old" | green |
| MCP-09 | a release younger than 1,440 minutes | `scripts/update-mcp-docs.test.mjs` › "a release younger than 1,440 minutes waits" | green |
| MCP-09 | a new major | `scripts/update-mcp-docs.test.mjs` › "a new major is never proposed as a bump" | green |
| MCP-09 | the registry document | `scripts/update-mcp-docs.test.mjs` › "the registry reader takes the latest dist-tag and each release's bin entry" | green |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: not run by this change's writer, whose brief leaves the
  full gate to the parent session on a machine short of memory; the parent runs it over the
  archive's tree.
- Run at `8e7555b`, each exit 0: `pnpm verify:mcp-docs:test`, `pnpm verify:mcp-docs`,
  `pnpm mcp:docs:test`, `pnpm verify:english`, `pnpm codex-budget:test`,
  `pnpm verify:instruction-entry`, `pnpm verify:manifest:coverage`, `pnpm knip`, and `eslint`
  over the five changed scripts.
- `pnpm verify:specs` at `8e7555b`: exit 1, five problems, each a test title the living spec
  still cites and this change renamed or removed (MCP-01's four npx scenarios and MCP-03's
  release scenario). The archive replaces those requirements; it exits 0 after it.

## Not verified

- A live registry run: the brief allowed only `npm view` reads of the five packages, so the block
  was refreshed through the updater's injected fetcher from `npm view <package> time --json`,
  `dist-tags` and `<package>@<version> bin` saved on 2026-11-20, and `fetchFromRegistry` is
  proven only against an injected `request` with a registry-shaped document.
- That each pinned server starts from `node_modules`: nothing was installed, so no server ran
  from its entry; the entries are the `bin` the registry records for each pinned version.
- `docs/harness.md:161` still says the gate "never judges a version", outside this change's edit
  surfaces; and the Template → Certifipago parity-ledger row of decision 44
  (`docs/INIT_AND_HARNESS_PLAN.md`, carried by C7) still calls pinning the owner's call, a row the
  brief did not give this change to edit.
