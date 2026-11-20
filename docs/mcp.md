# MCP servers — what each one is for, and how this doc stays current

The MCP (Model Context Protocol) servers a project can give its agents are listed in one catalog,
[`.agents/contracts/mcp-servers.json`](../.agents/contracts/mcp-servers.json). Each entry names
the server, the capability that selects it, its npm package, the exact version it is pinned to,
its `entry` (the bin file inside the package), the command a client runs and the docs that
describe it. `/init` writes a project's `.mcp.json` from the entries whose capability the project
selects, and adds each one's `<package>@<version>` to the project's root devDependencies as an
exact version (planned: the template ships no `.mcp.json`).

## The servers

| Server              | Selected by     | What it is for                                                                           |
| ------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `next-devtools`     | `web-next`      | Next.js development: the Next.js docs, and the errors, routes and logs of a `next dev`   |
| `shadcn`            | `ui-kit-shadcn` | The shadcn CLI's server (`shadcn mcp`): browse and add components from shadcn registries |
| `expo`              | `mobile-expo`   | Expo: the SDK docs, and the running app through the Expo dev server                      |
| `metro`             | `mobile-expo`   | The Metro bundler of the running mobile app: what it bundles, and its errors             |
| `react-native-docs` | `mobile-expo`   | The React Native documentation                                                           |

`ui-kit-shadcn` is an assumed name: the `shadcn` answer to the UI kit question of `/init`, kept
until `/init` defines its capabilities; no capability of `template.manifest.json` carries it yet.
A server's own README lists its tools, and they change with its releases: that is why the updater
below names this doc when a server's pin changes.

## Why the commands are pinned and direct

Every catalog command is `node node_modules/<package>/<entry>`, then the server's own arguments
when it takes any (`node node_modules/shadcn/dist/index.js mcp`), and the project installs
`<package>@<version>` as an exact root devDependency. A client starts one process per server, and
nothing is fetched from the network when it does (decision 61, which replaced the unpinned
`npx -y <package>` of decision 55 on 2026-11-20).

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
has no exact `version` (a range, `latest` or a tag), names an `entry` outside its package, or
whose first argument is not `node_modules/<package>/<entry>`.

## Keeping this doc current

```bash
pnpm mcp:docs          # asks the npm registry; the only command here that uses the network
pnpm verify:mcp-docs   # offline, inside pnpm validate
```

**`pnpm mcp:docs`** reads the catalog, plus `.mcp.json` when the project has one, so a project
lists the servers it actually runs. For each npm package it asks the registry for the `latest`
dist-tag, the publish time of every release and the bin file each release runs, then rewrites the
generated block below, and nothing else: per server, the devDependency line a project adds, the
direct command a client runs, and the latest release with its publish date.

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
  devDependency. Its package is the one its command runs, through `npx` or
  `node node_modules/<package>/…`. A server whose command is neither (a local script, a remote
  URL) is listed as `not on npm`, with no version, and the registry is never asked for it.
- `Checked` is the date the updater recorded the row. A run that finds the same pins and the same
  latest releases writes nothing, whatever its date.
- A failed request, a malformed catalog or `.mcp.json`, or a doc without its markers exits 1,
  names what failed and leaves this doc as it was. A failed run still prints the versions and the
  bumps it found, but no `review:` line: it wrote nothing, so the next run that writes names them.

Run it after adding a server, after a bump, before a release, and whenever an agent's MCP tools
behave differently than this doc says.

**`pnpm verify:mcp-docs`** fails when the block's servers, packages, capabilities, pinned versions
or commands differ from the catalog plus `.mcp.json`, when the block differs from what the updater
wrote (its end marker carries a digest of its lines, so a value typed by hand fails), or when a
catalog entry is malformed or names a doc that does not exist. Latest releases are informational:
it never judges whether a pin is the latest, and it makes no network request.

To add a server: pick a release at least 1,440 minutes old (`npm view <package> time --json`),
read its bin file (`npm view <package>@<version> bin --json`), add its catalog entry, describe it
in the table above, run `pnpm mcp:docs` and commit the three together.

To apply a bump: set the entry's `version` and `entry` (and its first argument) in the catalog; in
a project, set the same version in the root devDependencies and the same command in `.mcp.json`,
then install. Run `pnpm mcp:docs`, re-read the docs it names, and commit them together.

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
