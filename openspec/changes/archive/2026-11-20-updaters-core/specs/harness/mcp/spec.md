# Delta: harness/mcp

> **Change:** `2026-11-20-updaters-core`

## ADDED Requirements

### Requirement: MCP-13 — `--check` says whether the block is current, and writes nothing

`pnpm mcp:docs --check` SHALL ask the registry as the update does, write nothing, and exit 0 when
the block it would render equals the doc's, 2 when a run would rewrite it, and 1 on any failure
the update mode exits 1 for; a pin bump the registry makes possible leaves the block current,
since the updater never writes the catalog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a block that is current

- **GIVEN** a block the updater wrote, and a registry that answers the same releases
- **WHEN** `pnpm mcp:docs --check` runs
- **THEN** it exits 0, says the doc is current, and the doc is byte-identical
- **Test:** `scripts/update-mcp-docs.test.mjs` › "--check over a current block exits 0 and writes nothing"

#### Scenario: a server released

- **GIVEN** a block that records an older latest release of one server
- **WHEN** `pnpm mcp:docs --check` runs
- **THEN** it exits 2, prints the server's line, its `bump:` line and that a run would rewrite the
  block, prints no
  `review:` line, and the doc is byte-identical, its modification time unchanged
- **Test:** `scripts/update-mcp-docs.test.mjs` › "--check over an out-of-date block exits 2 and writes nothing"

#### Scenario: the registry fails

- **GIVEN** a registry that fails for one server
- **WHEN** `pnpm mcp:docs --check` runs
- **THEN** it exits 1, names the server, and the doc is byte-identical
- **Test:** `scripts/update-mcp-docs.test.mjs` › "--check exits 1 and writes nothing when a registry request fails"

#### Scenario: the command as a process

- **GIVEN** a scratch tree whose block records an older latest release, and a stubbed registry
- **WHEN** `node scripts/update-mcp-docs.mjs --check` runs, then the same command without
  `--check`
- **THEN** the first exits 2 and leaves the doc as it was, the second exits 0 and rewrites it
- **Test:** `scripts/update-mcp-docs.test.mjs` › "the command exits 2 under --check and 0 without it over the same out-of-date doc"

### Requirement: MCP-14 — `--json` prints the run as one JSON document

`pnpm mcp:docs --json` SHALL print to stdout one JSON document and nothing else: the mode, the
status (`current`, `outdated`, `updated` or `failed`), one record per server with its package,
its pin, its latest release, the latest the block held before and its change, the `bump:`,
`waits:` and `major:` lines, the paths the run wrote or, under `--check`, would write, the
`review` paths and the problems; its exit code and what it writes are those of the same run without `--json`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an update that writes

- **GIVEN** a block the updater wrote, and a catalog whose pin of one server moved to its newer
  latest release
- **WHEN** `pnpm mcp:docs --json` runs
- **THEN** it exits 0, rewrites the block, and stdout parses as one document whose status is
  `updated`, whose released server says what its latest was, and whose `review` holds that
  server's docs
- **Test:** `scripts/update-mcp-docs.test.mjs` › "--json prints the run as one JSON document"

#### Scenario: a check

- **GIVEN** a block that records an older latest release of one server
- **WHEN** `pnpm mcp:docs --check --json` runs, then again with a registry that fails
- **THEN** the first exits 2, the doc is byte-identical, and the document's mode is `check`, its
  status `outdated` and its `bumps` the server's bump; the second exits 1 with status `failed`
- **Test:** `scripts/update-mcp-docs.test.mjs` › "--json with --check prints the plan and writes nothing"
