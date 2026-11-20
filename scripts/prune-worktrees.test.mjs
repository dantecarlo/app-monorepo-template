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
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from './git-free-env.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'
import {
  optionsFrom,
  REASON,
  removeLeftover,
  removeWorktree,
  reportLines
} from './prune-worktrees.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, 'prune-worktrees.mjs')
const ROOT_PACKAGE = join(HERE, '..', 'package.json')
const POST_MERGE = join(HERE, '..', '.husky', 'post-merge')

const EXIT_OK = 0
const EXIT_FAILED = 1
const REMOVE_RETRIES = 10
const MAIN = 'main'
const UNSAVED_FILE = 'unsaved-work.txt'
const LATE_FILE = 'late.txt'
const README = 'README.md'
const README_TEXT = 'README\n'
// Ignored files an install, a build, a typecheck, a test run or the next
// session writes again.
const REBUILT_FILES = {
  '.atl/skill-registry.md': '\n',
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
// What git says when a fast-forward would overwrite a local change.
const GIT_REFUSAL = /local changes .* would be overwritten by merge/u
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
// else.
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
  { branch: 'feat/unmerged', dir: 'unmerged', kept: REASON.NOT_IN_DEFAULT },
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
  git({ args: ['clone', '-q', ...BYTE_ENDINGS, origin, main], cwd: scratch })
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
        untracked,
        untrackedFile
      }) => {
        const path = join(scratch, dir)
        const track = untracked
          ? ['--no-track', '-b', branch, path, `origin/${branch}`]
          : [path, branch]
        git({ args: ['worktree', 'add', '-q', ...track], cwd: main })
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
  assert.match(summary, /: removed 1, kept 14; by reason: /)
  assert.ok(summary.includes(`${REASON.DIRTY} 2`), summary)
  assert.ok(summary.includes(`${REASON.IGNORED} 2`), summary)
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
// branch is `branch`, the main clone, and a second clone that pushes a
// change to README.md. `prepare` runs in the main clone before the command
// does.
const behindMain = ({ args = [], branch = MAIN, prepare = () => {} }) => {
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
      `M 100644 inline ${README}`,
      data({ text: README_TEXT }),
      ''
    ].join('\n')
  })
  git({ args: ['clone', '-q', ...BYTE_ENDINGS, origin, main], cwd: scratch })
  git({
    args: ['clone', '-q', ...BYTE_ENDINGS, origin, pusher],
    cwd: scratch
  })
  writeFileSync(join(pusher, README), 'README v2\n')
  git({ args: ['commit', '-q', '-am', 'v2'], cwd: pusher })
  git({ args: ['push', '-q', 'origin', branch], cwd: pusher })
  const before = git({ args: ['rev-parse', 'HEAD'], cwd: main })
  prepare({ main })
  const run = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: main,
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  return {
    before,
    head: git({ args: ['rev-parse', 'HEAD'], cwd: main }),
    main,
    readme: readFileSync(join(main, README), 'utf8'),
    run,
    tip: git({ args: ['rev-parse', `origin/${branch}`], cwd: main })
  }
}

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
      `left the main checkout ${forward({ path: main })} 1 commit behind ` +
        `origin/${MAIN}: `
    ),
    run.stdout
  )
  assert.match(run.stdout, GIT_REFUSAL)
})

test('a file that differs only in its line endings blocks the fast-forward and stays', () => {
  const crlf = README_TEXT.replace('\n', '\r\n')
  const { before, head, main, readme, run } = behindMain({
    prepare: ({ main: checkout }) =>
      writeFileSync(join(checkout, README), crlf)
  })
  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(head, before)
  assert.equal(readme, crlf)
  assert.ok(
    run.stdout.includes(
      `left the main checkout ${forward({ path: main })} 1 commit behind ` +
        `origin/${MAIN}: `
    ),
    run.stdout
  )
  assert.match(run.stdout, GIT_REFUSAL)
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

test("END TO END: under a hook's GIT_DIR, the fixture and the command keep to the scratch repositories and the hook's repository is left alone", () => {
  const { decoyWritten, result } = withHookGitDir({
    use: () => behindMain({})
  })
  assert.equal(decoyWritten, false)
  assert.equal(result.run.status, EXIT_OK, result.run.stderr)
  assert.equal(result.head, result.tip)
})

test('the root package runs this suite from validate', () => {
  const { scripts } = JSON.parse(readFileSync(ROOT_PACKAGE, 'utf8'))
  assert.equal(scripts['worktrees:prune'], 'node scripts/prune-worktrees.mjs')
  assert.equal(
    scripts['worktrees:prune:test'],
    'node --test scripts/prune-worktrees.test.mjs'
  )
  assert.ok(scripts.validate.includes('pnpm worktrees:prune:test'))
})
