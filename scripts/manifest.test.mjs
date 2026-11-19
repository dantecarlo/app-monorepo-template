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
import { execFileSync, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { test } from 'node:test'

import { withScratchTree } from './gate/scratch.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import {
  analyzeCoverage,
  analyzeRegions,
  analyzeRegistryOwners,
  dropRegions,
  matchesAny,
  validateManifest
} from './manifest.mjs'

const COVERAGE_GATE = join(
  import.meta.dirname,
  'verify-manifest-coverage.mjs'
)
const REGISTRY = '.agents/contracts/dependencies.json'

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

// ---------------------------------------------------------------------------
// analyzeRegistryOwners — every registry entry has one owner the manifest
// knows, so a prune knows which entries go with it
// ---------------------------------------------------------------------------

const registryOf = (packages) => ({ packages })
const WEB_MANIFEST = manifestOf({
  capabilities: [capability({ claims: ['apps/web/**'], id: 'web-next' })]
})

test('a registry entry owned by core or by a declared capability passes', () => {
  assert.deepEqual(
    analyzeRegistryOwners({
      manifest: WEB_MANIFEST,
      registry: registryOf([
        { category: 'core', name: 'react', owner: 'core' },
        { category: 'core', name: 'next', owner: 'web-next' }
      ])
    }),
    []
  )
})

test('a registry entry that names no owner is unowned', () => {
  assert.deepEqual(
    analyzeRegistryOwners({
      manifest: WEB_MANIFEST,
      registry: registryOf([
        { category: 'core', name: 'react', owner: 'core' },
        { category: 'core', name: 'next' },
        { category: 'core', name: 'expo', owner: '' }
      ])
    }),
    [
      {
        detail:
          'next names no owner: name the capability whose prune removes it, or core',
        name: 'next'
      },
      {
        detail:
          'expo names no owner: name the capability whose prune removes it, or core',
        name: 'expo'
      }
    ]
  )
})

test('a registry entry whose owner the manifest does not declare is unowned', () => {
  assert.deepEqual(
    analyzeRegistryOwners({
      manifest: WEB_MANIFEST,
      registry: registryOf([
        { category: 'core', name: 'expo', owner: 'mobile-expo' }
      ])
    }),
    [
      {
        detail:
          'expo is owned by "mobile-expo", which template.manifest.json does not declare',
        name: 'expo'
      }
    ]
  )
})

test('a registry with no packages array is reported, not skipped', () => {
  assert.deepEqual(
    analyzeRegistryOwners({ manifest: WEB_MANIFEST, registry: {} }),
    [
      {
        detail:
          'the registry holds no "packages" array, so no entry has an owner',
        name: REGISTRY
      }
    ]
  )
})

// ---------------------------------------------------------------------------
// verify-manifest-coverage, as a process over a scratch git repository
// ---------------------------------------------------------------------------

const GATE_MANIFEST = JSON.stringify(
  manifestOf({
    capabilities: [
      capability({ claims: ['apps/web/**'], id: 'web-next' })
    ],
    core: ['.agents/**', 'template.manifest.json']
  })
)

const runCoverageGate = ({ files }) =>
  withScratchTree({
    files: { 'template.manifest.json': GATE_MANIFEST, ...files },
    prefix: 'manifest-coverage-',
    use: ({ root }) => {
      const env = gitFreeEnv()
      execFileSync('git', ['init', '-q'], { cwd: root, env })
      execFileSync('git', ['add', '-A'], { cwd: root, env })
      return spawnSync(process.execPath, [COVERAGE_GATE, '--root', root], {
        encoding: 'utf8',
        env
      })
    }
  })

const OWNED_REGISTRY = JSON.stringify(
  registryOf([
    { category: 'core', name: 'react', owner: 'core' },
    { category: 'core', name: 'next', owner: 'web-next' }
  ])
)

