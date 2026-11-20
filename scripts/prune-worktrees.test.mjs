#!/usr/bin/env node
// ---------------------------------------------------------------------------
// prune-worktrees — the cases for the command that removes the worktree of a
// branch a pull request merged, then fast-forwards the main checkout.
//
// Every repository here is a throwaway under the OS temp directory, built by
// the test: a bare origin whose whole history one `git fast-import` writes,
// a clone of it on main, and one linked worktree per case. The command runs
// twice over the same repositories, `--dry-run` first, and each case reads
// what those two runs printed and left. The fixture's git commands start in
// gitFreeEnv(); the command itself runs with the GIT_DIR a post-merge hook
// in a linked worktree exports. Every clone compares line endings as bytes
// (`core.autocrlf=false`), whatever the machine's own setting, so a file
// that differs only in them is a local change. Nothing here runs detached:
// each scratch removal retries while Windows still holds a handle in it.
//
// Usage:
//   node --test scripts/prune-worktrees.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync
} from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from './git-free-env.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'
import {
  DIVERGED,
  FETCH_SECONDS_VARIABLE,
  fetchSecondsFrom,
  LOCAL_CHANGES,
  NESTED_RUN_VARIABLE,
  NOT_COVERED,
  optionsFrom,
  REASON,
  reportLines
} from './prune-worktrees.detect.mjs'
import {
  removeIfStillClean,
  removeLeftover,
  removeWorktree
} from './prune-worktrees.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, 'prune-worktrees.mjs')
const ROOT_PACKAGE = join(HERE, '..', 'package.json')
const POST_MERGE = join(HERE, '..', '.husky', 'post-merge')

const EXIT_OK = 0
const EXIT_FAILED = 1
const REMOVE_RETRIES = 10
const LOOPBACK = '127.0.0.1'
// How long a test waits for a command that a stalled remote could hold.
const STALL_GUARD_MS = 20_000
const MAIN = 'main'
const UNSAVED_FILE = 'unsaved-work.txt'
const LATE_FILE = 'late.txt'
const README = 'README.md'
const README_TEXT = 'README\n'
// A second tracked file of the main checkout, one no fast-forward touches.
const OTHER = 'b.txt'
const OTHER_TEXT = 'b\n'
const PUSHED_FILE = 'new.txt'
const LOCK_REASON = 'probe'
const HIDDEN_EDIT = 'local edit nobody committed\n'
// Ignored files an install, a build, a typecheck, a test run or the next
// session writes again.
const REBUILT_FILES = {
  '.husky/_/h': '\n',
  '.turbo/cache.json': '{}\n',
  'apps/mobile/.expo/settings.json': '{}\n',
  'apps/mobile/expo-env.d.ts': '\n',
  'apps/web/.next/BUILD_ID': '\n',
  'apps/web/coverage/lcov.info': '\n',
  'apps/web/next-env.d.ts': '\n',
  'apps/web/node_modules/pkg/index.js': '\n',
  'apps/web/tsconfig.tsbuildinfo': '{}\n',
  'node_modules/pkg/index.js': '\n',
  'packages/core/dist/index.js': '\n'
}
const PLAN_FILE = 'odd/tasks/plan.md'
// A note under a directory named as test output, away from any root, and a
// file that carries the name of one.
const NOTE_FILE = 'docs/coverage/notes.md'
const NAMED_FILE = 'coverage'
const ENV_FILE = '.env'
// Machine-local agent tooling the repository ignores: personal skills and
// notes nothing writes again.
const ATL_FILE = '.atl/my-notes.md'
// The two files of `.atl/` the skill-registry skill writes again, and a
// note beside them that nothing does.
const SKILL_REGISTRY = {
  '.atl/.skill-registry.cache.json': '{}\n',
  '.atl/skill-registry.md': '# Skill registry\n'
}
const ATL_NOTES = '.atl/notes.md'
const LATE_ENV = 'KEY=late\n'
// What the fixture repository ignores through `.git/info/exclude`.
const IGNORED_PATHS = [
  '.atl/',
  '.claude/worktrees/',
  '.expo/',
  '.husky/_/',
  '.next/',
  '.turbo/',
  'coverage/',
  'dist/',
  'node_modules/',
  'odd/',
  '.env',
  '*.tsbuildinfo',
  'expo-env.d.ts',
  'next-env.d.ts',
  NAMED_FILE,
  ''
]
const COMMITTER = 'probe <probe@example.invalid> 1700000000 +0000'
const IDENTITY = [
  '-c',
  'user.name=probe',
  '-c',
  'user.email=probe@example.invalid'
]
// Clones that read line endings as bytes, whatever the machine sets.
const BYTE_ENDINGS = ['-c', 'core.autocrlf=false']

const scratchRoots = []

after(() =>
  scratchRoots.forEach((root) =>
    rmSync(root, {
      force: true,
      maxRetries: REMOVE_RETRIES,
      recursive: true
    })
  )
)

const scratchRoot = ({ prefix }) => {
  const root = mkdtempSync(join(tmpdir(), prefix))
  scratchRoots.push(root)
  return root
}

const git = ({ args, cwd, input }) =>
  execFileSync('git', [...IDENTITY, ...args], {
    cwd,
    encoding: 'utf8',
    env: gitFreeEnv(),
    input,
    stdio: 'pipe'
  }).trim()

const forward = ({ path }) => path.replaceAll('\\', '/')

// Each case: the branch, where its worktree lives under the scratch root,
// whether main merged it, whether origin still holds it, whether its local
// branch tracks origin, the files written into it, and the reason it is
// kept (absent: it is removed). `ignored` writes the ignored files an
// install, a build and a typecheck write; `files` writes others, each path
// with its text; `untrackedFile` writes one the repository does not ignore;
// `hidesUntracked` sets `status.showUntrackedFiles=no` for that worktree
// alone; `crlf` rewrites its tracked file with CRLF endings and nothing
// else; `locked` runs `git worktree lock` on it.
const CASES = [
  { branch: 'feat/merged', dir: 'merged', ignored: true, merged: true },
  {
    branch: 'feat/ignored-doc',
    dir: 'ignored-doc',
    files: {
      [NAMED_FILE]: 'named\n',
      [NOTE_FILE]: 'note\n',
      [PLAN_FILE]: 'plan\n'
    },
    ignored: true,
    kept: REASON.IGNORED,
    merged: true
  },
  {
    branch: 'feat/env',
    dir: 'env',
    files: { [ENV_FILE]: 'KEY=local\n' },
    kept: REASON.IGNORED,
    merged: true
  },
  {
    branch: 'feat/atl',
    dir: 'atl',
    files: { [ATL_FILE]: 'personal\n' },
    kept: REASON.IGNORED,
    merged: true
  },
  {
    branch: 'feat/locked',
    dir: 'locked',
    kept: REASON.LOCKED,
    locked: true,
    merged: true
  },
  {
    branch: 'feat/dirty',
    dir: 'dirty',
    hidesUntracked: true,
    kept: REASON.DIRTY,
    merged: true,
    untrackedFile: 'notes.txt'
  },
  {
    branch: 'feat/line-endings',
    crlf: true,
    dir: 'line-endings',
    kept: REASON.DIRTY,
    merged: true
  },
  // A merged, clean worktree with another registered worktree inside it,
  // under a path the repository ignores, as `.claude/worktrees/` is ignored
  // where the Claude app writes it.
  {
    branch: 'feat/hidden',
    dir: 'wt-hidden',
    kept: REASON.HOLDS_WORKTREE,
    merged: true
  },
  {
    branch: 'feat/nest',
    dir: 'wt-hidden/.claude/worktrees/nest',
    kept: REASON.CLAUDE_APP,
    merged: true,
    untrackedFile: UNSAVED_FILE
  },
  {
    branch: 'feat/unmerged',
    dir: 'unmerged',
    kept: REASON.NOT_IN_DEFAULT
  },
  {
    branch: 'feat/upstream',
    dir: 'upstream',
    kept: REASON.UPSTREAM_PRESENT,
    merged: true,
    onOrigin: true
  },
  {
    branch: 'feat/no-upstream',
    dir: 'no-upstream',
    kept: REASON.NO_UPSTREAM,
    merged: true,
    onOrigin: true,
    untracked: true
  },
  {
    branch: 'feat/app',
    dir: 'main/.claude/worktrees/app',
    kept: REASON.CLAUDE_APP,
    merged: true
  },
  {
    branch: 'feat/current',
    dir: 'current',
    kept: REASON.CURRENT,
    merged: true
  }
]

