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
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { gitFreeEnv } from '../git-free-env.mjs'
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

test('a tree given an origin is a git checkout whose origin remote is that URL, and is gone after use', () => {
  const origin = 'https://github.com/acme/acme-ledger.git'
  const args = ['config', '--get', 'remote.origin.url']
  const [root, url] = withScratchTree({
    files: {},
    origin,
    prefix: PREFIX,
    use: ({ root }) => [
      root,
      execFileSync('git', ['-C', root, ...args], { env: gitFreeEnv() })
    ]
  })
  assert.equal(String(url).trim(), origin)
  assert.equal(existsSync(root), false)
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
