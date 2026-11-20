#!/usr/bin/env node
// ---------------------------------------------------------------------------
// worktrees:prune — removes the linked worktree of every branch a pull
// request merged, and that branch, then fast-forwards the main checkout.
//
// It starts with `git fetch --prune origin`, stopped after 30 s or the
// seconds PRUNE_WORKTREES_FETCH_SECONDS names, with every process it
// started, a remote helper or an ssh command included (`runBounded` of
// scripts/agent-harness/reaper/, `taskkill /T /F` on Windows); a fetch
// stopped there skips the prune and the fast-forward, says so in one line
// and exits 0. After
// it, the default branch is the one `origin/HEAD` names. A linked worktree
// is removed only when it is not the main checkout, not the worktree this
// runs in, not under `.claude/worktrees/` (the Claude app manages those),
// is not locked, holds no other registered worktree inside it, is on a
// branch whose upstream reads `[gone]` (the forge deletes a pull request's
// head branch on merge), has an empty `git status --porcelain
// --untracked-files=all`, marks no tracked file skip-worktree or
// assume-unchanged (whose edits `git status` and `git worktree remove`
// cannot see), holds no ignored file outside what an install, a build or
// the next session writes again (an `.atl/` that holds only the two files
// of the skill registry included), its HEAD is reachable from the default
// branch, those reads inside it still pass when they run again just before
// its removal, and a plain `git worktree remove` accepts it. Its branch is
// then deleted only while its tip is still the commit it was judged at.
// Every other worktree is kept and printed with the reason. `git status`
// compares bytes as git does, so a file that differs
// only in its line endings, where git counts that as a change, is a local
// change and keeps its worktree.
//
// Last, the main checkout is fast-forwarded to the default branch when it
// is on that branch (`git merge --ff-only`), so the hooks it serves run the
// default branch's code. Any tracked local change in it, staged or not, a
// line-ending-only one included, blocks the fast-forward, and so does
// whatever makes git refuse (a local commit, an untracked file it would
// overwrite); the checkout then stays where it is, and the line says how
// far behind it is and why. The fast-forward fires the main checkout's own
// post-merge, so it runs with NESTED_RUN_VARIABLE set, and a run that finds
// it set exits at once. `--dry-run` prints the same decisions and removes
// or moves nothing, then what it does not cover; it predicts git's refusal
// to fast-forward from an ancestry check and a dry run of the checkout
// (`git read-tree -m -u --dry-run`) against a refreshed copy of the index,
// so it names a local commit or an untracked file the fast-forward would
// overwrite, never a file whose timestamp alone changed, and takes no lock
// in the main checkout. `--quiet` prints the
// removals, the main checkout's line and the summary line only.
//
// `.husky/post-merge` runs it with `--quiet` after a local merge or pull.
// This file runs git and touches the disk; every decision it takes from
// what git printed is in prune-worktrees.detect.mjs.
//
// Not covered (NOT_COVERED, the last line of a dry run): a dry run still
// runs `git fetch --prune origin`, which it needs to read a `[gone]`
// upstream; on Windows, a worktree another process holds as its current
// directory is emptied and unregistered while its directory stays; the
// prune runs in the foreground, so the merge that started it waits for it,
// for its fetch up to the bound; on Windows a fetch stopped at the bound
// ends without git's own cleanup, its remote helper ended with it; and an
// ignored file written in
// the moment between the check just before a removal and git's own removal
// goes with the worktree.
//
// Usage:
//   node scripts/prune-worktrees.mjs
//   node scripts/prune-worktrees.mjs --dry-run
//   node scripts/prune-worktrees.mjs --quiet
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runBounded } from './agent-harness/reaper/bounded-child.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import {
  AGENT_TOOLING_DIR,
  BRANCH_PREFIX,
  defaultBranchOf,
  DIVERGED,
  failureLine,
  fetchSecondsFrom,
  hiddenOf,
  isSkillRegistry,
  listDetail,
  LOCAL_CHANGES,
  localChangesOf,
  NESTED_RUN_VARIABLE,
  optionsFrom,
  parseBranchNames,
  parseUpstreams,
  parseWorktrees,
  REASON,
  refusalOf,
  REMOTE,
  reportLines,
  samePath,
  skippedLines,
  statusOf,
  structuralReason,
  UPSTREAM_FORMAT
} from './prune-worktrees.detect.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

const REMOTE_HEAD = `refs/remotes/${REMOTE}/HEAD`
// 64 MiB of git output.
const GIT_OUTPUT_BYTES = 67_108_864
const MS_PER_SECOND = 1000
// `git merge-base --is-ancestor` exits 1 when the first commit is not an
// ancestor of the second; any other failure is an error.
const NOT_ANCESTOR = 1
// The index a dry run copies, and the scratch directory that holds the copy.
const INDEX_FILE = 'index'
const INDEX_COPY_PREFIX = 'prune-worktrees-index-'

