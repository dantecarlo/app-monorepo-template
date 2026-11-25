# harness/mcp — living spec

> **Governs:** `.agents/contracts/mcp-servers.json`, `scripts/mcp-docs.detect.mjs`, `scripts/update-mcp-docs.mjs`, `scripts/verify-mcp-docs.mjs`, `scripts/mcp/launch.mjs`
> **ID prefix:** `MCP`
> **Derived from:** `docs/mcp.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-25 at `98fe189`

## Purpose

The MCP unit of the harness keeps the project's MCP servers pinned and launched directly
(decision 61), and their documentation current. It owns the catalog of servers the template can
configure, each with its area (`web` or `mobile`), pinned to an exact version and run as
`node scripts/mcp/launch.mjs <name>`; the launcher, which starts a server only in a session whose
`ATL_MCP_AREA` names its area and imports `node_modules/<package>/<entry>` in its own process; the
updater that asks the npm registry for each server's releases, rewrites the generated block of
`docs/mcp.md` and reports the pin bumps a newer release makes possible; and the offline gate
that holds the catalog's entries and that block to the catalog and the project's .mcp.json.
Writing .mcp.json and the root devDependencies belongs to `/init`, applying a bump to whoever
reads the report, and the prose of the doc to whoever re-reads it when the updater names it; the
gate helpers of the other harness scripts are not part of this unit.

## Requirements

### Requirement: MCP-01 — One pinned catalog entry per server, run through the launcher

The MCP catalog `.agents/contracts/mcp-servers.json` SHALL hold one entry per MCP server, with
its name, its `area` (`web` or `mobile`, no other value), the capability that selects it, its npm
package, an exact `version` (never a range, `latest` or a tag), the `entry` bin file as a relative
path inside the package, the server's own arguments as `serverArgs` when it takes any (a list of
non-empty strings), the command `node`, never `npx`, with args exactly
`scripts/mcp/launch.mjs <name>`, and the repository docs that describe it, each of which exists.

**Evidence:** `.agents/contracts/mcp-servers.json:2`, `scripts/mcp-docs.detect.mjs:16-22`,
`scripts/mcp-docs.detect.mjs:148-187`, `scripts/mcp-docs.detect.mjs:189-211`,
`scripts/mcp-docs.detect.mjs:215-256`, `scripts/verify-mcp-docs.mjs:60-68`

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

**Evidence:** `scripts/mcp-docs.detect.mjs:108-129`, `scripts/mcp-docs.detect.mjs:262-297`,
`scripts/mcp-docs.detect.mjs:305-355`, `scripts/update-mcp-docs.mjs:238`

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

**Evidence:** `scripts/update-mcp-docs.mjs:135-149`, `scripts/update-mcp-docs.mjs:275-287`,
`scripts/mcp-docs.detect.mjs:409-424`, `scripts/mcp-docs.detect.mjs:527-539`,
`scripts/mcp-docs.detect.mjs:577-578`

#### Scenario: one pin changed

- **GIVEN** a block the updater wrote, then a catalog whose pin of one server moved to a new
  version and entry
- **WHEN** `pnpm mcp:docs` runs
- **THEN** that server's row shows the new devDependency line and still the launcher command, the
  other row is unchanged, the doc outside the block and the catalog docs are byte-identical, and
  the output holds `review: <path>` for that server's docs only
- **Test:** `scripts/update-mcp-docs.test.mjs` › "a changed pin rewrites its row and prints the review paths"

### Requirement: MCP-04 — Nothing new, nothing written

`pnpm mcp:docs` SHALL leave `docs/mcp.md` unwritten when every server's pinned version, command,
latest version, package and capability match the block, whatever the date of the run.

**Evidence:** `scripts/mcp-docs.detect.mjs:543-545`, `scripts/mcp-docs.detect.mjs:579`,
`scripts/update-mcp-docs.mjs:324-328`

#### Scenario: a second run on a later day

- **GIVEN** a block the updater wrote, and a registry that still answers the same versions
- **WHEN** `pnpm mcp:docs` runs on a later day
- **THEN** the doc is not written, and no review path is printed
- **Test:** `scripts/update-mcp-docs.test.mjs` › "an unchanged version writes nothing"

### Requirement: MCP-05 — A failure writes nothing

`pnpm mcp:docs` SHALL exit non-zero and leave `docs/mcp.md` byte-identical when a registry
request fails or the doc has no generated block, naming the server or the missing marker.

**Evidence:** `scripts/update-mcp-docs.mjs:231-235`, `scripts/update-mcp-docs.mjs:298-303`,
`scripts/update-mcp-docs.mjs:318-321`

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
commands of the generated block differ from those of the catalog plus .mcp.json; when .mcp.json
does not parse or has no `mcpServers` object; when a .mcp.json server named like a catalog server
does not run `node scripts/mcp/launch.mjs <its name>`; and when a .mcp.json server that runs the
launcher names no catalog server, or passes it more than that name.

**Evidence:** `scripts/verify-mcp-docs.mjs:51-56`, `scripts/verify-mcp-docs.mjs:70-98`,
`scripts/verify-mcp-docs.mjs:143-166`, `scripts/mcp-docs.detect.mjs:262-297`,
`scripts/mcp-docs.detect.mjs:358-401`

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

### Requirement: MCP-07 — The block is only what the updater wrote

`pnpm verify:mcp-docs` SHALL fail when the generated block differs from what the updater wrote:
a value or a line edited by hand, a digest that does not match the block's lines, or a marker that
is gone.

**Evidence:** `scripts/verify-mcp-docs.mjs:100-122`, `scripts/mcp-docs.detect.mjs:403-407`,
`scripts/mcp-docs.detect.mjs:445-452`

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

**Evidence:** `scripts/verify-mcp-docs.mjs:31-45`, `scripts/mcp-docs.detect.mjs:70`,
`scripts/mcp-docs.detect.mjs:499-500`

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

**Evidence:** `scripts/update-mcp-docs.mjs:64-68`, `scripts/update-mcp-docs.mjs:94-133`,
`scripts/update-mcp-docs.mjs:151-205`, `scripts/update-mcp-docs.mjs:207-226`

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

### Requirement: MCP-10 — A server starts only in a session of its area

`scripts/mcp/launch.mjs <name>` SHALL start the catalog server `<name>` when `ATL_MCP_AREA` is
unset or empty, or when that comma list (`web`, `mobile`, `web,mobile`, `none`) names the
server's area; otherwise it SHALL exit 0 at once, starting nothing and writing one line to stderr
that names the server, its area and the list.

**Evidence:** `scripts/mcp/launch.mjs:51-64`, `scripts/mcp/launch.mjs:103-110`

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

**Evidence:** `scripts/mcp/launch.mjs:67-71`, `scripts/mcp/launch.mjs:111-122`,
`scripts/mcp-docs.detect.mjs:119-120`

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

**Evidence:** `scripts/mcp/launch.mjs:93-102`, `scripts/mcp/launch.mjs:111-119`

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
