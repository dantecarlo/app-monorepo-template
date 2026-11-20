#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for hook-git-dir. `withHookGitDir` is the proof every suite that
// spawns git gives of decision 33: its flow, run under a decoy GIT_DIR, keeps
// its git inside its own scratch repositories. A helper that never reports a
// written decoy proves nothing, so these cases show it reporting one, and
// show it putting the environment back however the flow ends.
//
// Usage:
//   node --test scripts/hook-git-dir.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import { gitFreeEnv } from './git-free-env.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'

const HOOK_VARIABLES = ['GIT_DIR', 'GIT_INDEX_FILE']
const PROBE_FILE = 'probe.txt'
const PROBE_IDENTITY = [
  '-c',
  'user.name=probe',
  '-c',
  'user.email=probe@example.invalid'
]

// git in `cwd`, under `env`: `gitFreeEnv()` for a flow that keeps its git
// to itself, `process.env` for one that inherits what a hook exports.
const git = ({ args, cwd, env }) =>
  execFileSync('git', [...PROBE_IDENTITY, ...args], {
    cwd,
    encoding: 'utf8',
    env,
    stdio: 'pipe'
  }).trim()

const samePath = ({ path }) =>
  resolve(path).replaceAll('\\', '/').toLowerCase()

// A scratch repository with one commit, built by git started under `env`.
const commitInScratch = ({ env }) => {
  const root = mkdtempSync(join(tmpdir(), 'hook-git-dir-scratch-'))
  try {
    git({ args: ['init', '-q'], cwd: root, env })
    writeFileSync(join(root, PROBE_FILE), 'probe\n')
    git({ args: ['add', PROBE_FILE], cwd: root, env })
    git({ args: ['commit', '-q', '-m', 'probe'], cwd: root, env })
    return git({
      args: ['rev-list', '--count', 'HEAD'],
      cwd: root,
      env: gitFreeEnv()
    })
  } finally {
    rmSync(root, { force: true, recursive: true })
  }
}

// Runs `use` with each hook variable set to `value`, or unset when `value`
// is undefined, and puts back what was there.
const withHookVariables = ({ use, value }) => {
  const saved = HOOK_VARIABLES.map((name) => [name, process.env[name]])
  HOOK_VARIABLES.forEach((name) => {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  })
  try {
    return use()
  } finally {
    saved.forEach(([name, before]) => {
      if (before === undefined) delete process.env[name]
      else process.env[name] = before
    })
  }
}

test('given a flow whose git starts in gitFreeEnv(), the decoy is left alone and its result is returned', () => {
  const { decoyWritten, result } = withHookGitDir({
    use: () => commitInScratch({ env: gitFreeEnv() })
  })

  assert.equal(decoyWritten, false)
  assert.equal(result, '1')
})

test('given a flow whose git inherits the hook environment, the decoy is reported written', () => {
  const { decoyWritten } = withHookGitDir({
    use: () => {
      try {
        commitInScratch({ env: process.env })
      } catch {
        // The decoy took the writes; what the flow saw does not matter here.
      }
    }
  })

  assert.equal(decoyWritten, true)
})

test('given a flow that only sets a config value through the hook environment, the decoy is reported written', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'hook-git-dir-config-'))
  try {
    const { decoyWritten } = withHookGitDir({
      use: () =>
        git({
          args: ['config', 'probe.key', 'value'],
          cwd: scratch,
          env: process.env
        })
    })

    assert.equal(decoyWritten, true)
  } finally {
    rmSync(scratch, { force: true, recursive: true })
  }
})

test('while the flow runs, GIT_DIR and GIT_INDEX_FILE name a decoy repository outside the scratch tree', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'hook-git-dir-seen-'))
  try {
    const { result } = withHookGitDir({
      use: () => ({
        gitDir: process.env.GIT_DIR,
        indexFile: process.env.GIT_INDEX_FILE,
        resolved: git({
          args: ['rev-parse', '--absolute-git-dir'],
          cwd: scratch,
          env: process.env
        })
      })
    })

    assert.equal(
      samePath({ path: result.resolved }),
      samePath({ path: result.gitDir })
    )
    assert.equal(
      samePath({ path: result.indexFile }),
      samePath({ path: join(result.gitDir, 'index') })
    )
    assert.ok(
      !samePath({ path: result.gitDir }).startsWith(
        samePath({ path: scratch })
      ),
      result.gitDir
    )
    assert.equal(existsSync(result.gitDir), false)
  } finally {
    rmSync(scratch, { force: true, recursive: true })
  }
})

test('given hook variables unset before the run, they are unset after it', () => {
  withHookVariables({
    use: () => {
      withHookGitDir({ use: () => undefined })

      HOOK_VARIABLES.forEach((name) =>
        assert.equal(process.env[name], undefined, name)
      )
    },
    value: undefined
  })
})

test('given hook variables set before the run, they hold their values after it', () => {
  const outer = join(tmpdir(), 'hook-git-dir-outer', '.git')
  withHookVariables({
    use: () => {
      withHookGitDir({ use: () => undefined })

      HOOK_VARIABLES.forEach((name) =>
        assert.equal(process.env[name], outer, name)
      )
    },
    value: outer
  })
})

test('given a flow that throws, the error reaches the caller, the variables are put back and the decoy is removed', () => {
  const seen = {}
  withHookVariables({
    use: () => {
      assert.throws(
        () =>
          withHookGitDir({
            use: () => {
              seen.gitDir = process.env.GIT_DIR
              throw new Error('flow failed')
            }
          }),
        /flow failed/
      )

      HOOK_VARIABLES.forEach((name) =>
        assert.equal(process.env[name], undefined, name)
      )
    },
    value: undefined
  })
  assert.equal(existsSync(seen.gitDir), false)
})
