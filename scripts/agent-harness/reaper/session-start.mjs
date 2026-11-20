#!/usr/bin/env node
// ---------------------------------------------------------------------------
// session-start — the Claude Code SessionStart hook of the process reaper,
// wired by `.claude/settings.json`, which `pnpm agent-harness:generate`
// renders from `.agents/hooks.json` (no matcher: every start, resume, clear
// and compaction, under a 15 s hook timeout).
//
// It first runs the MCP check (mcp-check.mjs): when a .mcp.json server that
// runs the launcher has no installed entry, it prints one line naming those
// servers and the install command; it reads two files and stats one per
// server, so it costs milliseconds of the same budget. Then it runs the
// reaper (reap.mjs) with `--kill --quiet`, so every session starts by
// ending the orphan trees the sessions before it left, and prints the one
// total line. Claude Code adds both lines to the session's context. It
// never blocks or fails the session: the check and the reaper are each
// imported inside a `try`, so a module that does not load is one error like
// any other, a check that throws and a reaper that throws, exits 1 or
// outlasts its bound each print one line to stderr, and the hook exits 0
// whatever happened. It reads no stdin.
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

/**
 * Runs the MCP check, then the reaper, once for a starting session and
 * resolves 0, whatever happened. `options` reach the reaper as its injected
 * effects; `checkMcp`, `load`, `boundMs` and the two line writers are
 * injected by tests.
 */
export const sessionStart = async ({
  boundMs,
  checkMcp = checkThisCheckout,
  load = loadReaper,
  options = {},
  stderr,
  stdout
}) => {
  await reportMcp({ checkMcp, stderr, stdout })
  let timer
  try {
    const { contract, runReaper } = await load()
    const errors = []
    const outcome = await Promise.race([
      runReaper({
        ...options,
        argv: [...SESSION_ARGV],
        contract,
        stderr: (line) => errors.push(line),
        stdout
      }),
      // The timer holds the process until the race is decided, so a reaper
      // that hangs on nothing still ends in the line below, never in Node's
      // unsettled-await exit 13; `finally` clears it.
      new Promise((done) => {
        timer = setTimeout(
          () => done(TIMED_OUT),
          boundMs ?? contract.boundSeconds * MS_PER_SECOND + MARGIN_MS
        )
      })
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
