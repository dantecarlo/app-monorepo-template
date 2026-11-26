// ---------------------------------------------------------------------------
// The prune of supabase, checked on this repository. The supabase
// capability claims this suite, so its prune deletes it with the rest of
// its files (scripts/prune-boundary.repository.mjs).
//
// Run: node --test scripts/prune-boundary.supabase.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ownersOf, pruneRepository } from './prune-boundary.repository.mjs'

const CAPABILITY = 'supabase'

test('supabase alone claims this suite, so its prune deletes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [CAPABILITY])
})

test('pruning supabase of this repository leaves no dangling reference', () => {
  assert.deepEqual(pruneRepository({ capabilityId: CAPABILITY }), [])
})
