#!/usr/bin/env node
// ---------------------------------------------------------------------------
// session-start — the Claude Code SessionStart hook of the process reaper,
// wired by `.claude/settings.json`, which `pnpm agent-harness:generate`
// renders from `.agents/hooks.json` (no matcher: every start, resume, clear
// and compaction, under a 15 s hook timeout).
//
// It runs the reaper (reap.mjs) with `--kill --quiet`, so every session
// starts by ending the orphan trees the sessions before it left, and prints
// the one total line, which Claude Code adds to the session's context. It
// never blocks or fails the session: the reaper is imported inside a `try`,
// so a module that does not load is one error like any other, a reaper that
// throws, exits 1 or outlasts its bound prints one line to stderr, and the
// hook exits 0 whatever happened. It reads no stdin.
//
// Usage (Claude Code runs it):
//   node "${CLAUDE_PROJECT_DIR}/scripts/agent-harness/reaper/session-start.mjs"
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OWN_ROOT = resolve(HERE, '..', '..', '..')
const LABEL = 'reap'
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

const oneLine = ({ code, lines }) => {
  if (lines.length === 0) {
    return `${LABEL}: the session-start reaper exited ${code}; the session goes on`
  }
  return lines.length === 1
    ? lines[0]
    : `${lines[0]} (and ${lines.length - 1} more)`
}

/**
 * Runs the reaper once for a starting session and resolves 0, whatever
 * happened. `options` reach the reaper as its injected effects; `load`,
 * `boundMs` and the two line writers are injected by tests.
 */
export const sessionStart = async ({
  boundMs,
  load = loadReaper,
  options = {},
  stderr,
  stdout
}) => {
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
