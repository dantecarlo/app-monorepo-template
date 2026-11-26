// ---------------------------------------------------------------------------
// The prune of web-next, checked on this repository. The web-next
// capability claims this suite, so its prune deletes it with the rest of
// its files (scripts/prune-boundary.repository.mjs).
//
// Run: node --test scripts/prune-boundary.web-next.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  misplacedGatewaysOf,
  ownersOf,
  pruneRepository,
  staleSpecClaimsAfter
} from './prune-boundary.repository.mjs'

const CAPABILITY = 'web-next'
const APP = 'web'

test('web-next alone claims this suite, so its prune deletes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [CAPABILITY])
})

test('pruning web-next of this repository leaves no dangling reference', () => {
  assert.deepEqual(pruneRepository({ capabilityId: CAPABILITY }), [])
})

// The prune deletes the files the app claims or removes, its spec among
// them, and the manifest stops declaring it; a claim another capability
// keeps on a spec, such as one of an optional capability that adds a part
// to the app, must not be left matching nothing.
test('pruning web-next of this repository leaves no claim of a kept capability on a spec stale', () => {
  assert.deepEqual(staleSpecClaimsAfter({ capabilityId: CAPABILITY }), [])
})

test('the web app lists its backend gateway in the region of its import', () => {
  assert.deepEqual(misplacedGatewaysOf({ app: APP }), [])
})
