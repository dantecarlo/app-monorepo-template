# MCP servers — what each one is for, and how this doc stays current

The MCP (Model Context Protocol) servers a project can give its agents are listed in one catalog,
[`.agents/contracts/mcp-servers.json`](../.agents/contracts/mcp-servers.json). Each entry names
the server, its area (`web` or `mobile`), the capability that selects it, its npm package, the
exact version it is pinned to, its `entry` (the bin file inside the package), the server's own
arguments (`serverArgs`, when it takes any), the command a client runs and the docs that describe
it. `/init` writes a project's `.mcp.json` from the entries whose capability the project selects,
each with the entry's `command` and `args`, and adds each one's `<package>@<version>` to the
project's root devDependencies as an exact version (planned: the template ships no `.mcp.json`).

## The servers

| Server              | Area     | Selected by     | What it is for                                                                           |
| ------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------- |
| `next-devtools`     | `web`    | `web-next`      | Next.js development: the Next.js docs, and the errors, routes and logs of a `next dev`   |
| `shadcn`            | `web`    | `ui-kit-shadcn` | The shadcn CLI's server (`shadcn mcp`): browse and add components from shadcn registries |
| `expo`              | `mobile` | `mobile-expo`   | Expo: the SDK docs, and the running app through the Expo dev server                      |
| `metro`             | `mobile` | `mobile-expo`   | The Metro bundler of the running mobile app: what it bundles, and its errors             |
| `react-native-docs` | `mobile` | `mobile-expo`   | The React Native documentation                                                           |

`ui-kit-shadcn` is an assumed name: the `shadcn` answer to the UI kit question of `/init`, kept
until `/init` defines its capabilities; no capability of `template.manifest.json` carries it yet.
A server's own README lists its tools, and they change with its releases: that is why the updater
below names this doc when a server's pin changes.

## Why the commands are pinned and direct

Every catalog command is `node scripts/mcp/launch.mjs <name>`, and the project installs
`<package>@<version>` as an exact root devDependency. The launcher reads the server's catalog
entry and imports `node_modules/<package>/<entry>` in its own process, with `process.argv` set to
the node binary, that file, the entry's `serverArgs` (`mcp` for shadcn), then the arguments the
project's `.mcp.json` gives after the name. A client starts one process per server, and nothing is
fetched from the network when it does (decision 61, which replaced the unpinned `npx -y <package>`
of decision 55 on 2026-11-20).

A project passes what only it knows after the name. expo-mcp 0.2.4 exits 1 without the URL of the
Expo dev server, so a project that runs `expo` gives it in `.mcp.json`, which expands the variable
when the client starts the server:

```json
"expo": {
  "command": "node",
  "args": [
    "scripts/mcp/launch.mjs",
    "expo",
    "--dev-server-url",
    "${EXPO_DEV_SERVER_URL:-http://localhost:8081}"
  ]
}
```

- **The cost of `npx`.** On Windows an `npx -y` server runs as four processes: `cmd.exe`, its
  `conhost`, the npx-cli launcher and the server itself. Measured on 2026-11-20 with nine sessions
  open: 44 launchers averaging 93 MB against 45 servers averaging 86 MB, so the launchers alone
  cost as much memory as the servers.
- **The release-age policy.** An unpinned `-y` fetches the latest release at every start, which
  bypasses pnpm's `minimumReleaseAge` (1,440 minutes). A pin is installed like any other
  dependency, so the policy holds.
- **The cost of a pin.** A pinned server can fall behind the framework release it describes.
  `pnpm mcp:docs` proposes the bump once a newer release is old enough, and a person applies it.

`pnpm verify:mcp-docs` refuses a catalog entry that runs `npx`, runs a command other than `node`,
has no `area` or one other than `web` or `mobile`, has no exact `version` (a range, `latest` or a
tag), names an `entry` outside its package or one that is not a `.js`, `.mjs` or `.cjs` file
(the launcher imports a file, and `import()` refuses a directory), has `serverArgs` that are not a
list of non-empty strings, or whose args are not `scripts/mcp/launch.mjs <its own name>`. In a
project's `.mcp.json` it refuses a server named like a catalog server that does not run
`node scripts/mcp/launch.mjs <its name>`, a server that runs the launcher with no name or with a
name the catalog does not hold, and an argument after the name that is not a string.

## Each session starts the servers of its area

The owner chose this on 2026-11-20 (translated from Spanish): "By area + shared". Every session
used to start every server of `.mcp.json`: a web session the three mobile ones, a mobile session
the two web ones. Now the launcher reads `ATL_MCP_AREA`, a comma list of areas, from its
environment:

