// ---------------------------------------------------------------------------
// init-project, run on a copy of the repository.
//
// The copy holds every file git tracks or would track, taken from the working
// tree, in a temporary directory outside the repository; the real checkout is
// never renamed.
//
// Run: pnpm init-project:test
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { before, test } from 'node:test'

import { gitFreeEnv } from './git-free-env.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const SLUG = 'demo-app'
const TEMPLATE_NAME = 'app-monorepo-template'
const KEPT_AS_IS = [
  'scripts/check-identity.mjs',
  'scripts/init-project.mjs',
  'scripts/init-project.test.mjs',
  'scripts/template-identity.mjs',
  'pnpm-lock.yaml'
]

const listFiles = () =>
  execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: gitFreeEnv()
    }
  )
    .split('\0')
    .filter(Boolean)

let copy = ''
let hookRun = { decoyWritten: true, result: [] }

// The copy is taken and renamed under a decoy GIT_DIR, as a git hook would
// run this suite, so every case below also proves the listing read this
// repository and not the one a hook exports (decision 33).
before(() => {
  hookRun = withHookGitDir({
    use: () => {
      copy = mkdtempSync(join(tmpdir(), 'init-project-'))
      process.on('exit', () => rmSync(copy, { recursive: true }))
      const listed = listFiles()
      for (const file of listed) {
        const target = join(copy, file)
        mkdirSync(dirname(target), { recursive: true })
        try {
          cpSync(join(REPO_ROOT, file), target)
        } catch (error) {
          // A file deleted in the working tree but not yet in git's index.
          if (error.code !== 'ENOENT') throw error
        }
      }
      execFileSync(process.execPath, ['scripts/init-project.mjs', SLUG], {
        cwd: copy,
        env: gitFreeEnv(),
        stdio: 'ignore'
      })
      return listed
    }
  })
})

test("END TO END: under a hook's GIT_DIR, the copy is listed from this repository and the hook's repository is left alone", () => {
  assert.equal(hookRun.decoyWritten, false)
  assert.deepEqual(hookRun.result, listFiles())
})

const read = ({ root, file }) => readFileSync(join(root, file), 'utf8')

// Renaming the template's own names holds only where the template carries
// them: scripts/init-project.template.test.mjs, which /init removes from a
// derived project.
test('the root package.json names no template workspace', () => {
  assert.doesNotMatch(read({ file: 'package.json', root: copy }), /@app\//)
})

// TEMPLATE_NAME is the template's root name, which this file keeps as it is.
test('a renamed tree no longer counts as the template', () => {
  const { name } = JSON.parse(read({ file: 'package.json', root: copy }))

  assert.equal(name, SLUG)
  assert.notEqual(name, TEMPLATE_NAME)
})

for (const file of KEPT_AS_IS) {
  test(`${file} is left byte for byte`, () => {
    assert.equal(
      read({ file, root: copy }),
      read({ file, root: REPO_ROOT })
    )
  })
}

test('no template identity token is left', () => {
  assert.doesNotThrow(() =>
    execFileSync(process.execPath, ['scripts/check-identity.mjs'], {
      cwd: copy,
      env: gitFreeEnv(),
      stdio: 'ignore'
    })
  )
})

const HARNESS_CONFIG = '.agents/harness.config.json'
// The three lines of the identity block that init rewrites.
const IDENTITY_LINE = /^\s*"(?:packageScope|product|repository)":/u
const LINE_FEED = '\n'
const CARRIAGE_RETURN = '\r'

test('the harness config names the renamed project', () => {
  const { identity } = JSON.parse(
    read({ file: HARNESS_CONFIG, root: copy })
  )

  assert.equal(identity.product, SLUG)
  assert.equal(identity.packageScope, `@${SLUG}`)
  assert.equal(identity.repository, SLUG)
})

test('the harness config keeps every other line byte for byte, and its line endings', () => {
  const before = read({ file: HARNESS_CONFIG, root: REPO_ROOT }).split(
    LINE_FEED
  )
  const after = read({ file: HARNESS_CONFIG, root: copy }).split(LINE_FEED)

  assert.equal(after.length, before.length)
  before.forEach((line, index) => {
    if (IDENTITY_LINE.test(line)) {
      assert.match(after[index], IDENTITY_LINE)
      assert.equal(
        after[index].endsWith(CARRIAGE_RETURN),
        line.endsWith(CARRIAGE_RETURN)
      )
    } else {
      assert.equal(after[index], line)
    }
  })
})

test('the renamed harness config passes verify:harness-config', () => {
  assert.doesNotThrow(() =>
    execFileSync(process.execPath, ['scripts/verify-harness-config.mjs'], {
      cwd: copy,
      env: gitFreeEnv(),
      stdio: 'ignore'
    })
  )
})
