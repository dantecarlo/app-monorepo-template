#!/usr/bin/env node
// ---------------------------------------------------------------------------
// worktrees:prune — removes the linked worktree of every branch a pull
// request merged, and that branch, then fast-forwards the main checkout.
//
// After `git fetch --prune origin`, the default branch is the one
// `origin/HEAD` names. A linked worktree is removed only when it is not the
// main checkout, not the worktree this runs in, not under
// `.claude/worktrees/` (the Claude app manages those), holds no other
// registered worktree inside it, is on a branch whose upstream reads
// `[gone]` (the forge deletes a pull request's head branch on merge), has an
// empty `git status --porcelain --untracked-files=all`, holds no ignored
// file outside what an install, a build or the next session writes again,
// its HEAD is reachable from the default branch, and a plain
// `git worktree remove` accepts it. Every other worktree is kept and printed
// with the reason. `git status` compares bytes as git does, so a file that
// differs only in its line endings, where git counts that as a change, is a
// local change and keeps its worktree.
//
// Last, the main checkout is fast-forwarded to the default branch when it
// is on that branch (`git merge --ff-only`), so the hooks it serves run the
// default branch's code. A local change or commit the fast-forward would
// lose makes git refuse; the checkout then stays where it is, and the line
// says how far behind it is and what git said. `--dry-run` prints the same
// decisions and removes or moves nothing; `--quiet` prints the removals,
// the main checkout's line and the summary line only.
//
// `.husky/post-merge` runs it with `--quiet` after a local merge or pull.
//
// Usage:
//   node scripts/prune-worktrees.mjs
//   node scripts/prune-worktrees.mjs --dry-run
//   node scripts/prune-worktrees.mjs --quiet
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from './git-free-env.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

const LABEL = 'prune-worktrees'
const REMOTE = 'origin'
const REMOTE_HEAD = `refs/remotes/${REMOTE}/HEAD`
const REMOTES_PREFIX = 'refs/remotes/'
const REMOTE_PREFIX = `${REMOTE}/`
const GONE = '[gone]'
const DETACHED_BRANCH = '(detached)'
const CLAUDE_APP_DIR = '/.claude/worktrees/'
const BRANCH_PREFIX = 'refs/heads/'
const FIELD_SEPARATOR = '\t'
const IGNORED_PREFIX = '!! '

const OPTION = { DRY_RUN: '--dry-run', QUIET: '--quiet' }

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
const REBUILT_PREFIXES = ['.atl/', '.husky/_/']
const REBUILT_FILE =
  /(?:^|\/)(?:next-env\.d\.ts|expo-env\.d\.ts|[^/]+\.tsbuildinfo)$/
const LISTED_IGNORED = 3
// 64 MiB of git output.
const GIT_OUTPUT_BYTES = 67_108_864

export const REASON = {
  CLAUDE_APP: 'under .claude/worktrees/, which the Claude app manages',
  CURRENT: 'the worktree this command runs in',
  DETACHED: 'detached HEAD',
  DIRTY: 'uncommitted or untracked changes',
  HOLDS_WORKTREE: 'another registered worktree sits inside it',
  IGNORED: 'it holds ignored files nothing rebuilds',
  MAIN: 'the main checkout',
  NO_UPSTREAM: 'its branch has no upstream',
  NOT_IN_DEFAULT: 'its HEAD is not in the default branch',
  REMOVE_FAILED: 'git could not remove it',
  TRACKS_DEFAULT: 'its branch tracks the default branch',
  UNREADABLE: 'git could not read it',
  UPSTREAM_PRESENT: 'its upstream branch still exists'
}

// One git command run in `cwd` without the GIT_* variables a hook exports,
// which would otherwise point it at the hook's repository. Its output,
// trimmed; a failure throws git's own message.
const git = ({ args, cwd }) => {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      env: gitFreeEnv(),
      maxBuffer: GIT_OUTPUT_BYTES,
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch (error) {
    throw new Error(
      `git ${args.join(' ')} failed in ${cwd}: ` +
        String(error.stderr || error.message).trim()
    )
  }
}

