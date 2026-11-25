# Verify report: 2026-11-20-mcp-by-area

> **Verified:** 2026-11-25 at `3c84555`

## Scenarios

Every test ran green at `3c84555`: `pnpm verify:mcp-docs:test` 42 of 42 (36 before the change),
`pnpm mcp:docs:test` 12 of 12 (11 before), `pnpm mcp:launch:test` 8 of 8 (new),
`node --test scripts/prune-worktrees.test.mjs` 87 of 87 (81 before) and `pnpm reap:test` 99 of 99
(96 before).

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| MCP-01 | an entry runs npx | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that runs npx is refused" | green |
| MCP-01 | an entry has no version | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no version is refused" | green |
| MCP-01 | a version that is not exact | `scripts/verify-mcp-docs.test.mjs` › "a catalog version that is a range, latest or a tag is refused" | green |
| MCP-01 | an entry has no area | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no area is refused" | green |
| MCP-01 | an area outside the set | `scripts/verify-mcp-docs.test.mjs` › "a catalog area other than web or mobile is refused" | green |
| MCP-01 | the args do not run the launcher | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose args do not run the launcher with its own name is refused" | green |
| MCP-01 | an entry that leaves its package | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose entry leaves its package is refused" | green |
| MCP-01 | a command other than node | `scripts/verify-mcp-docs.test.mjs` › "a catalog npm server whose command is not node is refused" | green |
| MCP-01 | an entry passes its own arguments to the server | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with its own server args passes" | green |
| MCP-01 | server args that are not a list of words | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose server args are not a list of words is refused" | green |
| MCP-01 | an entry names a doc that is gone | `scripts/verify-mcp-docs.test.mjs` › "a catalog doc that does not exist is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a missing catalog is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog that is not JSON is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog with no servers array is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry that is not an object is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry without its fields is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog package that is not an npm name is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry with no docs list is refused" | green |
| MCP-01 | a malformed catalog | `scripts/verify-mcp-docs.test.mjs` › "a server listed twice in the catalog is refused" | green |
| MCP-02 | a project adds a server of its own | `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server outside the catalog is listed" | green |
| MCP-02 | a project server launched from node_modules | `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server launched from node_modules is listed with its package" | green |
| MCP-02 | a .mcp.json server through the launcher | `scripts/update-mcp-docs.test.mjs` › "a .mcp.json server that runs the launcher is listed with its catalog package" | green |
| MCP-02 | a server that is not an npm package | `scripts/update-mcp-docs.test.mjs` › "a non-npm command is listed as not on npm" | green |
| MCP-03 | one pin changed | `scripts/update-mcp-docs.test.mjs` › "a changed pin rewrites its row and prints the review paths" | green |
| MCP-06 | a server added to the catalog | `scripts/verify-mcp-docs.test.mjs` › "a catalog server missing from the block fails" | green |
| MCP-06 | a server removed from the catalog | `scripts/verify-mcp-docs.test.mjs` › "a block server the catalog no longer has fails" | green |
| MCP-06 | a server only in .mcp.json | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server missing from the block fails" | green |
| MCP-06 | a .mcp.json server the block already lists | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json server the block lists passes, on npm or not" | green |
| MCP-06 | a catalog server of .mcp.json through the launcher | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json catalog server that runs the launcher passes" | green |
| MCP-06 | a catalog server of .mcp.json outside the launcher | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json catalog server that does not run the launcher is refused" | green |
| MCP-06 | a launcher entry that names no catalog server | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json launcher entry that names no catalog server is refused" | green |
| MCP-06 | a package or a capability changed | `scripts/verify-mcp-docs.test.mjs` › "a package that differs from the catalog fails" | green |
| MCP-06 | a package or a capability changed | `scripts/verify-mcp-docs.test.mjs` › "a capability that differs from the catalog fails" | green |
| MCP-06 | a pin or a command changed | `scripts/verify-mcp-docs.test.mjs` › "a block whose pinned version differs from the catalog fails" | green |
| MCP-06 | a pin or a command changed | `scripts/verify-mcp-docs.test.mjs` › "a block whose command differs from the catalog fails" | green |
| MCP-06 | a .mcp.json the gate cannot read | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json that is not JSON is refused" | green |
| MCP-06 | a .mcp.json the gate cannot read | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json with no mcpServers object is refused" | green |
| MCP-06 | the gate as a process | `scripts/verify-mcp-docs.test.mjs` › "the gate exits 1 and names the server the block is missing" | green |
| MCP-10 | the gate as a function | `scripts/mcp/launch.test.mjs` › "the area gate starts a server when ATL_MCP_AREA is unset, empty or names its area, and holds it otherwise" | green |
| MCP-10 | a server outside the session's area | `scripts/mcp/launch.test.mjs` › "a server outside ATL_MCP_AREA exits 0 at once with one line naming it and its area" | green |
| MCP-11 | the fixture entry records what it ran with | `scripts/mcp/launch.test.mjs` › "the launcher imports the pinned entry in its own process with the server's argv" | green |
| MCP-11 | every real catalog entry | `scripts/mcp/launch.test.mjs` › "every catalog server resolves to its entry file inside its package" | green |
| MCP-11 | a real server starts | Not covered | not run |
| MCP-12 | an unknown name | `scripts/mcp/launch.test.mjs` › "an unknown server name exits 1, naming it and the command to run" | green |
| MCP-12 | an entry that is not installed | `scripts/mcp/launch.test.mjs` › "a server whose entry is not installed exits 1, naming it and pnpm install --frozen-lockfile" | green |
| REAP-10 | the bound | `scripts/agent-harness/reaper/bounded-child.test.mjs` › "a child that outlasts its bound has its tree ended and reads as timed out" | green |
| REAP-10 | a real tree on Windows | `scripts/agent-harness/reaper/bounded-child.test.mjs` › "on Windows a child stopped at its bound takes the process it started with it" | green |
| REAP-10 | the pruner's fetch on Windows | `scripts/prune-worktrees.test.mjs` › "on Windows a fetch stopped at its bound ends the processes git started" | green |
| REAP-10 | a silent fetch failure | `scripts/prune-worktrees.test.mjs` › "a fetch that fails with nothing on stderr names its error or its exit code, never undefined" | green |
| REAP-10 | an install after a fast-forward that changed the lockfile | `scripts/prune-worktrees.test.mjs` › "a fast-forward that changes pnpm-lock.yaml runs pnpm install --frozen-lockfile --offline" | green |
| REAP-10 | an install that fails or outlasts its bound | `scripts/prune-worktrees.test.mjs` › "an install that fails or outlasts PRUNE_WORKTREES_INSTALL_SECONDS names the command to run, and the run exits 0" | green |
| REAP-10 | the install bound | `scripts/prune-worktrees.test.mjs` › "the install is bound to 120 s unless PRUNE_WORKTREES_INSTALL_SECONDS names another positive number" | green |
| REAP-13 | entries that are missing | `scripts/agent-harness/reaper/mcp-check.test.mjs` › "the MCP check names every launcher server whose entry is missing, and the install command" | green |
| REAP-13 | nothing to say | `scripts/agent-harness/reaper/mcp-check.test.mjs` › "the MCP check says nothing without a .mcp.json, or when every entry is installed" | green |
| REAP-13 | the hook prints the line | `scripts/agent-harness/reaper/session-start.test.mjs` › "the session hook prints the MCP check's line first, and a check that throws costs one stderr line" | green |

