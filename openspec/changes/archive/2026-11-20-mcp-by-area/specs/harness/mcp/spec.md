# Delta: harness/mcp

> **Change:** `2026-11-20-mcp-by-area`

The living spec's header gains `scripts/mcp/launch.mjs` in its `Governs` line at the archive.

## ADDED Requirements

### Requirement: MCP-10 — A server starts only in a session of its area

`scripts/mcp/launch.mjs <name>` SHALL start the catalog server `<name>` when `ATL_MCP_AREA` is
unset or empty, or when that comma list (`web`, `mobile`, `web,mobile`, `none`) names the
server's area; otherwise it SHALL exit 0 at once, starting nothing and writing one line to stderr
that names the server, its area and the list.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the gate as a function

- **GIVEN** a server of the area `web`, and `ATL_MCP_AREA` unset, empty, `web`, `web,mobile`,
  ` Web , mobile `, `mobile` and `none`
- **WHEN** the area gate reads each
- **THEN** it starts the server for the first five and holds it for `mobile` and `none`
- **Test:** `scripts/mcp/launch.test.mjs` › "the area gate starts a server when ATL_MCP_AREA is unset, empty or names its area, and holds it otherwise"

#### Scenario: a server outside the session's area

- **GIVEN** a catalog whose fixture server has the area `mobile`, and `ATL_MCP_AREA=web`
- **WHEN** `node scripts/mcp/launch.mjs <name>` runs as a process
- **THEN** it exits 0, its stderr is one line naming the server, `mobile` and `web`, and the
  fixture entry never ran
- **Test:** `scripts/mcp/launch.test.mjs` › "a server outside ATL_MCP_AREA exits 0 at once with one line naming it and its area"

### Requirement: MCP-11 — The launcher runs the pinned entry in its own process

When it starts a server, `scripts/mcp/launch.mjs` SHALL set `process.argv` to
`[process.execPath, <absolute entry>, ...serverArgs]`, where the entry is
`<root>/node_modules/<package>/<entry>` of the catalog, and import that file in the same process,
never spawning another.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the fixture entry records what it ran with

- **GIVEN** a catalog whose fixture server has `serverArgs` `["mcp", "--stdio"]`, and an installed
  fixture entry that records its argv and its pid
- **WHEN** `node scripts/mcp/launch.mjs <name>` runs as a process with `ATL_MCP_AREA` unset
- **THEN** the entry saw `[process.execPath, <its absolute path>, "mcp", "--stdio"]`, its pid is
  the launcher's own, and the launcher exits 0
- **Test:** `scripts/mcp/launch.test.mjs` › "the launcher imports the pinned entry in its own process with the server's argv"

#### Scenario: every real catalog entry

- **GIVEN** the committed catalog
- **WHEN** the launcher resolves each server's entry against a root
- **THEN** each is an absolute path under `<root>/node_modules/<package>/`, ending in its `entry`
- **Test:** `scripts/mcp/launch.test.mjs` › "every catalog server resolves to its entry file inside its package"

#### Scenario: a real server starts

- **GIVEN** a project that installed a catalog server's pinned devDependency
- **WHEN** a client starts it through the launcher
- **THEN** the server answers over stdio
- **Test:** Not covered — the template installs none of the catalog servers, so no real start runs; a server whose entry starts only as the main module (`import.meta.main`, `require.main === module`) is not detected

### Requirement: MCP-12 — An unknown name or a missing entry names what to run

`scripts/mcp/launch.mjs <name>` SHALL exit 1, starting nothing, when `<name>` is not a valid
server of the catalog, naming it and `pnpm verify:mcp-docs`, and when its entry file is not
installed, naming the server, the missing path and `pnpm install --frozen-lockfile`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an unknown name

- **GIVEN** the committed catalog
- **WHEN** `node scripts/mcp/launch.mjs no-such-server` runs as a process
- **THEN** it exits 1 and its stderr names `no-such-server` and `pnpm verify:mcp-docs`
- **Test:** `scripts/mcp/launch.test.mjs` › "an unknown server name exits 1, naming it and the command to run"

#### Scenario: an entry that is not installed

- **GIVEN** the committed catalog, in a checkout that installed none of its servers
- **WHEN** `node scripts/mcp/launch.mjs <name>` runs as a process for each catalog server, with
  `ATL_MCP_AREA` unset
- **THEN** each exits 1 and its stderr names the server, its entry path and
  `pnpm install --frozen-lockfile`
- **Test:** `scripts/mcp/launch.test.mjs` › "a server whose entry is not installed exits 1, naming it and pnpm install --frozen-lockfile"

## MODIFIED Requirements

### Requirement: MCP-01 — One pinned catalog entry per server, run through the launcher

The MCP catalog `.agents/contracts/mcp-servers.json` SHALL hold one entry per MCP server, with
its name, its `area` (`web` or `mobile`, no other value), the capability that selects it, its npm
package, an exact `version` (never a range, `latest` or a tag), the `entry` bin file as a relative
path inside the package, the server's own arguments as `serverArgs` when it takes any (a list of
non-empty strings), the command `node`, never `npx`, with args exactly
`scripts/mcp/launch.mjs <name>`, and the repository docs that describe it, each of which exists.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an entry runs npx

