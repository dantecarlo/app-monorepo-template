import assert from 'node:assert/strict'
import { dirname } from 'node:path'
import { test } from 'node:test'

import {
  replayNotice,
  resolveSeed,
  SEED_ENV_VAR,
  seedFromCommitSha,
  testSequence,
  workspaceName
} from '../vitest-sequence.mjs'

const SHA1 = '0123456789abcdef0123456789abcdef01234567'
const SHA256 = `${SHA1}0123456789abcdef01234567`
const PACKAGE_DIR = dirname(dirname(import.meta.dirname))

test('the seed is the first 12 hex digits of the commit sha', () => {
  assert.equal(
    seedFromCommitSha({ sha: SHA1 }),
    parseInt('0123456789ab', 16)
  )
  assert.equal(
    seedFromCommitSha({ sha: SHA256 }),
    parseInt('0123456789ab', 16)
  )
})

test('a value that is not a commit sha is refused, naming the override', () => {
  assert.throws(
    () => seedFromCommitSha({ sha: '' }),
    new RegExp(SEED_ENV_VAR)
  )
  assert.throws(
    () => seedFromCommitSha({ sha: 'not-a-sha' }),
    /not a commit sha/
  )
})

test('the commit gives the seed unless the override is set', () => {
  assert.deepEqual(resolveSeed({ env: {}, sha: SHA1 }), {
    seed: parseInt('0123456789ab', 16),
    source: 'the commit'
  })
  assert.deepEqual(
    resolveSeed({ env: { [SEED_ENV_VAR]: '  ' }, sha: SHA1 }),
    {
      seed: parseInt('0123456789ab', 16),
      source: 'the commit'
    }
  )
  assert.deepEqual(
    resolveSeed({ env: { [SEED_ENV_VAR]: '42' }, sha: '' }),
    {
      seed: 42,
      source: SEED_ENV_VAR
    }
  )
})

test('an override that is not an integer is refused', () => {
  assert.throws(
    () => resolveSeed({ env: { [SEED_ENV_VAR]: 'abc' }, sha: SHA1 }),
    /not an integer/
  )
  assert.throws(
    () => resolveSeed({ env: { [SEED_ENV_VAR]: '1.5' }, sha: SHA1 }),
    /not an integer/
  )
})

test('the replay notice names the seed, its source and the command that replays it', () => {
  const notice = replayNotice({
    seed: 42,
    source: 'the commit',
    workspace: '@app/core'
  })

  assert.match(notice, /seed 42, from the commit/)
  assert.match(
    notice,
    /VITEST_SEQUENCE_SEED=42 pnpm --filter @app\/core test/
  )
})

test('the workspace name comes from its package.json', () => {
  assert.equal(workspaceName({ packageDir: PACKAGE_DIR }), '@app/tooling')
})

test('testSequence shuffles with the resolved seed and prints how to replay it', (t) => {
  const printed = t.mock.method(console, 'log', () => {})
  const previous = process.env[SEED_ENV_VAR]
  process.env[SEED_ENV_VAR] = '7'
  t.after(() => {
    if (previous === undefined) delete process.env[SEED_ENV_VAR]
    else process.env[SEED_ENV_VAR] = previous
  })

  assert.deepEqual(testSequence({ packageDir: PACKAGE_DIR }), {
    seed: 7,
    shuffle: true
  })
  assert.equal(printed.mock.callCount(), 1)
  assert.match(
    printed.mock.calls[0].arguments[0],
    /@app\/tooling runs shuffled — seed 7/
  )
})
