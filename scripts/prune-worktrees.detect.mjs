// ---------------------------------------------------------------------------
// prune-worktrees.detect — the pure decisions behind worktrees:prune.
//
// The caller runs git and hands over what it printed; these functions only
// read it and decide: the options, the worktree list, the branches and their
// upstreams, a worktree's status and hidden files, the main checkout's local
// changes, why git refused a fast-forward, and every line the command prints.
// No filesystem and no git here.
// ---------------------------------------------------------------------------

import { resolve } from 'node:path'

export const LABEL = 'prune-worktrees'
export const REMOTE = 'origin'
export const BRANCH_PREFIX = 'refs/heads/'
const REMOTES_PREFIX = 'refs/remotes/'
const REMOTE_PREFIX = `${REMOTE}/`
const GONE = '[gone]'
const DETACHED_BRANCH = '(detached)'
const CLAUDE_APP_DIR = '/.claude/worktrees/'
const FIELD_SEPARATOR = '\t'
const IGNORED_PREFIX = '!! '
const HINT_PREFIX = 'hint:'
// A porcelain status entry: two status letters and a space before the path;
// a rename or a copy is followed by an entry holding its source.
const STATUS_COLUMNS = 3
const RENAMED = /^(?:[RC].|.[RC]) /u
// `git ls-files -v`: a lower-case tag marks a file assume-unchanged, and
// `S` marks it skip-worktree.
const HIDDEN_TAG = /^(?:[a-z]|S) /u

const OPTION = { DRY_RUN: '--dry-run', QUIET: '--quiet' }

// Set on every git the command runs. The fast-forward of the main checkout
// fires that checkout's post-merge, which starts the command again from
// there; that run would no longer see the worktree the first one protects as
// its own.
export const NESTED_RUN_VARIABLE = 'PRUNE_WORKTREES_RUNNING'

// The bound, in seconds, on the `git fetch --prune origin` a run starts
// with: a stalled remote would otherwise hold the merge or the pull whose
// post-merge started it.
export const FETCH_SECONDS_VARIABLE = 'PRUNE_WORKTREES_FETCH_SECONDS'
const FETCH_SECONDS = 30

// 30, or the positive number of seconds FETCH_SECONDS_VARIABLE names; any
// other value, an empty one included, throws, naming the variable and it.
export const fetchSecondsFrom = ({ env }) => {
  const value = env[FETCH_SECONDS_VARIABLE]
  if (value === undefined) return FETCH_SECONDS
  const seconds = Number(value)
  if (value.trim() === '' || !Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(
      `${FETCH_SECONDS_VARIABLE} must be a positive number of seconds, ` +
        `not "${value}"`
    )
  }
  return seconds
}

export const NOT_COVERED =
  'a dry run still runs git fetch --prune origin, which it needs to read ' +
  'a [gone] upstream; on Windows, a worktree another process holds as its ' +
  'current directory is emptied and unregistered while its directory ' +
  'stays; the prune runs in the foreground, so the merge that started it ' +
  `waits for it, for its fetch up to ${FETCH_SECONDS_VARIABLE} ` +
  `(${FETCH_SECONDS} s unless set); on Windows a fetch stopped at that ` +
  "bound ends without git's own cleanup, so a remote helper it started, " +
  'as for https, runs on until its connection ends; and an ignored file ' +
  'written in the moment between the check just before a removal and ' +
  "git's own removal goes with the worktree"

export const LOCAL_CHANGES = 'it holds local changes'
// Why a dry run predicts that git would not fast-forward the main checkout:
// its HEAD is not an ancestor of the default branch.
export const DIVERGED =
  'it holds commits the default branch does not, so git would not ' +
  'fast-forward it'

