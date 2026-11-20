import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import { gitFreeEnv } from '../../../../scripts/git-free-env.mjs'
import {
  analyzeCoverage,
  dropRegions,
  matchesAny
} from '../../../../scripts/manifest.mjs'
import { findPruneLeaks } from '../prune-boundary.mjs'

const REPO_ROOT = resolve(import.meta.dirname, '../../../..')
const CAPABILITY = 'vendor'
const REMOVED_DEPENDENCY = '@vendor/sdk'
const PLUGIN = '@vendor/sdk/expo'
const KEPT_PLUGIN = 'expo-router'

const manifestWith = ({ onAbsent = [], claims }) => ({
  capabilities: [{ claims, id: CAPABILITY, onAbsent }]
})

const REMOVE_DEPENDENCY = {
  file: 'apps/web/package.json',
  name: REMOVED_DEPENDENCY,
  scope: 'dependencies',
  verb: 'remove-dep'
}

const check = ({ files, manifest }) =>
  findPruneLeaks({
    capabilityId: CAPABILITY,
    files: Object.keys(files),
    manifest,
    dropRegions,
    matches: matchesAny,
    readText: ({ path }) => files[path]
  })

const appJson = ({ plugins }) => JSON.stringify({ expo: { plugins } })

const REGISTRY = '.agents/contracts/dependencies.json'
const registryOf = (packages) =>
  JSON.stringify({
    packages,
    testInfrastructure: ['{apps,packages}/*/src/test/**']
  })
const manifestFile = (dependencies) =>
  JSON.stringify({ dependencies, name: 'workspace' })
const registryLeaks = (leaks) =>
  leaks.filter(({ kind }) => kind.startsWith('registry-'))

// A kept web app and a vendor app the capability claims whole.
const WORKSPACE_FILES = {
  'apps/vendor/package.json': manifestFile({ 'vendor-sdk': '1' }),
  'apps/vendor/src/client.adapter.ts': "import 'vendor-sdk'\n",
  'apps/vendor/src/test/setup.ts': 'export {}\n',
  'apps/web/package.json': manifestFile({ react: '1' }),
  'apps/web/src/home.ts': "import 'react'\n",
  'apps/web/src/test/setup.ts': 'export {}\n'
}
const VENDOR_APP = manifestWith({ claims: ['apps/vendor/**'] })
const REACT = { category: 'core', name: 'react', owner: 'core' }
test('a kept file that imports a pruned file is a leak', () => {
  const files = {
    'apps/web/next.config.ts': "import plugin from './vendor.config'\n",
    'apps/web/src/lib/a/index.ts':
      "export { createVendor } from './createVendor.adapter'\n",
    'apps/web/src/lib/a/createVendor.adapter.ts': 'export const x = 1\n',
    'apps/web/src/lib/a/root.adapter.ts':
      "import { createVendor } from '@/lib/a/createVendor.adapter'\n",
    'apps/web/vendor.config.ts': 'export default 1\n'
  }
  const manifest = manifestWith({
    claims: ['apps/web/vendor.config.ts'],
    onAbsent: [
      {
        paths: ['apps/web/src/lib/a/createVendor.adapter.ts'],
        verb: 'remove'
      }
    ]
  })

  assert.deepEqual(check({ files, manifest }), [
    {
      file: 'apps/web/next.config.ts',
      kind: 'import',
      specifier: './vendor.config'
    },
    {
      file: 'apps/web/src/lib/a/index.ts',
      kind: 'import',
      specifier: './createVendor.adapter'
    },
    {
      file: 'apps/web/src/lib/a/root.adapter.ts',
      kind: 'import',
      specifier: '@/lib/a/createVendor.adapter'
    }
  ])
})

test('a kept file that imports a removed dependency is a leak', () => {
  const files = {
    'apps/web/instrumentation.ts': [
      "import * as Vendor from '@vendor/sdk'",
      "const lazy = () => import('@vendor/sdk/server')",
      "import { other } from '@vendor/sdk-extra'"
    ].join('\n'),
    'apps/web/vendor.config.ts': 'export default 1\n'
  }
  const manifest = manifestWith({
    claims: ['apps/web/vendor.config.ts'],
    onAbsent: [REMOVE_DEPENDENCY]
  })

  assert.deepEqual(check({ files, manifest }), [
    {
      file: 'apps/web/instrumentation.ts',
      kind: 'import',
      specifier: '@vendor/sdk'
    },
    {
      file: 'apps/web/instrumentation.ts',
      kind: 'import',
      specifier: '@vendor/sdk/server'
    }
  ])
})

