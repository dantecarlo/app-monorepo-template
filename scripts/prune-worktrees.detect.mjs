// ---------------------------------------------------------------------------
// prune-worktrees.detect — the pure decisions behind worktrees:prune.
//
// The caller runs git and hands over what it printed; these functions only
// read it and decide: the options, the worktree list, the branches and their
// upstreams, a worktree's status and hidden files, the main checkout's local
// changes, why git refused a fast-forward, the install a fast-forward that
// changed the lockfile runs, and every line the command prints. No
// filesystem and no git here.
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

// The bound, in seconds, on the `pnpm install` a fast-forward that changed
// the lockfile runs: an install that hangs would otherwise hold the merge.
export const INSTALL_SECONDS_VARIABLE = 'PRUNE_WORKTREES_INSTALL_SECONDS'
const INSTALL_SECONDS = 120

// `fallback`, or the positive number of seconds `variable` names; any other
// value, an empty one included, throws, naming the variable and it.
const secondsFrom = ({ env, fallback, variable }) => {
  const value = env[variable]
  if (value === undefined) return fallback
  const seconds = Number(value)
  if (value.trim() === '' || !Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(
      `${variable} must be a positive number of seconds, not "${value}"`
    )
  }
  return seconds
}

// 30, or the positive number of seconds FETCH_SECONDS_VARIABLE names.
export const fetchSecondsFrom = ({ env }) =>
  secondsFrom({
    env,
    fallback: FETCH_SECONDS,
    variable: FETCH_SECONDS_VARIABLE
  })

// 120, or the positive number of seconds INSTALL_SECONDS_VARIABLE names.
export const installSecondsFrom = ({ env }) =>
  secondsFrom({
    env,
    fallback: INSTALL_SECONDS,
    variable: INSTALL_SECONDS_VARIABLE
  })

// The lockfile whose change, in a fast-forward, makes the run install; the
// install it runs, a plain `pnpm install` that may resolve again and so
// rewrite the lockfile (the owner, 2026-11-25, translated from Spanish:
// "Change to pnpm i"); and the command a person runs when it fails.
export const LOCKFILE = 'pnpm-lock.yaml'
const INSTALL_ARGS = ['install']
const INSTALL_LINE = `pnpm ${INSTALL_ARGS.join(' ')}`
const RETRY_COMMAND = INSTALL_LINE

// The command and arguments that run the install: through cmd.exe on
// Windows, where pnpm is a `.cmd` only a shell starts, and `pnpm` itself
// elsewhere.
export const installCommandOf = ({ comspec, platform }) =>
  platform === 'win32'
    ? {
        args: ['/d', '/s', '/c', 'pnpm', ...INSTALL_ARGS],
        command: comspec ?? 'cmd.exe'
      }
    : { args: [...INSTALL_ARGS], command: 'pnpm' }

// What a finished install run says about itself: `installed`, or `failed`
// with why, from what `runBounded` resolved.
export const installOutcomeOf = ({ run, seconds }) => {
  if (run.timedOut)
    return { state: 'failed', why: `did not finish within ${seconds} s` }
  if (run.error)
    return {
      state: 'failed',
      why: `could not start: ${run.error.message}`
    }
  if (run.code !== 0) return { state: 'failed', why: `exited ${run.code}` }
  return { state: 'installed' }
}

export const NOT_COVERED =
  'a dry run still runs git fetch --prune origin, which it needs to read ' +
  'a [gone] upstream; on Windows, a worktree another process holds as its ' +
  'current directory is emptied and unregistered while its directory ' +
  'stays; the prune runs in the foreground, so the merge that started it ' +
  `waits for it, for its fetch up to ${FETCH_SECONDS_VARIABLE} ` +
  `(${FETCH_SECONDS} s unless set); on Windows a fetch stopped at that ` +
  "bound ends with every process it started, but without git's own " +
  'cleanup, so a lock file of git may stay behind; and an ignored file ' +
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
// `.atl/` is not among them: besides the skill registry, which the
// skill-registry skill writes again (SKILL_REGISTRY_FILES), it holds
// machine-local agent tooling, personal skills included, that nothing does.
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

// The directory of machine-local agent tooling at a worktree's root, and the
// two files of it the skill-registry skill writes again.
export const AGENT_TOOLING_DIR = '.atl/'
const SKILL_REGISTRY_FILES = new Set([
  '.skill-registry.cache.json',
  'skill-registry.md'
])

// Whether what an ignored entry under `.atl/` holds is the skill registry
// and nothing else. `items` is what the caller found there on disk, by name
// under `.atl/` and whether it is a regular file: the children of `.atl/`
// when the entry is the directory itself, else the one path it names. A
// name the registry does not hold, or one that is not a regular file, a link
// or a directory included, is something else, and so is an empty list.
export const isSkillRegistry = ({ items }) =>
  items.length > 0 &&
  items.every(({ file, name }) => file && SKILL_REGISTRY_FILES.has(name))

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