Tests with no scenario of their own, pinning what the install does around the requirement: "a dry
run says it would install after a fast-forward that changes pnpm-lock.yaml, and installs nothing",
"under --quiet an install that succeeds prints no line of its own", "a fast-forward that leaves
pnpm-lock.yaml as it was installs nothing and prints what it printed before" and "the launcher
starts a server whose area ATL_MCP_AREA names", all green.

## Gate

- `pnpm validate`: not run. The owner's brief for this change said not to run `pnpm validate` or
  the turbo suite. Run instead, at `3c84555`, each exit 0: `pnpm verify:mcp-docs:test`,
  `pnpm verify:mcp-docs`, `pnpm mcp:docs:test`, `pnpm mcp:launch:test`,
  `node --test scripts/prune-worktrees.test.mjs`, `pnpm reap:test`, `pnpm agent-harness:test`,
  `pnpm agent-harness:projection-check`, `pnpm write-guard:test`, `pnpm verify:english`,
  `pnpm verify:manifest:coverage`, `pnpm knip`, and `pnpm exec eslint` on every changed `.mjs`
  file. `pnpm verify:specs` exited 1 before the archive, on the two test titles of MCP-01 this
  change renames, as expected, and is run again after it.
- A base-versus-head run of the pruner over the same scratch repositories, with a fast-forward
  that leaves `pnpm-lock.yaml` as it was, printed byte-identical stdout and stderr and the same
  exit code, in the real run, `--dry-run` and `--quiet`.

