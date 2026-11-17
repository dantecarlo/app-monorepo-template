import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import { gitFreeEnv } from '../../../../scripts/git-free-env.mjs'
import { matchesAny } from '../../../../scripts/manifest.mjs'
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
    matches: matchesAny,
    readText: ({ path }) => files[path]
  })

const appJson = ({ plugins }) => JSON.stringify({ expo: { plugins } })

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

test('pruning the sentry capability of this repository leaves no dangling reference', () => {
  const manifest = JSON.parse(
    readFileSync(join(REPO_ROOT, 'template.manifest.json'), 'utf8')
  )

  assert.deepEqual(
    findPruneLeaks({
      capabilityId: 'sentry',
      files: listRepositoryFiles(),
      manifest,
      matches: matchesAny,
      readText: ({ path }) => readFileSync(join(REPO_ROOT, path), 'utf8')
    }),
    []
  )
})
