// ---------------------------------------------------------------------------
// The prune of design-tokens, checked on this repository. The design-tokens
// capability claims this suite, so its prune deletes it with the rest of
// its files (scripts/prune-boundary.repository.mjs).
//
// The design-tokens prune still leaves imports of its package in the apps
// (docs/manifest.md § Known gaps, blocker B4), so only the package.json
// side is held here: no kept package.json declares the package whose entry
// the prune takes.
//
// Run: node --test scripts/prune-boundary.design-tokens.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ownersOf, pruneRepository } from './prune-boundary.repository.mjs'

const CAPABILITY = 'design-tokens'
const UNREGISTERED = 'registry-unregistered'

test('design-tokens alone claims this suite, so its prune deletes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [CAPABILITY])
})

test('pruning design-tokens of this repository keeps no package whose entry it takes', () => {
  assert.deepEqual(
    pruneRepository({ capabilityId: CAPABILITY }).filter(
      ({ kind }) => kind === UNREGISTERED
    ),
    []
  )
})
