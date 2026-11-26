#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Tests for report-spec-drift. The detector is driven from synthetic specs
// and measurements; measureDrift runs against a throwaway git repository in
// the OS temp directory, so a committed change, an uncommitted one, an
// untracked file and an unknown commit are each seen through real git. The
// report itself then runs over that repository: it lists the stale specs
// and exits 0.
//
// Usage:
//   node --test scripts/report-spec-drift.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { withScratchTree } from './gate/scratch.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'
import { measureDrift } from './report-spec-drift.mjs'
import {
  collectDrift,
  DRIFT_KIND,
  readSpecAnchor
} from './spec-drift.detect.mjs'

const UNKNOWN_SHA = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
const REPORT = join(
  dirname(fileURLToPath(import.meta.url)),
  'report-spec-drift.mjs'
)

const specText = ({ governs = '`src/`', sha }) =>
  [
    '# unit — living spec',
    '',
    `> **Governs:** ${governs}`,
    '> **ID prefix:** `UNIT`',
    `> **Verified against the code:** 2026-11-11 at \`${sha}\``,
    ''
  ].join('\n')

const measurement = (overrides = {}) => ({
  changed: [],
  commitKnown: true,
  governed: ['src/'],
  missing: [],
  path: 'openspec/specs/unit/spec.md',
  sha: 'abc1234',
  ...overrides
})

test('the anchor reads every governed path and the verified commit', () => {
  const anchor = readSpecAnchor({
    text: specText({ governs: '`src/a/`, `src/b.ts`', sha: 'abc1234' })
  })
  assert.deepEqual(anchor, {
    governed: ['src/a/', 'src/b.ts'],
    sha: 'abc1234'
  })
})

// A capability's region of the header holds a Governs line of its own
// (openspec/README.md § 2.2). The markers are built inside strings, never
// written alone on a line of this file, where the coverage gate would read
// them as a region of this file.
const regionOf = ({ lines, owner = 'vendor' }) => [
  `<!-- region ${owner} -->`,
  ...lines,
  `<!-- endregion ${owner} -->`
]

const twoGovernsSpec = ({ first, second, sha }) =>
  [
    '# unit — living spec',
    '',
    `> **Governs:** ${first}`,
    ...regionOf({ lines: [`> **Governs:** ${second}`] }),
    '> **ID prefix:** `UNIT`',
    `> **Verified against the code:** 2026-11-19 at \`${sha}\``,
    ''
  ].join('\n')

test('the anchor reads the governed paths of every Governs line, in order', () => {
  const anchor = readSpecAnchor({
    text: twoGovernsSpec({
      first: '`src/a/`, `src/b.ts`',
      second: '`src/vendor.ts`',
      sha: 'abc1234'
    })
  })
  assert.deepEqual(anchor, {
    governed: ['src/a/', 'src/b.ts', 'src/vendor.ts'],
    sha: 'abc1234'
  })
})

test('a spec with no verified commit reads a null sha', () => {
  const anchor = readSpecAnchor({ text: '> **Governs:** `src/`\n' })
  assert.equal(anchor.sha, null)
})

test('a spec whose governed files match its commit is not reported', () => {
  assert.deepEqual(collectDrift({ measured: [measurement()] }), [])
})

test('a spec with a file changed since its commit is stale', () => {
  const [finding] = collectDrift({
    measured: [measurement({ changed: ['src/a.ts'] })]
  })
  assert.equal(finding.kind, DRIFT_KIND.stale)
  assert.deepEqual(finding.changed, ['src/a.ts'])
})

test('a spec verified at a commit the repository lacks is reported', () => {
  const [finding] = collectDrift({
    measured: [measurement({ commitKnown: false })]
  })
  assert.equal(finding.kind, DRIFT_KIND.unknownCommit)
})

test('a spec with no commit or no governed path cannot be measured', () => {
  const kinds = collectDrift({
    measured: [measurement({ sha: null }), measurement({ governed: [] })]
  }).map(({ kind }) => kind)
  assert.deepEqual(kinds, [DRIFT_KIND.noAnchor, DRIFT_KIND.noAnchor])
})

test('a governed path that does not exist is reported beside the drift', () => {
  const kinds = collectDrift({
    measured: [measurement({ changed: ['src/a.ts'], missing: ['lib/'] })]
  }).map(({ kind }) => kind)
  assert.deepEqual(kinds, [DRIFT_KIND.missingPath, DRIFT_KIND.stale])
})

