// ---------------------------------------------------------------------------
// lock — one killing reaper at a time. Every Claude Code session runs the
// reaper at its start, and several sessions start together, so a run that
// ends processes first creates a lock file under the OS temp directory,
// exclusively; a run that finds one held exits at once. A lock older than
// 30 s belongs to a reaper that died, since a reaper ends within its 8 s
// bound, and is taken over.
// ---------------------------------------------------------------------------

import { rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const LOCK_PATH = join(tmpdir(), 'atl-process-reaper.lock')

const STALE_MS = 30_000
const EXISTS = 'EEXIST'
const GONE = 'ENOENT'

const create = ({ path }) => {
  try {
    writeFileSync(path, `${process.pid}\n`, { flag: 'wx' })
    return true
  } catch (error) {
    if (error.code === EXISTS) return false
    throw error
  }
}

const isStale = ({ path }) => {
  try {
    return Date.now() - statSync(path).mtimeMs > STALE_MS
  } catch (error) {
    if (error.code === GONE) return true
    throw error
  }
}

const heldAt = ({ path }) => ({
  release: () => rmSync(path, { force: true })
})

/**
 * The lock at `path`, as { release }, or null when another reaper holds it.
 * A lock older than 30 s is removed and taken; any other failure to read
 * or write it throws.
 */
export const takeLock = ({ path = LOCK_PATH } = {}) => {
  if (create({ path })) return heldAt({ path })
  if (!isStale({ path })) return null
  rmSync(path, { force: true })
  return create({ path }) ? heldAt({ path }) : null
}