test('an import between two pruned files is no leak', () => {
  const files = {
    'apps/web/next.config.ts': "import base from './base.config'\n",
    'apps/web/vendor.config.ts': [
      "import { wrap } from '@vendor/sdk'",
      "import { helper } from './vendor.helper'"
    ].join('\n'),
    'apps/web/vendor.helper.ts': "import * as V from '@vendor/sdk'\n"
  }
  const manifest = manifestWith({
    claims: ['apps/web/vendor.*.ts'],
    onAbsent: [REMOVE_DEPENDENCY]
  })

  assert.deepEqual(check({ files, manifest }), [])
})

test('an Expo plugin the prune leaves that names a removed dependency is a leak', () => {
  const files = {
    'apps/mobile/app.json': appJson({ plugins: [KEPT_PLUGIN, PLUGIN] }),
    'apps/mobile/vendor.config.ts': 'export default 1\n'
  }
  const manifest = manifestWith({
    claims: ['apps/mobile/vendor.config.ts'],
    onAbsent: [{ ...REMOVE_DEPENDENCY, file: 'apps/mobile/package.json' }]
  })

  assert.deepEqual(check({ files, manifest }), [
    { file: 'apps/mobile/app.json', kind: 'plugin', specifier: PLUGIN }
  ])
})

test('a patched plugin list that drifts from app.json is a leak', () => {
  const files = {
    'apps/mobile/app.json': appJson({
      plugins: [KEPT_PLUGIN, ['expo-font', { fonts: [] }], PLUGIN]
    }),
    'apps/mobile/vendor.config.ts': 'export default 1\n'
  }
  const patch = (value) =>
    manifestWith({
      claims: ['apps/mobile/vendor.config.ts'],
      onAbsent: [
        { ...REMOVE_DEPENDENCY, file: 'apps/mobile/package.json' },
        {
          file: 'apps/mobile/app.json',
          op: 'set',
          path: 'expo.plugins',
          value,
          verb: 'patch-json'
        }
      ]
    })

  assert.deepEqual(
    check({
      files,
      manifest: patch([KEPT_PLUGIN, ['expo-font', { fonts: [] }]])
    }),
    []
  )
  assert.deepEqual(check({ files, manifest: patch([KEPT_PLUGIN]) }), [
    {
      file: 'apps/mobile/app.json',
      kind: 'plugin-drift',
      specifier: 'expo.plugins'
    }
  ])
})

test('an entry the pruned capability owns goes with its package', () => {
  const files = {
    ...WORKSPACE_FILES,
    [REGISTRY]: registryOf([
      REACT,
      {
        category: 'vendor',
        name: 'vendor-sdk',
        owner: CAPABILITY,
        seam: ['apps/vendor/src/*.adapter.ts']
      }
    ])
  }

  assert.deepEqual(check({ files, manifest: VENDOR_APP }), [])
})

test('a kept entry whose package no kept package.json declares is a leak', () => {
  const files = {
    ...WORKSPACE_FILES,
    'apps/web/package.json': manifestFile({
      [REMOVED_DEPENDENCY]: '1',
      react: '1'
    }),
    [REGISTRY]: registryOf([
      REACT,
      { category: 'core', name: 'vendor-sdk', owner: 'core' },
      {
        category: 'core',
        name: `${REMOVED_DEPENDENCY}/server`,
        owner: 'core'
      }
    ])
  }
  const manifest = manifestWith({
    claims: ['apps/vendor/**'],
    onAbsent: [REMOVE_DEPENDENCY]
  })

  assert.deepEqual(registryLeaks(check({ files, manifest })), [
    {
      file: REGISTRY,
      kind: 'registry-stale',
      specifier: '@vendor/sdk/server'
    },
    { file: REGISTRY, kind: 'registry-stale', specifier: 'vendor-sdk' }
  ])
})

