# harness/mcp — living spec

> **Governs:** `.agents/contracts/mcp-servers.json`, `scripts/mcp-docs.detect.mjs`, `scripts/update-mcp-docs.mjs`, `scripts/verify-mcp-docs.mjs`
> **ID prefix:** `MCP`
> **Derived from:** `docs/mcp.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-15 at `b88d592`

## Purpose

The MCP unit of the harness keeps the documentation of the project's MCP servers current while
their commands stay unpinned (decision 55). It owns the catalog of servers the template can
configure, the updater that asks the npm registry for each server's latest release and rewrites
the generated block of `docs/mcp.md`, and the offline gate that holds that block to the catalog
and the project's .mcp.json. Writing .mcp.json belongs to `/init`, and the prose of the doc to
whoever re-reads it when the updater names it; the gate helpers of the other harness scripts are
not part of this unit.

## Requirements

### Requirement: MCP-01 — One unpinned catalog entry per server

The MCP catalog `.agents/contracts/mcp-servers.json` SHALL hold one entry per MCP server, with
its name, the capability that selects it, its npm package, its command and args, unpinned as
`npx -y <package> [server args...]` with the package the first argument after `-y`, and the
repository docs that describe it, each of which exists.

**Evidence:** `.agents/contracts/mcp-servers.json:3`, `scripts/mcp-docs.detect.mjs:73-78`,
`scripts/mcp-docs.detect.mjs:80-110`, `scripts/verify-mcp-docs.mjs:46-54`

#### Scenario: an entry pins its version

- **GIVEN** a catalog entry whose args run `expo-mcp@0.2.0`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the unpinned command it owes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that pins its version is refused"

#### Scenario: an entry passes its own arguments to the server

- **GIVEN** a catalog entry that runs `npx -y shadcn mcp`, listed by the block
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with server args after its package passes"

#### Scenario: an entry pins its version before its arguments

- **GIVEN** a catalog entry that runs `npx -y shadcn@4.23.0 mcp`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the command it runs
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that pins its version before its server args is refused"

#### Scenario: an entry runs no package

- **GIVEN** a catalog entry for `shadcn` whose args are `-y mcp`, so no package follows `-y`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the unpinned command it owes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that runs no package is refused"

#### Scenario: an entry names a doc that is gone

- **GIVEN** a catalog entry whose docs name a file the repository does not have
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the path
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog doc that does not exist is refused"

### Requirement: MCP-02 — Every server the project can run is listed

`pnpm mcp:docs` SHALL list every server of the catalog and of the project's .mcp.json when one
exists, a server only in .mcp.json under the capability `project`, and a server whose command
is not `npx` with an npm package as `not on npm`, with no version and no registry request.

**Evidence:** `scripts/mcp-docs.detect.mjs:59-69`, `scripts/mcp-docs.detect.mjs:188-208`,
`scripts/mcp-docs.detect.mjs:216-223`, `scripts/update-mcp-docs.mjs:109`

#### Scenario: a project adds a server of its own

- **GIVEN** a .mcp.json that runs a server the catalog does not list, through `npx`
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the block lists it with the capability `project`, its package and its latest version
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server outside the catalog is listed"

#### Scenario: a server that is not an npm package

- **GIVEN** a .mcp.json server whose command is not `npx`
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the block lists it as `not on npm`, with no version, and the registry is never asked
  for it
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a non-npm command is listed as not on npm"

### Requirement: MCP-03 — A release rewrites the block and names the docs to review

`pnpm mcp:docs` SHALL ask the npm registry for each package's `latest` dist-tag and its publish
time, rewrite only the generated block of `docs/mcp.md`, and print each catalog doc of a server
whose version changed as `review: <path>`, never rewriting that doc.

**Evidence:** `scripts/update-mcp-docs.mjs:82-98`, `scripts/update-mcp-docs.mjs:146-155`,
`scripts/mcp-docs.detect.mjs:304-316`, `scripts/mcp-docs.detect.mjs:344-351`

#### Scenario: one server released

- **GIVEN** a block that records an older version of one server and the latest of another
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the released server's row carries the new version, its publish date and the run's
  date, the other row is unchanged, the doc outside the block and the catalog docs are
  byte-identical, and the output holds `review: <path>` for the released server's docs only
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a new version rewrites the block and prints the review paths"

### Requirement: MCP-04 — Nothing new, nothing written

`pnpm mcp:docs` SHALL leave `docs/mcp.md` unwritten when every server's version, package and
capability match the block, whatever the date of the run.

**Evidence:** `scripts/mcp-docs.detect.mjs:320-324`, `scripts/mcp-docs.detect.mjs:352`,
`scripts/update-mcp-docs.mjs:191-194`

#### Scenario: a second run on a later day

- **GIVEN** a block the updater wrote, and a registry that still answers the same versions
- **WHEN** `pnpm mcp:docs` runs on a later day
- **THEN** the doc is not written, and no review path is printed
- **Test:** `scripts/update-mcp-docs.test.mjs` › "an unchanged version writes nothing"

### Requirement: MCP-05 — A failure writes nothing

`pnpm mcp:docs` SHALL exit non-zero and leave `docs/mcp.md` byte-identical when a registry
request fails or the doc has no generated block, naming the server or the missing marker.

**Evidence:** `scripts/update-mcp-docs.mjs:102-106`, `scripts/update-mcp-docs.mjs:166-171`,
`scripts/update-mcp-docs.mjs:184-187`

#### Scenario: the registry fails for one server

- **GIVEN** a registry that answers one server and fails for another
- **WHEN** `pnpm mcp:docs` runs
- **THEN** it exits non-zero, names the server whose request failed, and the doc is
  byte-identical
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a registry failure leaves the doc byte-identical and exits non-zero"

#### Scenario: the doc has lost its markers

- **GIVEN** a `docs/mcp.md` with no generated block
- **WHEN** `node scripts/update-mcp-docs.mjs` runs as a process
- **THEN** it exits 1, names the missing marker, asks the registry nothing, and the doc is
  byte-identical
- **Test:** `scripts/update-mcp-docs.test.mjs` › "the command exits 1 and requests nothing when the doc has no generated block"

### Requirement: MCP-06 — The block lists what the catalog and .mcp.json hold

`pnpm verify:mcp-docs` SHALL fail when the servers, packages or capabilities of the generated
block differ from those of the catalog plus .mcp.json.

**Evidence:** `scripts/verify-mcp-docs.mjs:56-87`, `scripts/verify-mcp-docs.mjs:125-144`

#### Scenario: a server added to the catalog

- **GIVEN** a catalog server the block does not list
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the server and `pnpm mcp:docs`
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog server missing from the block fails"

#### Scenario: a server removed from the catalog

- **GIVEN** a block row for a server neither the catalog nor .mcp.json lists
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the server
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a block server the catalog no longer has fails"

#### Scenario: a server only in .mcp.json

- **GIVEN** a .mcp.json server the block does not list
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the server
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server missing from the block fails"

#### Scenario: a .mcp.json server the block already lists

- **GIVEN** a .mcp.json with an npm server and a local script, both listed by the block the
  updater wrote, under the capability `project`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server the block lists passes, on npm or not"

#### Scenario: a package or a capability changed

- **GIVEN** a catalog entry whose package, or whose capability, differs from its block row
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the server, the block's value and the catalog's
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a package that differs from the catalog fails"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a capability that differs from the catalog fails"

#### Scenario: the gate as a process

- **GIVEN** a scratch tree whose catalog lists a server the block does not
- **WHEN** `node scripts/verify-mcp-docs.mjs --root <tree>` runs
- **THEN** it exits 1 and prints the server's name
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "the gate exits 1 and names the server the block is missing"

### Requirement: MCP-07 — The block is only what the updater wrote

`pnpm verify:mcp-docs` SHALL fail when the generated block differs from what the updater wrote:
a value or a line edited by hand, a digest that does not match the block's lines, or a marker that
is gone.

**Evidence:** `scripts/verify-mcp-docs.mjs:89-111`, `scripts/mcp-docs.detect.mjs:210-214`,
`scripts/mcp-docs.detect.mjs:244-251`

#### Scenario: a version typed by hand

- **GIVEN** a block whose version cell was changed by hand, its digest untouched
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, saying the block was edited by hand and that `pnpm mcp:docs` rewrites it
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a version edited by hand fails"

#### Scenario: a note typed inside the block

- **GIVEN** a block with a line added by hand between its markers
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, saying the block was edited by hand
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a line added by hand inside the block fails"

#### Scenario: a block the updater never wrote

- **GIVEN** a block whose end marker carries no digest, as the doc holds before its first run
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, saying `pnpm mcp:docs` never wrote it
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a block the updater never wrote fails"

#### Scenario: the markers are gone

- **GIVEN** a `docs/mcp.md` with no generated block
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the missing marker
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a doc without the generated block fails"

### Requirement: MCP-08 — The gate is offline and never judges a version

`pnpm verify:mcp-docs` SHALL decide from the repository's files alone: it makes no network
request and passes whatever versions the block records.

**Evidence:** `scripts/verify-mcp-docs.mjs:25-38`, `scripts/mcp-docs.detect.mjs:45`,
`scripts/mcp-docs.detect.mjs:276-277`

#### Scenario: an old version the updater wrote

- **GIVEN** a block the updater wrote with versions the registry has long replaced
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a block the updater wrote passes, whatever versions it holds"

#### Scenario: a Windows checkout

- **GIVEN** a block the updater wrote, checked out with CRLF line endings
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes: the digest is taken over the lines, not their endings
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a block checked out with CRLF line endings passes"

#### Scenario: no request leaves the gate

- **GIVEN** a `fetch` that records every call
- **WHEN** the gate reads and judges a tree
- **THEN** `fetch` was never called
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "the gate makes no network request"

#### Scenario: a green states what it judged

- **GIVEN** a scratch tree whose block the updater wrote
- **WHEN** `node scripts/verify-mcp-docs.mjs --root <tree>` runs
- **THEN** it exits 0 and prints how many servers it compared with how many rows
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "the gate exits 0 over a block the updater wrote and states what it judged"