// A fast-import data block. The line join supplies the newline after it;
// a second one would be the blank line that ends the commit.
const data = ({ text }) => `data ${Buffer.byteLength(text)}\n${text}`

const fileOf = ({ branch }) => `${branch.replaceAll('/', '-')}.txt`

const textOf = ({ branch }) => `${branch}\n`

// The whole origin history as one fast-import stream: main's first commit,
// one commit per case branch on top of it, and on main one merge commit per
// merged branch, under the subject a pull request's merge button writes.
const historyStream = () => {
  const root = [
    `commit refs/heads/${MAIN}`,
    'mark :1',
    `committer ${COMMITTER}`,
    data({ text: 'init' }),
    `M 100644 inline ${README}`,
    data({ text: README_TEXT })
  ]
  const branches = CASES.flatMap(({ branch }, at) => [
    `commit refs/heads/${branch}`,
    `mark :${at + 2}`,
    `committer ${COMMITTER}`,
    data({ text: `add ${fileOf({ branch })}` }),
    'from :1',
    `M 100644 inline ${fileOf({ branch })}`,
    data({ text: textOf({ branch }) })
  ])
  const merges = CASES.flatMap(({ branch, merged }, at) =>
    merged
      ? [
          `commit refs/heads/${MAIN}`,
          `committer ${COMMITTER}`,
          data({ text: `Merge pull request #${at} from owner/${branch}` }),
          `merge :${at + 2}`,
          `M 100644 inline ${fileOf({ branch })}`,
          data({ text: textOf({ branch }) })
        ]
      : []
  )
  return [...root, ...branches, ...merges, ''].join('\n')
}

// The scratch main checkout's post-merge hook, written the way husky's own
// stub runs `.husky/post-merge`: `sh -e` on the real file, so `git hook run`
// drives it through git's shell on every platform.
const installPostMerge = ({ main }) => {
  const hook = join(main, '.git', 'hooks', 'post-merge')
  writeFileSync(
    hook,
    `#!/usr/bin/env sh\nsh -e "${forward({ path: POST_MERGE })}" "$@"\n`,
    { mode: 0o755 }
  )
}