test('a remove-dep takes the entries of a package it removes from its last package.json', () => {
  const VENDOR_ADAPTER = 'apps/web/src/vendor.adapter.ts'
  const files = {
    ...WORKSPACE_FILES,
    'apps/other/package.json': manifestFile({ 'other-sdk': '1' }),
    'apps/web/package.json': manifestFile({
      [REMOVED_DEPENDENCY]: '1',
      'other-sdk': '1',
      react: '1'
    }),
    [VENDOR_ADAPTER]: `import '${REMOVED_DEPENDENCY}'\n`,
    [REGISTRY]: registryOf([
      REACT,
      {
        category: 'vendor',
        name: REMOVED_DEPENDENCY,
        owner: 'web-next',
        seam: [VENDOR_ADAPTER]
      },
      {
        category: 'vendor',
        name: `${REMOVED_DEPENDENCY}/server`,
        owner: 'web-next',
        seam: [VENDOR_ADAPTER]
      },
      {
        category: 'vendor',
        name: 'other-sdk',
        owner: 'web-next',
        seam: []
      }
    ])
  }
  const manifest = manifestWith({
    claims: ['apps/vendor/**', VENDOR_ADAPTER],
    onAbsent: [
      REMOVE_DEPENDENCY,
      { ...REMOVE_DEPENDENCY, name: 'other-sdk' }
    ]
  })

  assert.deepEqual(check({ files, manifest }), [])
})

test('a kept seam glob that matches no kept file is a leak', () => {
  const files = {
    ...WORKSPACE_FILES,
    'apps/web/package.json': manifestFile({ react: '1', zod: '1' }),
    [REGISTRY]: registryOf([
      REACT,
      {
        category: 'infra',
        name: 'zod',
        owner: 'core',
        seam: ['apps/web/src/*.ts', 'apps/vendor/src/*.adapter.ts']
      }
    ])
  }

  assert.deepEqual(registryLeaks(check({ files, manifest: VENDOR_APP })), [
    {
      file: REGISTRY,
      kind: 'registry-seam',
      specifier: 'zod apps/vendor/src/*.adapter.ts'
    }
  ])
})

test('a kept dependency whose entry the prune removes is a leak', () => {
  const files = {
    ...WORKSPACE_FILES,
    'apps/web/package.json': manifestFile({
      react: '1',
      'vendor-sdk': '1'
    }),
    [REGISTRY]: registryOf([
      REACT,
      { category: 'core', name: 'vendor-sdk', owner: CAPABILITY }
    ])
  }

  assert.deepEqual(registryLeaks(check({ files, manifest: VENDOR_APP })), [
    {
      file: 'apps/web/package.json',
      kind: 'registry-unregistered',
      specifier: 'vendor-sdk'
    }
  ])
})

test('a kept file that names a pruned file by a relative path is a leak', () => {
  const files = {
    'apps/mobile/src/test/mocks/kept.ts': 'export {}\n',
    'apps/mobile/src/test/mocks/vendor.ts': 'export {}\n',
    'apps/mobile/vitest.config.ts': [
      "import mock from './src/test/mocks/vendor'",
      'const alias = {',
      "  kept: path.resolve(__dirname, './src/test/mocks/kept.ts'),",
      "  vendor: path.resolve(__dirname, './src/test/mocks/vendor.ts')",
      '}'
    ].join('\n')
  }
  const manifest = manifestWith({
    claims: ['apps/mobile/src/test/mocks/vendor.ts']
  })

  assert.deepEqual(check({ files, manifest }), [
    {
      file: 'apps/mobile/vitest.config.ts',
      kind: 'import',
      specifier: './src/test/mocks/vendor'
    },
    {
      file: 'apps/mobile/vitest.config.ts',
      kind: 'path',
      specifier: './src/test/mocks/vendor.ts'
    }
  ])
})

test('a kept .env.example key that only pruned files read is a leak', () => {
  const files = {
    'apps/web/.env.example': [
      '# Vendor keys',
      'VENDOR_DSN=',
      'KEPT_KEY=1',
      'UNREAD_KEY='
    ].join('\n'),
    'apps/web/src/kept.ts': 'export const k = process.env.KEPT_KEY\n',
    'apps/web/vendor.config.ts': [
      'export const dsn = process.env.VENDOR_DSN',
      "export const kept = process.env['KEPT_KEY']"
    ].join('\n')
  }
  const manifest = manifestWith({ claims: ['apps/web/vendor.config.ts'] })

  assert.deepEqual(check({ files, manifest }), [
    { file: 'apps/web/.env.example', kind: 'env', specifier: 'VENDOR_DSN' }
  ])
})

const KEPT_SPEC = 'openspec/specs/apps/web/spec.md'
const VENDOR_TEST = 'apps/web/__tests__/vendor.config.test.ts'
const testLine = (path) => `- **Test:** \`${path}\` › "a title"`

