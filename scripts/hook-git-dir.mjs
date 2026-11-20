// ---------------------------------------------------------------------------
// hook-git-dir — a git hook's environment, simulated for a suite.
//
// Git exports GIT_DIR and GIT_INDEX_FILE into a hook, naming the repository
// the hook guards. A suite run from a hook inherits them, and every git it
// starts without `gitFreeEnv()` writes to that repository whatever its
// `cwd`: its config takes `core.worktree` and a test identity, its index the
// suite's files.
//
// `withHookGitDir` runs a suite's flow with both variables naming a decoy
// repository, and reports whether anything under the decoy changed. A suite
// proves it is safe inside a hook by running its end-to-end flow here and
// asserting `decoyWritten` is false (decision 33).
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { gitFreeEnv } from './git-free-env.mjs'

const HOOK_VARIABLES = ['GIT_DIR', 'GIT_INDEX_FILE']
const GIT_DIR_NAME = '.git'
const INDEX_NAME = 'index'

// Every file under `gitDir` with its size and modification time: a write
// anywhere in it, to the config, the index, a ref or an object, changes it.
const footprintOf = ({ gitDir }) =>
  JSON.stringify(
    readdirSync(gitDir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const path = join(entry.parentPath, entry.name)
        const { mtimeMs, size } = statSync(path)
        return `${path}\t${size}\t${mtimeMs}`
      })
      .sort()
  )

const restore = ({ saved }) =>
  saved.forEach(([name, value]) => {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  })

// Runs `use` the way a git hook runs a child: GIT_DIR and GIT_INDEX_FILE
// name a decoy repository, as a hook names the one it guards. Returns what
// `use` returned and whether the decoy was written. The variables are put
// back and the decoy removed however `use` ends; an error it throws reaches
// the caller.
export const withHookGitDir = ({ use }) => {
  const decoy = mkdtempSync(resolve(tmpdir(), 'hook-decoy-'))
  const gitDir = join(decoy, GIT_DIR_NAME)
  const saved = HOOK_VARIABLES.map((name) => [name, process.env[name]])
  try {
    execFileSync('git', ['init', '-q'], {
      cwd: decoy,
      env: gitFreeEnv(),
      stdio: 'ignore'
    })
    const before = footprintOf({ gitDir })
    process.env.GIT_DIR = gitDir
    process.env.GIT_INDEX_FILE = join(gitDir, INDEX_NAME)
    const result = use()
    return { decoyWritten: footprintOf({ gitDir }) !== before, result }
  } finally {
    restore({ saved })
    rmSync(decoy, { force: true, recursive: true })
  }
}
