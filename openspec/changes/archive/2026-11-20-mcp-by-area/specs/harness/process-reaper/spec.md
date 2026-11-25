# Delta: harness/process-reaper

> **Change:** `2026-11-20-mcp-by-area`

The living spec's header gains `scripts/agent-harness/reaper/mcp-check.mjs` in its `Governs` line
at the archive.

## ADDED Requirements

### Requirement: REAP-13 — A session starts by naming the MCP servers that cannot start

The `SessionStart` hook `scripts/agent-harness/reaper/session-start.mjs` SHALL, before the reaper
runs and inside the same budget, read the checkout's `.mcp.json` and MCP catalog and, for every
`.mcp.json` server whose args start with `scripts/mcp/launch.mjs` and name a catalog server, check
that `node_modules/<package>/<entry>` exists; when any is missing it prints one line naming those
servers and `pnpm install --frozen-lockfile`. It prints nothing without a `.mcp.json` or when every
entry is there, and a check that throws prints one line to stderr, the hook still exiting 0.

**Evidence:** written at apply time, when the code exists.

#### Scenario: entries that are missing

- **GIVEN** a `.mcp.json` with three launcher servers, one of them installed, a server that runs
  `npx` and a remote URL, and the catalog of the three
- **WHEN** the MCP check reads the tree
- **THEN** it returns one line naming the two missing servers, in order, and
  `pnpm install --frozen-lockfile`, and nothing about the other two servers
- **Test:** `scripts/agent-harness/reaper/mcp-check.test.mjs` › "the MCP check names every launcher server whose entry is missing, and the install command"

#### Scenario: nothing to say

- **GIVEN** a tree with no `.mcp.json`, and one whose every launcher server is installed
- **WHEN** the MCP check reads each
- **THEN** it returns nothing for both
- **Test:** `scripts/agent-harness/reaper/mcp-check.test.mjs` › "the MCP check says nothing without a .mcp.json, or when every entry is installed"

#### Scenario: the hook prints the line

- **GIVEN** a check that returns a line, one that returns nothing and one that throws
- **WHEN** the session-start script runs each, with a reaper that ends nothing
- **THEN** the first prints that line before the reaper's, the second prints only the reaper's,
  the third prints one stderr line, and each returns 0
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "the session hook prints the MCP check's line first, and a check that throws costs one stderr line"

## MODIFIED Requirements

### Requirement: REAP-10 — A child stopped at its bound takes its tree with it

`runBounded` SHALL run a command with a time bound and, at the bound, end the child's whole tree
with `signalProcessTree` (`taskkill /T /F` on Windows, the child's signal on POSIX), release its
pipes and read as timed out. The worktree pruner's `git fetch --prune` runs through it, and a
fetch that fails reports git's stderr, else the spawn's error, else its exit code; so does the
`pnpm install --frozen-lockfile --offline` the pruner runs after a fast-forward that changed
`pnpm-lock.yaml`, bounded by `PRUNE_WORKTREES_INSTALL_SECONDS` (120 s unless set), whose failure or
timeout prints one line with the exact `pnpm install --frozen-lockfile` to run and leaves the
run's exit code at 0.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the bound

- **GIVEN** an injected child that never ends
- **WHEN** `runBounded` reaches its bound
- **THEN** it asked for the child's tree to end and returned timed out
- **Test:** `scripts/agent-harness/reaper/bounded-child.test.mjs` › "a child that outlasts its bound has its tree ended and reads as timed out"

#### Scenario: a real tree on Windows

- **GIVEN** a node child that starts a node grandchild and waits
- **WHEN** `runBounded` reaches its bound on Windows
- **THEN** both the child and the grandchild have ended
- **Test:** `scripts/agent-harness/reaper/bounded-child.test.mjs` › "on Windows a child stopped at its bound takes the process it started with it"

#### Scenario: the pruner's fetch on Windows

- **GIVEN** a clone whose remote runs an ssh command that never answers
- **WHEN** the pruner's fetch is stopped at its bound on Windows
- **THEN** the run skips and exits 0, and the ssh command git started has ended
- **Test:** `scripts/prune-worktrees.test.mjs` › "on Windows a fetch stopped at its bound ends the processes git started"

#### Scenario: a silent fetch failure

- **GIVEN** a fetch that exits 128 with nothing on stderr, and one that never started
- **WHEN** the pruner builds its error
- **THEN** it names `exited 128` and the spawn's error, never `undefined`
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fetch that fails with nothing on stderr names its error or its exit code, never undefined"

#### Scenario: an install after a fast-forward that changed the lockfile

- **GIVEN** a main checkout one commit behind, whose next commit changes `pnpm-lock.yaml`, and a
  `pnpm` on the path that records its arguments
- **WHEN** the pruner runs
- **THEN** it fast-forwards, runs `pnpm install --frozen-lockfile --offline` once in the main
  checkout, says so and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fast-forward that changes pnpm-lock.yaml runs pnpm install --frozen-lockfile --offline"

#### Scenario: an install that fails or outlasts its bound

- **GIVEN** the same checkout, and a `pnpm` that exits 1, then one that never ends under
  `PRUNE_WORKTREES_INSTALL_SECONDS=1`
- **WHEN** the pruner runs with `--quiet`
- **THEN** it fast-forwards, prints one line with the exit code or the bound and
  `pnpm install --frozen-lockfile`, and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an install that fails or outlasts PRUNE_WORKTREES_INSTALL_SECONDS names the command to run, and the run exits 0"

#### Scenario: the install bound

- **GIVEN** `PRUNE_WORKTREES_INSTALL_SECONDS` unset, `2.5`, empty, `0` and `ten`
- **WHEN** the pruner reads it
- **THEN** it bounds the install at 120 s and 2.5 s, and throws for the other three, naming the
  variable and the value
- **Test:** `scripts/prune-worktrees.test.mjs` › "the install is bound to 120 s unless PRUNE_WORKTREES_INSTALL_SECONDS names another positive number"