const scratch = mkdtempSync(join(tmpdir(), 'report-spec-drift-'))
after(() => rmSync(scratch, { recursive: true }))

const git = ({ args }) =>
  execFileSync(
    'git',
    [
      '-c',
      'user.email=test@example.invalid',
      '-c',
      'user.name=test',
      ...args
    ],
    { cwd: scratch, encoding: 'utf8', env: gitFreeEnv() }
  ).trim()

const writeSpec = ({ name, sha }) => {
  mkdirSync(join(scratch, 'openspec', 'specs', name), { recursive: true })
  writeFileSync(
    join(scratch, 'openspec', 'specs', name, 'spec.md'),
    specText({ governs: `\`${name}/\``, sha })
  )
}

const measuredFor = ({ name }) =>
  measureDrift({ root: scratch }).find(
    ({ path }) => path === `openspec/specs/${name}/spec.md`
  )

test('measureDrift sees committed, uncommitted and untracked change through git', () => {
  git({ args: ['init', '-q'] })
  for (const name of ['fresh', 'committed', 'edited', 'untracked']) {
    mkdirSync(join(scratch, name), { recursive: true })
    writeFileSync(join(scratch, name, 'a.ts'), 'export const a = 1\n')
  }
  git({ args: ['add', '-A'] })
  git({ args: ['commit', '-q', '-m', 'base'] })
  const base = git({ args: ['rev-parse', 'HEAD'] })
  for (const name of ['fresh', 'committed', 'edited', 'untracked']) {
    writeSpec({ name, sha: base })
  }
  writeSpec({ name: 'unknown', sha: UNKNOWN_SHA })
  mkdirSync(join(scratch, 'unknown'), { recursive: true })
  writeFileSync(join(scratch, 'committed', 'a.ts'), 'export const a = 2\n')
  git({ args: ['add', '-A'] })
  git({ args: ['commit', '-q', '-m', 'change committed/a.ts'] })
  writeFileSync(join(scratch, 'edited', 'a.ts'), 'export const a = 3\n')
  writeFileSync(join(scratch, 'untracked', 'b.ts'), 'export const b = 1\n')

  assert.deepEqual(measuredFor({ name: 'fresh' }).changed, [])
  assert.deepEqual(measuredFor({ name: 'committed' }).changed, [
    'committed/a.ts'
  ])
  assert.deepEqual(measuredFor({ name: 'edited' }).changed, [
    'edited/a.ts'
  ])
  assert.deepEqual(measuredFor({ name: 'untracked' }).changed, [
    'untracked/b.ts'
  ])
  assert.equal(measuredFor({ name: 'unknown' }).commitKnown, false)
  assert.equal(measuredFor({ name: 'fresh' }).commitKnown, true)

  const stale = collectDrift({ measured: measureDrift({ root: scratch }) })
    .filter(({ kind }) => kind === DRIFT_KIND.stale)
    .map(({ path }) => path)
  assert.deepEqual(stale, [
    'openspec/specs/committed/spec.md',
    'openspec/specs/edited/spec.md',
    'openspec/specs/untracked/spec.md'
  ])
})