const runPostMerge = ({ cwd }) => {
  const run = spawnSync('git', ['hook', 'run', 'post-merge', '--', '0'], {
    cwd,
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  return { output: `${run.stdout}${run.stderr}`, status: run.status }
}

const fixture = {}

before(() => {
  const scratch = scratchRoot({ prefix: 'prune-worktrees-' })
  const origin = join(scratch, 'origin.git')
  const main = join(scratch, 'main')
  git({
    args: ['init', '-q', '--bare', '-b', MAIN, origin],
    cwd: scratch
  })
  git({
    args: ['fast-import', '--quiet'],
    cwd: origin,
    input: historyStream()
  })
  git({
    args: ['clone', '-q', ...BYTE_ENDINGS, origin, main],
    cwd: scratch
  })
  appendFileSync(
    join(main, '.git', 'info', 'exclude'),
    IGNORED_PATHS.join('\n')
  )
  git({ args: ['config', 'core.repositoryformatversion', '1'], cwd: main })
  git({ args: ['config', 'extensions.worktreeConfig', 'true'], cwd: main })
  installPostMerge({ main })

  // An existing origin branch checked out by name becomes a local branch
  // tracking it; `--no-track` leaves it without an upstream.
  const paths = Object.fromEntries(
    CASES.map(
      ({
        branch,
        crlf,
        dir,
        files = {},
        hidesUntracked,
        ignored,
        locked,
        untracked,
        untrackedFile
      }) => {
        const path = join(scratch, dir)
        const track = untracked
          ? ['--no-track', '-b', branch, path, `origin/${branch}`]
          : [path, branch]
        git({ args: ['worktree', 'add', '-q', ...track], cwd: main })
        if (locked) {
          git({
            args: ['worktree', 'lock', '--reason', LOCK_REASON, path],
            cwd: main
          })
        }
        if (hidesUntracked) {
          git({
            args: [
              'config',
              '--worktree',
              'status.showUntrackedFiles',
              'no'
            ],
            cwd: path
          })
        }
        if (untrackedFile)
          writeFileSync(join(path, untrackedFile), 'draft\n')
        if (crlf) {
          writeFileSync(
            join(path, fileOf({ branch })),
            textOf({ branch }).replace('\n', '\r\n')
          )
        }
        const writes = {
          ...(ignored ? REBUILT_FILES : {}),
          ...files
        }
        Object.entries(writes).forEach(([file, text]) => {
          mkdirSync(dirname(join(path, file)), { recursive: true })
          writeFileSync(join(path, file), text)
        })
        return [branch, path]
      }
    )
  )
  const tracking = join(scratch, 'tracking')
  git({
    args: [
      'worktree',
      'add',
      '-q',
      '--track',
      '-b',
      'feat/tracking',
      tracking,
      `origin/${MAIN}`
    ],
    cwd: main
  })
  const detached = join(scratch, 'detached')
  git({
    args: ['worktree', 'add', '-q', '--detach', detached, MAIN],
    cwd: main
  })
  // A pull request's head branch is deleted on merge; `feat/unmerged`
  // lost its upstream without a merge.
  git({
    args: [
      'push',
      '-q',
      'origin',
      '--delete',
      ...CASES.filter(({ onOrigin }) => !onOrigin).map(
        ({ branch }) => branch
      )
    ],
    cwd: main
  })

  const current = paths['feat/current']
  // The variable git exports into a post-merge hook run in `current`.
  const env = {
    ...gitFreeEnv(),
    GIT_DIR: join(main, '.git', 'worktrees', 'current')
  }
  const dryRun = spawnSync(process.execPath, [SCRIPT, '--dry-run'], {
    cwd: current,
    encoding: 'utf8',
    env
  })
  const afterDryRun = {
    listed: git({ args: ['worktree', 'list', '--porcelain'], cwd: main }),
    mergedStays: existsSync(paths['feat/merged'])
  }
  const real = spawnSync(process.execPath, [SCRIPT], {
    cwd: current,
    encoding: 'utf8',
    env
  })
  const lineEndings = join(
    paths['feat/line-endings'],
    fileOf({ branch: 'feat/line-endings' })
  )
  const afterReal = {
    atlStays: existsSync(join(paths['feat/atl'], ATL_FILE)),
    branches: git({ args: ['branch', '--list'], cwd: main }),
    exists: Object.fromEntries(
      Object.entries({ ...paths, detached, tracking }).map(
        ([name, path]) => [name, existsSync(path)]
      )
    ),
    lineEndingBytes: readFileSync(lineEndings, 'utf8'),
    listed: git({ args: ['worktree', 'list', '--porcelain'], cwd: main }),
    namedStays: existsSync(join(paths['feat/ignored-doc'], NAMED_FILE)),
    noteStays: existsSync(join(paths['feat/ignored-doc'], NOTE_FILE)),
    planStays: existsSync(join(paths['feat/ignored-doc'], PLAN_FILE)),
    unsavedStays: existsSync(join(paths['feat/nest'], UNSAVED_FILE))
  }

  // The real post-merge hook, run by git from the main checkout: `current`
  // is no longer the worktree it runs in.
  const postMerge = runPostMerge({ cwd: main })
  const currentAfterPostMerge = existsSync(current)

  // A removal git itself refuses: a file written into the worktree after
  // the decision, as one written between the status read and the removal,
  // with the repository hiding untracked files from `git status`.
  const late = paths['feat/upstream']
  git({ args: ['config', 'status.showUntrackedFiles', 'no'], cwd: late })
  writeFileSync(join(late, LATE_FILE), 'late\n')
  const refused = removeWorktree({
    root: main,
    worktree: { branch: 'feat/upstream', path: late }
  })

  Object.assign(fixture, {
    afterDryRun,
    afterReal,
    current,
    currentAfterPostMerge,
    detached,
    dryRun,
    paths,
    postMerge,
    real,
    refused: {
      branches: git({ args: ['branch', '--list'], cwd: main }),
      lateStays: existsSync(join(late, LATE_FILE)),
      result: refused
    },
    tracking
  })
})

// A line stating the decision for one worktree: the verb, the path, the
// branch in parentheses and, for a kept one, the reason.
const DECISION_LINE =
  /^prune-worktrees: (?:would remove|removed|kept) .+ \([^)]+\)/

// The decision each output line states for one path, with the verb of a dry
// run and of a real one read as the same decision.
const decisions = ({ stdout }) =>
  stdout
    .split(/\r?\n/)
    .filter((line) => DECISION_LINE.test(line))
    .map((line) => line.replace('would remove', 'removed'))
    .sort()

const keptLine = ({ branch, path, reason }) =>
  `kept ${forward({ path })} (${branch}): ${reason}`

const lineFor = ({ branch }) =>
  fixture.real.stdout
    .split(/\r?\n/)
    .find((one) => one.includes(`(${branch})`))

test('a dry run exits 0 and names the worktree it would remove', () => {
  assert.equal(fixture.dryRun.status, EXIT_OK, fixture.dryRun.stderr)
  assert.ok(
    fixture.dryRun.stdout.includes(
      `would remove ${forward({ path: fixture.paths['feat/merged'] })}`
    ),
    fixture.dryRun.stdout
  )
})

test('a dry run removes no worktree, no directory and no branch', () => {
  assert.ok(fixture.afterDryRun.mergedStays)
  assert.ok(
    fixture.afterDryRun.listed.includes('refs/heads/feat/merged'),
    fixture.afterDryRun.listed
  )
})

test('a dry run states the decisions the real run carries out', () => {
  assert.deepEqual(
    decisions({ stdout: fixture.dryRun.stdout }),
    decisions({ stdout: fixture.real.stdout })
  )
})

test('a merged, clean worktree whose upstream is gone is removed', () => {
  assert.equal(fixture.real.status, EXIT_OK, fixture.real.stderr)
  const path = fixture.paths['feat/merged']
  assert.ok(!existsSync(path), `${path} still exists`)
  assert.ok(!fixture.afterReal.listed.includes('refs/heads/feat/merged'))
  assert.ok(!fixture.afterReal.branches.includes('feat/merged'))
})

// The merged worktree holds each path of `REBUILT_FILES`, all ignored.
test('ignored files an install or a build writes do not keep it', () => {
  assert.ok(
    fixture.real.stdout.includes(
      `removed ${forward({ path: fixture.paths['feat/merged'] })} (feat/merged)`
    ),
    fixture.real.stdout
  )
})

// git's own removal deletes an ignored file without asking.
test('an ignored file nothing rebuilds keeps the worktree and stays', () => {
  assert.ok(fixture.afterReal.planStays, `${PLAN_FILE} was deleted`)
  assert.ok(fixture.afterReal.noteStays, `${NOTE_FILE} was deleted`)
  assert.ok(fixture.afterReal.namedStays, `${NAMED_FILE} was deleted`)
  const line = lineFor({ branch: 'feat/ignored-doc' })
  assert.ok(
    line?.includes(
      `${REASON.IGNORED}: ${NAMED_FILE}, docs/coverage/, odd/`
    ),
    line
  )
  assert.ok(!line.includes('node_modules'), line)
  assert.ok(!line.includes('apps/web/coverage'), line)
})

test('an env file keeps the worktree: nothing writes it again', () => {
  assert.ok(fixture.afterReal.exists['feat/env'])
  assert.ok(
    lineFor({ branch: 'feat/env' })?.includes(
      `${REASON.IGNORED}: ${ENV_FILE}`
    ),
    fixture.real.stdout
  )
})

// `.atl/` is machine-local agent tooling the repository ignores: personal
// skills and notes, which no install or session writes again.
test('a file under .atl/ keeps the worktree and stays', () => {
  assert.ok(fixture.afterReal.atlStays, `${ATL_FILE} was deleted`)
  assert.ok(
    lineFor({ branch: 'feat/atl' })?.includes(`${REASON.IGNORED}: .atl/`),
    fixture.real.stdout
  )
})

test('a locked worktree is kept with its lock reason, in the dry run as in the real one', () => {
  const kept = `${REASON.LOCKED}: ${LOCK_REASON}`
  const dryLine = fixture.dryRun.stdout
    .split(/\r?\n/u)
    .find((one) => one.includes('(feat/locked)'))
  assert.ok(dryLine?.includes(`kept `), dryLine)
  assert.ok(dryLine.endsWith(kept), dryLine)
  assert.ok(lineFor({ branch: 'feat/locked' })?.endsWith(kept))
})

test('a dry run names what it does not cover as its last line', () => {
  const last = fixture.dryRun.stdout.trim().split(/\r?\n/u).at(-1)
  assert.equal(last, `prune-worktrees: not covered: ${NOT_COVERED}`)
  assert.match(NOT_COVERED, /fetch --prune/u)
  assert.match(NOT_COVERED, /current directory/u)
  assert.match(NOT_COVERED, /foreground/u)
})

test('a file that differs only in its line endings is a local change and keeps the worktree', () => {
  assert.ok(fixture.afterReal.exists['feat/line-endings'])
  assert.equal(
    fixture.afterReal.lineEndingBytes,
    textOf({ branch: 'feat/line-endings' }).replace('\n', '\r\n')
  )
  assert.ok(
    fixture.real.stdout.includes(
      keptLine({
        branch: 'feat/line-endings',
        path: fixture.paths['feat/line-endings'],
        reason: REASON.DIRTY
      })
    ),
    fixture.real.stdout
  )
})

test('the work of a worktree nested inside a merged one survives', () => {
  assert.ok(fixture.afterReal.unsavedStays, `${UNSAVED_FILE} was deleted`)
  assert.ok(
    fixture.afterReal.listed.includes('refs/heads/feat/nest'),
    fixture.afterReal.listed
  )
})

test('status.showUntrackedFiles=no does not hide untracked work', () => {
  assert.ok(fixture.afterReal.exists['feat/dirty'])
  assert.ok(
    fixture.real.stdout.includes(
      keptLine({
        branch: 'feat/dirty',
        path: fixture.paths['feat/dirty'],
        reason: REASON.DIRTY
      })
    ),
    fixture.real.stdout
  )
})

test('a removal git refuses is kept with the message git gave', () => {
  const { result } = fixture.refused
  assert.equal(result.kept, REASON.REMOVE_FAILED)
  assert.match(result.detail, /untracked/)
  assert.ok(fixture.refused.lateStays, `${LATE_FILE} was deleted`)
  assert.ok(fixture.refused.branches.includes('feat/upstream'))
})

CASES.filter(({ kept }) => kept).forEach(({ branch, kept }) => {
  test(`${branch} is kept: ${kept}`, () => {
    const path = fixture.paths[branch]
    assert.ok(fixture.afterReal.exists[branch], `${path} was removed`)
    assert.ok(fixture.afterReal.branches.includes(branch))
    assert.ok(
      fixture.real.stdout.includes(
        keptLine({ branch, path, reason: kept })
      ),
      fixture.real.stdout
    )
  })
})

test('a worktree tracking the default branch itself is kept', () => {
  assert.ok(fixture.afterReal.exists.tracking)
  assert.ok(
    fixture.real.stdout.includes(
      keptLine({
        branch: 'feat/tracking',
        path: fixture.tracking,
        reason: REASON.TRACKS_DEFAULT
      })
    ),
    fixture.real.stdout
  )
})

test('a detached worktree is kept', () => {
  assert.ok(fixture.afterReal.exists.detached)
  assert.ok(
    fixture.real.stdout.includes(
      keptLine({
        branch: 'detached',
        path: fixture.detached,
        reason: REASON.DETACHED
      })
    ),
    fixture.real.stdout
  )
})

test('the main checkout is kept', () => {
  assert.ok(
    fixture.real.stdout.includes(`(${MAIN}): ${REASON.MAIN}`),
    fixture.real.stdout
  )
})

test('the summary line counts the removed and the kept by reason', () => {
  const summary = fixture.real.stdout.trim().split(/\r?\n/).at(-1)
  assert.match(summary, /: removed 1, kept 16; by reason: /)
  assert.ok(summary.includes(`${REASON.DIRTY} 2`), summary)
  assert.ok(summary.includes(`${REASON.IGNORED} 3`), summary)
  assert.ok(summary.includes(`${REASON.LOCKED} 1`), summary)
  assert.ok(summary.includes(`${REASON.MAIN} 1`), summary)
})

test('--quiet prints the removals and the summary, no kept line', () => {
  const lines = reportLines({
    dryRun: false,
    quiet: true,
    results: [
      { branch: 'feat/a', kept: null, path: 'C:/wt/a' },
      { branch: 'feat/b', kept: REASON.DIRTY, path: 'C:/wt/b' }
    ]
  })
  assert.deepEqual(lines, [
    'prune-worktrees: removed C:/wt/a (feat/a)',
    `prune-worktrees: removed 1, kept 1; by reason: ${REASON.DIRTY} 1`
  ])
})

test('outside a git repository it exits 1 and removes nothing', () => {
  const outside = scratchRoot({ prefix: 'prune-outside-' })
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: outside,
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  assert.equal(result.status, EXIT_FAILED)
  assert.match(result.stderr, /nothing was removed/)
})

// The fast-forward of the main checkout fires that checkout's own
// post-merge, which would start the pruner again from there.
test('a run started from inside a prune exits 0 at once and prints nothing', () => {
  const outside = scratchRoot({ prefix: 'prune-nested-' })
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: outside,
    encoding: 'utf8',
    env: { ...gitFreeEnv(), [NESTED_RUN_VARIABLE]: '1' }
  })
  assert.equal(result.status, EXIT_OK, result.stderr)
  assert.equal(result.stdout, '')
  assert.equal(result.stderr, '')
})