// What the install after a fast-forward leaves out, added to a dry run's
// last line only when it would install, so every other run prints what it
// printed before the install existed.
export const INSTALL_NOT_COVERED =
  `the install runs in the foreground too, up to ${INSTALL_SECONDS_VARIABLE} ` +
  `(${INSTALL_SECONDS} s unless set), only after a fast-forward this run ` +
  `made, never after a merge or a pull that changed ${LOCKFILE} itself, and ` +
  'an install that fails or is stopped leaves node_modules as pnpm left it'

const notCovered = ({ dryRun, install }) => {
  if (!dryRun) return []
  const more = install === undefined ? '' : `; ${INSTALL_NOT_COVERED}`
  return [`${LABEL}: not covered: ${NOT_COVERED}${more}`]
}

// The install's line, or null: a dry run's and a finished install's are
// left out under `--quiet`, a failed one never is.
const installLine = ({ dryRun, install, main, quiet }) => {
  if (install === undefined) return null
  const where = `in ${main.path}`
  if (install.state === 'failed') {
    const changed = dryRun ? 'changes with the fast-forward' : 'changed'
    return (
      `${LABEL}: ${LOCKFILE} ${changed} and ${INSTALL_LINE} ${install.why}; ` +
      `run \`${RETRY_COMMAND}\` ${where}`
    )
  }
  if (quiet) return null
  return install.state === 'would'
    ? `${LABEL}: ${LOCKFILE} changes with the fast-forward, so it would ` +
        `run ${INSTALL_LINE} ${where}`
    : `${LABEL}: ${LOCKFILE} changed, so it ran ${INSTALL_LINE} ${where}`
}

// The line an install that rewrote the lockfile in the main checkout adds,
// under `--quiet` too, or null. It never offers `git checkout --`, which in
// a checkout other worktrees share has wiped other sessions' work.
const rewroteLine = ({ install, main }) =>
  install?.rewrote
    ? `${LABEL}: ${INSTALL_LINE} rewrote ${LOCKFILE} in ${main.path}; ` +
      'commit it on a branch, or run ' +
      `\`git restore --source=HEAD -- ${LOCKFILE}\` (this discards the ` +
      "install's lockfile change)"
    : null

// One line per worktree, a kept one left out under `--quiet`, the main
// checkout's line when it was behind or off the default branch, the
// install's line after a fast-forward that changed the lockfile and the
// line of an install that rewrote it, the summary line, and for a dry run
// what it does not cover.
export const reportLines = ({ dryRun, install, main, quiet, results }) => [
  ...results
    .filter((result) => !quiet || !result.kept)
    .map((result) => decisionLine({ dryRun, result })),
  ...[
    mainLine({ dryRun, main }),
    installLine({ dryRun, install, main, quiet }),
    rewroteLine({ install, main })
  ].filter((line) => line !== null),
  summaryLine({ dryRun, results }),
  ...notCovered({ dryRun, install })
]

// The line printed before a removal starts, `removing <path> (<branch>)`:
// a run ended inside the removal leaves it as its last line.
export const removingLine = ({ worktree }) => {
  const branch =
    worktree.branch === DETACHED_BRANCH ? 'detached' : worktree.branch
  const path = resolve(worktree.path).replaceAll('\\', '/')
  return `${LABEL}: removing ${path} (${branch})`
}

// The line a failed run ends with, on stderr: git's message, then what the
// run had removed before it failed, the worktrees its report listed above;
// when it removed none, that a removal had started if one was announced, else
// that nothing was removed. A dry run removes nothing.
export const failureLine = ({
  dryRun = false,
  message,
  results = [],
  started = false
}) => {
  const removed = dryRun ? 0 : results.filter(({ kept }) => !kept).length
  if (removed === 0 && started) {
    return (
      `${LABEL}: ${message} — a removal had started; the last "removing" ` +
      'line above names it.'
    )
  }
  if (removed === 0) return `${LABEL}: ${message} — nothing was removed.`
  const worktrees =
    removed === 1 ? '1 worktree was' : `${removed} worktrees were`
  return (
    `${LABEL}: ${message} — ${worktrees} removed before it failed, ` +
    'listed above.'
  )
}

// What a run whose fetch outlasted its bound of `seconds` prints, `--quiet`
// or not: it judged nothing, so it removed and moved nothing.
export const skippedLines = ({ dryRun, seconds }) => [
  `${LABEL}: skipped: git fetch --prune ${REMOTE} did not finish within ` +
    `${seconds} s, so no worktree was removed and the main checkout was ` +
    'not moved',
  ...notCovered({ dryRun })
]
