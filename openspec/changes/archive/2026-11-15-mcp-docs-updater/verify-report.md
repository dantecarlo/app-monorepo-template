# Verify report: 2026-11-15-mcp-docs-updater

> **Verified:** 2026-11-15 at `b88d592`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `c1c0224`, and again over the
archive on top of `b88d592` (which only rewords the gate's claim): `mcp:docs:test` 6 of 6,
`verify:mcp-docs:test` 21 of 21.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| MCP-01 | an entry pins its version | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that pins its version is refused" | green |
| MCP-01 | an entry passes its own arguments to the server | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with server args after its package passes" | green |
| MCP-01 | an entry pins its version before its arguments | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that pins its version before its server args is refused" | green |
| MCP-01 | an entry runs no package | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that runs no package is refused" | green |
| MCP-01 | an entry names a doc that is gone | `scripts/verify-mcp-docs.test.mjs` › "a catalog doc that does not exist is refused" | green |
| MCP-02 | a project adds a server of its own | `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server outside the catalog is listed" | green |
| MCP-02 | a server that is not an npm package | `scripts/update-mcp-docs.test.mjs` › "a non-npm command is listed as not on npm" | green |
| MCP-03 | one server released | `scripts/update-mcp-docs.test.mjs` › "a new version rewrites the block and prints the review paths" | green |
| MCP-04 | a second run on a later day | `scripts/update-mcp-docs.test.mjs` › "an unchanged version writes nothing" | green |
| MCP-05 | the registry fails for one server | `scripts/update-mcp-docs.test.mjs` › "a registry failure leaves the doc byte-identical and exits non-zero" | green |
| MCP-05 | the doc has lost its markers | `scripts/update-mcp-docs.test.mjs` › "the command exits 1 and requests nothing when the doc has no generated block" | green |
| MCP-06 | a server added to the catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog server missing from the block fails" | green |
| MCP-06 | a server removed from the catalog | `scripts/verify-mcp-docs.test.mjs` › "a block server the catalog no longer has fails" | green |
| MCP-06 | a server only in .mcp.json | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server missing from the block fails" | green |
| MCP-06 | a .mcp.json server the block already lists | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server the block lists passes, on npm or not" | green |
| MCP-06 | a package or a capability changed | `scripts/verify-mcp-docs.test.mjs` › "a package that differs from the catalog fails", "a capability that differs from the catalog fails" | green |
| MCP-06 | the gate as a process | `scripts/verify-mcp-docs.test.mjs` › "the gate exits 1 and names the server the block is missing" | green |
| MCP-07 | a version typed by hand | `scripts/verify-mcp-docs.test.mjs` › "a version edited by hand fails" | green |
| MCP-07 | a note typed inside the block | `scripts/verify-mcp-docs.test.mjs` › "a line added by hand inside the block fails" | green |
| MCP-07 | a block the updater never wrote | `scripts/verify-mcp-docs.test.mjs` › "a block the updater never wrote fails" | green |
| MCP-07 | the markers are gone | `scripts/verify-mcp-docs.test.mjs` › "a doc without the generated block fails" | green |
| MCP-08 | an old version the updater wrote | `scripts/verify-mcp-docs.test.mjs` › "a block the updater wrote passes, whatever versions it holds" | green |
| MCP-08 | a Windows checkout | `scripts/verify-mcp-docs.test.mjs` › "a block checked out with CRLF line endings passes" | green |
| MCP-08 | no request leaves the gate | `scripts/verify-mcp-docs.test.mjs` › "the gate makes no network request" | green |
| MCP-08 | a green states what it judged | `scripts/verify-mcp-docs.test.mjs` › "the gate exits 0 over a block the updater wrote and states what it judged" | green |

Each test was seen red first:

- The updater's five in-process tests and its process test ran red against a stub that wrote
  nothing (no row, exit 0 where 1 was due, the registry never asked). "an unchanged version
  writes nothing" ran red against a planner that rewrites every row's date: the doc's bytes
  changed. The first real run found a failed run printing "(unchanged)" for a changed version; the
  assertion on "(was 0.3.0)" ran red, then green.
- The gate's red cases ran red against a stub that finds nothing (0 findings each), its process
  checks exited 0 and printed no denominator, "the gate makes no network request" ran red with a
  planted `fetch`, "a block the updater never wrote fails" ran red on the hand-edit message, and
  "a catalog entry with server args after its package passes" ran red on the rule it replaced
  ("shadcn runs npx -y shadcn mcp; a catalog command is the unpinned npx -y shadcn"). The
  cases that pass are not red against a stub by construction; "every case fails against a
  blinded gate" proves the red cases assert something.

## The real registry runs

- **2026-11-15, first run** (at `f0ad721`): exit 1. It found `expo-mcp` 0.2.4, `metro-mcp`
  0.15.0, `next-devtools-mcp` 0.4.0 and `react-native-docs-mcp` 0.2.1, and the registry answered
  `@shadcn/mcp-server` with `404 Not Found`, so `docs/mcp.md` was left untouched. The entry moved
  to `npx -y shadcn mcp` (`29ceea0`, proposal Q2).
- **2026-11-15, second run** (at `e1f8967`): exit 0, and it wrote the block committed in
  `c1c0224`:

| Server            | Package                 | Latest | Published  |
| ----------------- | ----------------------- | ------ | ---------- |
| expo              | `expo-mcp`              | 0.2.4  | 2026-02-12 |
| metro             | `metro-mcp`             | 0.15.0 | 2026-09-04 |
| next-devtools     | `next-devtools-mcp`     | 0.4.0  | 2026-06-24 |
| react-native-docs | `react-native-docs-mcp` | 0.2.1  | 2026-07-06 |
| shadcn            | `shadcn`                | 4.23.0 | 2026-10-27 |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-15, at `c1c0224` (turbo 24 of 24 tasks;
  `verify:mcp-docs` judged 5 servers of the catalog and .mcp.json against 5 rows; `verify:tests`
  judged 177 test files and 81 units; `report:spec-drift` listed 0 of 8 specs; `knip` green).

## Not verified

- The "What it is for" column of `docs/mcp.md` is written from each package's name, Certifipago's
  choice and, for shadcn, its vendored MCP doc; no upstream README was read.
- A `.mcp.json` server whose name holds a `|` would break the block's table; no project has one,
  and no test covers it.
- A digest recomputed by hand passes the gate; the pull request review reads the block's diff.
