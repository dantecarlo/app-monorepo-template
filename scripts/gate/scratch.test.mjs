#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for scratch. `withScratchTree` creates its root, so it removes
// it with no `force`: the root is gone after `use` however `use` ends, and a
// root that something else already removed is an error, never passed over.
//
// Usage:
//   node --test scripts/gate/scratch.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { withScratchTree } from './scratch.mjs'

const PREFIX = 'gate-scratch-test-'
const NOT_FOUND = 'ENOENT'

test('use reads the files under its root, gets its result back, and the root is gone after it', () => {
  let seen = ''
  const result = withScratchTree({
    files: { 'a/b.txt': 'b\n' },
    prefix: PREFIX,
    use: ({ root }) => {
      seen = root
      return readFileSync(join(root, 'a', 'b.txt'), 'utf8')
    }
  })

  assert.equal(result, 'b\n')
  assert.equal(existsSync(seen), false)
})

test('a use that throws reaches the caller, and the root is gone after it', () => {
  let seen = ''
  const thrown = new Error('use failed')

  assert.throws(
    () =>
      withScratchTree({
        files: {},
        prefix: PREFIX,
        use: ({ root }) => {
          seen = root
          throw thrown
        }
      }),
    (error) => error === thrown
  )
  assert.equal(existsSync(seen), false)
})

test('a root that use removed itself is an error, never passed over', () => {
  assert.throws(
    () =>
      withScratchTree({
        files: {},
        prefix: PREFIX,
        use: ({ root }) => rmSync(root, { recursive: true })
      }),
    (error) => error.code === NOT_FOUND
  )
})