// Ignored paths that an install, a build, a typecheck, a test run or the
// next session writes again: a directory of the first names at any depth;
// one of the second names at the root or at a workspace root
// (`apps/<name>/`, `packages/<name>/`); a path under one of the prefixes; a
// file of these names. An env file is none of them: nothing writes it
// again, so a worktree that holds one is kept.
const REBUILT_ANYWHERE = new Set(['node_modules'])
const REBUILT_AT_ROOTS = new Set([
  '.codegraph',
  '.expo',
  '.next',
  '.nyc_output',
  '.turbo',
  'coverage',
  'dist',
  'dist-web',
  'out',
  'playwright-report',
  'test-results'
])
const WORKSPACE_GROUPS = new Set(['apps', 'packages'])
const WORKSPACE_ROOT_DEPTH = 2
// `.atl/` is not among them: it holds machine-local agent tooling, personal
// skills included, that nothing writes again.
const REBUILT_PREFIXES = ['.husky/_/']
const REBUILT_FILE =
  /(?:^|\/)(?:next-env\.d\.ts|expo-env\.d\.ts|[^/]+\.tsbuildinfo)$/
const LISTED_IGNORED = 3

export const REASON = {
  CLAUDE_APP: 'under .claude/worktrees/, which the Claude app manages',
  CURRENT: 'the worktree this command runs in',
  DETACHED: 'detached HEAD',
  DIRTY: 'uncommitted or untracked changes',
  HIDDEN:
    'git status cannot see a tracked file marked skip-worktree or assume-unchanged',
  HOLDS_WORKTREE: 'another registered worktree sits inside it',
  IGNORED: 'it holds ignored files nothing rebuilds',
  LOCKED: 'locked',
  MAIN: 'the main checkout',
  NO_UPSTREAM: 'its branch has no upstream',
  NOT_IN_DEFAULT: 'its HEAD is not in the default branch',
  REMOVE_FAILED: 'git could not remove it',
  TRACKS_DEFAULT: 'its branch tracks the default branch',
  UNREADABLE: 'git could not read it',
  UPSTREAM_PRESENT: 'its upstream branch still exists'
}

// A path in one spelling: forward slashes, and on Windows one letter case.
export const samePath = ({ path }) => {
  const forward = resolve(path).replaceAll('\\', '/')
  return process.platform === 'win32' ? forward.toLowerCase() : forward
}

// `--dry-run` and `--quiet`; any other option throws, naming it.
export const optionsFrom = ({ argv }) => {
  const given = argv.slice(2)
  const unknown = given.filter(
    (option) => !Object.values(OPTION).includes(option)
  )
  if (unknown.length > 0) {
    throw new Error(
      `unknown option ${unknown.join(', ')}; it takes ` +
        `${OPTION.DRY_RUN} and ${OPTION.QUIET}`
    )
  }
  return {
    dryRun: given.includes(OPTION.DRY_RUN),
    quiet: given.includes(OPTION.QUIET)
  }
}

// Every worktree `git worktree list --porcelain` printed, as its path, its
// branch and, when it is locked, the lock with its reason, the main checkout
// first; a detached checkout reads `(detached)`.
export const parseWorktrees = ({ porcelain }) =>
  porcelain.split(/\r?\n\r?\n/).flatMap((block) => {
    const path = (block.match(/^worktree (.+)$/m) ?? [])[1]
    if (!path) return []
    const branch = (
      (block.match(/^branch (.+)$/m) ?? [])[1] ?? DETACHED_BRANCH
    ).replace(BRANCH_PREFIX, '')
    const lock = block.match(/^locked(?: (.+))?$/m)
    return [
      lock ? { branch, lock: { reason: lock[1] }, path } : { branch, path }
    ]
  })

// The default branch `origin/HEAD` names, given as its full ref: its local
// name, its remote-tracking name and that ref.
export const defaultBranchOf = ({ ref }) => {
  const tracking = ref.replace(REMOTES_PREFIX, '')
  return {
    branch: tracking.replace(REMOTE_PREFIX, ''),
    ref: tracking,
    upstream: ref
  }
}

// The format `parseUpstreams` reads from `git for-each-ref`.
export const UPSTREAM_FORMAT =
  '--format=%(refname)%09%(objectname)%09%(upstream)%09%(upstream:track)'

