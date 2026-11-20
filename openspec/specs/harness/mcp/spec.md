# harness/mcp — living spec

> **Governs:** `.agents/contracts/mcp-servers.json`, `scripts/mcp-docs.detect.mjs`, `scripts/update-mcp-docs.mjs`, `scripts/verify-mcp-docs.mjs`
> **ID prefix:** `MCP`
> **Derived from:** `docs/mcp.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-20 at `2c66fde`

## Purpose

The MCP unit of the harness keeps the project's MCP servers pinned and launched directly
(decision 61), and their documentation current. It owns the catalog of servers the template can
configure, each pinned to an exact version and run as `node node_modules/<package>/<entry>`; the
updater that asks the npm registry for each server's releases, rewrites the generated block of
`docs/mcp.md` and reports the pin bumps a newer release makes possible; and the offline gate
that holds the catalog's entries and that block to the catalog and the project's .mcp.json.
Writing .mcp.json and the root devDependencies belongs to `/init`, applying a bump to whoever
reads the report, and the prose of the doc to whoever re-reads it when the updater names it; the
gate helpers of the other harness scripts are not part of this unit.

## Requirements

### Requirement: MCP-01 — One pinned, direct catalog entry per server

The MCP catalog `.agents/contracts/mcp-servers.json` SHALL hold one entry per MCP server, with
its name, the capability that selects it, its npm package, an exact `version` (never a range,
`latest` or a tag), the `entry` bin file as a relative path inside the package, the command
`node`, never `npx`, with args `node_modules/<package>/<entry>` followed by the server's own
arguments, and the repository docs that describe it, each of which exists.

**Evidence:** `.agents/contracts/mcp-servers.json:2`, `scripts/mcp-docs.detect.mjs:110-165`,
`scripts/mcp-docs.detect.mjs:167-185`, `scripts/mcp-docs.detect.mjs:189-228`,
`scripts/verify-mcp-docs.mjs:55-63`

#### Scenario: an entry runs npx

- **GIVEN** a catalog entry whose command is `npx -y expo-mcp`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the direct `node` command it owes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that runs npx is refused"

#### Scenario: an entry has no version

- **GIVEN** a catalog entry without `version`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the missing field
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no version is refused"

#### Scenario: a version that is not exact

- **GIVEN** three catalog entries pinned to `^0.2.4`, `latest` and `next`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails once per entry, naming each value
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog version that is a range, latest or a tag is refused"

#### Scenario: the first argument does not name the entry

- **GIVEN** a catalog entry whose first argument is another file of its package
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the path its first argument owes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose first argument does not name its entry is refused"

#### Scenario: an entry that leaves its package

- **GIVEN** a catalog entry whose `entry` is `../other/index.js`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose entry leaves its package is refused"

#### Scenario: a command other than node

- **GIVEN** a catalog entry whose command is `pnpm`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and `node`
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog npm server whose command is not node is refused"

#### Scenario: an entry passes its own arguments to the server

- **GIVEN** a catalog entry that runs `node node_modules/shadcn/dist/index.js mcp`, listed by the
  block
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with server args after its entry passes"

#### Scenario: an entry names a doc that is gone

- **GIVEN** a catalog entry whose docs name a file the repository does not have
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the path
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog doc that does not exist is refused"

#### Scenario: a malformed catalog

- **GIVEN** a catalog that is missing, is not JSON or has no `servers` array, or an entry that is
  not an object, lacks a field, names a package that is not an npm name, has no docs list or
  repeats a name
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming what is wrong
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a missing catalog is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog that is not JSON is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog with no servers array is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that is not an object is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry without its fields is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog package that is not an npm name is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no docs list is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a server listed twice in the catalog is refused"

### Requirement: MCP-02 — Every server the project can run is listed

`pnpm mcp:docs` SHALL list every server of the catalog and of the project's .mcp.json when one
exists, a server only in .mcp.json under the capability `project`, with the npm package its
command runs through `npx` or `node node_modules/<package>/…`, and a server whose command is
neither as `not on npm`, with no version and no registry request.

**Evidence:** `scripts/mcp-docs.detect.mjs:85-108`, `scripts/mcp-docs.detect.mjs:270-307`,
`scripts/mcp-docs.detect.mjs:315-330`, `scripts/update-mcp-docs.mjs:236`

#### Scenario: a project adds a server of its own

- **GIVEN** a .mcp.json that runs a server the catalog does not list, through `npx`
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the block lists it with the capability `project`, its package and its latest version
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server outside the catalog is listed"

#### Scenario: a project server launched from node_modules

- **GIVEN** a .mcp.json server that runs `node node_modules/@acme/mcp-server/dist/cli.js`
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the block lists it under `project` with the package `@acme/mcp-server`, its command and
  its latest version, and no devDependency
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server launched from node_modules is listed with its package"

#### Scenario: a server that is not an npm package

- **GIVEN** a .mcp.json server whose command runs a local script, or a remote URL
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the block lists it as `not on npm`, with no version, and the registry is never asked
  for it
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a non-npm command is listed as not on npm"

### Requirement: MCP-03 — A changed pin rewrites the block and names the docs to review

`pnpm mcp:docs` SHALL ask the npm registry for each package's `latest` dist-tag and its publish
time, rewrite only the generated block of `docs/mcp.md`, which shows per server its devDependency
line `"<package>": "<version>"`, its direct command and its latest release, and print each
catalog doc of a server whose pinned version changed, or that is new in the block, as
`review: <path>`, never rewriting that doc.

**Evidence:** `scripts/update-mcp-docs.mjs:133-147`, `scripts/update-mcp-docs.mjs:273-285`,
`scripts/mcp-docs.detect.mjs:315-330`, `scripts/mcp-docs.detect.mjs:433-445`,
`scripts/mcp-docs.detect.mjs:483-484`

#### Scenario: one pin changed

- **GIVEN** a block the updater wrote, then a catalog whose pin of one server moved to a new
  version and entry
- **WHEN** `pnpm mcp:docs` runs
- **THEN** that server's row shows the new devDependency line and command, the other row is
  unchanged, the doc outside the block and the catalog docs are byte-identical, and the output
  holds `review: <path>` for that server's docs only
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a changed pin rewrites its row and prints the review paths"

### Requirement: MCP-04 — Nothing new, nothing written

`pnpm mcp:docs` SHALL leave `docs/mcp.md` unwritten when every server's pinned version, command,
latest version, package and capability match the block, whatever the date of the run.

**Evidence:** `scripts/mcp-docs.detect.mjs:449-451`, `scripts/mcp-docs.detect.mjs:485`,
`scripts/update-mcp-docs.mjs:322-326`

#### Scenario: a second run on a later day

- **GIVEN** a block the updater wrote, and a registry that still answers the same versions
- **WHEN** `pnpm mcp:docs` runs on a later day
- **THEN** the doc is not written, and no review path is printed
- **Test:** `scripts/update-mcp-docs.test.mjs` › "an unchanged version writes nothing"

### Requirement: MCP-05 — A failure writes nothing

`pnpm mcp:docs` SHALL exit non-zero and leave `docs/mcp.md` byte-identical when a registry
request fails or the doc has no generated block, naming the server or the missing marker.

**Evidence:** `scripts/update-mcp-docs.mjs:229-233`, `scripts/update-mcp-docs.mjs:296-301`,
`scripts/update-mcp-docs.mjs:316-319`

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

`pnpm verify:mcp-docs` SHALL fail when the servers, packages, capabilities, pinned versions or
commands of the generated block differ from those of the catalog plus .mcp.json, and when
.mcp.json does not parse or has no `mcpServers` object.

**Evidence:** `scripts/verify-mcp-docs.mjs:46-51`, `scripts/verify-mcp-docs.mjs:65-93`,
`scripts/verify-mcp-docs.mjs:135-155`, `scripts/mcp-docs.detect.mjs:233-262`

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

#### Scenario: a pin or a command changed

- **GIVEN** a catalog entry whose version, or whose entry and so its command, differs from its
  block row
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the server, the block's value and the catalog's
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a block whose pinned version differs from the catalog fails"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a block whose command differs from the catalog fails"

#### Scenario: a .mcp.json the gate cannot read

- **GIVEN** a .mcp.json that is not JSON, or that has no `mcpServers` object
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming .mcp.json
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json that is not JSON is refused"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json with no mcpServers object is refused"

#### Scenario: the gate as a process

- **GIVEN** a scratch tree whose catalog lists a server the block does not
- **WHEN** `node scripts/verify-mcp-docs.mjs --root <tree>` runs
- **THEN** it exits 1 and prints the server's name
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "the gate exits 1 and names the server the block is missing"

### Requirement: MCP-07 — The block is only what the updater wrote

`pnpm verify:mcp-docs` SHALL fail when the generated block differs from what the updater wrote:
a value or a line edited by hand, a digest that does not match the block's lines, or a marker that
is gone.

**Evidence:** `scripts/verify-mcp-docs.mjs:95-117`, `scripts/mcp-docs.detect.mjs:309-313`,
`scripts/mcp-docs.detect.mjs:351-358`

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

### Requirement: MCP-08 — The gate is offline and never judges a latest version

`pnpm verify:mcp-docs` SHALL decide from the repository's files alone: it makes no network
request, never judges whether a pin is the latest release, and passes whatever latest versions
the block records.

**Evidence:** `scripts/verify-mcp-docs.mjs:27-40`, `scripts/mcp-docs.detect.mjs:63`,
`scripts/mcp-docs.detect.mjs:405-406`

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

### Requirement: MCP-09 — A newer release is a planned pin bump

`pnpm mcp:docs` SHALL report, for each catalog server, the highest stable release of its pinned
major that the `latest` dist-tag covers and that was published at least 1,440 minutes before the
run, as `bump:` with the change of `version` and `entry` it plans; report a newer release of that
major still younger than 1,440 minutes as `waits:` with the time it becomes eligible; report a
newer major as `major:`, never as a bump; and never write the catalog.

**Evidence:** `scripts/update-mcp-docs.mjs:62-66`, `scripts/update-mcp-docs.mjs:92-131`,
`scripts/update-mcp-docs.mjs:149-203`, `scripts/update-mcp-docs.mjs:205-224`

#### Scenario: a release old enough to pin

- **GIVEN** a catalog that pins `0.3.0`, and a registry whose `latest` is `0.3.1`, published two
  days before the run, with another bin file
- **WHEN** `pnpm mcp:docs` runs
- **THEN** it prints the bump from `0.3.0` to `0.3.1` with the old and the new entry, the catalog
  is byte-identical, and no review path is printed
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a newer release is reported as a pin bump once it is 1,440 minutes old"

#### Scenario: a release younger than 1,440 minutes

- **GIVEN** a registry whose `latest`, `0.3.2`, was published an hour before the run, and whose
  `0.3.1` was published two days before it
- **WHEN** `pnpm mcp:docs` runs
- **THEN** it prints the bump to `0.3.1`, never to `0.3.2`, and says `0.3.2` waits until 1,440
  minutes after its publish time
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a release younger than 1,440 minutes waits"

#### Scenario: a new major

- **GIVEN** a catalog that pins `0.3.0`, and a registry whose `latest` is `1.0.0`, old enough
- **WHEN** `pnpm mcp:docs` runs
- **THEN** it prints `1.0.0` as a new major to bump by hand, and no bump line
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a new major is never proposed as a bump"

#### Scenario: the registry document

- **GIVEN** a registry document with a `latest` dist-tag, the publish time of each version and
  each version's `bin`, as a string or as an object
- **WHEN** the updater's registry reader reads it
- **THEN** it returns the latest version with its publish time, and each release with its entry
- **Test:** `scripts/update-mcp-docs.test.mjs` › "the registry reader takes the latest dist-tag and each release's bin entry"