test('a kept spec that cites a pruned test is a leak', () => {
  const files = {
    'apps/web/__tests__/next.config.test.ts': 'export {}\n',
    [KEPT_SPEC]: [
      testLine(VENDOR_TEST),
      testLine('apps/web/__tests__/next.config.test.ts'),
      testLine(VENDOR_TEST)
    ].join('\n'),
    'openspec/specs/capabilities/vendor/spec.md': testLine(VENDOR_TEST),
    [VENDOR_TEST]: 'export {}\n'
  }
  const manifest = manifestWith({
    claims: [VENDOR_TEST, 'openspec/specs/capabilities/vendor/spec.md']
  })

  assert.deepEqual(check({ files, manifest }), [
    { file: KEPT_SPEC, kind: 'spec', specifier: VENDOR_TEST }
  ])
})

test('a kept spec that governs or cites a pruned file as evidence is a leak', () => {
  const files = {
    [KEPT_SPEC]: [
      '> **Governs:** `apps/web/src`, `apps/web/vendor.config.ts`',
      '**Evidence:** `apps/web/src/vendor.adapter.ts:3-9`, `apps/web/src/a.ts:2`'
    ].join('\n'),
    'apps/web/src/a.ts': 'export {}\n',
    'apps/web/src/vendor.adapter.ts': 'export {}\n',
    'apps/web/vendor.config.ts': 'export default 1\n'
  }
  const manifest = manifestWith({
    claims: ['apps/web/vendor.config.ts', 'apps/web/src/vendor.adapter.ts']
  })

  assert.deepEqual(check({ files, manifest }), [
    {
      file: KEPT_SPEC,
      kind: 'spec',
      specifier: 'apps/web/src/vendor.adapter.ts'
    },
    {
      file: KEPT_SPEC,
      kind: 'spec',
      specifier: 'apps/web/vendor.config.ts'
    }
  ])
})

// A marker is built with join: alone on a line of this file it would be a
// region of this file.
const regionOf = ({ lines, owner }) =>
  [`// region ${owner}`, ...lines, `// endregion ${owner}`].join('\n')

test('a leak inside a region of the pruned capability is no leak', () => {
  const IMPORT_PRUNED = "import plugin from './vendor.config'"
  const files = {
    'apps/web/a.config.ts': [
      'export const a = 1',
      regionOf({ lines: [IMPORT_PRUNED], owner: CAPABILITY })
    ].join('\n'),
    'apps/web/b.config.ts': regionOf({
      lines: [IMPORT_PRUNED],
      owner: 'other'
    }),
    'apps/web/vendor.config.ts': 'export default 1\n'
  }
  const manifest = manifestWith({ claims: ['apps/web/vendor.config.ts'] })

  assert.deepEqual(check({ files, manifest }), [
    {
      file: 'apps/web/b.config.ts',
      kind: 'import',
      specifier: './vendor.config'
    }
  ])
})

// git lists the tracked files and the ones not yet added; a tracked file
// deleted in the work tree is gone after the prune too.
const listRepositoryFiles = () =>
  execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: REPO_ROOT, encoding: 'utf8', env: gitFreeEnv() }
  )
    .split('\0')
    .filter((path) => path !== '' && existsSync(join(REPO_ROOT, path)))

const REPOSITORY_MANIFEST = JSON.parse(
  readFileSync(join(REPO_ROOT, 'template.manifest.json'), 'utf8')
)
// A project /init pruned no longer declares the capability: nothing is
// left to prune, so its check is skipped there, never failed.
const declares = (capabilityId) =>
  REPOSITORY_MANIFEST.capabilities.some(({ id }) => id === capabilityId)
const skipUnless = (capabilityId) =>
  declares(capabilityId)
    ? false
    : `the manifest no longer declares ${capabilityId}`

const pruneRepository = ({ capabilityId, regions = dropRegions }) =>
  findPruneLeaks({
    capabilityId,
    files: listRepositoryFiles(),
    manifest: REPOSITORY_MANIFEST,
    dropRegions: regions,
    matches: matchesAny,
    readText: ({ path }) => readFileSync(join(REPO_ROOT, path), 'utf8')
  })

const CLEAN_PRUNES = ['sentry', 'supabase', 'mobile-expo', 'web-next']

test(
  'pruning sentry, supabase, mobile-expo or web-next of this repository leaves no dangling reference',
  { skip: !CLEAN_PRUNES.some(declares) && 'none of them is declared' },
  () => {
    assert.deepEqual(
      CLEAN_PRUNES.filter(declares).flatMap((capabilityId) =>
        pruneRepository({ capabilityId }).map((leak) => ({
          capabilityId,
          ...leak
        }))
      ),
      []
    )
  }
)