// A branch that moved between the decision and the removal keeps the
// commits it gained.
test('a branch whose tip moved since it was judged is kept when its worktree goes', () => {
  const scratch = scratchRoot({ prefix: 'prune-moved-' })
  const root = join(scratch, 'main')
  const path = join(scratch, 'moved')
  git({ args: ['init', '-q', '-b', MAIN, root], cwd: scratch })
  git({ args: ['commit', '-q', '--allow-empty', '-m', 'init'], cwd: root })
  git({
    args: ['worktree', 'add', '-q', '-b', 'feat/moved', path],
    cwd: root
  })
  const judged = git({ args: ['rev-parse', 'HEAD'], cwd: path })
  git({ args: ['commit', '-q', '--allow-empty', '-m', 'late'], cwd: path })
  const result = removeWorktree({
    root,
    worktree: { branch: 'feat/moved', path, sha: judged }
  })
  assert.equal(result.kept, null)
  assert.ok(!existsSync(path), `${path} still exists`)
  assert.match(result.detail, /feat\/moved/u)
  assert.match(
    git({ args: ['branch', '--list', 'feat/moved'], cwd: root }),
    /feat\/moved/u
  )
})

test('a branch still at its judged tip is deleted with its worktree, and its config with it', () => {
  const scratch = scratchRoot({ prefix: 'prune-judged-' })
  const root = join(scratch, 'main')
  const path = join(scratch, 'judged')
  git({ args: ['init', '-q', '-b', MAIN, root], cwd: scratch })
  git({ args: ['commit', '-q', '--allow-empty', '-m', 'init'], cwd: root })
  git({
    args: ['worktree', 'add', '-q', '-b', 'feat/judged', path],
    cwd: root
  })
  git({
    args: ['config', 'branch.feat/judged.remote', 'origin'],
    cwd: root
  })
  const judged = git({ args: ['rev-parse', 'HEAD'], cwd: path })
  const result = removeWorktree({
    root,
    worktree: { branch: 'feat/judged', path, sha: judged }
  })
  assert.equal(result.kept, null)
  assert.equal(result.detail, undefined)
  assert.equal(
    git({ args: ['branch', '--list', 'feat/judged'], cwd: root }),
    ''
  )
  const config = spawnSync(
    'git',
    ['config', '--get-regexp', '^branch\\.feat/judged\\.'],
    { cwd: root, encoding: 'utf8', env: gitFreeEnv() }
  )
  assert.equal(config.stdout, '')
})

test('an unknown option throws, naming it', () => {
  assert.throws(
    () => optionsFrom({ argv: ['node', 'x.mjs', '--all'] }),
    /--all/
  )
})

test('--dry-run and --quiet are read', () => {
  assert.deepEqual(
    optionsFrom({ argv: ['node', 'x.mjs', '--dry-run', '--quiet'] }),
    { dryRun: true, quiet: true }
  )
})

// pnpm stores a package as a junction, here one into a directory outside
// the worktree: removing the worktree removes the link and keeps what it
// points at, and a junction whose target is gone is removed too.
test('a left directory goes, and a junction in it is not followed', () => {
  const scratch = scratchRoot({ prefix: 'prune-leftover-' })
  const target = join(scratch, 'store')
  const leftover = join(scratch, 'worktree')
  mkdirSync(target)
  writeFileSync(join(target, 'kept.txt'), 'store\n')
  mkdirSync(join(leftover, 'node_modules'), { recursive: true })
  writeFileSync(join(leftover, 'node_modules', 'a.txt'), 'a\n')
  symlinkSync(target, join(leftover, 'node_modules', 'pkg'), 'junction')
  symlinkSync(
    join(scratch, 'missing'),
    join(leftover, 'node_modules', 'broken'),
    'junction'
  )
  removeLeftover({ path: leftover })
  assert.ok(!existsSync(leftover), `${leftover} still exists`)
  assert.equal(readFileSync(join(target, 'kept.txt'), 'utf8'), 'store\n')
})

test('post-merge runs the prune from the main checkout', () => {
  assert.ok(!fixture.currentAfterPostMerge, fixture.postMerge.output)
  assert.ok(
    fixture.postMerge.output.includes(
      `removed ${forward({ path: fixture.current })} (feat/current)`
    ),
    fixture.postMerge.output
  )
})

