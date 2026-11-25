// ---------------------------------------------------------------------------
// lock — one killing reaper at a time. Every Claude Code session runs the
// reaper at its start, and several sessions start together, so a run that
// ends processes first creates a lock file under the OS temp directory,
// exclusively, holding its pid and a token unique to that acquisition; a
// run that finds one held exits at once.
//
// A lock older than 30 s belongs to a reaper that died, since a reaper ends
// within its 8 s bound. It is taken over only under a guard, `<lock>.guard`,
// created exclusively beside it, and only when it is still stale under that
// guard: two runs that both read it as stale never both take it. A guard
// older than 30 s was left by a reaper that died holding it; the run that
// finds it removes it, only while it still holds what that run read, and
// takes nothing, so the next run takes the lock. A release removes the lock
// only while it still holds its own token, never a lock a later run took.
// ---------------------------------------------------------------------------

import { randomUUID } from 'node:crypto'
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const LOCK_PATH = join(tmpdir(), 'atl-process-reaper.lock')

const STALE_MS = 30_000
const GUARD_SUFFIX = '.guard'
const ENCODING = 'utf8'
const EXISTS = 'EEXIST'
const GONE = 'ENOENT'
const NODE_FS = Object.freeze({ readFileSync, rmSync, statSync, writeFileSync })

// Creates `path` with `text`, exclusively: false when it already exists.
const create = ({ fs, path, text }) => {
  try {
    fs.writeFileSync(path, text, { flag: 'wx' })
    return true
  } catch (error) {
    if (error.code === EXISTS) return false
    throw error
  }
}

const readOrNull = ({ fs, path }) => {
  try {
    return fs.readFileSync(path, ENCODING)
  } catch (error) {
    if (error.code === GONE) return null
    throw error
  }
}

// A file that is gone reads as stale: nobody holds it.
const isStale = ({ fs, now, path }) => {
  try {
    return now() - fs.statSync(path).mtimeMs > STALE_MS
  } catch (error) {
    if (error.code === GONE) return true
    throw error
  }
}

// Removes `path` only while it still holds `text`.
const removeIfHolds = ({ fs, path, text }) => {
  if (readOrNull({ fs, path }) === text) fs.rmSync(path, { force: true })
}

const heldAt = ({ fs, path, text }) => ({
  release: () => removeIfHolds({ fs, path, text })
})

// A guard a reaper that died left behind is removed, only while it holds
// what this run read of it; a live one is another run's takeover.
const clearDeadGuard = ({ fs, guard, now }) => {
  const seen = readOrNull({ fs, path: guard })
  if (seen === null || !isStale({ fs, now, path: guard })) return
  removeIfHolds({ fs, path: guard, text: seen })
}

const takeOver = ({ fs, now, path, text }) => {
  const guard = `${path}${GUARD_SUFFIX}`
  if (!create({ fs, path: guard, text })) {
    clearDeadGuard({ fs, guard, now })
    return null
  }
  try {
    if (!isStale({ fs, now, path })) return null
    fs.rmSync(path, { force: true })
    return create({ fs, path, text }) ? heldAt({ fs, path, text }) : null
  } finally {
    removeIfHolds({ fs, path: guard, text })
  }
}

/**
 * The lock at `path`, as { release }, or null when another reaper holds it
 * or is taking it over. A lock older than 30 s is taken over under its
 * guard; any other failure to read or write it throws. `fs`, `now` and
 * `token` are injected by tests.
 */
export const takeLock = ({
  fs = NODE_FS,
  now = Date.now,
  path = LOCK_PATH,
  token = randomUUID
} = {}) => {
  const text = `${process.pid}\n${token()}\n`
  if (create({ fs, path, text })) return heldAt({ fs, path, text })
  if (!isStale({ fs, now, path })) return null
  return takeOver({ fs, now, path, text })
}
