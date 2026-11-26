// ---------------------------------------------------------------------------
// The prune of cloudflare, checked on this repository. The cloudflare
// capability claims this suite, so its prune deletes it with the rest of
// its files (scripts/prune-boundary.repository.mjs).
//
// The cloudflare prune still leaves imports of its adapters in the web app
// (docs/manifest.md § Known gaps, blocker B4), so only the registry it
// leaves is held here.
//
// Run: node --test scripts/prune-boundary.cloudflare.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  ownersOf,
  pruneRepository,
  registryFindingsOf
} from './prune-boundary.repository.mjs'

const CAPABILITY = 'cloudflare'

test('cloudflare alone claims this suite, so its prune deletes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [CAPABILITY])
})

test('pruning cloudflare of this repository leaves the registry true', () => {
  assert.deepEqual(
    registryFindingsOf({
      leaks: pruneRepository({ capabilityId: CAPABILITY })
    }),
    []
  )
})
