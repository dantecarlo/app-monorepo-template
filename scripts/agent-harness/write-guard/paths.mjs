// ---------------------------------------------------------------------------
// paths — the write guard's reading of a target path: one spelling for every
// form a path takes, and where the target sits.
//
// A target is a SINK (`/dev/null`, `NUL`), SCRATCH (under the OS temp dir,
// $TEMP, $TMP, $TMPDIR or /tmp), REPO (inside a checkout: the nearest folder
// above it holding `.git`, a directory in a clone and a file in a worktree),
// or OUTSIDE all of them. The walk from the target upward stops at the first
// checkout or scratch root it meets, so a repository cloned under the temp
// dir is still a repository, and a home folder that is a checkout does not
// swallow the temp dir below it.
//
// Ported from the path half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs, with one change: a target is
// judged against the checkout it sits in, found from the target, so a rule
// file of a sibling worktree is a rule file too.
// ---------------------------------------------------------------------------

import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix } from 'node:path'

export const TARGET_KIND = Object.freeze({
  outside: 'outside',
  repo: 'repo',
  scratch: 'scratch',
  sink: 'sink'
})

const SINK = /^(?:\/dev\/(?:null|stdout|stderr|tty|fd\/\d+)|nul|con)$/iu
const GIT_BASH_DRIVE = /^\/([a-zA-Z])(?=\/|$)/u
const DRIVE = /^([a-zA-Z]):/u
const DRIVE_ROOT = /^[a-z]:\/$/u
const ABSOLUTE = /^(?:\/|[a-zA-Z]:)/u
const SEPARATOR = '/'
const WINDOWS = process.platform === 'win32'

// Backslashes become slashes, Git Bash's `/d/...` becomes `d:/...` on
// Windows, and the drive letter is lower-cased; the rest keeps its case, so
// the path still names the file on a case-sensitive disk.
const slashed = ({ text, windows }) => {
  const forward = text.replaceAll('\\', SEPARATOR)
  const bash = windows ? GIT_BASH_DRIVE.exec(forward) : null
  const drived = bash
    ? `${bash[1]}:${forward.slice(2) || SEPARATOR}`
    : forward
  return drived.replace(DRIVE, (drive) => drive.toLowerCase())
}

export const normalizePath = ({ path, windows = WINDOWS }) => {
  const normal = posix.normalize(slashed({ text: path, windows }))
  const rooted = /^[a-z]:$/u.test(normal)
    ? `${normal}${SEPARATOR}`
    : normal
  return rooted.length > 1 &&
    rooted.endsWith(SEPARATOR) &&
    !DRIVE_ROOT.test(rooted)
    ? rooted.slice(0, -1)
    : rooted
}

// Paths are compared without regard to case: Windows and macOS disks ignore
// it, and a false match on a case-sensitive disk only makes the guard ask.
const comparable = ({ path }) => path.toLowerCase()

export const relativeTo = ({ root, target }) =>
  target.slice(root.length).replace(/^\/+/u, '')

// The folder above `path`, or null at a root (`/` or `c:/`).
const parentOf = ({ path }) => {
  const at = path.lastIndexOf(SEPARATOR)
  if (at < 0) return null
  const head = path.slice(0, at + 1)
  const parent =
    at === 0 || DRIVE_ROOT.test(head) ? head : path.slice(0, at)
  return parent === path ? null : parent
}

const ancestorsOf = ({ path }) => {
  const found = []
  let current = parentOf({ path })
  while (current !== null) {
    found.push(current)
    current = parentOf({ path: current })
  }
  return found
}

const resolveTarget = ({ cwd, host, text }) => {
  const forward = slashed({ text, windows: host.windows })
  if (ABSOLUTE.test(forward)) {
    return normalizePath({ path: forward, windows: host.windows })
  }
  const base = cwd ?? host.ownRoot
  if (typeof base !== 'string') {
    throw new Error(
      `the relative path ${text} has no cwd to resolve against`
    )
  }
  return normalizePath({
    path: `${slashed({ text: base, windows: host.windows })}/${forward}`,
    windows: host.windows
  })
}

/**
 * Where `text` sits, resolved against `cwd`: `{ kind, path }`, plus `root`
 * and `relative` for a target inside a checkout.
 */
export const classify = ({ cwd, host, text }) => {
  if (SINK.test(text)) return { kind: TARGET_KIND.sink, path: text }
  const path = resolveTarget({ cwd, host, text })
  const scratchRoots = host.scratchRoots.map((root) =>
    normalizePath({ path: root, windows: host.windows })
  )
  const isScratchRoot = ({ dir }) =>
    scratchRoots.some(
      (root) => comparable({ path: root }) === comparable({ path: dir })
    )
  const stop = ancestorsOf({ path }).find(
    (dir) => host.isCheckout({ dir }) || isScratchRoot({ dir })
  )
  if (stop === undefined) return { kind: TARGET_KIND.outside, path }
  if (host.isCheckout({ dir: stop })) {
    return {
      kind: TARGET_KIND.repo,
      path,
      relative: relativeTo({ root: stop, target: path }),
      root: stop
    }
  }
  return { kind: TARGET_KIND.scratch, path }
}

const SCRATCH_VARIABLES = ['TEMP', 'TMP', 'TMPDIR']
const POSIX_SCRATCH = '/tmp'

// The host the hook really runs on: the disk, the OS temp dir and the
// environment. Tests hand `decide` a synthetic one instead.
export const liveHost = ({ environment = process.env, ownRoot } = {}) => ({
  env: environment,
  isCheckout: ({ dir }) => existsSync(join(dir, '.git')),
  ownRoot,
  scratchRoots: [
    tmpdir(),
    ...SCRATCH_VARIABLES.map((name) => environment[name]),
    POSIX_SCRATCH
  ].filter((root) => typeof root === 'string' && root !== ''),
  windows: WINDOWS
})