const REGISTRY_CHECKED = [
  'sentry',
  'mobile-expo',
  'supabase',
  'web-next',
  'cloudflare'
]

const registryLeaksOf = ({ capabilities }) =>
  capabilities.filter(declares).flatMap((capabilityId) =>
    registryLeaks(pruneRepository({ capabilityId })).map((leak) => ({
      capabilityId,
      ...leak
    }))
  )

test(
  'pruning sentry, mobile-expo, supabase, web-next or cloudflare of this repository leaves the registry true',
  { skip: !REGISTRY_CHECKED.some(declares) && 'none of them is declared' },
  () => {
    assert.deepEqual(registryLeaksOf({ capabilities: REGISTRY_CHECKED }), [])
  }
)

// The i18n and design-tokens prunes still leave imports of their packages
// in the apps (blocker B4), so only the package.json side is held here: no
// kept package.json declares the package whose entry the prune takes.
const PACKAGE_TAKERS = ['i18n', 'design-tokens']
const UNREGISTERED = 'registry-unregistered'

test(
  'pruning i18n or design-tokens of this repository keeps no package whose entry it takes',
  { skip: !PACKAGE_TAKERS.some(declares) && 'none of them is declared' },
  () => {
    assert.deepEqual(
      registryLeaksOf({ capabilities: PACKAGE_TAKERS }).filter(
        ({ kind }) => kind === UNREGISTERED
      ),
      []
    )
  }
)

// The Sentry part of each app's spec, its Governs line and its
// requirements, sits in a sentry region of that spec (openspec/README.md
// § 2.2). The sentry prune must drop it with the region; read with the
// region kept, the same specs must cite the Sentry files, or the region
// would be holding nothing.
const APP_SPECS = [
  'openspec/specs/apps/mobile/spec.md',
  'openspec/specs/apps/web/spec.md'
]
const keepRegions = ({ text }) => text
const appSpecsCiting = ({ regions }) => [
  ...new Set(
    pruneRepository({ capabilityId: 'sentry', regions })
      .filter(
        ({ file, kind }) => kind === 'spec' && APP_SPECS.includes(file)
      )
      .map(({ file }) => file)
  )
]

test(
  'pruning sentry of this repository drops the Sentry part of each app spec with its region',
  { skip: skipUnless('sentry') },
  () => {
    assert.deepEqual(appSpecsCiting({ regions: dropRegions }), [])
    assert.deepEqual(
      appSpecsCiting({ regions: keepRegions }),
      APP_SPECS.filter((path) => existsSync(join(REPO_ROOT, path)))
    )
  }
)

// A project may keep Sentry and drop one app. The app's prune deletes the
// files the app claims or removes, its spec among them, and the manifest
// stops declaring it; a claim of the kept sentry capability on a spec must
// not be left matching nothing.
const APP_PRUNES = ['mobile-expo', 'web-next']
const SPEC_ROOT = 'openspec/specs/'

const prunedFiles = ({ capability }) => [
  ...capability.claims,
  ...(capability.onAbsent ?? [])
    .filter(({ verb }) => verb === 'remove')
    .flatMap(({ paths }) => paths)
]

const staleSentrySpecClaims = ({ capabilityId }) => {
  const capability = REPOSITORY_MANIFEST.capabilities.find(
    ({ id }) => id === capabilityId
  )
  const patterns = prunedFiles({ capability })
  const kept = listRepositoryFiles().filter(
    (path) => !matchesAny({ path, patterns })
  )
  const manifest = {
    ...REPOSITORY_MANIFEST,
    capabilities: REPOSITORY_MANIFEST.capabilities.filter(
      ({ id }) => id !== capabilityId
    )
  }
  return analyzeCoverage({ files: kept, manifest })
    .staleClaims.filter(
      ({ claim, owner }) =>
        owner === 'sentry' && claim.startsWith(SPEC_ROOT)
    )
    .map((stale) => ({ capabilityId, ...stale }))
}

test(
  'pruning mobile-expo or web-next of this repository leaves no sentry claim on a spec stale',
  { skip: skipUnless('sentry') },
  () => {
    const stale = APP_PRUNES.filter(declares).flatMap((capabilityId) =>
      staleSentrySpecClaims({ capabilityId })
    )

    assert.deepEqual(stale, [])
  }
)