## Not verified

- MCP-11 "a real server starts": the template installs none of the catalog servers, so no real
  server was started through the launcher. A server whose entry starts only as the main module
  (`import.meta.main`, `require.main === module`) would be imported and not start; no entry was
  checked for it.
- Whether Claude Code passes the session's environment, `ATL_MCP_AREA` with it, to a stdio
  server: not checked live; `docs/mcp.md` names the `.mcp.json` `env` forward for a client that
  does not.
- The shared documentation servers through mcp-proxy: documented only; nothing here runs it.
- The install after a fast-forward was run against a recording `pnpm`, never a real
  `pnpm install --frozen-lockfile --offline`.

## The verifier's correction

The independent verifier of `e644a66f` found no blocker, one real limitation and five advisories,
fixed in `2e1d1745`, each test seen red for its stated reason first:

| Requirement | Finding | Test | RED before the fix | Result |
| ----------- | ------- | ---- | ------------------ | ------ |
| MCP-06 | expo-mcp 0.2.4 exits 1 without `--dev-server-url`, and the gate refused args after the name | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json catalog server that passes its own args after the name passes" | refused: "a catalog server runs `node scripts/mcp/launch.mjs expo`" | green |
| MCP-06 | no name, a wrong name and a non-string arg still refused | `scripts/verify-mcp-docs.test.mjs` › "a .mcp.json launcher entry that names no catalog server is refused" | "no name is none", and `42` accepted | green |
| MCP-11 | the launcher appends the args after the name | `scripts/mcp/launch.test.mjs` › "the launcher imports the pinned entry in its own process with the server's argv" | argv ended at `--stdio` | green |
| MCP-10 | unknown words of `ATL_MCP_AREA` are named | `scripts/mcp/launch.test.mjs` › "an unknown area in ATL_MCP_AREA is named on stderr with the valid ones, and the gate decides as before" | no line naming them | green |
| MCP-10 | the verifier's probe | `scripts/mcp/launch.test.mjs` › "the area gate holds every server for a list of unknown words, and starts all for separators alone" | green from the start: it pins the behaviour | green |
| MCP-01 | an `entry` naming a directory failed only at run time | `scripts/verify-mcp-docs.test.mjs` › "a catalog entry whose entry is not a .js, .mjs or .cjs file is refused" | 0 findings, 2 expected | green |
| REAP-10 | a bad install bound aborted the whole prune | `scripts/prune-worktrees.test.mjs` › "an invalid PRUNE_WORKTREES_INSTALL_SECONDS is read only when an install is due" | exit 1, "must be a positive number of seconds, not \"0\" — nothing was removed." | green |
| REAP-13 | the check ran outside the budget | `scripts/agent-harness/reaper/session-start.test.mjs` › "a hung MCP check ends within the hook's budget, and the hook exits 0" | timed out at 10 s | green |
| REAP-13 | the same, in a process of its own | `scripts/agent-harness/reaper/session-start.test.mjs` › "a hung MCP check still lets the hook process exit 0 with its one line" | no exit 0 | green |
| REAP-13 | the check reported servers the area holds off | `scripts/agent-harness/reaper/mcp-check.test.mjs` › "the MCP check leaves out a server whose area ATL_MCP_AREA holds off" | named expo and metro under `web` | green |

At `2e1d1745`: `pnpm mcp:launch:test` 10 of 10, `pnpm verify:mcp-docs:test` 44 of 44,
`node --test scripts/prune-worktrees.test.mjs` 88 of 88, `pnpm reap:test` 102 of 102.
