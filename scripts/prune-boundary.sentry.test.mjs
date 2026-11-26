// ---------------------------------------------------------------------------
// The prune of sentry, checked on this repository. The sentry capability
// claims this suite, so its prune deletes it with the rest of its files
// (scripts/prune-boundary.repository.mjs).
//
// Run: node --test scripts/prune-boundary.sentry.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { dropRegions } from './manifest.mjs'
import {
  ownersOf,
  prunedFilesOf,
  pruneRepository
} from './prune-boundary.repository.mjs'

const CAPABILITY = 'sentry'
const APP_FOLDER = /^apps\/(?<app>[^/]+)\//u
const SPEC_KIND = 'spec'
const keepRegions = ({ text }) => text

test('sentry alone claims this suite, so its prune deletes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [CAPABILITY])
})

test('pruning sentry of this repository leaves no dangling reference', () => {
  assert.deepEqual(pruneRepository({ capabilityId: CAPABILITY }), [])
})

// The Sentry part of each app's spec, its Governs line and its
// requirements, sits in a sentry region of that spec (openspec/README.md
// § 2.2). The sentry prune must drop it with the region; read with the
// region kept, the same specs must cite the Sentry files, or the region
// would be holding nothing. The apps are the ones that hold a file the
// sentry prune deletes: an app another prune removed holds none.
const sentryAppSpecs = () =>
  [
    ...new Set(
      prunedFilesOf({ capabilityId: CAPABILITY })
        .map((path) => APP_FOLDER.exec(path)?.groups.app)
        .filter(Boolean)
    )
  ]
    .sort()
    .map((app) => `openspec/specs/apps/${app}/spec.md`)

const specsCiting = ({ regions, specs }) => [
  ...new Set(
    pruneRepository({ capabilityId: CAPABILITY, regions })
      .filter(
        ({ file, kind }) => kind === SPEC_KIND && specs.includes(file)
      )
      .map(({ file }) => file)
  )
]

test('pruning sentry of this repository drops the Sentry part of each app spec with its region', () => {
  const specs = sentryAppSpecs()

  assert.deepEqual(specsCiting({ regions: dropRegions, specs }), [])
  assert.deepEqual(specsCiting({ regions: keepRegions, specs }), specs)
})
