import assert from 'node:assert/strict'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import { SEED_ENV_VAR } from './vitest-sequence.mjs'
import { packageTestBase } from './vitest-package-base.mjs'

const PACKAGE_DIR = resolve(import.meta.dirname, '..')

test('the base aliases @ onto the package src and runs a shuffled node suite', (t) => {
  t.mock.method(console, 'log', () => {})
  const previous = process.env[SEED_ENV_VAR]
  process.env[SEED_ENV_VAR] = '3'
  t.after(() => {
    if (previous === undefined) delete process.env[SEED_ENV_VAR]
    else process.env[SEED_ENV_VAR] = previous
  })

  const base = packageTestBase({ packageDir: PACKAGE_DIR })

  assert.equal(base.resolve.alias['@'], join(PACKAGE_DIR, 'src'))
  assert.equal(base.test.environment, 'node')
  assert.equal(base.test.globals, true)
  assert.equal(base.test.clearMocks, true)
  assert.deepEqual(base.test.sequence, { seed: 3, shuffle: true })
  assert.equal(base.test.coverage.provider, 'v8')
  assert.deepEqual(base.test.coverage.exclude, ['src/**/index.ts'])
})

test('the base sets no Vitest 5 option', (t) => {
  t.mock.method(console, 'log', () => {})
  const previous = process.env[SEED_ENV_VAR]
  process.env[SEED_ENV_VAR] = '3'
  t.after(() => {
    if (previous === undefined) delete process.env[SEED_ENV_VAR]
    else process.env[SEED_ENV_VAR] = previous
  })

  assert.equal(
    'fsModuleCache' in packageTestBase({ packageDir: PACKAGE_DIR }).test,
    false
  )
})
