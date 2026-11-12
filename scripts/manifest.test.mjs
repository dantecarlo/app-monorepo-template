#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Mutation gate for scripts/manifest.mjs — the pure core behind both manifest
// gates. Every rule is driven from synthetic manifests and synthetic file
// lists: no filesystem, no git, no ordering luck.
//
// Usage:
//   node --test scripts/manifest.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  analyzeCoverage,
  matchesAny,
  validateManifest
} from './manifest.mjs'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const capability = ({ claims = [], id, ...rest }) => ({
  claims,
  group: 'web',
  id,
  title: `Capability ${id}`,
  ...rest
})

const manifestOf = ({ capabilities = [], core = [], presets = [] }) => ({
  capabilities,
  core,
  presets,
  version: 1
})

const rulesOf = ({ violations }) =>
  violations.map(({ rule }) => rule).sort()

// ---------------------------------------------------------------------------
// matchesAny — the glob contract
// ---------------------------------------------------------------------------

test('** matches across path segments', () => {
  assert.equal(
    matchesAny({ path: 'apps/web/src/a/b.ts', patterns: ['apps/web/**'] }),
    true
  )
})

test('** matches the zero-segment case', () => {
  assert.equal(
    matchesAny({ path: 'docs/x.md', patterns: ['docs/**'] }),
    true
  )
})

test('* does not cross a path separator', () => {
  assert.equal(
    matchesAny({
      path: 'apps/web/deep/file.ts',
      patterns: ['apps/*/file.ts']
    }),
    false
  )
  assert.equal(
    matchesAny({ path: 'apps/web/file.ts', patterns: ['apps/*/file.ts'] }),
    true
  )
})

test('an exact pattern matches only that exact path', () => {
  assert.equal(
    matchesAny({ path: 'docs/e2e.md', patterns: ['docs/e2e.md'] }),
    true
  )
  assert.equal(
    matchesAny({ path: 'docs/e2e.md.bak', patterns: ['docs/e2e.md'] }),
    false
  )
})

test('regex metacharacters in a pattern are treated literally', () => {
  assert.equal(
    matchesAny({ path: 'a.b/c.ts', patterns: ['a.b/c.ts'] }),
    true
  )
  assert.equal(
    matchesAny({ path: 'axb/c.ts', patterns: ['a.b/c.ts'] }),
    false
  )
})

test('an empty pattern list matches nothing', () => {
  assert.equal(matchesAny({ path: 'anything', patterns: [] }), false)
})

// ---------------------------------------------------------------------------
// validateManifest — structural well-formedness
// ---------------------------------------------------------------------------

test('a minimal well-formed manifest yields no violations', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['apps/web/**'], id: 'web-next' })
      ],
      core: ['package.json'],
      presets: [
        { capabilities: ['web-next'], id: 'default', title: 'Default' }
      ]
    })
  })

  assert.deepEqual(violations, [])
})

