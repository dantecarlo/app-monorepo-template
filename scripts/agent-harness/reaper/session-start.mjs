#!/usr/bin/env node
// ---------------------------------------------------------------------------
// session-start — the Claude Code SessionStart hook of the process reaper,
// wired by `.claude/settings.json`, which `pnpm agent-harness:generate`
// renders from `.agents/hooks.json` (no matcher: every start, resume, clear
// and compaction, under a 15 s hook timeout).
//
// It first runs the MCP check (mcp-check.mjs): when a .mcp.json server that
// runs the launcher, and that the session's ATL_MCP_AREA starts, has no
// installed entry, it prints one line naming those servers and the install
// command. Then it runs the reaper (reap.mjs) with `--kill --quiet`, so
// every session starts by ending the orphan trees the sessions before it
// left, and prints the one total line. Claude Code adds both lines to the
// session's context. The check and the reaper share one budget, the
// reaper's bound (8 s) plus a margin: a check that outlasts it prints one
// line and the reaper does not run. It never blocks or fails the session:
// the check and the reaper are each imported inside a `try`, so a module
// that does not load is one error like any other, a check that throws or
// hangs and a reaper that throws, exits 1 or outlasts its bound each print
// one line to stderr, and the hook exits 0 whatever happened. It reads no
// stdin.
//
// Usage (Claude Code runs it):
//   node "${CLAUDE_PROJECT_DIR}/scripts/agent-harness/reaper/session-start.mjs"
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OWN_ROOT = resolve(HERE, '..', '..', '..')
const LABEL = 'reap'
const MCP_LABEL = 'mcp-check'
const MS_PER_SECOND = 1000
// The reaper ends itself at its bound; this margin is the hook's own last
// word past it, well inside the 15 s hook timeout.
const MARGIN_MS = 1000
const TIMED_OUT = Symbol('timed out')
// The reaper's bound when its contract does not load: the one the committed
// contract holds, so the check is bounded even then.
const FALLBACK_BOUND_SECONDS = 8
const HUNG_CHECK =
  `${MCP_LABEL}: the session-start MCP check outlasted the hook's budget, ` +
  'so the reaper did not run; the session goes on'
const EXIT_OK = 0

export const SESSION_ARGV = Object.freeze(['--kill', '--quiet'])

/** The contract of this checkout and the reaper's entry point. */
export const loadReaper = async () => {
  const { loadContract } = await import('./contract.mjs')
  const { runReaper } = await import('./reap.mjs')
  return { contract: loadContract({ root: OWN_ROOT }), runReaper }
}

/** The MCP check of this checkout: its one line, or null. */
export const checkThisCheckout = async () => {
  const { mcpCheckLine } = await import('./mcp-check.mjs')
  return mcpCheckLine({ root: OWN_ROOT })
}

// Prints the MCP check's line, if any; a check that throws is one stderr
// line.
const reportMcp = async ({ checkMcp, stderr, stdout }) => {
  try {
    const line = await checkMcp()
    if (line) stdout(line)
  } catch (error) {
    stderr(
      `${MCP_LABEL}: the session-start MCP check failed ` +
        `(${String(error?.message ?? error)}); the session goes on`
    )
  }
}

const oneLine = ({ code, lines }) => {
  if (lines.length === 0) {
    return `${LABEL}: the session-start reaper exited ${code}; the session goes on`
  }
  return lines.length === 1
    ? lines[0]
    : `${lines[0]} (and ${lines.length - 1} more)`
}

// The reaper's module and contract, or the error that kept them from
// loading, which the reaper's turn reports after the MCP check ran.
const tryLoad = async ({ load }) => {
  try {
    return { loaded: await load() }
  } catch (error) {
    return { loadError: error }
  }
}

/**
 * Runs the MCP check, then the reaper, once for a starting session, both
 * inside one budget, and resolves 0, whatever happened. `options` reach
 * the reaper as its injected effects; `checkMcp`, `load`, `boundMs` and the
 * two line writers are injected by tests.
 */
export const sessionStart = async ({
  boundMs,
  checkMcp = checkThisCheckout,
  load = loadReaper,
  options = {},
  stderr,
  stdout
}) => {
  const { loaded, loadError } = await tryLoad({ load })
  let timer
  // The timer holds the process until each race is decided, so a check or
  // a reaper that hangs on nothing still ends in its line, never in Node's
  // unsettled-await exit 13; `finally` clears it.
  const deadline = new Promise((done) => {
    timer = setTimeout(
      () => done(TIMED_OUT),
      boundMs ??
        (loaded?.contract.boundSeconds ?? FALLBACK_BOUND_SECONDS) *
          MS_PER_SECOND +
          MARGIN_MS
    )
  })
  try {
    const checked = await Promise.race([
      reportMcp({ checkMcp, stderr, stdout }),
      deadline
    ])
    if (checked === TIMED_OUT) {
      stderr(HUNG_CHECK)
      return EXIT_OK
    }
    if (loadError) throw loadError
    const { contract, runReaper } = loaded
    const errors = []
    const outcome = await Promise.race([
      runReaper({
        ...options,
        argv: [...SESSION_ARGV],
        contract,
        stderr: (line) => errors.push(line),
        stdout
      }),
      deadline
    ])
    if (outcome === TIMED_OUT) {
      stderr(`${LABEL}: the session-start reaper outlasted its bound; the session goes on`)
    } else if (outcome !== EXIT_OK || errors.length > 0) {
      stderr(oneLine({ code: outcome, lines: errors }))
    }
  } catch (error) {
    stderr(
      `${LABEL}: the session-start reaper failed ` +
        `(${String(error?.message ?? error)}); the session goes on`
    )
  } finally {
    clearTimeout(timer)
  }
  return EXIT_OK
}

if (import.meta.main) {
  process.exitCode = await sessionStart({
    stderr: (line) => process.stderr.write(`${line}\n`),
    stdout: (line) => process.stdout.write(`${line}\n`)
  })
}
