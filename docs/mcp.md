# MCP servers — what each one is for, and how this doc stays current

The MCP (Model Context Protocol) servers a project can give its agents are listed in one catalog,
[`.agents/contracts/mcp-servers.json`](../.agents/contracts/mcp-servers.json). Each entry names
the server, the capability that selects it, its npm package, the command a client runs and the
docs that describe it. `/init` writes a project's `.mcp.json` from the entries whose capability
the project selects (planned: the template ships no `.mcp.json`).

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
below names this doc when a server releases.

## Why the commands stay unpinned

Every catalog command is `npx -y <package>`, then the server's own arguments when it takes any
(`npx -y shadcn mcp`), with no version: a client runs the release npx resolves when it starts the
server. An MCP server earns its place by knowing the framework release in front of it, and a
pinned one falls behind the framework it describes. The cost is that a release can change a
server's tools without a diff in this repository; `pnpm mcp:docs` makes that change visible.
`pnpm verify:mcp-docs` refuses a catalog entry that pins a version or runs no package.

## Keeping this doc current

```bash
pnpm mcp:docs          # asks the npm registry; the only command here that uses the network
pnpm mcp:docs --check  # asks the same and writes nothing: exit 0 current, 2 out of date, 1 failed
pnpm mcp:docs --json   # prints the run as one JSON document; combines with --check
pnpm verify:mcp-docs   # offline, inside pnpm validate
```

**`pnpm mcp:docs`** reads the catalog, plus `.mcp.json` when the project has one, so a project
lists the servers it actually runs. For each npm package it asks the registry for the `latest`
dist-tag and its publish time, then rewrites the generated block below, and nothing else.

- It prints one line per server: `mcp-docs: <server> <package> <version> (unchanged)`,
  `(was <old version>)` or `(new in the block)`.
- A server whose version changed prints each doc its catalog entry names as `review: <path>`. A
  release may have changed its tools: re-read the docs that describe them, starting with its row
  in the table above. The updater never rewrites them.
- A server only in `.mcp.json` is listed under the capability `project`, with no docs. A server
  whose command is not `npx` with an npm package (a local script, a remote URL) is listed as
  `not on npm`, with no version, and the registry is never asked for it.
- `Checked` is the date the updater recorded the row's version. A run that finds the same versions
  writes nothing, whatever its date, so this doc's diff moves only when a server releases.
- A failed request, a malformed catalog or `.mcp.json`, or a doc without its markers exits 1,
  names what failed and leaves this doc as it was. A failed run still prints the versions it
  found, but no `review:` line: it wrote nothing, so the next run that writes names them.

Run it after adding a server, before a release, and whenever an agent's MCP tools behave
differently than this doc says.

**`pnpm mcp:docs --check`** asks the registry the same way and writes nothing. It exits 0 when the
block is current, 2 when a run would rewrite it, and 1 on any failure the update exits 1 for. It
prints the same server lines, then `is current` or `out of date`, and no `review:` line, since it
wrote nothing. **`--json`** prints the run, or under `--check` the plan, as one JSON document on
stdout and nothing else there: its `mode` (`update` or `check`), its `status` (`current`,
`outdated`, `updated` or `failed`), one record per server with its package, version, the version
the block held before and its change, the paths it wrote or would write, the `review` paths and the
problems. Its exit code, what it writes and what it prints on stderr are those of the same run
without `--json`. Both make `pnpm mcp:docs` an updater of `.agents/contracts/updaters.json`, which
`pnpm updaters:run` turns into a pull request when the check exits 2 (see
[harness.md](harness.md) § 3g).

**`pnpm verify:mcp-docs`** fails when the block's servers, packages or capabilities differ from
the catalog plus `.mcp.json`, when the block differs from what the updater wrote (its end marker
carries a digest of its lines, so a value typed by hand fails), or when a catalog entry is
malformed, pins a version or names a doc that does not exist. Versions are informational: it never
judges whether one is the latest, and it makes no network request.

To add a server: add its catalog entry, describe it in the table above, run `pnpm mcp:docs` and
commit the three together.

## Latest releases

<!-- mcp-docs:start — generated by `pnpm mcp:docs` from .agents/contracts/mcp-servers.json and .mcp.json; never edit it by hand -->
| Server            | Capability    | Package                 | Latest | Published  | Checked    |
| ----------------- | ------------- | ----------------------- | ------ | ---------- | ---------- |
| expo              | mobile-expo   | `expo-mcp`              | 0.2.4  | 2026-02-12 | 2026-11-15 |
| metro             | mobile-expo   | `metro-mcp`             | 0.15.0 | 2026-09-04 | 2026-11-15 |
| next-devtools     | web-next      | `next-devtools-mcp`     | 0.4.0  | 2026-06-24 | 2026-11-15 |
| react-native-docs | mobile-expo   | `react-native-docs-mcp` | 0.2.1  | 2026-07-06 | 2026-11-15 |
| shadcn            | ui-kit-shadcn | `shadcn`                | 4.23.0 | 2026-10-27 | 2026-11-15 |
<!-- mcp-docs:end digest:99c227c9f926a190 -->