test('a duplicate capability id fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['a/**'], id: 'dup' }),
        capability({ claims: ['b/**'], id: 'dup' })
      ]
    })
  })

  assert.ok(rulesOf({ violations }).includes('capability-id-duplicate'))
})

test('a non-kebab-case capability id fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [capability({ claims: ['a/**'], id: 'WebNext' })]
    })
  })

  assert.ok(
    rulesOf({ violations }).includes('capability-id-not-kebab-case')
  )
})

test('a capability with no claims fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [capability({ claims: [], id: 'ghost' })]
    })
  })

  assert.ok(rulesOf({ violations }).includes('capability-claims-empty'))
})

test('an unknown verb fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({
          claims: ['a/**'],
          id: 'x',
          onAbsent: [{ paths: ['a'], verb: 'nuke' }]
        })
      ]
    })
  })

  assert.ok(rulesOf({ violations }).includes('action-verb-unknown'))
})

test('a known verb missing a required field fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({
          claims: ['a/**'],
          id: 'x',
          onAbsent: [{ file: 'package.json', verb: 'patch-json' }]
        })
      ]
    })
  })

  assert.ok(rulesOf({ violations }).includes('action-field-missing'))
})

test('a requires pointing at an unknown capability fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['a/**'], id: 'x', requires: ['nope'] })
      ]
    })
  })

  assert.ok(
    rulesOf({ violations }).includes('requires-unknown-capability')
  )
})

test('a capability that both requires and conflicts with the same id fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({
          claims: ['a/**'],
          conflictsWith: ['y'],
          id: 'x',
          requires: ['y']
        }),
        capability({ claims: ['b/**'], id: 'y' })
      ]
    })
  })

  assert.ok(
    rulesOf({ violations }).includes('requires-conflicts-contradiction')
  )
})

test('a preset naming an unknown capability fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [capability({ claims: ['a/**'], id: 'x' })],
      presets: [{ capabilities: ['ghost'], id: 'p', title: 'P' }]
    })
  })

  assert.ok(rulesOf({ violations }).includes('preset-unknown-capability'))
})

test('a preset that omits a required capability fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['a/**'], id: 'x', requires: ['y'] }),
        capability({ claims: ['b/**'], id: 'y' })
      ],
      presets: [{ capabilities: ['x'], id: 'p', title: 'P' }]
    })
  })

  assert.ok(
    rulesOf({ violations }).includes('preset-unsatisfied-requires')
  )
})

test('a preset holding two conflicting capabilities fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['a/**'], conflictsWith: ['y'], id: 'x' }),
        capability({ claims: ['b/**'], id: 'y' })
      ],
      presets: [{ capabilities: ['x', 'y'], id: 'p', title: 'P' }]
    })
  })

  assert.ok(
    rulesOf({ violations }).includes('preset-conflicting-capabilities')
  )
})

test('an absolute or escaping claim fires', () => {
  const violations = validateManifest({
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['/etc/passwd', '../outside/**'], id: 'x' })
      ]
    })
  })

  assert.ok(rulesOf({ violations }).includes('claim-not-repo-relative'))
})

// ---------------------------------------------------------------------------
// analyzeCoverage — the manifest cannot lie in either direction
// ---------------------------------------------------------------------------

test('a fully claimed file list reports nothing', () => {
  const result = analyzeCoverage({
    files: ['package.json', 'apps/web/src/a.ts'],
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['apps/web/**'], id: 'web-next' })
      ],
      core: ['package.json']
    })
  })

  assert.deepEqual(result.unclaimed, [])
  assert.deepEqual(result.conflicts, [])
  assert.deepEqual(result.staleClaims, [])
})

test('a tracked file claimed by nobody is reported as unclaimed', () => {
  const result = analyzeCoverage({
    files: ['apps/web/src/a.ts', 'orphan.ts'],
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['apps/web/**'], id: 'web-next' })
      ]
    })
  })

  assert.deepEqual(result.unclaimed, ['orphan.ts'])
})

test('a file claimed by two capabilities is reported as a conflict', () => {
  const result = analyzeCoverage({
    files: ['apps/web/src/a.ts'],
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['apps/web/**'], id: 'web-next' }),
        capability({ claims: ['apps/**/a.ts'], id: 'other' })
      ]
    })
  })

  assert.equal(result.conflicts.length, 1)
  assert.deepEqual(result.conflicts[0].owners, ['other', 'web-next'])
})

test('a file claimed by both core and a capability is reported as a conflict', () => {
  const result = analyzeCoverage({
    files: ['apps/web/src/a.ts'],
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['apps/web/**'], id: 'web-next' })
      ],
      core: ['apps/web/**']
    })
  })

  assert.equal(result.conflicts.length, 1)
  assert.deepEqual(result.conflicts[0].owners, ['core', 'web-next'])
})

test('a claim matching zero tracked files is reported as stale', () => {
  const result = analyzeCoverage({
    files: ['apps/web/src/a.ts'],
    manifest: manifestOf({
      capabilities: [
        capability({
          claims: ['apps/web/**', 'apps/ghost/**'],
          id: 'web-next'
        })
      ]
    })
  })

  assert.deepEqual(result.staleClaims, [
    { claim: 'apps/ghost/**', owner: 'web-next' }
  ])
})

test('a stale core claim is reported too', () => {
  const result = analyzeCoverage({
    files: ['apps/web/src/a.ts'],
    manifest: manifestOf({
      capabilities: [
        capability({ claims: ['apps/web/**'], id: 'web-next' })
      ],
      core: ['nope.json']
    })
  })

  assert.deepEqual(result.staleClaims, [
    { claim: 'nope.json', owner: 'core' }
  ])
})
