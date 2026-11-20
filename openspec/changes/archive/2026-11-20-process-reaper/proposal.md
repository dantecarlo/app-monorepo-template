# Proposal: a reaper for the processes a dead session leaves behind

> **Status:** archived — 2026-11-20

## Why

On Windows a killed parent does not take its children with it. A Claude Code session that
crashes or is restarted, a background shell the harness stops, or a stopped `pnpm validate`
leaves its MCP servers, turbo, the vitest workers, esbuild and `git-remote-https` running with a
dead parent, and those orphans pile up over a day until the machine runs out of memory. Measured
on 2026-11-20 at 11:30, right after a reboot, with nine sessions open: 205 MCP-server processes,
about 23 a session, none an orphan yet; half of their node memory is `npx-cli.js` launchers (44
launchers averaging 93 MB against 45 servers averaging 86 MB), since each `npx -y <pkg>` server is
four processes: `cmd.exe`, `conhost.exe`, the launcher and the server. Nothing in the template
ends an orphan today, and the worktree pruner's bounded `git fetch` stops git alone at its bound,
which leaves the remote helper it started running on Windows.

The owner's words, verbatim:

- 2026-11-20 (translated from Spanish): "Something important that I also want to fix is that a
  great many zombie processes are being left behind, so many that the computer runs out of
  memory. Is there a way to fix it? If there is a way, it has to be done as priority 1".

## What changes

- **The contract.** `.agents/contracts/process-reaper.json` lists the process families the reaper
  may end, each with an `id`, a command-line `pattern` and a `what`, and a `$comment` that says
  why each is safe to end: npx-launched MCP servers and their launchers, the known MCP server
  entrypoints, vitest and tinypool workers, turbo, esbuild, tsc, jest workers, `git-remote-https`,
  and the `cmd.exe` and `conhost.exe` wrappers whose only child is a reapable process. It also
  holds the grace period (60 s), the time bound (8 s) and a `spare` list of the processes it never
  ends, nor any tree that holds one: a daemon detached by design reads as an orphan, and the
  shared MCP proxy `mcp-proxy`, found by the first dry run on 2026-11-20, is its first entry. It
  is a rule file.
- **The reaper.** `scripts/agent-harness/reaper/`: a pure core that takes the process list as
  data, and a thin platform adapter. An orphan is a process whose parent pid names no live
  process, or names one that started after it (a reused pid); on POSIX also one whose parent is
  pid 1 or the user's subreaper. The reaper ends an orphan whose command line matches a family,
  with its whole descendant tree, and never touches its own ancestry, a tree that holds a spared
  process or one younger than the grace period, or anything outside the families. It lists processes with
  `Get-CimInstance Win32_Process` on Windows and `ps` on POSIX, and ends a tree with
  `taskkill /PID <pid> /T /F` on Windows and SIGTERM then SIGKILL after 2 s on POSIX.
- **The commands.** `pnpm reap` is a dry run that prints each candidate (pid, family, age, MB)
  and the total; `pnpm reap:kill` ends them; `--json` prints the plan and `--quiet` only the
  total. It exits 0 when it finished and 1 on a failure, and always ends within its bound: on a
  timeout it ends nothing it has not decided on and exits 1. `pnpm reap:test` runs inside
  `pnpm validate`.
- **The session hook.** A `SessionStart` entry of `.agents/hooks.json` runs
  `scripts/agent-harness/reaper/session-start.mjs`, the reaper in kill mode, quiet, within its
  bound and under a 15 s hook timeout. It never blocks or fails a session: any error prints one
  line to stderr and exits 0. The hook projection learns `SessionStart`, which takes no matcher,
  and renders it into `.claude/settings.json`. Codex and OpenCode are not wired, as for the write
  guard.
- **The tree on a timeout.** `runBounded`, in the reaper's folder, runs a child with a time
  bound and ends the child's whole tree at the bound with `signalProcessTree` of
  `@app/tooling/process-tree`, so `taskkill /T /F` on Windows. The worktree pruner's bounded
  `git fetch` runs through it.
- **The docs.** A `docs/harness.md` section on the reaper, its rows in `docs/code-standards.md`
  § 21 and `docs/maps/global-map.md`, the new living spec and its row in `openspec/README.md`
  § 2.1, and the manifest claims.

- **The verifier's correction (2026-11-20).** An independent verifier found that a family matched
  text anywhere in a command line, so a live Git for Windows shell whose text named turbo was a
  candidate, and that a PreToolUse hook with no matcher lost its error text. A family now matches
  a process's own executable and script; consoles, POSIX shells and the npx launcher are wrappers
  read by what they wrap; Git for Windows processes, tmux and screen are spared; persistent and
  watch work matches no family; a killing run takes a lock and reads each candidate again right
  before its kill; `signalProcessTree` stops taskkill after 5 s; the session hook's timer holds
  the process; and a silent fetch failure names its error or exit code.

## Out of scope

- **An orphan whose parent pid was reused by a process that does not read as newer than it**,
  such as one whose start time the listing cannot read: it is not an orphan to the reaper and
  stays.
- **A runaway that still has its parent**: a live session's own processes are not orphans, however
  much memory they hold.
- **A process outside the families**, an orphaned `pnpm` or shell included: the families change
  only when the owner asks.
- **How a project launches its MCP servers.** Each `npx` launcher is an extra process, but the
  owner rule of 2026-11-15 keeps MCP commands unpinned; that question is F75's.
- **Codex, OpenCode and Copilot**, which run no hook adapter yet.

## Affected specs

- `openspec/specs/harness/process-reaper/spec.md` (new): added REAP-01 to REAP-12.
- `openspec/specs/packages/tooling/spec.md`: modified TOOLING-12 (taskkill stopped after 5 s).

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
