# Proposal: pin the MCP servers and launch each one with `node`

> **Status:** archived — 2026-11-20

## Why

Every command of the MCP catalog is `npx -y <package>`, unpinned (decision 55 of
`docs/INIT_AND_HARNESS_PLAN.md`, `docs/mcp.md` § "Why the commands stay unpinned", held by
`pnpm verify:mcp-docs`). On Windows each such server runs as four processes: `cmd.exe`, its
`conhost`, the npx-cli launcher and the server itself. Measured on 2026-11-20 with nine sessions
open: 44 launchers averaging 93 MB against 45 servers averaging 86 MB, so the launchers alone cost
as much memory as the servers. An unpinned `-y` also fetches the latest release at every start,
which bypasses pnpm's `minimumReleaseAge` (1,440 minutes).

Certifipago is making the same change now (TASK-mcp-pinned-launchers: pinned root
devDependencies launched with `node node_modules/<pkg>/<entry>`), so the two repositories keep one
shape.

The owner's words, verbatim:

- 2026-11-20 (translated from Spanish), on the problem: "a great many zombie processes are being
  left behind, so many that the computer runs out of memory … it has to be done as priority 1"
- 2026-11-20 (translated from Spanish), choosing among options that all launch "without `npx` and
  with a pinned version": "By area + shared"
- 2026-11-20 (translated from Spanish), in the Arquitecto chat, answering whether to replace the
  2026-11-15 rule with pinned versions launched directly: "Yes, and make it priority 0"
- 2026-11-20 (translated from Spanish), asked whether the template's rule changes too: "Yes, in
  the template too"

This is the owner's request to change a rule, so the LAW "A rule is not edited to fit the work"
lets it through.

## What changes

- **The catalog.** Each entry of `.agents/contracts/mcp-servers.json` keeps `name`, `capability`,
  `package` and `docs`, and gains `version`, an exact release published at least 1,440 minutes
  ago, and `entry`, the package's bin file. Its command is `node` and its args are
  `node_modules/<package>/<entry>`, then the server's own arguments. A project adds
  `<package>@<version>` as an exact root devDependency; `/init` will do it when it writes
  `.mcp.json`. The `$comment` says why: one process per server, no network fetch when a client
  starts it, and the release-age policy.
- **The gate.** `pnpm verify:mcp-docs` refuses an `npx` command, a missing or non-exact `version`
  (a range, `latest` or a tag), an `entry` that leaves its package or that the first argument does
  not name, and a command other than `node` for an npm server. It also fails a block whose pinned
  version or command differs from the catalog plus `.mcp.json`. Every check the base already had
  is pinned by a test of its own.
- **The updater.** The generated block of `docs/mcp.md` shows, per server, the devDependency line
  and the direct command next to the latest release. `pnpm mcp:docs` reports a newer release as a
  pin bump, a planned change of `version` and `entry`, only once that release is 1,440 minutes
  old; a younger release waits, and a new major is never proposed. It never writes the catalog. A
  server whose pin changed prints its docs to review. A `.mcp.json` server launched from
  `node_modules` is listed with its package. Its network calls stay injectable.
- **The docs.** `docs/mcp.md` replaces "Why the commands stay unpinned" with "Why the commands are
  pinned and direct", with the measurement and the cost: a pin can fall behind the framework, and
  the updater proposes the bump. The `AGENTS.md` key-docs row of `docs/mcp.md` stops saying
  "unpinned".
- **The plan.** Decision 55 is marked superseded on 2026-11-20 by a new decision that quotes the
  owner, and a Template → Certifipago parity-ledger row records Certifipago's
  TASK-mcp-pinned-launchers.

## Out of scope

- Writing `.mcp.json` and the root devDependencies: `/init` does it (F.11), reading this catalog.
  The template ships neither.
- Applying a bump: the updater reports it; a person or an agent edits the catalog, the
  devDependency and `.mcp.json`, installs, and runs `pnpm mcp:docs`.
- Reading a project's `package.json` for the pin of a server only in `.mcp.json`: such a row shows
  no devDependency.
- `docs/harness.md` and `docs/maps/global-map.md`, which describe the gate in one line each and lie
  outside this change's edit surfaces.

## Affected specs

- `openspec/specs/harness/mcp/spec.md`: modified MCP-01, MCP-02, MCP-03, MCP-04, MCP-06 and
  MCP-08; added MCP-09.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