test('the coverage gate passes a tree whose files and registry entries each have one owner', () => {
  const result = runCoverageGate({
    files: { [REGISTRY]: OWNED_REGISTRY, 'apps/web/a.ts': 'export {}\n' }
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(
    result.stdout,
    /all 3 tracked file\(s\) owned exactly once, no stale claims, 2 registry entries each owned once/u
  )
})

test('the coverage gate fails an unclaimed file, naming it', () => {
  const result = runCoverageGate({
    files: {
      [REGISTRY]: OWNED_REGISTRY,
      'apps/web/a.ts': 'export {}\n',
      'stray.md': '# stray\n'
    }
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /UNCLAIMED \(1\)[^\n]*\n {4}stray\.md/u)
})

test('the coverage gate fails a registry entry with no owner or an undeclared one, naming each', () => {
  const result = runCoverageGate({
    files: {
      [REGISTRY]: JSON.stringify(
        registryOf([
          { category: 'core', name: 'react' },
          { category: 'core', name: 'expo', owner: 'mobile-expo' }
        ])
      ),
      'apps/web/a.ts': 'export {}\n'
    }
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /UNOWNED ENTRIES \(2\)/u)
  assert.match(result.stderr, /react names no owner/u)
  assert.match(
    result.stderr,
    /expo is owned by "mobile-expo", which template\.manifest\.json does not declare/u
  )
})

// ---------------------------------------------------------------------------
// Regions — the lines of a file another owner keeps that a capability owns.
// A fixture line is built with join, never written as a line of this file:
// a marker on a line of its own here would be a region of this file.
// ---------------------------------------------------------------------------

const linesOf = (...lines) => lines.join('\n')
const open = ({ mark = '#', owner }) => `${mark} region ${owner}`
const close = ({ mark = '#', owner }) => `${mark} endregion ${owner}`
const SENTRY_MANIFEST = manifestOf({
  capabilities: [
    capability({ claims: ['apps/web/**'], id: 'web-next' }),
    capability({ claims: ['apps/web/sentry.ts'], id: 'sentry' })
  ]
})

test('a prune drops its own regions, markers included, and keeps the others', () => {
  const text = linesOf(
    'kept: 1',
    open({ owner: 'sentry' }),
    'sentry: 1',
    close({ owner: 'sentry' }),
    `  ${open({ mark: '//', owner: 'web-next' })}`,
    'web: 1',
    `  ${close({ mark: '//', owner: 'web-next' })}`,
    '<!-- region sentry -->',
    'more: 1',
    '<!-- endregion sentry -->',
    'last: 1'
  )

  assert.equal(
    dropRegions({ owner: 'sentry', text }),
    linesOf(
      'kept: 1',
      `  ${open({ mark: '//', owner: 'web-next' })}`,
      'web: 1',
      `  ${close({ mark: '//', owner: 'web-next' })}`,
      'last: 1'
    )
  )
  assert.equal(dropRegions({ owner: 'i18n', text }), text)
})

test('a well-formed region of a declared capability reports nothing', () => {
  assert.deepEqual(
    analyzeRegions({
      files: [
        {
          path: '.env.example',
          text: linesOf(
            open({ owner: 'sentry' }),
            'A=1',
            close({ owner: 'sentry' })
          )
        },
        {
          path: 'README.md',
          text: 'no region here, nor a region sentry\n'
        }
      ],
      manifest: SENTRY_MANIFEST
    }),
    []
  )
})

test('a region whose owner the manifest does not declare is reported, core included', () => {
  assert.deepEqual(
    analyzeRegions({
      files: [
        {
          path: 'pnpm-workspace.yaml',
          text: linesOf(
            open({ owner: 'stripe' }),
            'x: 1',
            close({ owner: 'stripe' }),
            open({ owner: 'core' }),
            close({ owner: 'core' })
          )
        }
      ],
      manifest: SENTRY_MANIFEST
    }),
    [
      {
        detail:
          'region "stripe" names a capability template.manifest.json does not declare',
        line: 1,
        path: 'pnpm-workspace.yaml'
      },
      {
        detail:
          'region "core" names a capability template.manifest.json does not declare',
        line: 4,
        path: 'pnpm-workspace.yaml'
      }
    ]
  )
})

test('an unbalanced or nested region is reported', () => {
  const findings = analyzeRegions({
    files: [
      { path: 'a.yaml', text: linesOf(open({ owner: 'sentry' }), 'x: 1') },
      {
        path: 'b.yaml',
        text: linesOf('x: 1', close({ owner: 'sentry' }))
      },
      {
        path: 'c.yaml',
        text: linesOf(
          open({ owner: 'sentry' }),
          open({ owner: 'web-next' }),
          close({ owner: 'web-next' }),
          close({ owner: 'sentry' })
        )
      },
      {
        path: 'd.yaml',
        text: linesOf(
          open({ owner: 'sentry' }),
          close({ owner: 'web-next' })
        )
      }
    ],
    manifest: SENTRY_MANIFEST
  })

  assert.deepEqual(
    findings.map(({ detail, line, path }) => `${path}:${line} ${detail}`),
    [
      'a.yaml:1 region "sentry" is never closed',
      'b.yaml:2 endregion "sentry" closes no open region',
      'c.yaml:2 region "web-next" opens inside region "sentry", opened at line 1: regions do not nest',
      'c.yaml:3 endregion "web-next" closes region "sentry", opened at line 1',
      'c.yaml:4 endregion "sentry" closes no open region',
      'd.yaml:2 endregion "web-next" closes region "sentry", opened at line 1'
    ]
  )
})

test('dropping the regions of a file whose regions are unbalanced throws', () => {
  assert.throws(
    () =>
      dropRegions({
        owner: 'sentry',
        text: linesOf(open({ owner: 'sentry' }), 'x: 1')
      }),
    /region "sentry" is never closed/u
  )
})

test('the coverage gate fails a region it cannot drop cleanly, naming the file and line', () => {
  const result = runCoverageGate({
    files: {
      [REGISTRY]: OWNED_REGISTRY,
      'apps/web/a.ts': linesOf(
        'export {}',
        open({ mark: '//', owner: 'mobile-expo' }),
        'export const x = 1',
        close({ mark: '//', owner: 'mobile-expo' }),
        open({ mark: '//', owner: 'web-next' })
      )
    }
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /REGIONS \(2\)/u)
  assert.match(
    result.stderr,
    /apps\/web\/a\.ts:2 {2}→ {2}region "mobile-expo" names a capability template\.manifest\.json does not declare/u
  )
  assert.match(
    result.stderr,
    /apps\/web\/a\.ts:5 {2}→ {2}region "web-next" is never closed/u
  )
})
