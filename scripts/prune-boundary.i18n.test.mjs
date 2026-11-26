// ---------------------------------------------------------------------------
// The prune of i18n, checked on this repository. The i18n capability claims
// this suite, so its prune deletes it with the rest of its files
// (scripts/prune-boundary.repository.mjs).
//
// The i18n prune still leaves imports of its package in the apps
// (docs/manifest.md § Known gaps, blocker B4), so only the package.json
// side is held here: no kept package.json declares the package whose entry
// the prune takes.
//
// Run: node --test scripts/prune-boundary.i18n.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ownersOf, pruneRepository } from './prune-boundary.repository.mjs'

const CAPABILITY = 'i18n'
const UNREGISTERED = 'registry-unregistered'

test('i18n alone claims this suite, so its prune deletes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [CAPABILITY])
})

test('pruning i18n of this repository keeps no package whose entry it takes', () => {
  assert.deepEqual(
    pruneRepository({ capabilityId: CAPABILITY }).filter(
      ({ kind }) => kind === UNREGISTERED
    ),
    []
  )
})
