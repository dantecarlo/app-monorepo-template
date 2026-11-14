// ---------------------------------------------------------------------------
// Ends a child process together with every process it started.
//
// A child spawned with TREE_SPAWN_OPTIONS leads its own process group on
// POSIX, and a negative pid signals the whole group. Windows has no groups
// and delivers no TERM to a native process: `taskkill /T /F` ends the tree at
// once. A plain `child.kill()` reaches the child alone on Windows: a
// grandchild keeps running and keeps the child's pipes open.
// ---------------------------------------------------------------------------

import { execFile, execFileSync } from 'node:child_process'

const WINDOWS_PLATFORM = 'win32'
const IS_WINDOWS = process.platform === WINDOWS_PLATFORM
const PROCESS_TREE_KILLER = 'taskkill'
const NO_SIGNAL = 0
const PERMISSION_DENIED = 'EPERM'

/** Spread into `spawn` options for a child whose tree may need ending. */
export const TREE_SPAWN_OPTIONS = Object.freeze({ detached: !IS_WINDOWS })

// Signal 0 tests whether a process exists without signalling it.
const isRunning = ({ pid }) => {
  try {
    process.kill(pid, NO_SIGNAL)
    return true
  } catch (error) {
    return error.code === PERMISSION_DENIED
  }
}

/**
 * Signals `child` and its descendants; Windows ends them whatever `signal`.
 * With `wait`, the call returns once Windows' taskkill has, and the tree has
 * ended; without it, taskkill runs in the background. An `exit` handler
 * completes only synchronous work.
 *
 * Returns false only when the tree could not be signalled and the child is
 * still running; a child that never started, or already ended, returns true.
 */
export const signalProcessTree = ({ child, signal, wait = false }) => {
  if (child.pid === undefined) return true
  if (IS_WINDOWS) {
    const args = ['/pid', String(child.pid), '/T', '/F']
    if (!wait) {
      execFile(PROCESS_TREE_KILLER, args, { windowsHide: true }, () => {})
      return true
    }
    try {
      execFileSync(PROCESS_TREE_KILLER, args, {
        stdio: 'ignore',
        windowsHide: true
      })
      return true
    } catch {
      // taskkill also fails on a tree that already ended.
      return !isRunning({ pid: child.pid })
    }
  }
  try {
    process.kill(-child.pid, signal)
    return true
  } catch {
    return child.kill(signal) || !isRunning({ pid: child.pid })
  }
}