// One git command run in `cwd` without the GIT_* variables a hook exports,
// which would otherwise point it at the hook's repository, and with
// NESTED_RUN_VARIABLE set for any hook it fires. Its output, trimmed; a
// failure throws git's own message, its stderr kept on the error.
// `trim: false` keeps the output whole, the leading space of a porcelain
// status line included. A git that exits non-zero leaves its exit code on
// the error as `status`. `env` adds variables after the GIT_* ones are
// dropped, as GIT_INDEX_FILE for a copy of the index.
const gitEnv = ({ env = {} } = {}) => ({
  ...gitFreeEnv(),
  ...env,
  [NESTED_RUN_VARIABLE]: '1'
})

const gitFailure = ({ args, cwd, status, stderr }) =>
  Object.assign(new Error(`git ${args.join(' ')} failed in ${cwd}: ${stderr}`), {
    status,
    stderr
  })

const git = ({ args, cwd, env, trim = true }) => {
  try {
    const output = execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      env: gitEnv({ env }),
      maxBuffer: GIT_OUTPUT_BYTES,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    return trim ? output.trim() : output
  } catch (error) {
    throw gitFailure({
      args,
      cwd,
      status: error.status,
      stderr: String(error.stderr || error.message).trim()
    })
  }
}

// `git fetch --prune origin`, stopped after `seconds`, rounded up to the
// whole milliseconds Node takes, with every process it started: true when
// it finished, false when it was stopped. A fetch git fails throws.
const fetchOrigin = async ({ root, seconds }) => {
  const args = ['fetch', '--quiet', '--prune', REMOTE]
  const run = await runBounded({
    args,
    command: 'git',
    cwd: root,
    env: gitEnv(),
    timeoutMs: Math.ceil(seconds * MS_PER_SECOND)
  })
  if (run.timedOut) return false
  if (run.error || run.code !== 0) throw fetchFailureOf({ args, cwd: root, run })
  return true
}

// The error of a fetch that `runBounded` saw fail: git's stderr, else the
// spawn's own error, else the exit code.
export const fetchFailureOf = ({ args, cwd, run }) =>
  gitFailure({
    args,
    cwd,
    status: run.code,
    stderr: run.stderr.trim() || run.error?.message || `exited ${run.code}`
  })

// Every worktree of the repository `root` belongs to, the main checkout
// first.
const listWorktrees = ({ root }) =>
  parseWorktrees({
    porcelain: git({
      args: ['worktree', 'list', '--porcelain'],
      cwd: root
    })
  })

// The default branch `origin/HEAD` names. Unset, it throws with the command
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
  return defaultBranchOf({ ref })
}

const readUpstreams = ({ root }) =>
  parseUpstreams({
    listing: git({
      args: ['for-each-ref', UPSTREAM_FORMAT, BRANCH_PREFIX],
      cwd: root
    })
  })

// Every local branch whose tip is reachable from the default branch.
const readMerged = ({ defaultBranch, root }) =>
  parseBranchNames({
    listing: git({
      args: [
        'for-each-ref',
        `--merged=${defaultBranch.ref}`,
        '--format=%(refname)',
        BRANCH_PREFIX
      ],
      cwd: root
    })
  })

// What an ignored entry under `.atl/` holds on disk, for isSkillRegistry:
// the children of `.atl/` when the entry is the directory itself, else the
// one path it names, each by name and whether it is a regular file, which a
// link is not.
const agentToolingItems = ({ entry, worktree }) => {
  const name = entry.slice(AGENT_TOOLING_DIR.length)
  const path = join(worktree.path, entry)
  if (name === '') {
    return readdirSync(path, { withFileTypes: true }).map((child) => ({
      file: child.isFile(),
      name: child.name
    }))
  }
  return [{ file: lstatSync(path).isFile(), name }]
}