// Every local branch with its tip, its upstream ref and its
// `[gone]`/`[ahead 1]` tracking state; a branch with no upstream reads an
// empty ref.
export const parseUpstreams = ({ listing }) =>
  new Map(
    listing
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [ref, sha, upstream = '', track = ''] =
          line.split(FIELD_SEPARATOR)
        return [ref.replace(BRANCH_PREFIX, ''), { sha, track, upstream }]
      })
  )

// The local branch names of a `git for-each-ref --format=%(refname)` list.
export const parseBranchNames = ({ listing }) =>
  new Set(
    listing
      .split(/\r?\n/)
      .filter(Boolean)
      .map((ref) => ref.replace(BRANCH_PREFIX, ''))
  )

// The reason a worktree is kept that needs no read inside it, or null.
// `registered` is every registered worktree path, in one spelling.
export const structuralReason = ({
  current,
  defaultBranch,
  isMain,
  registered,
  upstream,
  worktree
}) => {
  const path = samePath({ path: worktree.path })
  if (isMain) return REASON.MAIN
  if (path === current) return REASON.CURRENT
  if (worktree.lock) return REASON.LOCKED
  if (path.includes(CLAUDE_APP_DIR)) return REASON.CLAUDE_APP
  if (registered.some((other) => other.startsWith(`${path}/`))) {
    return REASON.HOLDS_WORKTREE
  }
  if (worktree.branch === DETACHED_BRANCH) return REASON.DETACHED
  if (!upstream?.upstream) return REASON.NO_UPSTREAM
  if (upstream.upstream === defaultBranch.upstream) {
    return REASON.TRACKS_DEFAULT
  }
  if (upstream.track !== GONE) return REASON.UPSTREAM_PRESENT
  return null
}

const isAtRoot = ({ at, segments }) =>
  at === 0 ||
  (at === WORKSPACE_ROOT_DEPTH && WORKSPACE_GROUPS.has(segments[0]))

const isRebuilt = ({ entry }) => {
  const segments = entry.replace(/\/$/, '').split('/')
  const inDirectory = segments.slice(
    0,
    entry.endsWith('/') ? undefined : -1
  )
  return (
    inDirectory.some(
      (segment, at) =>
        REBUILT_ANYWHERE.has(segment) ||
        (REBUILT_AT_ROOTS.has(segment) && isAtRoot({ at, segments }))
    ) ||
    REBUILT_PREFIXES.some((prefix) => entry.startsWith(prefix)) ||
    REBUILT_FILE.test(entry)
  )
}

// A worktree's `git status --porcelain -z --ignored=matching`: whether
// anything is modified or untracked, and each path an ignore pattern
// matches, a matched directory as one entry ending in `/`, that nothing
// writes again.
export const statusOf = ({ porcelain }) => {
  const entries = porcelain.split('\0').filter(Boolean)
  const ignored = entries
    .filter((entry) => entry.startsWith(IGNORED_PREFIX))
    .map((entry) => entry.slice(IGNORED_PREFIX.length))
  return {
    dirty: ignored.length < entries.length,
    unrebuilt: ignored.filter((entry) => !isRebuilt({ entry }))
  }
}

// Every tracked file a `git ls-files -v -z` listing marks assume-unchanged
// or skip-worktree: `git status` and `git worktree remove` skip both, so an
// edit to one is invisible to them and lost with the worktree.
export const hiddenOf = ({ listing }) =>
  listing
    .split('\0')
    .filter((entry) => HIDDEN_TAG.test(entry))
    .map((entry) => entry.replace(HIDDEN_TAG, ''))

export const listDetail = ({ entries }) => {
  const listed = entries.slice(0, LISTED_IGNORED).join(', ')
  const more = entries.length - LISTED_IGNORED
  return more > 0 ? `${listed} and ${more} more` : listed
}

// Every tracked path a `git status --porcelain -z --untracked-files=no`
// shows, staged or not, a line-ending-only change included; the source
// entry that follows a rename or a copy is not a path of its own.
export const localChangesOf = ({ porcelain }) =>
  porcelain
    .split('\0')
    .filter(Boolean)
    .reduce(
      ({ paths, source }, entry) =>
        source
          ? { paths, source: false }
          : {
              paths: [...paths, entry.slice(STATUS_COLUMNS)],
              source: RENAMED.test(entry)
            },
      { paths: [], source: false }
    ).paths