| `ATL_MCP_AREA`      | Starts                                                  |
| ------------------- | ------------------------------------------------------- |
| unset or empty      | every server, as before areas existed                   |
| `web`               | `next-devtools` and `shadcn`                            |
| `mobile`            | `expo`, `metro` and `react-native-docs`                 |
| `web,mobile`        | every server                                            |
| `none`              | no catalog server                                       |

A server outside the list exits 0 at once, starting nothing, and writes one line to stderr naming
the server, its area and the list (`mcp-launch: expo not started: its area is mobile, and
ATL_MCP_AREA is web`). The client marks it failed once and goes on: nothing retries and nothing
blocks. A word of the list that is neither `web`, `mobile` nor `none` (`desktop`, `we b`,
`mobile;web`) adds one stderr line naming it and the valid words, and the launcher decides as it
would without it, so a list of unknown words starts nothing. A name the catalog does not hold
exits 1 and names `pnpm verify:mcp-docs`; an entry that is not installed exits 1 and names
`pnpm install`.

**One saved Desktop environment per area.** Every role session of a project starts from one main
checkout, so a per-worktree `.claude/settings.local.json` cannot tell the sessions apart: the area
is set per session, through the environment. Claude Desktop passes the `KEY=value` variables of a
saved local environment to every session started from it
([Desktop docs](https://code.claude.com/docs/en/desktop#set-environment-variables-for-local-sessions)).
Save three, one per area, each holding one variable:

- `ATL_MCP_AREA=web`, for the sessions that work on `apps/web`;
- `ATL_MCP_AREA=mobile`, for the sessions that work on `apps/mobile`;
- `ATL_MCP_AREA=none`, for the sessions that need no catalog server (the PO, the architect, a
  release).

The savings start only once each role session is opened from its environment. Until then the
variable is unset and every server starts, as before. The launcher reads the variable from the
environment the client starts it with; a client that does not pass its own environment on to a
stdio server can forward it with `"env": { "ATL_MCP_AREA": "${ATL_MCP_AREA:-}" }` in each
`.mcp.json` entry, since `.mcp.json` expands `${VAR}` and `${VAR:-default}` in `command`, `args`
and `env`.

**Not wired yet: Codex and OpenCode.** Neither has an area today. Codex switches a server off
with `-c mcp_servers.<name>.enabled=false`, or with a profile that sets it, and OpenCode with
`enabled` per server in its config; the template writes neither, so a Codex or OpenCode session
starts every server it is configured with.

## Optional: one shared copy of the documentation servers

The second half of "By area + shared": a documentation-only server, such as `react-native-docs`
or a user's own context7, answers the same for every session, so one copy can serve the whole
machine instead of one per session. Nothing in the template starts it; a person who wants it runs
[mcp-proxy](https://github.com/sparfenyuk/mcp-proxy) (sparfenyuk, MIT) on `127.0.0.1`. It starts
one child process per backend server it is configured with and shares it among every client that
connects; its README gives the command line and the URL of each backend. The process reaper
spares it however it is launched (`docs/harness.md` § 3g).

- **Why not supergateway.** It spawns one child per request, so a shared URL would start as many
  servers as there are calls, which is the cost this exists to remove.
- **Why the shared URL lives at user level.** Each client reaches the proxy through a user-level
  entry of `type: "http"` with its URL, never through the project's `.mcp.json`. The repository
  stays portable, since it names no port of one machine, and a project-scope entry with the same
  name overrides the user-level one, so a project that ships its own server under that name keeps
  it. Give the user-level entry a name the project's `.mcp.json` does not use, and leave that
  documentation server out of the session's area, or set `ATL_MCP_AREA=none`, so it is not
  started twice.

## Installing the pinned entries

The launcher imports a file under `node_modules`, so a server cannot start until the project
installs its pinned devDependency. Two pieces keep that from going unnoticed:

- the worktree pruner runs `pnpm install` after a post-merge fast-forward of the main checkout
  that changes `pnpm-lock.yaml`, prints the `pnpm install` to run when that install fails, and
  says so when the install rewrites the lockfile (`docs/harness.md`, Layer 2);
- every Claude Code session starts by naming, in one line, the `.mcp.json` servers that run the
  launcher, that the session's `ATL_MCP_AREA` starts, and whose entry is not installed, with the
  same command (`docs/harness.md` § 3g). A server its area holds off is left out: the launcher
  would hold it anyway.

## Keeping this doc current

```bash
pnpm mcp:docs          # asks the npm registry; the only command here that uses the network
pnpm verify:mcp-docs   # offline, inside pnpm validate
```

**`pnpm mcp:docs`** reads the catalog, plus `.mcp.json` when the project has one, so a project
lists the servers it actually runs. For each npm package it asks the registry for the `latest`
dist-tag, the publish time of every release and the bin file each release runs, then rewrites the
generated block below, and nothing else: per server, the devDependency line a project adds, the
command a client runs, and the latest release with its publish date.

- It prints one line per server: `mcp-docs: <server> <package> <latest> (unchanged)`,
  `(was <old latest>)` or `(new in the block)`.
- A newer release of the pinned major prints as
  `bump: <server> <package> version <pinned> -> <new>, entry <pinned entry> -> <new entry>`, once it
  is 1,440 minutes old: a planned change the updater never applies. A newer release that is still
  younger prints as `waits:`, with the time it becomes eligible. A `latest` of a higher major
  prints as `major:`: the updater never proposes a major, a person decides it.
- A server whose pin changed, or that is new in the block, prints each doc its catalog entry names
  as `review: <path>`. Its tools may have changed: re-read the docs that describe them, starting
  with its row in the table above. The updater never rewrites them.
- A server only in `.mcp.json` is listed under the capability `project`, with no docs and no
  devDependency. Its package is the one its command runs, through `npx`,
  `node node_modules/<package>/…`, or the launcher with a catalog name, which runs that catalog
  server's package. A server whose command is none of them (a local script, a remote URL) is
  listed as `not on npm`, with no version, and the registry is never asked for it.
- `Checked` is the date the updater recorded the row. A run that finds the same pins and the same
  latest releases writes nothing, whatever its date.
- A failed request, a malformed catalog or `.mcp.json`, or a doc without its markers exits 1,
  names what failed and leaves this doc as it was. A failed run still prints the versions and the
  bumps it found, but no `review:` line: it wrote nothing, so the next run that writes names them.

Run it after adding a server, after a bump, before a release, and whenever an agent's MCP tools
behave differently than this doc says.

**`pnpm verify:mcp-docs`** fails when the block's servers, packages, capabilities, pinned versions
or commands differ from the catalog plus `.mcp.json`, when the block differs from what the updater
wrote (its end marker carries a digest of its lines, so a value typed by hand fails), when a
catalog entry is malformed or names a doc that does not exist, or when a `.mcp.json` server does
not run the launcher as it must. Latest releases are informational: it never judges whether a pin
is the latest, and it makes no network request.

To add a server: pick a release at least 1,440 minutes old (`npm view <package> time --json`),
read its bin file (`npm view <package>@<version> bin --json`), add its catalog entry with its
`area`, its `serverArgs` when it takes any, and the args `["scripts/mcp/launch.mjs", "<name>"]`,
describe it in the table above, run `pnpm mcp:docs` and commit the three together.

To apply a bump: set the entry's `version` and `entry` in the catalog; in a project, set the same
version in the root devDependencies and install (`.mcp.json` keeps running the launcher). Run
`pnpm mcp:docs`, re-read the docs it names, and commit them together.

## Pins and latest releases

<!-- mcp-docs:start — generated by `pnpm mcp:docs` from .agents/contracts/mcp-servers.json and .mcp.json; never edit it by hand -->
| Server            | Capability    | Package                 | devDependency                      | Command                                         | Latest | Published  | Checked    |
| ----------------- | ------------- | ----------------------- | ---------------------------------- | ----------------------------------------------- | ------ | ---------- | ---------- |
| expo              | mobile-expo   | `expo-mcp`              | `"expo-mcp": "0.2.4"`              | `node scripts/mcp/launch.mjs expo`              | 0.2.4  | 2026-02-12 | 2026-11-20 |
| metro             | mobile-expo   | `metro-mcp`             | `"metro-mcp": "0.15.0"`            | `node scripts/mcp/launch.mjs metro`             | 0.15.0 | 2026-09-04 | 2026-11-20 |
| next-devtools     | web-next      | `next-devtools-mcp`     | `"next-devtools-mcp": "0.4.0"`     | `node scripts/mcp/launch.mjs next-devtools`     | 0.4.0  | 2026-06-24 | 2026-11-20 |
| react-native-docs | mobile-expo   | `react-native-docs-mcp` | `"react-native-docs-mcp": "0.2.1"` | `node scripts/mcp/launch.mjs react-native-docs` | 0.2.1  | 2026-07-06 | 2026-11-20 |
| shadcn            | ui-kit-shadcn | `shadcn`                | `"shadcn": "4.23.0"`               | `node scripts/mcp/launch.mjs shadcn`            | 4.23.0 | 2026-10-27 | 2026-11-20 |
<!-- mcp-docs:end digest:b624a7e059be19e9 -->
