import assert from 'node:assert/strict'
import test from 'node:test'

import { gitFreeEnv } from './git-free-env.mjs'

test('given variables git exports into a hook, drops every GIT_* one', () => {
  const environment = {
    GIT_DIR: '/elsewhere/.git',
    GIT_INDEX_FILE: '/elsewhere/index',
    GIT_WORK_TREE: '/elsewhere',
    PATH: '/usr/bin'
  }

  assert.deepEqual(gitFreeEnv({ environment }), { PATH: '/usr/bin' })
})

test('given lowercase and mixed-case names, drops them too', () => {
  const environment = {
    GiT_ExEc_PaTh: '/elsewhere',
    HOME: '/home/probe',
    git_dir: '/elsewhere/.git'
  }

  assert.deepEqual(gitFreeEnv({ environment }), { HOME: '/home/probe' })
})

test('given a name that only contains GIT_ or starts with GIT, keeps it', () => {
  const environment = {
    GITHUB_TOKEN: 'kept',
    MY_GIT_DIR: 'kept',
    NOT_GIT_: 'kept'
  }

  assert.deepEqual(gitFreeEnv({ environment }), environment)
})

test('given no environment, reads the process environment and leaves it unchanged', (t) => {
  const exported = process.env.GIT_FREE_ENV_PROBE
  t.after(() => {
    if (exported === undefined) delete process.env.GIT_FREE_ENV_PROBE
    else process.env.GIT_FREE_ENV_PROBE = exported
  })
  process.env.GIT_FREE_ENV_PROBE = 'present'

  const free = gitFreeEnv()

  assert.equal(
    Object.keys(free).some((key) => key.startsWith('GIT_FREE_ENV')),
    false
  )
  assert.equal(free.PATH ?? free.Path, process.env.PATH)
  assert.equal(process.env.GIT_FREE_ENV_PROBE, 'present')
})