// Why git refused: its first line that is not a hint, followed by the files
// it lists, one per tab-indented line.
export const refusalOf = ({ error }) => {
  const lines = String(error.stderr ?? error.message).split(/\r?\n/u)
  const reason =
    lines.find(
      (line) => line.trim() !== '' && !line.startsWith(HINT_PREFIX)
    ) ?? error.message
  const files = lines
    .filter((line) => line.startsWith('\t'))
    .map((line) => line.trim())
  return files.length > 0
    ? `${reason} ${listDetail({ entries: files })}`
    : reason
}

const commits = ({ count }) => `${count} commit${count === 1 ? '' : 's'}`

// The line for the main checkout, or null when it sits at the default
// branch.
const mainLine = ({ dryRun, main }) => {
  if (main === undefined) return null
  const where = `the main checkout ${main.path}`
  if (main.branch !== undefined) {
    return `${LABEL}: left ${where} on ${main.branch}, not ${main.wanted}`
  }
  if (main.behind === 0) return null
  const by = `by ${commits({ count: main.behind })} to ${main.ref}`
  if (main.moved) return `${LABEL}: fast-forwarded ${where} ${by}`
  if (main.detail === undefined) {
    return `${LABEL}: would fast-forward ${where} ${by}`
  }
  return (
    `${LABEL}: ${dryRun ? 'would leave' : 'left'} ${where} ` +
    `${commits({ count: main.behind })} behind ${main.ref}: ${main.detail}`
  )
}

const decisionLine = ({ dryRun, result }) => {
  const branch =
    result.branch === DETACHED_BRANCH ? 'detached' : result.branch
  const where = `${result.path} (${branch})`
  if (result.kept) {
    const detail = result.detail ? `: ${result.detail}` : ''
    return `${LABEL}: kept ${where}: ${result.kept}${detail}`
  }
  const verb = dryRun ? 'would remove' : 'removed'
  const leftover = result.leftover
    ? `; its directory stays: ${result.leftover}`
    : ''
  const kept = result.detail ? `; its branch stays: ${result.detail}` : ''
  return `${LABEL}: ${verb} ${where}${leftover}${kept}`
}

const summaryLine = ({ dryRun, results }) => {
  const kept = results.filter(({ kept: reason }) => reason)
  const counts = kept.reduce(
    (tally, { kept: reason }) =>
      tally.set(reason, (tally.get(reason) ?? 0) + 1),
    new Map()
  )
  const byReason = [...counts]
    .map(([reason, count]) => `${reason} ${count}`)
    .join(', ')
  const verb = dryRun ? 'would remove' : 'removed'
  return (
    `${LABEL}: ${verb} ${results.length - kept.length}, ` +
    `kept ${kept.length}; by reason: ${byReason || 'none'}`
  )
}

const notCovered = ({ dryRun }) =>
  dryRun ? [`${LABEL}: not covered: ${NOT_COVERED}`] : []

// One line per worktree, a kept one left out under `--quiet`, the main
// checkout's line when it was behind or off the default branch, the summary
// line, and for a dry run what it does not cover.
export const reportLines = ({ dryRun, main, quiet, results }) => [
  ...results
    .filter((result) => !quiet || !result.kept)
    .map((result) => decisionLine({ dryRun, result })),
  ...[mainLine({ dryRun, main })].filter((line) => line !== null),
  summaryLine({ dryRun, results }),
  ...notCovered({ dryRun })
]

// What a run whose fetch outlasted its bound of `seconds` prints, `--quiet`
// or not: it judged nothing, so it removed and moved nothing.
export const skippedLines = ({ dryRun, seconds }) => [
  `${LABEL}: skipped: git fetch --prune ${REMOTE} did not finish within ` +
    `${seconds} s, so no worktree was removed and the main checkout was ` +
    'not moved',
  ...notCovered({ dryRun })
]
