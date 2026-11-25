# Proposal: start each session's MCP servers by area, through one launcher

> **Status:** archived — 2026-11-25

## Why

The first slice (`2026-11-20-mcp-pinned`) made every catalog server one pinned `node` process
instead of four. Every session still starts every server of `.mcp.json`, though: a web session
starts the three mobile servers and a mobile session the two web ones, and Certifipago runs many
role sessions at once from one main checkout. A fast-forward that changes `pnpm-lock.yaml` also
leaves the pinned entries missing until someone installs, and nothing says so before a server
fails to start.

The owner's words, verbatim:

- 2026-11-20 (translated from Spanish), on the problem: "a great many zombie processes are being
  left behind, so many that the computer runs out of memory … it has to be done as priority 1"
- 2026-11-20 (translated from Spanish), choosing among options that all launch "without `npx` and
  with a pinned version": "By area + shared"

That option says each worktree, and in practice each session, starts only the servers of its area
(web, mobile or none), and the documentation servers run once for the whole machine.

Every Certifipago role session starts from one main checkout, so a per-worktree
`.claude/settings.local.json` cannot tell the sessions apart: the gate is per session, through the
environment. A saved local environment of Claude Desktop passes `KEY=value` to the sessions
started from it, and `.mcp.json` expands `${VAR}` and `${VAR:-default}` in `command`, `args` and
`env`. A stdio server that exits at once is marked failed once; nothing retries and nothing
blocks. Certifipago's slice 2 uses the same names: `area`, `scripts/mcp/launch.mjs`,
`ATL_MCP_AREA` and `PRUNE_WORKTREES_INSTALL_SECONDS`.

## What changes

- **The catalog.** Each entry of `.agents/contracts/mcp-servers.json` gains `area`, `web` or
  `mobile` and no other value (next-devtools and shadcn `web`; metro, expo and react-native-docs
  `mobile`), and `serverArgs`, the server's own arguments (shadcn's `mcp`), optional. Its command
  stays `node` and its `args` become `["scripts/mcp/launch.mjs", "<name>"]`; `version` and
  `entry` stay, and the launcher reads them. The `$comment` explains both fields. `pnpm
  verify:mcp-docs` refuses a missing area, a value outside the set, `serverArgs` that is not a
  list of words, and args other than the launcher with the entry's own name.
- **The launcher.** `scripts/mcp/launch.mjs <name>` reads its catalog entry and `ATL_MCP_AREA`, a
  comma list (`web`, `mobile`, `web,mobile`, `none`). Unset or empty, every server starts, as
  today. A list without the server's area exits 0 at once with one stderr line naming the server
  and the area. Otherwise it sets `process.argv` to `[process.execPath, <absolute entry>,
  ...serverArgs]` and imports the pinned entry in the same process: it never spawns. An unknown
  name, or an entry file that is not installed, exits 1, naming the server and the command to run.
- **`.mcp.json`.** Every catalog server of a project's `.mcp.json` runs
  `node scripts/mcp/launch.mjs <name>`; `pnpm verify:mcp-docs` refuses one that does not, and a
  launcher entry that names no catalog server. The updater lists a launcher entry with its
  catalog package, and the generated block of `docs/mcp.md` shows the launcher command.
- **Install after a fast-forward.** When the post-merge fast-forward of `scripts/prune-worktrees.mjs`
  changes `pnpm-lock.yaml`, it runs `pnpm install --frozen-lockfile --offline` through
  `runBounded`, bounded by `PRUNE_WORKTREES_INSTALL_SECONDS` (120 s unless set). A failure or a
  timeout prints one line with the exact `pnpm install --frozen-lockfile` command to run and never
  fails the merge; `--dry-run` says it would install, and `--quiet` keeps only the failure line. A
  fast-forward that leaves the lockfile as it was installs nothing and prints what it printed.
- **The session-start check.** The `SessionStart` hook of the process reaper also checks, for every
  `.mcp.json` server that runs the launcher, that its catalog entry file is installed, and prints
  one line naming the missing servers and the install command; it always exits 0, inside the same
  budget, and prints nothing without a `.mcp.json`.
- **The docs.** `docs/mcp.md` describes the area, the launcher, one saved Desktop environment per
  area, Codex and OpenCode as not wired yet, and the optional machine-shared documentation servers
  through mcp-proxy; `docs/harness.md` the session-start check and the install after a
  fast-forward; a §21 row of `docs/code-standards.md` and the global map name the launcher.

## Out of scope

- Wiring Codex (`-c mcp_servers.X.enabled=false` or a profile) and OpenCode (`enabled` per
  server): the docs say plainly they are not wired yet.
- Running mcp-proxy for the project, or writing a user's `~/.claude.json`: the shared
  documentation servers are optional, at user level, and documented only.
- Writing `.mcp.json` and the root devDependencies: `/init` does it (F.11), reading this catalog;
  the template ships neither.
- A real start of each catalog server through the launcher: the template installs none of them.
- A spec of the worktree pruner, which has none; its install is pinned by REAP-10, whose
  `runBounded` it runs through, and by tests of its own.

## Affected specs

- `openspec/specs/harness/mcp/spec.md`: modified MCP-01, MCP-02, MCP-03 and MCP-06; added MCP-10,
  MCP-11 and MCP-12.
- `openspec/specs/harness/process-reaper/spec.md`: modified REAP-10; added REAP-13.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