test('post-merge exits 0 and lists no kept line', () => {
  assert.equal(fixture.postMerge.status, EXIT_OK, fixture.postMerge.output)
  assert.ok(!fixture.postMerge.output.includes(': kept '))
})

test('post-merge exits 0 when the prune fails, and says nothing was removed', () => {
  const scratch = scratchRoot({ prefix: 'prune-post-merge-' })
  const repository = join(scratch, 'repository')
  git({ args: ['init', '-q', repository], cwd: scratch })
  installPostMerge({ main: repository })
  const run = runPostMerge({ cwd: repository })
  assert.equal(run.status, EXIT_OK, run.output)
  assert.match(run.output, /prune-worktrees: .*nothing was removed/su)
})

// A main checkout one commit behind its origin: a bare origin whose default
// branch is `branch` and whose first commit holds README.md, b.txt and the
// `* text=auto` this repository's `.gitattributes` sets; the main clone; and
// a second clone that pushes `push`, by default a change to README.md.
// `prepare` runs in the main clone before the command does, which starts
// under `env`.
const behindMain = ({
  args = [],
  branch = MAIN,
  env = gitFreeEnv(),
  prepare = () => {},
  push = { [README]: 'README v2\n' }
}) => {
  const scratch = scratchRoot({ prefix: 'prune-forward-' })
  const origin = join(scratch, 'origin.git')
  const main = join(scratch, 'main')
  const pusher = join(scratch, 'pusher')
  git({
    args: ['init', '-q', '--bare', '-b', branch, origin],
    cwd: scratch
  })
  git({
    args: ['fast-import', '--quiet'],
    cwd: origin,
    input: [
      `commit refs/heads/${branch}`,
      `committer ${COMMITTER}`,
      data({ text: 'init' }),
      'M 100644 inline .gitattributes',
      data({ text: '* text=auto\n' }),
      `M 100644 inline ${README}`,
      data({ text: README_TEXT }),
      `M 100644 inline ${OTHER}`,
      data({ text: OTHER_TEXT }),
      ''
    ].join('\n')
  })
  git({
    args: ['clone', '-q', ...BYTE_ENDINGS, origin, main],
    cwd: scratch
  })
  git({
    args: ['clone', '-q', ...BYTE_ENDINGS, origin, pusher],
    cwd: scratch
  })
  Object.entries(push).forEach(([file, text]) =>
    writeFileSync(join(pusher, file), text)
  )
  git({ args: ['add', '--all'], cwd: pusher })
  git({ args: ['commit', '-q', '-m', 'v2'], cwd: pusher })
  git({ args: ['push', '-q', 'origin', branch], cwd: pusher })
  const before = git({ args: ['rev-parse', 'HEAD'], cwd: main })
  prepare({ main })
  const run = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: main,
    encoding: 'utf8',
    env
  })
  return {
    before,
    head: git({ args: ['rev-parse', 'HEAD'], cwd: main }),
    main,
    other: readFileSync(join(main, OTHER), 'utf8'),
    readme: readFileSync(join(main, README), 'utf8'),
    run,
    tip: git({ args: ['rev-parse', `origin/${branch}`], cwd: main })
  }
}

// Rewrites a checked-out file with the other line endings and nothing else.
// Under `* text=auto` a checkout writes the platform's endings, CRLF on
// Windows and LF elsewhere, so the change starts from what is on disk.
const flipEndings = ({ path }) => {
  const text = readFileSync(path, 'utf8')
  const flipped = text.includes('\r\n')
    ? text.replaceAll('\r\n', '\n')
    : text.replaceAll('\n', '\r\n')
  writeFileSync(path, flipped)
  return flipped
}

// The line that says the main checkout stayed one commit behind, and why.
const leftLine = ({ main, reason }) =>
  `left the main checkout ${forward({ path: main })} 1 commit behind ` +
  `origin/${MAIN}: ${reason}`

test('a main checkout on main behind origin is fast-forwarded', () => {
  const { head, main, run, tip } = behindMain({})
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, tip)
  assert.ok(
    run.stdout.includes(
      `fast-forwarded the main checkout ${forward({ path: main })} by ` +
        `1 commit to origin/${MAIN}`
    ),
    run.stdout
  )
})

test("the default branch is origin's, whatever its name", () => {
  const { head, main, run, tip } = behindMain({ branch: 'trunk' })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, tip)
  assert.ok(
    run.stdout.includes(
      `fast-forwarded the main checkout ${forward({ path: main })} by ` +
        '1 commit to origin/trunk'
    ),
    run.stdout
  )
})

test('the summary stays the last line after a fast-forward', () => {
  const { run } = behindMain({})
  const lines = run.stdout.trim().split(/\r?\n/)
  assert.match(lines.at(-1), /: removed 0, kept 1; by reason: /)
})

test('a dry run names the fast-forward and does not move the checkout', () => {
  const { before, head, main, run } = behindMain({ args: ['--dry-run'] })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.ok(
    run.stdout.includes(
      `would fast-forward the main checkout ${forward({ path: main })} by ` +
        `1 commit to origin/${MAIN}`
    ),
    run.stdout
  )
})