- **GIVEN** a catalog entry whose command is `npx -y expo-mcp`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the launcher command it owes
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

#### Scenario: an entry has no area

- **GIVEN** a catalog entry without `area`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the entry and the missing field
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no area is refused"

#### Scenario: an area outside the set

- **GIVEN** catalog entries whose area is `desktop` and `Web`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails once per entry, naming each value and `web, mobile`
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog area other than web or mobile is refused"

#### Scenario: the args do not run the launcher

- **GIVEN** a catalog entry whose args are the direct `node_modules/<package>/<entry>`, and one
  whose args launch another server's name
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails once per entry, naming each and the `scripts/mcp/launch.mjs <name>` it owes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose args do not run the launcher with its own name is refused"

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

- **GIVEN** a catalog entry with `serverArgs` `["mcp"]`, listed by the block
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with its own server args passes"

#### Scenario: server args that are not a list of words

- **GIVEN** catalog entries whose `serverArgs` is the string `mcp`, and a list holding an empty
  string
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails once per entry, naming each
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose server args are not a list of words is refused"

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
command runs through `npx`, through `node node_modules/<package>/…` or through
`node scripts/mcp/launch.mjs <catalog name>`, which runs that catalog server's package, and a
server whose command is none of them as `not on npm`, with no version and no registry request.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: a .mcp.json server through the launcher

- **GIVEN** a .mcp.json whose `expo` runs `node scripts/mcp/launch.mjs expo`, and whose
  `docs-expo` runs `node scripts/mcp/launch.mjs expo` too
- **WHEN** `pnpm mcp:docs` runs
- **THEN** `expo` keeps its catalog row with its pin, `docs-expo` is listed under `project` with
  the package `expo-mcp` and no devDependency, and the registry is asked for `expo-mcp`
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server that runs the launcher is listed with its catalog package"

#### Scenario: a server that is not an npm package

- **GIVEN** a .mcp.json server whose command runs a local script, or a remote URL
- **WHEN** `pnpm mcp:docs` runs
- **THEN** the block lists it as `not on npm`, with no version, and the registry is never asked
  for it
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a non-npm command is listed as not on npm"

### Requirement: MCP-03 — A changed pin rewrites the block and names the docs to review

`pnpm mcp:docs` SHALL ask the npm registry for each package's `latest` dist-tag and its publish
time, rewrite only the generated block of `docs/mcp.md`, which shows per server its devDependency
line `"<package>": "<version>"`, the command a client runs (`node scripts/mcp/launch.mjs <name>`
for a catalog server) and its latest release, and print each catalog doc of a server whose pinned
version changed, or that is new in the block, as `review: <path>`, never rewriting that doc.

**Evidence:** written at apply time, when the code exists.

#### Scenario: one pin changed

- **GIVEN** a block the updater wrote, then a catalog whose pin of one server moved to a new
  version and entry
- **WHEN** `pnpm mcp:docs` runs
- **THEN** that server's row shows the new devDependency line and still the launcher command, the
  other row is unchanged, the doc outside the block and the catalog docs are byte-identical, and
  the output holds `review: <path>` for that server's docs only
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a changed pin rewrites its row and prints the review paths"

### Requirement: MCP-06 — The block lists what the catalog and .mcp.json hold

`pnpm verify:mcp-docs` SHALL fail when the servers, packages, capabilities, pinned versions or
commands of the generated block differ from those of the catalog plus .mcp.json; when .mcp.json
does not parse or has no `mcpServers` object; when a .mcp.json server named like a catalog server
does not run `node scripts/mcp/launch.mjs <its name>`; and when a .mcp.json server that runs the
launcher names no catalog server, or passes it more than that name.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: a catalog server of .mcp.json through the launcher

- **GIVEN** a .mcp.json whose `expo` and `next-devtools` run `node scripts/mcp/launch.mjs` with
  their own names, listed by the block
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it passes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json catalog server that runs the launcher passes"

#### Scenario: a catalog server of .mcp.json outside the launcher

- **GIVEN** a .mcp.json whose `expo` runs `npx -y expo-mcp`, and whose `next-devtools` runs the
  launcher with the name `expo`
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails once per server, naming each and the `node scripts/mcp/launch.mjs <name>` it
  owes
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json catalog server that does not run the launcher is refused"

#### Scenario: a launcher entry that names no catalog server

- **GIVEN** a .mcp.json server `docs` that runs `node scripts/mcp/launch.mjs gone`, and one that
  runs the launcher with a catalog name and one more argument
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails once per server, naming each and what the launcher was given
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json launcher entry that names no catalog server is refused"

#### Scenario: a package or a capability changed

- **GIVEN** a catalog entry whose package, or whose capability, differs from its block row
- **WHEN** `pnpm verify:mcp-docs` runs
- **THEN** it fails, naming the server, the block's value and the catalog's
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a package that differs from the catalog fails"
- **Test:** `scripts/verify-mcp-docs.test.mjs` › "a capability that differs from the catalog fails"

#### Scenario: a pin or a command changed

- **GIVEN** a catalog entry whose version differs from its block row, or a block row whose command
  is the direct `node node_modules/<package>/<entry>` written before the launcher
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
