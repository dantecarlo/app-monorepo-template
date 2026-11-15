# Proposal: keep the MCP server docs current with `pnpm mcp:docs`

> **Status:** open

## Why

Decision 55 of `docs/INIT_AND_HARNESS_PLAN.md` keeps MCP servers unpinned and replaces the
pinning of decision 44: a client runs `npx -y <package>`, so a server's tools change whenever the
server releases, and nothing tells a person or an agent that the docs naming those tools may be
stale. Stage F, step F.9 schedules the updater. The template has no `.mcp.json` today (`/init`
writes one from the capabilities the owner picks, F.11 in Stage 6), no list of the servers it
can configure, and no doc that names them: the five servers of Certifipago's `.mcp.json`
(`origin/master`) live only in the plan's prose.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "Don't pin the versions; rather, we need a kind of updater
  for our documentation, and update it if the MCPs update"

## What changes

- **The catalog.** `.agents/contracts/mcp-servers.json` lists every MCP server the template can
  configure, one entry each: its name, the capability that selects it, its npm package, its
  command and args, unpinned as `npx -y <package>`, and the repository docs that describe it. It
  starts with Certifipago's five: `next-devtools` (`next-devtools-mcp`, `web-next`),
  `shadcn-server` (`@shadcn/mcp-server`, `ui-kit-shadcn`), and `expo` (`expo-mcp`), `metro`
  (`metro-mcp`) and `react-native-docs` (`react-native-docs-mcp`) for `mobile-expo`. Assumption:
  no manifest capability carries the UI kit yet, so `ui-kit-shadcn` names the `shadcn` answer of
  the `/init` UI kit question until F.11 lands it.
- **The doc.** `docs/mcp.md` says what each server is for, which capability selects it, why the
  commands stay unpinned and how to refresh the doc. One block between markers is generated: per
  server, its name, capability, package, latest version, publish date and the date the version
  was recorded. The block ends with a digest of its own lines, so an edit by hand is visible
  offline. Nothing else in the doc is generated.
- **The updater.** `pnpm mcp:docs` (`scripts/update-mcp-docs.mjs`) reads the catalog, plus
  `.mcp.json` when one exists, so a derived project lists the servers it actually runs. It asks
  the npm registry for each package's `latest` dist-tag and its publish time and rewrites the
  block. A server only in `.mcp.json` is listed under the capability `project`; a server whose
  command is not `npx` with an npm package is listed as `not on npm`, with no version. When a
  version differs from the block's, it prints that server's catalog docs as `review: <path>` and
  never rewrites them. A run that finds nothing new writes nothing, whatever its date; a registry
  failure exits non-zero, names the server and leaves the doc untouched. Only this command uses
  the network.
- **The gate.** `pnpm verify:mcp-docs` (`scripts/verify-mcp-docs.mjs`), offline, inside
  `validate`: it fails when the block's servers, packages or capabilities differ from the catalog
  plus `.mcp.json`, when the block differs from what the updater wrote, or when the catalog is
  malformed (a missing field, a pinned version, a doc that does not exist). Versions are
  informational: the gate never judges them. The shared parsing and rendering is pure, in
  `scripts/mcp-docs.detect.mjs`.
- **The tests.** `scripts/update-mcp-docs.test.mjs` injects the registry fetcher, and
  `scripts/verify-mcp-docs.test.mjs` plants each drift in a scratch tree; neither touches the
  network. The block is refreshed once against the real registry, and the versions it found are
  recorded in the verify report.
- **The spec and the docs.** A new living spec, `openspec/specs/harness/mcp/spec.md` (prefix
  `MCP`), the first of the harness, with its row in `openspec/README.md` § 2.1;
  `docs/harness.md`, `docs/maps/global-map.md` and the "Key docs" table of `AGENTS.md`.

## Out of scope

- Writing `.mcp.json`: `/init` writes it from the selected capabilities (F.11, Stage 6), reading
  this catalog.
- Pinning a server: decision 55 keeps every command unpinned, and the catalog refuses a version.
- Rewriting the docs a release may make stale: the updater names them, a person or an agent
  re-reads them.
- A scheduled CI job that runs the updater and opens a pull request when a server releases. CI is
  delivery (high-risk item 5), so it waits on the owner (Q1).

## Affected specs

- `openspec/specs/harness/mcp/spec.md` (new): added MCP-01 to MCP-08.

## Open questions

- **Q1** — Should a scheduled CI job run `pnpm mcp:docs` and open a pull request when a server
  releases? It needs network in CI, a token that may open pull requests, and a schedule; the
  updater already exits non-zero on a registry failure and writes nothing when no server
  released, so the job would open a pull request only on a release.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