test('a local change the fast-forward would overwrite stays, unmoved', () => {
  const { before, head, main, readme, run } = behindMain({
    prepare: ({ main: checkout }) =>
      writeFileSync(join(checkout, README), 'local edit\n')
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.equal(readme, 'local edit\n')
  assert.ok(
    run.stdout.includes(
      leftLine({ main, reason: `${LOCAL_CHANGES}: ${README}` })
    ),
    run.stdout
  )
})

test('a file that differs only in its line endings blocks the fast-forward and stays', () => {
  const flipped = {}
  const { before, head, main, readme, run } = behindMain({
    prepare: ({ main: checkout }) => {
      flipped.text = flipEndings({ path: join(checkout, README) })
    }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.equal(readme, flipped.text)
  assert.ok(
    run.stdout.includes(
      leftLine({ main, reason: `${LOCAL_CHANGES}: ${README}` })
    ),
    run.stdout
  )
})

// Plan row 3.3: any tracked local change blocks the fast-forward, not only
// one in a file the fast-forward would update.
test('a local change to a file the fast-forward does not touch blocks it too', () => {
  const { before, head, main, other, run } = behindMain({
    prepare: ({ main: checkout }) =>
      writeFileSync(join(checkout, OTHER), 'b edited\n')
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.equal(other, 'b edited\n')
  assert.ok(
    run.stdout.includes(
      leftLine({ main, reason: `${LOCAL_CHANGES}: ${OTHER}` })
    ),
    run.stdout
  )
})

test('a line-ending-only change to a file the fast-forward does not touch blocks it', () => {
  const flipped = {}
  const { before, head, main, other, run } = behindMain({
    prepare: ({ main: checkout }) => {
      flipped.text = flipEndings({ path: join(checkout, OTHER) })
    }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.equal(other, flipped.text)
  assert.ok(
    run.stdout.includes(
      leftLine({ main, reason: `${LOCAL_CHANGES}: ${OTHER}` })
    ),
    run.stdout
  )
})

test('a staged change blocks the fast-forward, and a dry run says so', () => {
  const stage = ({ main: checkout }) => {
    writeFileSync(join(checkout, OTHER), 'b staged\n')
    git({ args: ['add', OTHER], cwd: checkout })
  }
  const real = behindMain({ prepare: stage })
  const dry = behindMain({ args: ['--dry-run'], prepare: stage })
  assert.equal(real.run.status, EXIT_OK, real.run.stderr)
  assert.equal(real.head, real.before)
  assert.ok(
    real.run.stdout.includes(
      leftLine({ main: real.main, reason: `${LOCAL_CHANGES}: ${OTHER}` })
    ),
    real.run.stdout
  )
  assert.ok(
    dry.run.stdout.includes(
      leftLine({
        main: dry.main,
        reason: `${LOCAL_CHANGES}: ${OTHER}`
      }).replace('left the', 'would leave the')
    ),
    dry.run.stdout
  )
})

test("git's refusal is named by its first line that is not a hint, with the files it lists", () => {
  const { before, head, main, run } = behindMain({
    prepare: ({ main: checkout }) =>
      writeFileSync(join(checkout, PUSHED_FILE), 'local\n'),
    push: { [PUSHED_FILE]: 'upstream\n' }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.ok(run.stdout.includes(leftLine({ main, reason: 'error: ' })))
  assert.match(
    run.stdout,
    new RegExp(`would be overwritten by merge: ${PUSHED_FILE}$`, 'mu')
  )
})

test("a main checkout that diverged is left with git's fatal line, not a hint", () => {
  const { head, main, run, tip } = behindMain({
    prepare: ({ main: checkout }) =>
      git({
        args: ['commit', '-q', '--allow-empty', '-m', 'local'],
        cwd: checkout
      })
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.notEqual(head, tip)
  const line = run.stdout
    .split(/\r?\n/u)
    .find((one) => one.includes('left the main checkout'))
  assert.ok(line?.startsWith('prune-worktrees: left'), run.stdout)
  assert.ok(
    line.includes(
      `${forward({ path: main })} 1 commit behind origin/${MAIN}: fatal: `
    ),
    line
  )
  assert.doesNotMatch(line, /hint:/u)
})

test('a main checkout on another branch is not moved', () => {
  const { before, head, main, run } = behindMain({
    prepare: ({ main: checkout }) =>
      git({ args: ['switch', '-q', '-c', 'feat/local'], cwd: checkout })
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.ok(
    run.stdout.includes(
      `left the main checkout ${forward({ path: main })} on feat/local, ` +
        `not ${MAIN}`
    ),
    run.stdout
  )
})

test('a main checkout already at its origin prints no line for it', () => {
  assert.doesNotMatch(
    fixture.real.stdout,
    /fast-forward|left the main checkout/
  )
})

test('with no origin/HEAD the default branch is unknown: it exits 1, names the fix and moves nothing', () => {
  const { before, head, run } = behindMain({
    prepare: ({ main: checkout }) => {
      git({
        args: ['config', 'remote.origin.followRemoteHEAD', 'never'],
        cwd: checkout
      })
      git({
        args: ['symbolic-ref', '--delete', 'refs/remotes/origin/HEAD'],
        cwd: checkout
      })
    }
  })
  assert.equal(run.status, EXIT_FAILED, run.stdout)
  assert.equal(head, before)
  assert.match(run.stderr, /git remote set-head origin --auto/)
  assert.match(run.stderr, /nothing was removed/)
})

// The command starts with the hook's GIT_DIR and GIT_INDEX_FILE in its
// environment, as `.husky/post-merge` starts it, so its own git calls must
// drop them.
test("END TO END: under a hook's GIT_DIR, the fixture and the command keep to the scratch repositories and the hook's repository is left alone", () => {
  const { decoyWritten, result } = withHookGitDir({
    use: () => behindMain({ env: { ...process.env } })
  })
  assert.equal(decoyWritten, false)
  assert.equal(result.run.status, EXIT_OK, result.run.stderr)
  assert.equal(result.head, result.tip)
})

// A bare origin, its main clone, a forge clone that merges pull requests,
// and one linked worktree per branch: each branch pushed, merged into main
// by the forge with a merge commit, and deleted on origin, which leaves the
// main clone behind. `hook` gives the main clone the real post-merge.
const mergedWorktrees = ({ branches, hook }) => {
  const scratch = scratchRoot({ prefix: 'prune-merged-' })
  const origin = join(scratch, 'origin.git')
  const main = join(scratch, 'main')
  const forge = join(scratch, 'forge')
  git({
    args: ['init', '-q', '--bare', '-b', MAIN, origin],
    cwd: scratch
  })
  git({
    args: ['clone', '-q', ...BYTE_ENDINGS, origin, main],
    cwd: scratch
  })
  writeFileSync(join(main, README), README_TEXT)
  git({ args: ['add', README], cwd: main })
  git({ args: ['commit', '-q', '-m', 'init'], cwd: main })
  git({ args: ['push', '-q', 'origin', MAIN], cwd: main })
  git({ args: ['remote', 'set-head', 'origin', '--auto'], cwd: main })
  if (hook) installPostMerge({ main })
  git({
    args: ['clone', '-q', ...BYTE_ENDINGS, origin, forge],
    cwd: scratch
  })
  const paths = Object.fromEntries(
    branches.map((branch) => {
      const path = join(scratch, branch.replaceAll('/', '-'))
      git({
        args: [
          'worktree',
          'add',
          '-q',
          '-b',
          branch,
          path,
          `origin/${MAIN}`
        ],
        cwd: main
      })
      writeFileSync(join(path, fileOf({ branch })), textOf({ branch }))
      git({ args: ['add', '--all'], cwd: path })
      git({ args: ['commit', '-q', '-m', branch], cwd: path })
      git({ args: ['push', '-q', '-u', 'origin', branch], cwd: path })
      git({ args: ['fetch', '-q'], cwd: forge })
      git({
        args: [
          'merge',
          '-q',
          '--no-ff',
          '-m',
          `Merge pull request from owner/${branch}`,
          `origin/${branch}`
        ],
        cwd: forge
      })
      git({ args: ['push', '-q', 'origin', MAIN], cwd: forge })
      git({
        args: ['push', '-q', 'origin', '--delete', branch],
        cwd: forge
      })
      return [branch, path]
    })
  )
  return { main, paths }
}

const prune = ({ cwd, env = gitFreeEnv() }) =>
  spawnSync(process.execPath, [SCRIPT], { cwd, encoding: 'utf8', env })

test("the worktree the command runs in survives the post-merge hook the main checkout's fast-forward fires", () => {
  const { main, paths } = mergedWorktrees({
    branches: ['feat/current'],
    hook: true
  })
  const current = paths['feat/current']
  const run = prune({
    cwd: current,
    env: {
      ...gitFreeEnv(),
      GIT_DIR: join(main, '.git', 'worktrees', 'feat-current')
    }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.match(run.stdout, /fast-forwarded the main checkout/u)
  assert.ok(
    existsSync(join(current, README)),
    'the worktree it runs in was emptied'
  )
  assert.match(
    git({ args: ['worktree', 'list', '--porcelain'], cwd: main }),
    /refs\/heads\/feat\/current/u
  )
})

for (const flag of ['--skip-worktree', '--assume-unchanged']) {
  test(`a local edit hidden by ${flag} keeps its worktree`, () => {
    const { main, paths } = mergedWorktrees({
      branches: ['feat/hidden'],
      hook: false
    })
    const hidden = paths['feat/hidden']
    git({ args: ['update-index', flag, README], cwd: hidden })
    writeFileSync(join(hidden, README), HIDDEN_EDIT)
    const run = prune({ cwd: main })
    assert.equal(run.status, EXIT_OK, run.stderr)
    assert.ok(existsSync(join(hidden, README)), run.stdout)
    assert.equal(readFileSync(join(hidden, README), 'utf8'), HIDDEN_EDIT)
    assert.ok(
      run.stdout.includes(
        keptLine({
          branch: 'feat/hidden',
          path: hidden,
          reason: `${REASON.HIDDEN}: ${README}`
        })
      ),
      run.stdout
    )
  })
}

// A remote that accepts the connection and never answers: the system
// completes the handshake while the test waits on the command, and git waits
// for a reply that never comes. `close` destroys every socket it accepted,
// so a git the command did not stop ends too.
const stalledRemote = async () => {
  const sockets = []
  const server = createServer((socket) => {
    socket.on('error', () => {})
    sockets.push(socket)
  })
  await new Promise((done) => server.listen(0, LOOPBACK, done))
  return {
    close: async () => {
      await new Promise((done) => setImmediate(done))
      sockets.forEach((socket) => socket.destroy())
      await new Promise((done) => server.close(done))
    },
    url: `git://${LOOPBACK}:${server.address().port}/origin.git`
  }
}

test('a fetch that outlasts its bound skips the prune and the fast-forward, says why and exits 0', async () => {
  const branch = 'feat/stalled'
  const { main, paths } = mergedWorktrees({
    branches: [branch],
    hook: false
  })
  git({ args: ['fetch', '-q', '--prune'], cwd: main })
  const originUrl = git({
    args: ['remote', 'get-url', 'origin'],
    cwd: main
  })
  const before = git({ args: ['rev-parse', 'HEAD'], cwd: main })
  const remote = await stalledRemote()
  git({ args: ['remote', 'set-url', 'origin', remote.url], cwd: main })
  const run = spawnSync(process.execPath, [SCRIPT, '--quiet'], {
    cwd: main,
    encoding: 'utf8',
    env: { ...gitFreeEnv(), [FETCH_SECONDS_VARIABLE]: '1' },
    timeout: STALL_GUARD_MS
  })
  await remote.close()
  assert.equal(run.status, EXIT_OK, `${run.error ?? ''} ${run.stderr}`)
  assert.equal(
    run.stdout.trim(),
    'prune-worktrees: skipped: git fetch --prune origin did not finish ' +
      'within 1 s, so no worktree was removed and the main checkout was ' +
      'not moved'
  )
  assert.equal(run.stderr, '')
  assert.ok(existsSync(paths[branch]), `${paths[branch]} was removed`)
  assert.match(
    git({ args: ['branch', '--list', branch], cwd: main }),
    /feat\/stalled/u
  )
  assert.equal(git({ args: ['rev-parse', 'HEAD'], cwd: main }), before)
  // The same repositories with a remote that answers: the worktree the
  // stalled run kept goes, and the main checkout moves.
  git({ args: ['remote', 'set-url', 'origin', originUrl], cwd: main })
  const answered = prune({ cwd: main })
  assert.equal(answered.status, EXIT_OK, answered.stderr)
  assert.ok(!existsSync(paths[branch]), answered.stdout)
  assert.notEqual(git({ args: ['rev-parse', 'HEAD'], cwd: main }), before)
})

// An ssh command that writes its pid to the file its first argument names
// and never answers: git starts it, through a shell on Windows, and waits
// on it, so the fetch is stopped at its bound with that tree below it.
const STALLED_SSH_SOURCE =
  "require('node:fs').writeFileSync(process.argv[2], String(process.pid)); " +
  'setInterval(() => {}, 1000)'
const SSH_BOUND_SECONDS = '3'
const ENDED_WITHIN_MS = 10_000
const POLL_MS = 100

const isRunning = ({ pid }) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM'
  }
}

test(
  'on Windows a fetch stopped at its bound ends the processes git started',
  {
    skip:
      process.platform !== 'win32' &&
      'on POSIX the bound still stops git alone, as before'
  },
  async () => {
    const { main, paths } = mergedWorktrees({
      branches: ['feat/stalled-ssh'],
      hook: false
    })
    const scratch = scratchRoot({ prefix: 'prune-ssh-' })
    const stall = join(scratch, 'stalled-ssh.cjs')
    const pidFile = join(scratch, 'ssh.pid')
    writeFileSync(stall, STALLED_SSH_SOURCE)
    const quoted = (path) => `"${forward({ path })}"`
    git({
      args: [
        'config',
        'core.sshCommand',
        [process.execPath, stall, pidFile].map(quoted).join(' ')
      ],
      cwd: main
    })
    git({ args: ['config', 'ssh.variant', 'simple'], cwd: main })
    git({
      args: ['remote', 'set-url', 'origin', `ssh://${LOOPBACK}/origin.git`],
      cwd: main
    })
    let pid
    try {
      const run = spawnSync(process.execPath, [SCRIPT, '--quiet'], {
        cwd: main,
        encoding: 'utf8',
        env: { ...gitFreeEnv(), [FETCH_SECONDS_VARIABLE]: SSH_BOUND_SECONDS },
        timeout: STALL_GUARD_MS
      })
      assert.ok(existsSync(pidFile), `the ssh command never started: ${run.stderr}`)
      pid = Number(readFileSync(pidFile, 'utf8'))
      assert.equal(run.status, EXIT_OK, `${run.error ?? ''} ${run.stderr}`)
      assert.match(run.stdout, /skipped: git fetch --prune origin did not finish/u)
      assert.ok(existsSync(paths['feat/stalled-ssh']))
      let waited = 0
      while (isRunning({ pid }) && waited < ENDED_WITHIN_MS) {
        await new Promise((done) => setTimeout(done, POLL_MS))
        waited += POLL_MS
      }
      assert.equal(isRunning({ pid }), false, `ssh command ${pid} still runs`)
    } finally {
      if (pid !== undefined && isRunning({ pid })) process.kill(pid)
    }
  }
)

test('the fetch is bound to 30 s unless PRUNE_WORKTREES_FETCH_SECONDS names another positive number', () => {
  assert.equal(fetchSecondsFrom({ env: {} }), 30)
  assert.equal(
    fetchSecondsFrom({ env: { [FETCH_SECONDS_VARIABLE]: '2.5' } }),
    2.5
  )
})

for (const value of ['', '0', '-1', 'soon', 'Infinity']) {
  test(`PRUNE_WORKTREES_FETCH_SECONDS="${value}" throws, naming the variable and the value`, () => {
    assert.throws(
      () => fetchSecondsFrom({ env: { [FETCH_SECONDS_VARIABLE]: value } }),
      (error) =>
        error.message.includes(FETCH_SECONDS_VARIABLE) &&
        error.message.includes(`"${value}"`)
    )
  })
}

// Node takes a timeout in whole milliseconds only; a bound that is not one
// is rounded up, so the run either fetches or skips, and git never reads
// as failed.
for (const value of ['0.0001', '1.0005']) {
  test(`PRUNE_WORKTREES_FETCH_SECONDS="${value}" bounds the fetch in whole milliseconds, rounded up`, () => {
    const { run } = behindMain({
      args: ['--dry-run'],
      env: { ...gitFreeEnv(), [FETCH_SECONDS_VARIABLE]: value }
    })
    assert.equal(run.status, EXIT_OK, run.stderr)
    assert.equal(run.stderr, '')
    assert.doesNotMatch(run.stdout, /out of range/u)
  })
}

// A worktree judged clean that is given an ignored file nothing rebuilds
// before its turn comes, as one written while the pruner removes the
// others: the check just before the removal reads the worktree again.
test('an ignored file written after the decision keeps the worktree, and the file stays', () => {
  const branch = 'feat/late-ignored'
  const { main, paths } = mergedWorktrees({
    branches: [branch],
    hook: false
  })
  appendFileSync(join(main, '.git', 'info', 'exclude'), `\n${ENV_FILE}\n`)
  const path = paths[branch]
  const sha = git({ args: ['rev-parse', 'HEAD'], cwd: path })
  writeFileSync(join(path, ENV_FILE), LATE_ENV)
  const result = removeIfStillClean({
    root: main,
    worktree: { branch, path, sha }
  })
  assert.equal(result.kept, REASON.IGNORED)
  assert.equal(result.detail, ENV_FILE)
  assert.equal(readFileSync(join(path, ENV_FILE), 'utf8'), LATE_ENV)
  assert.match(
    git({ args: ['worktree', 'list', '--porcelain'], cwd: main }),
    /refs\/heads\/feat\/late-ignored/u
  )
  assert.match(
    git({ args: ['branch', '--list', branch], cwd: main }),
    /feat\/late-ignored/u
  )
})

test('a worktree still clean just before its removal goes, and its branch with it', () => {
  const branch = 'feat/still-clean'
  const { main, paths } = mergedWorktrees({
    branches: [branch],
    hook: false
  })
  const path = paths[branch]
  const sha = git({ args: ['rev-parse', 'HEAD'], cwd: path })
  const result = removeIfStillClean({
    root: main,
    worktree: { branch, path, sha }
  })
  assert.equal(result.kept, null)
  assert.ok(!existsSync(path), `${path} still exists`)
  assert.equal(git({ args: ['branch', '--list', branch], cwd: main }), '')
})

test('a dry run over a main checkout that diverged says git would not fast-forward it', () => {
  const local = {}
  const { head, main, run } = behindMain({
    args: ['--dry-run'],
    prepare: ({ main: checkout }) => {
      git({
        args: ['commit', '-q', '--allow-empty', '-m', 'local'],
        cwd: checkout
      })
      local.sha = git({ args: ['rev-parse', 'HEAD'], cwd: checkout })
    }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, local.sha)
  assert.ok(
    run.stdout.includes(
      leftLine({ main, reason: DIVERGED }).replace(
        'left the',
        'would leave the'
      )
    ),
    run.stdout
  )
  assert.doesNotMatch(run.stdout, /would fast-forward/u)
})

test("a dry run over an untracked file the fast-forward would overwrite names git's refusal and touches nothing", () => {
  const { before, head, main, run } = behindMain({
    args: ['--dry-run'],
    prepare: ({ main: checkout }) =>
      writeFileSync(join(checkout, PUSHED_FILE), 'local\n'),
    push: { [PUSHED_FILE]: 'upstream\n' }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.equal(readFileSync(join(main, PUSHED_FILE), 'utf8'), 'local\n')
  assert.ok(!existsSync(join(main, '.git', 'index.lock')))
  const line = run.stdout
    .split(/\r?\n/u)
    .find((one) =>
      one.includes(`the main checkout ${forward({ path: main })}`)
    )
  assert.ok(
    line?.startsWith(
      `prune-worktrees: would leave the main checkout ${forward({ path: main })} ` +
        `1 commit behind origin/${MAIN}: error: `
    ),
    run.stdout
  )
  assert.match(line, /new\.txt.*would be overwritten/u)
})

// `git merge --ff-only` refreshes the index's stat data before it checks
// the files it updates; the fixture's upstream commit changes README.md.
test('a dry run over a tracked file whose timestamp alone changed says it would fast-forward', () => {
  const { before, head, main, run } = behindMain({
    args: ['--dry-run'],
    prepare: ({ main: checkout }) => {
      const later = new Date(Date.now() + 60_000)
      utimesSync(join(checkout, README), later, later)
    }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.ok(
    run.stdout.includes(
      `would fast-forward the main checkout ${forward({ path: main })} by 1 commit to origin/${MAIN}`
    ),
    run.stdout
  )
  assert.doesNotMatch(run.stdout, /not uptodate/u)
})

// A git working in the main checkout holds its `index.lock`: the dry run
// reads a copy of the index and takes no lock there.
test("an index.lock in the main checkout leaves the dry run's prediction as it was, and stays", () => {
  const lock = {}
  const { before, head, main, run } = behindMain({
    args: ['--dry-run'],
    prepare: ({ main: checkout }) => {
      lock.path = join(checkout, '.git', 'index.lock')
      writeFileSync(lock.path, '')
    }
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.ok(
    run.stdout.includes(
      `would fast-forward the main checkout ${forward({ path: main })} by 1 commit to origin/${MAIN}`
    ),
    run.stdout
  )
  assert.ok(existsSync(lock.path), `${lock.path} was removed`)
})

// A main checkout whose branch has no commit: git cannot count how far
// behind it is, so the last step fails after the removals. git's message
// spans lines, and the line that ends the run follows it.
test('a step that fails after the removals still reports what was removed, and exits 1', () => {
  const branch = 'feat/before-failure'
  const { main, paths } = mergedWorktrees({
    branches: [branch],
    hook: false
  })
  git({ args: ['update-ref', '-d', `refs/heads/${MAIN}`], cwd: main })
  const run = prune({ cwd: main })
  assert.equal(run.status, EXIT_FAILED, run.stdout)
  assert.ok(!existsSync(paths[branch]), run.stdout)
  assert.ok(
    run.stdout.includes(
      `removed ${forward({ path: paths[branch] })} (${branch})`
    ),
    run.stdout
  )
  assert.match(run.stdout, /: removed 1, kept 1; by reason: /u)
  assert.match(
    run.stderr,
    /^prune-worktrees: git rev-list .+ — 1 worktree was removed before it failed, listed above\.$/msu
  )
  assert.doesNotMatch(run.stderr, /nothing was removed/u)
})

// The worktree of `branch`, merged, with `.atl/` ignored as the template's
// `.gitignore` ignores it, holding `files`.
const atlWorktree = ({ branch, files }) => {
  const { main, paths } = mergedWorktrees({
    branches: [branch],
    hook: false
  })
  appendFileSync(join(main, '.git', 'info', 'exclude'), '\n.atl/\n')
  Object.entries(files).forEach(([file, text]) => {
    mkdirSync(dirname(join(paths[branch], file)), { recursive: true })
    writeFileSync(join(paths[branch], file), text)
  })
  return { main, path: paths[branch] }
}

test('an .atl/ that holds only the two skill-registry files does not keep the worktree', () => {
  const branch = 'feat/atl-registry'
  const { main, path } = atlWorktree({ branch, files: SKILL_REGISTRY })
  const run = prune({ cwd: main })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.ok(!existsSync(path), run.stdout)
  assert.ok(
    run.stdout.includes(`removed ${forward({ path })} (${branch})`),
    run.stdout
  )
})

// `notes.md` sits beside the registry and is a file of the same kind:
// only the names tell it from the two the skill-registry skill writes.
test('an .atl/ that holds anything besides the skill-registry files keeps the worktree, and it all stays', () => {
  const branch = 'feat/atl-notes'
  const files = { ...SKILL_REGISTRY, [ATL_NOTES]: 'notes\n' }
  const { main, path } = atlWorktree({ branch, files })
  const run = prune({ cwd: main })
  assert.equal(run.status, EXIT_OK, run.stderr)
  Object.entries(files).forEach(([file, text]) =>
    assert.equal(readFileSync(join(path, file), 'utf8'), text)
  )
  assert.ok(
    run.stdout.includes(
      keptLine({ branch, path, reason: `${REASON.IGNORED}: .atl/` })
    ),
    run.stdout
  )
})

test('the root package runs this suite from validate', () => {
  const { scripts } = JSON.parse(readFileSync(ROOT_PACKAGE, 'utf8'))
  assert.equal(
    scripts['worktrees:prune'],
    'node scripts/prune-worktrees.mjs'
  )
  assert.equal(
    scripts['worktrees:prune:test'],
    'node --test scripts/prune-worktrees.test.mjs'
  )
  assert.ok(scripts.validate.includes('pnpm worktrees:prune:test'))
})