// The worktree's `git status`: whether anything is modified or untracked,
// and each ignored path nothing writes again, an `.atl/` that holds only
// the skill registry left out. A read that fails throws.
const readStatus = ({ worktree }) => {
  const { dirty, unrebuilt } = statusOf({
    porcelain: git({
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
  })
  return {
    dirty,
    unrebuilt: unrebuilt.filter(
      (entry) =>
        !entry.startsWith(AGENT_TOOLING_DIR) ||
        !isSkillRegistry({ items: agentToolingItems({ entry, worktree }) })
    )
  }
}

const readHidden = ({ worktree }) =>
  hiddenOf({
    listing: git({
      args: ['ls-files', '-v', '-z'],
      cwd: worktree.path,
      trim: false
    })
  })

// The reason a worktree is kept, or null when it is removed, with the tip
// its branch was judged at. Only a worktree that passes every other check
// has `git status` and `git ls-files` run inside it.
const decide = ({
  current,
  defaultBranch,
  isMain,
  merged,
  registered,
  upstreams,
  worktree
}) => {
  const upstream = upstreams.get(worktree.branch)
  const judged = { ...worktree, sha: upstream?.sha }
  const structural = structuralReason({
    current,
    defaultBranch,
    isMain,
    registered,
    upstream,
    worktree
  })
  if (structural === REASON.LOCKED) {
    return { ...judged, detail: worktree.lock.reason, kept: structural }
  }
  if (structural) return { ...judged, kept: structural }
  if (!merged.has(worktree.branch)) {
    return { ...judged, kept: REASON.NOT_IN_DEFAULT }
  }
  return contentReason({ worktree: judged })
}

// What `git status` and `git ls-files` read inside a worktree: the reason
// it is kept, a modified or untracked file, a tracked file `git status`
// cannot see or an ignored file nothing writes again, or `kept: null`. A
// read git fails keeps it. Both the decision and the check just before the
// removal run it.
const contentReason = ({ worktree }) => {
  try {
    const { dirty, unrebuilt } = readStatus({ worktree })
    if (dirty) return { ...worktree, kept: REASON.DIRTY }
    const hidden = readHidden({ worktree })
    if (hidden.length > 0) {
      return {
        ...worktree,
        detail: listDetail({ entries: hidden }),
        kept: REASON.HIDDEN
      }
    }
    if (unrebuilt.length > 0) {
      return {
        ...worktree,
        detail: listDetail({ entries: unrebuilt }),
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
// A directory that stays is reported on the removal. The branch goes only
// while its tip is still `worktree.sha`, the commit it was judged at, and
// its configuration with it, as `git branch -D` would; a branch that moved
// since keeps the commits it gained.
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
    git({
      args: [
        'update-ref',
        '-d',
        `${BRANCH_PREFIX}${worktree.branch}`,
        String(worktree.sha)
      ],
      cwd: root
    })
  } catch (error) {
    return { ...worktree, detail: error.message, kept: null, leftover }
  }
  try {
    git({
      args: ['config', '--remove-section', `branch.${worktree.branch}`],
      cwd: root
    })
  } catch {
    // A branch with no configuration has no section to remove.
  }
  return { ...worktree, kept: null, leftover }
}

// A worktree judged removable, read again just before it goes, since the
// pruner works through the others between its decision and this removal:
// one that gained a change in the meantime, an ignored file nothing writes
// again included, is kept with that reason, and the rest is removed as
// `removeWorktree` removes it.
export const removeIfStillClean = ({ root, worktree }) => {
  const again = contentReason({ worktree })
  return again.kept ? again : removeWorktree({ root, worktree })
}

// Every tracked path with a local change in `root`, staged or not, a
// line-ending-only one included; untracked files are left to git.
const readLocalChanges = ({ root }) =>
  localChangesOf({
    porcelain: git({
      args: [
        '--no-optional-locks',
        'status',
        '--porcelain',
        '-z',
        '--untracked-files=no'
      ],
      cwd: root,
      trim: false
    })
  })

// Whether HEAD in `root` is an ancestor of `ref`, the one shape git can
// fast-forward. A failure other than "not an ancestor" throws.
const isAncestor = ({ ref, root }) => {
  try {
    git({ args: ['merge-base', '--is-ancestor', 'HEAD', ref], cwd: root })
    return true
  } catch (error) {
    if (error.status === NOT_ANCESTOR) return false
    throw error
  }
}

// A dry run of the two-tree checkout a fast-forward to `ref` makes (`git
// read-tree -m -u --dry-run`), which checks the untracked files it would
// overwrite or lose and writes no file, run against a copy of the main
// checkout's index in a scratch directory. `git merge --ff-only` refreshes
// the index's stat data before that check, so the copy is refreshed first
// (`git update-index -q --refresh`), and a file whose timestamp alone
// changed is not a refusal; neither the checkout's index nor its
// `index.lock` is touched. The scratch directory goes whatever happens; a
// refusal or a failure throws.
const dryCheckout = ({ ref, root }) => {
  const scratch = mkdtempSync(join(tmpdir(), INDEX_COPY_PREFIX))
  try {
    const copy = join(scratch, INDEX_FILE)
    copyFileSync(
      git({
        args: [
          'rev-parse',
          '--path-format=absolute',
          '--git-path',
          INDEX_FILE
        ],
        cwd: root
      }),
      copy
    )
    const env = { GIT_INDEX_FILE: copy }
    git({ args: ['update-index', '-q', '--refresh'], cwd: root, env })
    git({
      args: ['read-tree', '-m', '-u', '--dry-run', 'HEAD', ref],
      cwd: root,
      env
    })
  } finally {
    rmSync(scratch, { force: true, recursive: true })
  }
}

// Why git would refuse to fast-forward the main checkout to `ref`, read
// without moving it, or undefined when it would go ahead: DIVERGED when
// HEAD is not an ancestor of `ref`, else what the dry checkout refuses, in
// git's words.
const predictedRefusal = ({ ref, root }) => {
  if (!isAncestor({ ref, root })) return DIVERGED
  try {
    dryCheckout({ ref, root })
    return undefined
  } catch (error) {
    return refusalOf({ error })
  }
}

// The main checkout brought to the default branch when it sits on it, by a
// fast-forward. Any tracked local change blocks it before git is asked, a
// dry run included, and git refuses whatever else would be lost, a local
// commit or an untracked file it would overwrite; a dry run predicts that
// refusal without moving anything. A main checkout on another branch is not
// moved, and one already at the default branch reads `behind: 0`.
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
  if (behind === 0) return { ...at, behind, moved: false }
  const changed = readLocalChanges({ root })
  if (changed.length > 0) {
    return {
      ...at,
      behind,
      detail: `${LOCAL_CHANGES}: ${listDetail({ entries: changed })}`,
      moved: false
    }
  }
  if (dryRun) {
    const refusal = predictedRefusal({ ref: defaultBranch.ref, root })
    return refusal === undefined
      ? { ...at, behind, moved: false }
      : { ...at, behind, detail: refusal, moved: false }
  }
  try {
    git({
      args: ['merge', '--ff-only', '--quiet', defaultBranch.ref],
      cwd: root
    })
    return { ...at, behind, moved: true }
  } catch (error) {
    return { ...at, behind, detail: refusalOf({ error }), moved: false }
  }
}

// Every worktree of the repository `cwd` belongs to, each with the reason it
// is kept (`kept: null` for one removed), and what became of the main
// checkout, which is moved last, after every removal; or `timedOut` when the
// fetch outlasted `fetchSeconds`, before anything was judged. A fetch, a
// default branch or a list git cannot read throws before anything is
// removed; a step that fails after the decisions returns its `error` with
// the results gathered before it, every removal made included.
const pruneWorktrees = async ({ cwd, dryRun, fetchSeconds }) => {
  const current = samePath({
    path: git({ args: ['rev-parse', '--show-toplevel'], cwd })
  })
  const worktrees = listWorktrees({ root: current })
  const root = worktrees[0].path
  if (!(await fetchOrigin({ root, seconds: fetchSeconds })))
    return { timedOut: true }
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
  // Each result is kept as it comes, so a step that fails after a removal,
  // the main checkout's included, returns with what was removed before it.
  const results = []
  try {
    decided.forEach((one) =>
      results.push(
        dryRun || one.kept
          ? one
          : removeIfStillClean({ root, worktree: one })
      )
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
  } catch (error) {
    return { error, results }
  }
}

// A read that fails before anything is removed prints the reason and exits
// 1, saying nothing was removed; a step that fails after a removal prints
// the report of what was done, then the reason and how many worktrees were
// removed before it, and exits 1. A fetch that outlasts its bound prints why
// it skipped and exits 0. A run a prune started, through the post-merge its
// fast-forward fires, does nothing and prints nothing.
const main = async () => {
  if (process.env[NESTED_RUN_VARIABLE]) return
  try {
    const { dryRun, quiet } = optionsFrom({ argv: process.argv })
    const fetchSeconds = fetchSecondsFrom({ env: process.env })
    const outcome = await pruneWorktrees({
      cwd: process.cwd(),
      dryRun,
      fetchSeconds
    })
    const lines = outcome.timedOut
      ? skippedLines({ dryRun, seconds: fetchSeconds })
      : reportLines({
          dryRun,
          main: outcome.main,
          quiet,
          results: outcome.results
        })
    lines.forEach((line) => console.log(line))
    if (outcome.error) {
      console.error(
        failureLine({
          dryRun,
          message: outcome.error.message,
          results: outcome.results
        })
      )
      process.exitCode = 1
    }
  } catch (error) {
    console.error(failureLine({ message: error.message }))
    process.exitCode = 1
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'prune-worktrees.mjs')
) {
  await main()
}