// A path in one spelling: forward slashes, and on Windows one letter case.
const samePath = ({ path }) => {
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

// Every worktree `git worktree list --porcelain` prints, as its path and its
// branch, the main checkout first; a detached checkout reads `(detached)`.
const listWorktrees = ({ root }) =>
  git({ args: ['worktree', 'list', '--porcelain'], cwd: root })
    .split(/\r?\n\r?\n/)
    .flatMap((block) => {
      const path = (block.match(/^worktree (.+)$/m) ?? [])[1]
      if (!path) return []
      const branch = (
        (block.match(/^branch (.+)$/m) ?? [])[1] ?? DETACHED_BRANCH
      ).replace(BRANCH_PREFIX, '')
      return [{ branch, path }]
    })

// The default branch: the one `origin/HEAD` names, as its local name, its
// remote-tracking name and its full ref. Unset, it throws with the command
// that sets it.
const readDefaultBranch = ({ root }) => {
  const ref = (() => {
    try {
      return git({
        args: ['symbolic-ref', '--quiet', REMOTE_HEAD],
        cwd: root
      })
    } catch {
      throw new Error(
        `${REMOTE}/HEAD names no branch, so the default branch is unknown; ` +
          `run git remote set-head ${REMOTE} --auto`
      )
    }
  })()
  const tracking = ref.replace(REMOTES_PREFIX, '')
  return {
    branch: tracking.replace(REMOTE_PREFIX, ''),
    ref: tracking,
    upstream: ref
  }
}

// Every local branch with its upstream ref and its `[gone]`/`[ahead 1]`
// tracking state; a branch with no upstream reads an empty ref.
const readUpstreams = ({ root }) =>
  new Map(
    git({
      args: [
        'for-each-ref',
        '--format=%(refname)%09%(upstream)%09%(upstream:track)',
        BRANCH_PREFIX
      ],
      cwd: root
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [ref, upstream = '', track = ''] =
          line.split(FIELD_SEPARATOR)
        return [ref.replace(BRANCH_PREFIX, ''), { track, upstream }]
      })
  )

// Every local branch whose tip is reachable from the default branch.
const readMerged = ({ defaultBranch, root }) =>
  new Set(
    git({
      args: [
        'for-each-ref',
        `--merged=${defaultBranch.ref}`,
        '--format=%(refname)',
        BRANCH_PREFIX
      ],
      cwd: root
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((ref) => ref.replace(BRANCH_PREFIX, ''))
  )

// The reason a worktree is kept that needs no read inside it, or null.
// `registered` is every registered worktree path, in one spelling.
const structuralReason = ({
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

// The worktree's `git status`: whether anything is modified or untracked,
// and each path an ignore pattern matches, a matched directory as one entry
// ending in `/`, that nothing writes again.
const readStatus = ({ worktree }) => {
  const entries = git({
    args: [
      '--no-optional-locks',
      'status',
      '--porcelain',
      '-z',
      '--ignored=matching',
      '--untracked-files=all'
    ],
    cwd: worktree.path
  })
    .split('\0')
    .filter(Boolean)
  const ignored = entries
    .filter((entry) => entry.startsWith(IGNORED_PREFIX))
    .map((entry) => entry.slice(IGNORED_PREFIX.length))
  return {
    dirty: ignored.length < entries.length,
    unrebuilt: ignored.filter((entry) => !isRebuilt({ entry }))
  }
}

const ignoredDetail = ({ entries }) => {
  const listed = entries.slice(0, LISTED_IGNORED).join(', ')
  const more = entries.length - LISTED_IGNORED
  return more > 0 ? `${listed} and ${more} more` : listed
}

// The reason a worktree is kept, or null when it is removed. Only a worktree
// that passes every other check has `git status` run inside it.
const decide = ({
  current,
  defaultBranch,
  isMain,
  merged,
  registered,
  upstreams,
  worktree
}) => {
  const structural = structuralReason({
    current,
    defaultBranch,
    isMain,
    registered,
    upstream: upstreams.get(worktree.branch),
    worktree
  })
  if (structural) return { ...worktree, kept: structural }
  if (!merged.has(worktree.branch)) {
    return { ...worktree, kept: REASON.NOT_IN_DEFAULT }
  }
  try {
    const { dirty, unrebuilt } = readStatus({ worktree })
    if (dirty) return { ...worktree, kept: REASON.DIRTY }
    if (unrebuilt.length > 0) {
      return {
        ...worktree,
        detail: ignoredDetail({ entries: unrebuilt }),
        kept: REASON.IGNORED
      }
    }
    return { ...worktree, kept: null }
  } catch (error) {
    return { ...worktree, detail: error.message, kept: REASON.UNREADABLE }
  }
}

// A directory `git worktree remove` left on disk. `rmSync` removes a
// junction or a symbolic link as the link itself, a broken one included,
// and never enters its target, so the pnpm store it points into is kept.
export const removeLeftover = ({ path }) =>
  rmSync(path, { force: true, recursive: true })

// Removes one worktree, the directory Windows may leave behind, and its
// branch. Git refuses a worktree holding a modified or untracked file and
// deletes an ignored one, with untracked files shown whatever the
// repository's status configuration; a refusal is kept with git's message.
// A directory that stays is reported on the removal.
export const removeWorktree = ({ root, worktree }) => {
  try {
    git({
      args: [
        '-c',
        'status.showUntrackedFiles=all',
        'worktree',
        'remove',
        worktree.path
      ],
      cwd: root
    })
  } catch (error) {
    return {
      ...worktree,
      detail: error.message,
      kept: REASON.REMOVE_FAILED
    }
  }
  const leftover = (() => {
    if (!existsSync(worktree.path)) return undefined
    try {
      removeLeftover({ path: worktree.path })
      return undefined
    } catch (error) {
      return error.message
    }
  })()
  try {
    git({ args: ['branch', '-D', worktree.branch], cwd: root })
  } catch (error) {
    return { ...worktree, detail: error.message, kept: null, leftover }
  }
  return { ...worktree, kept: null, leftover }
}

// The main checkout brought to the default branch when it sits on it, by a
// fast-forward git itself refuses whenever a local change or a local commit
// would be lost. A main checkout on another branch is not moved, and one
// already at the default branch reads `behind: 0`.
const forwardMain = ({ defaultBranch, dryRun, root, worktree }) => {
  const at = { path: worktree.path, ref: defaultBranch.ref }
  if (worktree.branch !== defaultBranch.branch) {
    return {
      ...at,
      branch: worktree.branch,
      moved: false,
      wanted: defaultBranch.branch
    }
  }
  const behind = Number(
    git({
      args: ['rev-list', '--count', `HEAD..${defaultBranch.ref}`],
      cwd: root
    })
  )
  if (behind === 0 || dryRun) return { ...at, behind, moved: false }
  try {
    git({
      args: ['merge', '--ff-only', '--quiet', defaultBranch.ref],
      cwd: root
    })
    return { ...at, behind, moved: true }
  } catch (error) {
    return {
      ...at,
      behind,
      detail: error.message.split(/\r?\n/)[0],
      moved: false
    }
  }
}

// Every worktree of the repository `cwd` belongs to, each with the reason it
// is kept (`kept: null` for one removed), and what became of the main
// checkout, which is moved last, after every removal. A fetch, a default
// branch or a list git cannot read throws before anything is removed.
const pruneWorktrees = ({ cwd, dryRun }) => {
  const current = samePath({
    path: git({ args: ['rev-parse', '--show-toplevel'], cwd })
  })
  const worktrees = listWorktrees({ root: current })
  const root = worktrees[0].path
  git({ args: ['fetch', '--quiet', '--prune', REMOTE], cwd: root })
  const defaultBranch = readDefaultBranch({ root })
  const upstreams = readUpstreams({ root })
  const merged = readMerged({ defaultBranch, root })

  const registered = worktrees.map(({ path }) => samePath({ path }))

  const decided = worktrees.map((worktree, at) =>
    decide({
      current,
      defaultBranch,
      isMain: at === 0,
      merged,
      registered,
      upstreams,
      worktree
    })
  )
  const results = dryRun
    ? decided
    : decided.map((one) =>
        one.kept ? one : removeWorktree({ root, worktree: one })
      )
  if (!dryRun) git({ args: ['worktree', 'prune'], cwd: root })
  return {
    main: forwardMain({
      defaultBranch,
      dryRun,
      root,
      worktree: worktrees[0]
    }),
    results
  }
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
  if (dryRun) return `${LABEL}: would fast-forward ${where} ${by}`
  return (
    `${LABEL}: left ${where} ${commits({ count: main.behind })} behind ` +
    `${main.ref}: ${main.detail}`
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

// One line per worktree, a kept one left out under `--quiet`, the main
// checkout's line when it was behind or off the default branch, then the
// summary line.
export const reportLines = ({ dryRun, main, quiet, results }) => [
  ...results
    .filter((result) => !quiet || !result.kept)
    .map((result) => decisionLine({ dryRun, result })),
  ...[mainLine({ dryRun, main })].filter((line) => line !== null),
  summaryLine({ dryRun, results })
]

// A read that fails prints the reason and exits 1, having removed nothing.
const main = () => {
  try {
    const { dryRun, quiet } = optionsFrom({ argv: process.argv })
    const { main: mainCheckout, results } = pruneWorktrees({
      cwd: process.cwd(),
      dryRun
    })
    reportLines({ dryRun, main: mainCheckout, quiet, results }).forEach(
      (line) => console.log(line)
    )
  } catch (error) {
    console.error(`${LABEL}: ${error.message} — nothing was removed.`)
    process.exitCode = 1
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'prune-worktrees.mjs')
) {
  main()
}
