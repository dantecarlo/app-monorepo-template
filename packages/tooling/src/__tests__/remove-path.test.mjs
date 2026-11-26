// ---------------------------------------------------------------------------
// remove-path — a missing path is the one failure that counts as removed.
// The real cases run in a scratch folder under the OS temp directory; the
// failures no folder can stage portably come from an injected fs.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { removePath } from '../remove-path.mjs'

const SCRATCH_PREFIX = 'remove-path-'
const NOT_FOUND = 'ENOENT'
const DENIED = 'EPERM'

const scratch = () => mkdtempSync(join(tmpdir(), SCRATCH_PREFIX))

const failure = ({ code }) =>
  Object.assign(new Error(`${code}: injected`), { code })

test('a missing path returns, and nothing is created there', (t) => {
  const root = scratch()
  t.after(() => rmSync(root, { recursive: true }))
  const missing = join(root, 'missing')

  assert.equal(removePath({ path: missing }), undefined)
  assert.equal(existsSync(missing), false)
})

test('a file is removed, and the folder that holds it stays', (t) => {
  const root = scratch()
  t.after(() => rmSync(root, { recursive: true }))
  const file = join(root, 'file.txt')
  writeFileSync(file, 'file\n')

  removePath({ path: file })

  assert.equal(existsSync(file), false)
  assert.equal(existsSync(root), true)
})

test('a folder is removed with everything under it', () => {
  const root = scratch()
  mkdirSync(join(root, 'a', 'b'), { recursive: true })
  writeFileSync(join(root, 'a', 'b', 'c.txt'), 'c\n')
  writeFileSync(join(root, 'top.txt'), 'top\n')

  removePath({ path: root })

  assert.equal(existsSync(root), false)
})

test('an injected fs removes the path recursively, and its missing path returns', () => {
  const calls = []
  const fs = {
    rmSync: (path, options) => {
      calls.push({ options, path })
      throw failure({ code: NOT_FOUND })
    }
  }

  assert.equal(removePath({ fs, path: 'gone' }), undefined)
  assert.deepEqual(calls, [{ options: { recursive: true }, path: 'gone' }])
})

test('any other failure is rethrown as it was raised', () => {
  const denied = failure({ code: DENIED })
  const fs = {
    rmSync: () => {
      throw denied
    }
  }

  assert.throws(
    () => removePath({ fs, path: 'held' }),
    (error) => error === denied
  )
})

test('a failure that carries no code is rethrown too', () => {
  const broken = new Error('no code')
  const fs = {
    rmSync: () => {
      throw broken
    }
  }

  assert.throws(
    () => removePath({ fs, path: 'held' }),
    (error) => error === broken
  )
})
