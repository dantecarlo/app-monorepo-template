# Delta: harness/process-reaper

> **Change:** `2026-11-20-mcp-by-area`

The living spec's header gains `scripts/agent-harness/reaper/mcp-check.mjs` in its `Governs` line
at the archive.

## ADDED Requirements

### Requirement: REAP-13 — A session starts by naming the MCP servers that cannot start

The `SessionStart` hook `scripts/agent-harness/reaper/session-start.mjs` SHALL, before the reaper
runs, read the checkout's `.mcp.json` and MCP catalog and, for every `.mcp.json` server whose args
start with `scripts/mcp/launch.mjs`, name a catalog server and whose area the session's
`ATL_MCP_AREA` starts, check that `node_modules/<package>/<entry>` exists; when any is missing it
prints one line naming those servers and `pnpm install --frozen-lockfile`. It prints nothing
without a `.mcp.json` or when every such entry is there. The check and the reaper share one
budget, the reaper's bound plus its margin: a check that outlasts it prints one stderr line and
the reaper does not run, and a check that throws prints one stderr line, the hook exiting 0
either way.

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

#### Scenario: a server its area holds off

- **GIVEN** three missing launcher servers, two of the area `mobile` and one of `web`, and
  `ATL_MCP_AREA` set to `web`, `mobile`, `none` and empty
- **WHEN** the MCP check reads the tree under each
- **THEN** it names the web one, the two mobile ones, nothing, and all three
- **Test:** `scripts/agent-harness/reaper/mcp-check.test.mjs` › "the MCP check leaves out a server whose area ATL_MCP_AREA holds off"

#### Scenario: the hook prints the line

- **GIVEN** a check that returns a line, one that returns nothing and one that throws
- **WHEN** the session-start script runs each, with a reaper that ends nothing
- **THEN** the first prints that line before the reaper's, the second prints only the reaper's,
  the third prints one stderr line, and each returns 0
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "the session hook prints the MCP check's line first, and a check that throws costs one stderr line"

#### Scenario: a check that hangs

- **GIVEN** a check whose promise never settles, and a short budget
- **WHEN** the session-start script runs, in the test's process and then in a process of its own
- **THEN** it prints one stderr line saying the check outlasted the budget, runs no reaper, and
  returns 0, and the process exits 0, never Node's unsettled-await exit 13
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "a hung MCP check ends within the hook's budget, and the hook exits 0"
- **Test:** `scripts/agent-harness/reaper/session-start.test.mjs` › "a hung MCP check still lets the hook process exit 0 with its one line"

## MODIFIED Requirements

### Requirement: REAP-10 — A child stopped at its bound takes its tree with it

`runBounded` SHALL run a command with a time bound and, at the bound, end the child's whole tree
with `signalProcessTree` (`taskkill /T /F` on Windows, the child's signal on POSIX), release its
pipes and read as timed out. The worktree pruner's `git fetch --prune` runs through it, and a
fetch that fails reports git's stderr, else the spawn's error, else its exit code; so does the
plain `pnpm install` the pruner runs in the main checkout after a fast-forward that changed
`pnpm-lock.yaml`, bounded by `PRUNE_WORKTREES_INSTALL_SECONDS` (120 s unless set), which is read
only when such an install is due. An install that fails or times out, or a bound that is not a
positive number when one is due, prints one line with the `pnpm install` to run and leaves the
run's exit code at 0. An install that leaves `pnpm-lock.yaml` changed, by
`git diff --quiet -- pnpm-lock.yaml`, prints one line offering to commit it on a branch or to run
`git restore --source=HEAD -- pnpm-lock.yaml`, which discards the install's lockfile change, and
never `git checkout --`.

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
- **THEN** it fast-forwards, runs `pnpm install` once in the main checkout, with no other
  argument, says so, prints no rewrite line and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "a fast-forward that changes pnpm-lock.yaml runs pnpm install"

#### Scenario: an install that rewrites the lockfile

- **GIVEN** the same checkout, and a `pnpm` that rewrites `pnpm-lock.yaml`
- **WHEN** the pruner runs, and again with `--quiet`
- **THEN** each run leaves the rewritten lockfile as it is, prints exactly one line naming it, the
  choice to commit it on a branch and `git restore --source=HEAD -- pnpm-lock.yaml` with "this
  discards the install's lockfile change", and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an install that rewrites pnpm-lock.yaml says so in one line, under --quiet too, and the run exits 0"

#### Scenario: an install that fails or outlasts its bound

- **GIVEN** the same checkout, and a `pnpm` that exits 1, then one that never ends under
  `PRUNE_WORKTREES_INSTALL_SECONDS=1`
- **WHEN** the pruner runs with `--quiet`
- **THEN** it fast-forwards, prints one line with the exit code or the bound and the
  `pnpm install` to run in the main checkout, and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an install that fails or outlasts PRUNE_WORKTREES_INSTALL_SECONDS names the command to run, and the run exits 0"

#### Scenario: the install bound

- **GIVEN** `PRUNE_WORKTREES_INSTALL_SECONDS` unset, `2.5`, empty, `0` and `ten`
- **WHEN** the pruner reads it
- **THEN** it bounds the install at 120 s and 2.5 s, and throws for the other three, naming the
  variable and the value
- **Test:** `scripts/prune-worktrees.test.mjs` › "the install is bound to 120 s unless PRUNE_WORKTREES_INSTALL_SECONDS names another positive number"

#### Scenario: a bound that is not a number, read only when an install is due

- **GIVEN** `PRUNE_WORKTREES_INSTALL_SECONDS` set to `0`, `ten` and empty over a fast-forward that
  leaves `pnpm-lock.yaml` as it was, then to `0` over one that changes it
- **WHEN** the pruner runs each
- **THEN** the first three fast-forward, print exactly the lines a run without the install prints
  and exit 0; the last fast-forwards, runs no `pnpm`, prints the line naming the variable and
  `pnpm install`, and exits 0
- **Test:** `scripts/prune-worktrees.test.mjs` › "an invalid PRUNE_WORKTREES_INSTALL_SECONDS is read only when an install is due"