test('the report lists each stale spec and exits 1', () => {
  const result = spawnSync(process.execPath, [REPORT, '--root', scratch], {
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  assert.equal(result.status, 1)
  const warned = result.stdout
    .split(/\r?\n/u)
    .filter((line) => line.includes('WARN'))
  const stale = ['committed', 'edited', 'untracked']
  stale.forEach((name) =>
    assert.ok(
      warned.some((line) =>
        line.includes(`openspec/specs/${name}/spec.md: 1 file(s)`)
      ),
      `no WARN line for the stale spec ${name}`
    )
  )
  assert.ok(
    !warned.some((line) => line.includes('openspec/specs/fresh/spec.md')),
    'the fresh spec is reported'
  )
  assert.match(result.stdout, /3 of 5 living spec\(s\) behind their code/u)
})

// A repository of its own: a spec whose first Governs line names `core/`
// and whose region names `vendor/`, so a change under either path must make
// it stale, and the report must say so. Returns what measureDrift read and
// what the report printed. With `change` false, nothing moves.
const measureTwoGoverns = ({ change = true } = {}) =>
  withScratchTree({
    files: {
      'core/a.ts': 'export const a = 1\n',
      'vendor/a.ts': 'export const a = 1\n'
    },
    prefix: 'report-spec-drift-governs-',
    use: ({ root }) => {
      const run = (args) =>
        execFileSync(
          'git',
          [
            '-c',
            'user.email=test@example.invalid',
            '-c',
            'user.name=test',
            ...args
          ],
          { cwd: root, encoding: 'utf8', env: gitFreeEnv() }
        ).trim()
      run(['init', '-q'])
      run(['add', '-A'])
      run(['commit', '-q', '-m', 'base'])
      const base = run(['rev-parse', 'HEAD'])
      mkdirSync(join(root, 'openspec', 'specs', 'unit'), {
        recursive: true
      })
      writeFileSync(
        join(root, 'openspec', 'specs', 'unit', 'spec.md'),
        twoGovernsSpec({
          first: '`core/`',
          second: '`vendor/`',
          sha: base
        })
      )
      if (change) {
        writeFileSync(join(root, 'core', 'a.ts'), 'export const a = 2\n')
        writeFileSync(join(root, 'vendor', 'a.ts'), 'export const a = 3\n')
      }

      const [measured] = measureDrift({ root })
      const result = spawnSync(
        process.execPath,
        [REPORT, '--root', root],
        {
          encoding: 'utf8',
          env: gitFreeEnv()
        }
      )
      return { measured, result }
    }
  })

const assertTwoGovernsDrift = ({ measured, result }) => {
  assert.deepEqual(measured.governed, ['core/', 'vendor/'])
  assert.deepEqual(measured.changed, ['core/a.ts', 'vendor/a.ts'])
  assert.deepEqual(measured.missing, [])
  assert.equal(result.status, 1)
  assert.equal(result.stderr, '')
  assert.match(
    result.stdout,
    /WARN openspec\/specs\/unit\/spec\.md: 2 file\(s\) under its governed paths changed since [0-9a-f]+, e\.g\. core\/a\.ts, vendor\/a\.ts/u
  )
  assert.match(result.stdout, /1 of 1 living spec\(s\) behind their code/u)
}

test('a spec is measured against the paths of every Governs line', () => {
  assertTwoGovernsDrift(measureTwoGoverns())
})

test('a tree whose specs all match their code exits 0', () => {
  const { measured, result } = measureTwoGoverns({ change: false })
  assert.deepEqual(measured.changed, [])
  assert.equal(result.status, 0, result.stdout)
  assert.match(result.stdout, /0 of 1 living spec\(s\) behind their code/u)
})

test("END TO END: under a hook's GIT_DIR, the drift is measured in the scratch repository and the hook's repository is left alone", () => {
  const { decoyWritten, result } = withHookGitDir({
    use: measureTwoGoverns
  })

  assert.equal(decoyWritten, false)
  assertTwoGovernsDrift(result)
})

// -- a project made from the template --------------------------------------
// A derived checkout is one whose .agents/harness.config.json names an
// identity that is not the template's. Its history starts where its own
// identity first appears: at the commit `pnpm run init` makes when it is
// committed, whether or not the checkout holds the template's commits.

const TEMPLATE = {
  packageScope: '@app',
  product: 'app-monorepo-template',
  repository: 'dantecarlo/app-monorepo-template'
}
const PROJECT = { packageScope: '@acme', product: 'acme', repository: 'acme' }

const configWith = ({ identity }) =>
  `${JSON.stringify({ identity }, null, 2)}\n`

// A repository of its own under the OS temp dir, its git run with a fixed
// author; `use` gets the root and that runner.
const withRepository = ({ use }) =>
  withScratchTree({
    files: { 'core/a.ts': "import { x } from '@app/core'\n" },
    prefix: 'report-spec-drift-derived-',
    use: ({ root }) => {
      const run = (args) =>
        execFileSync(
          'git',
          [
            '-c',
            'user.email=test@example.invalid',
            '-c',
            'user.name=test',
            ...args
          ],
          { cwd: root, encoding: 'utf8', env: gitFreeEnv() }
        ).trim()
      const write = ({ path, text }) => {
        mkdirSync(dirname(join(root, path)), { recursive: true })
        writeFileSync(join(root, path), text)
      }
      const report = () =>
        spawnSync(process.execPath, [REPORT, '--root', root], {
          encoding: 'utf8',
          env: gitFreeEnv()
        })
      run(['init', '-q'])
      return use({ report, root, run, write })
    }
  })

const SPEC = 'openspec/specs/unit/spec.md'

// What `pnpm run init acme` does to this tree: the identity block and the
// `@app/` specifier of the governed code.
const initialize = ({ write }) => {
  write({
    path: '.agents/harness.config.json',
    text: configWith({ identity: PROJECT })
  })
  write({ path: 'core/a.ts', text: "import { x } from '@acme/core'\n" })
}

// The template as one commit, its spec verified at `sha` (a commit of the
// template's history the new repository may not hold).
const templateCommit = ({ run, sha, write }) => {
  write({
    path: '.agents/harness.config.json',
    text: configWith({ identity: TEMPLATE })
  })
  write({ path: SPEC, text: specText({ governs: '`core/`', sha }) })
  run(['add', '-A'])
  run(['commit', '-q', '-m', 'template'])
  return run(['rev-parse', 'HEAD'])
}

test('a project with fresh history passes right after init, and fails a real drift after its birth commit', () => {
  withRepository({
    use: ({ report, run, write }) => {
      templateCommit({ run, sha: UNKNOWN_SHA, write })
      initialize({ write })
      const unborn = report()
      assert.equal(unborn.status, 0, unborn.stdout)
      assert.match(unborn.stdout, /not committed yet/u)

      run(['add', '-A'])
      run(['commit', '-q', '-m', 'chore: init acme'])
      const birth = run(['rev-parse', '--short', 'HEAD'])
      const born = report()
      assert.equal(born.status, 0, born.stdout)
      assert.match(born.stdout, new RegExp(`born at ${birth}`, 'u'))

      write({ path: 'core/a.ts', text: 'export const drift = 1\n' })
      const drifted = report()
      assert.equal(drifted.status, 1, drifted.stdout)
      assert.match(
        drifted.stdout,
        /WARN openspec\/specs\/unit\/spec\.md: 1 file\(s\) under its governed paths changed since [0-9a-f]+, e\.g\. core\/a\.ts/u
      )
    }
  })
})

test("a project that keeps the template's history passes right after init, and is measured from its birth", () => {
  withRepository({
    use: ({ report, run, write }) => {
      write({ path: 'core/a.ts', text: "import { x } from '@app/core'\n" })
      run(['add', '-A'])
      run(['commit', '-q', '-m', 'template code'])
      const verified = run(['rev-parse', 'HEAD'])
      templateCommit({ run, sha: verified, write })
      initialize({ write })
      assert.equal(report().status, 0)

      run(['add', '-A'])
      run(['commit', '-q', '-m', 'chore: init acme'])
      assert.equal(report().status, 0)

      write({ path: 'core/b.ts', text: 'export const b = 1\n' })
      assert.equal(report().status, 1)
    }
  })
})

test('a spec a project syncs after its birth is measured from its own commit', () => {
  withRepository({
    use: ({ report, run, write }) => {
      templateCommit({ run, sha: UNKNOWN_SHA, write })
      initialize({ write })
      run(['add', '-A'])
      run(['commit', '-q', '-m', 'chore: init acme'])
      write({ path: 'core/a.ts', text: 'export const a = 2\n' })
      run(['add', '-A'])
      run(['commit', '-q', '-m', 'feat: change core'])
      assert.equal(report().status, 1)
      const synced = run(['rev-parse', 'HEAD'])
      write({ path: SPEC, text: specText({ governs: '`core/`', sha: synced }) })
      assert.equal(report().status, 0)
    }
  })
})

test('the template itself still fails a spec verified at a commit it does not hold', () => {
  withRepository({
    use: ({ report, run, write }) => {
      templateCommit({ run, sha: UNKNOWN_SHA, write })
      const result = report()
      assert.equal(result.status, 1)
      assert.match(result.stdout, /a commit this repository does not hold/u)
    }
  })
})

test('a shallow clone of a project cannot show its birth, and fails', () => {
  withRepository({
    use: ({ root, run, write }) => {
      templateCommit({ run, sha: UNKNOWN_SHA, write })
      initialize({ write })
      run(['add', '-A'])
      run(['commit', '-q', '-m', 'chore: init acme'])
      write({ path: 'core/b.ts', text: 'export const b = 1\n' })
      run(['add', '-A'])
      run(['commit', '-q', '-m', 'feat: b'])
      const clone = join(root, 'shallow')
      execFileSync(
        'git',
        ['clone', '-q', '--depth', '1', pathToFileURL(root).href, clone],
        { encoding: 'utf8', env: gitFreeEnv() }
      )
      const result = spawnSync(process.execPath, [REPORT, '--root', clone], {
        encoding: 'utf8',
        env: gitFreeEnv()
      })
      assert.equal(result.status, 1, result.stdout)
      assert.match(result.stdout, /shallow/u)
    }
  })
})
