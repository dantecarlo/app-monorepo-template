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
      process.on('exit', () =>
        rmSync(copy, { force: true, recursive: true })
      )
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

// A derived project already carries its own name, so there is nothing to rename.
const IS_TEMPLATE_TREE =
  JSON.parse(read({ file: 'package.json', root: REPO_ROOT })).name ===
  TEMPLATE_NAME

test(
  'a root script that names a workspace gets the new name',
  { skip: !IS_TEMPLATE_TREE },
  () => {
    const smoke = read({
      file: 'scripts/smoke-web-render.mjs',
      root: copy
    })

    assert.match(smoke, new RegExp(`@${SLUG}/web`))
    assert.doesNotMatch(smoke, /@app\//)
  }
)

test('the root package.json names no template workspace', () => {
  assert.doesNotMatch(read({ file: 'package.json', root: copy }), /@app\//)
})

// The guard above reads the root name against TEMPLATE_NAME, which the copy keeps.
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
      env: { ...gitFreeEnv(), ATL_TEMPLATE_SELF: '' },
      stdio: 'ignore'
    })
  )
})
