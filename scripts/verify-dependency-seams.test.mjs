#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-dependency-seams. Each case builds a throwaway tree in
// the OS temp directory (a registry, package.json files, sources and the
// allowlist) and drives the gate's own collector over it, so the walk, the
// parse and the detection local/dependency-seam runs are each part of the
// verdict. A case says which files ESLint lints the way the real ignore list
// does (the *.config.js and *.cjs configs are skipped); the checks then run
// the gate as a process, which asks ESLint itself, and re-run every case
// against a blinded gate.
//
// Usage:
//   node --test scripts/verify-dependency-seams.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  collectContext,
  FINDING_KIND,
  gate
} from './verify-dependency-seams.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-dependency-seams.mjs'
)
const FAILED = 1
const PASSED = 0

const REGISTRY = '.agents/contracts/dependencies.json'
const ALLOWLIST = 'eslint-dependency-seam-allowlist.json'
const TESTS = '{apps,packages}/*/**/__tests__/**'

const SCREEN = 'apps/web/src/screens/Home/Home.screen.tsx'
const SCHEMA = 'apps/web/src/validation/example.schema.ts'
const METRO = 'apps/mobile/metro.config.js'

const UNIT = 'F.8 unit 2: the i18n seam takes this import.'

const core = (name) => ({ category: 'core', name })
const zod = (seam = ['apps/*/src/validation/**']) => ({
  category: 'infra',
  name: 'zod',
  seam
})
const vitest = { category: 'build', name: 'vitest', seam: [TESTS] }
const nativewind = (seam) => ({
  category: 'infra',
  name: 'nativewind',
  seam
})

const BASE_ENTRIES = [core('react'), zod(), vitest]

const BASE_FILES = {
  'apps/web/package.json': JSON.stringify({
    dependencies: { react: '1', zod: '1' },
    name: '@app/web'
  }),
  'apps/web/src/test/setup.ts': "import { vi } from 'vitest'",
  'apps/web/src/validation/__tests__/example.schema.test.ts':
    "import { test } from 'vitest'\nimport { z } from 'zod'",
  'package.json': JSON.stringify({
    devDependencies: { vitest: '1' },
    name: 'root'
  }),
  [SCHEMA]: "import { z } from 'zod'",
  [SCREEN]: "import { useState } from 'react'"
}

const MOBILE_FILES = {
  'apps/mobile/package.json': JSON.stringify({
    dependencies: { nativewind: '1' },
    name: '@app/mobile'
  }),
  'apps/mobile/src/lib/theme/theme.config.ts':
    "import { colorScheme } from 'nativewind'",
  [METRO]: "const { withNativeWind } = require('nativewind/metro')"
}

const entry = ({ path = SCREEN, reason = UNIT, name = 'zod' } = {}) => ({
  package: name,
  path,
  reason
})

const text = (value) =>
  typeof value === 'string' ? value : JSON.stringify(value)

const treeOf = ({
  allowlist = [],
  entries = BASE_ENTRIES,
  files = {},
  registry
}) => ({
  ...BASE_FILES,
  ...files,
  [ALLOWLIST]: text(allowlist),
  [REGISTRY]: text(
    registry ?? {
      packages: entries,
      testInfrastructure: ['{apps,packages}/*/src/test/**']
    }
  )
})

// The files ESLint does not lint, as the ignore list of eslint.config.mjs
// spells them.
const UNLINTED = /(?:\.config\.(?:js|cjs|mjs)|\.cjs)$/u
const isLinted = (path) => !UNLINTED.test(path)

const walk =
  (tree = {}) =>
  () =>
    withScratchTree({
      files: treeOf(tree),
      prefix: 'dependency-seams-',
      use: ({ root }) => collectContext({ isLinted, root })
    })

const runGate = (tree) =>
  withScratchTree({
    files: treeOf(tree),
    prefix: 'dependency-seams-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const ZOD_IN_SCREEN = { [SCREEN]: "import { z } from 'zod'" }

export const CASES = [
  {
    context: walk(),
    expected: 0,
    name: 'a clean tree passes'
  },
  {
    context: walk({
      files: {
        'apps/web/package.json': JSON.stringify({
          dependencies: { 'left-pad': '1', react: '1', zod: '1' },
          name: '@app/web'
        })
      }
    }),
    expected: 1,
    name: 'a package.json dependency the registry does not name fails'
  },
  {
    context: walk({
      files: {
        'apps/web/package.json': JSON.stringify({
          dependencies: { react: '1', zod: '1' },
          name: '@app/web',
          optionalDependencies: { 'left-pad': '1' },
          peerDependencies: { 'is-odd': '1' }
        })
      }
    }),
    expected: 2,
    name: 'a dependency in any dependency field of a package.json is judged'
  },
  {
    context: walk({
      entries: [
        ...BASE_ENTRIES,
        { category: 'infra', name: 'left-pad', seam: [] }
      ]
    }),
    expected: 1,
    name: 'a registry entry for a package nothing declares is stale'
  },
  {
    context: walk({
      entries: [
        core('react'),
        vitest,
        { category: 'build', name: 'node:*', seam: [TESTS] }
      ],
      files: {
        'apps/web/package.json': JSON.stringify({
          dependencies: { react: '1' },
          name: '@app/web'
        }),
        'apps/web/src/validation/__tests__/example.schema.test.ts':
          "import { test } from 'vitest'\nimport { readFileSync } from 'node:fs'",
        [SCHEMA]: 'export const SCHEMA = 1'
      }
    }),
    expected: 0,
    name: 'the node:* entry is never stale: no package.json declares a builtin'
  },
  {
    context: walk({
      entries: [
        core('react'),
        zod(['apps/*/src/validation/**', 'apps/*/src/lib/store/**']),
        vitest
      ]
    }),
    expected: 1,
    name: 'a seam glob that matches no file fails'
  },
  {
    context: walk({
      entries: [
        ...BASE_ENTRIES,
        nativewind(['apps/mobile/src/lib/theme/**'])
      ],
      files: MOBILE_FILES
    }),
    expected: 1,
    name: 'a file ESLint does not lint that imports a package outside its seam fails'
  },
  {
    context: walk({
      entries: [
        ...BASE_ENTRIES,
        nativewind(['apps/mobile/src/lib/theme/**', METRO])
      ],
      files: MOBILE_FILES
    }),
    expected: 0,
    name: 'a config file inside its seam passes'
  },
  {
    context: walk({
      entries: [core('react'), { category: 'infra', name: 'zod' }, vitest]
    }),
    expected: 1,
    name: 'a non-core entry without a seam is malformed'
  },
  {
    context: walk({
      entries: [
        core('react'),
        { category: 'library', name: 'zod', seam: [] },
        vitest
      ]
    }),
    expected: 1,
    name: 'an entry with an unknown category is malformed'
  },
  {
    context: walk({ entries: [...BASE_ENTRIES, zod()] }),
    expected: 1,
    name: 'a registry that names one package twice is malformed'
  },
  {
    context: walk({
      entries: [{ ...core('react'), seam: [SCREEN] }, zod(), vitest]
    }),
    expected: 1,
    name: 'a core entry with a seam is malformed'
  },
  {
    context: walk({
      entries: [core('react'), { ...zod(), types: 'everywhere' }, vitest]
    }),
    expected: 1,
    name: 'an entry whose types are neither seam nor anywhere is malformed'
  },
  {
    context: walk({ registry: '{ "packages": [' }),
    expected: 1,
    name: 'a registry that is not JSON is refused, and nothing else is judged'
  },
  {
    context: walk({ allowlist: [entry()] }),
    expected: 1,
    name: 'an allowlist entry whose file no longer breaks the rule is stale'
  },
  {
    context: walk({ allowlist: [entry()], files: ZOD_IN_SCREEN }),
    expected: 0,
    name: 'an allowlist entry whose file still breaks the rule passes'
  },
  {
    context: walk({ files: ZOD_IN_SCREEN }),
    expected: 1,
    name: 'a violation the allowlist does not carry is named'
  },
  {
    context: walk({
      files: { [SCREEN]: "import leftPad from 'left-pad'" }
    }),
    expected: 1,
    name: 'an unregistered import is a violation the allowlist does not carry'
  },
  {
    context: walk({
      allowlist: [entry({ reason: 'cannot move yet' })],
      files: ZOD_IN_SCREEN
    }),
    expected: 2,
    name: 'an allowlist entry that names no F.8 unit is malformed'
  },
  {
    context: walk({
      allowlist: [entry({ reason: 'F.8 unit 9: the docs.' })],
      files: ZOD_IN_SCREEN
    }),
    expected: 2,
    name: 'an allowlist entry for unit 9 is malformed: units 2 to 8 move imports'
  },
  {
    context: walk({
      allowlist: [entry(), entry()],
      files: ZOD_IN_SCREEN
    }),
    expected: 1,
    name: 'a file and package listed twice is a duplicate'
  },
  {
    context: walk({ allowlist: '{ "path": "x" }' }),
    expected: 1,
    name: 'an allowlist that is not a JSON array is refused'
  }
]

const findingsOf = (tree) => gate.run(walk(tree)())

const checks = [
  {
    name: 'a stale finding names the file, the package and the remedy',
    run: () => {
      const [finding] = findingsOf({ allowlist: [entry()] })
      assert.equal(finding.kind, FINDING_KIND.allowlistStale)
      assert.equal(finding.path, SCREEN)
      assert.match(
        finding.detail,
        /Home\.screen\.tsx no longer imports zod/u
      )
      assert.match(
        finding.detail,
        /remove the entry, the list only shrinks/u
      )
    }
  },
  {
    name: 'an unlisted finding names the file, the package and the count',
    run: () => {
      const [finding] = findingsOf({
        files: { [SCREEN]: "import { z } from 'zod'\nvi.mock('zod')" }
      })
      assert.equal(finding.kind, FINDING_KIND.allowlistUnlisted)
      assert.match(
        finding.detail,
        /Home\.screen\.tsx imports zod outside its seam 2 time\(s\)/u
      )
    }
  },
  {
    name: 'an unregistered dependency names the package and its package.json',
    run: () => {
      const [finding] = findingsOf({
        files: {
          'apps/web/package.json': JSON.stringify({
            dependencies: { 'left-pad': '1', react: '1', zod: '1' },
            name: '@app/web'
          })
        }
      })
      assert.equal(finding.kind, FINDING_KIND.unregisteredDependency)
      assert.match(
        finding.detail,
        /apps\/web\/package\.json declares left-pad/u
      )
    }
  },
  {
    name: 'the gate exits 1 and prints the stale entry',
    run: () => {
      const result = runGate({ allowlist: [entry()] })
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(result.stderr, /verify-dependency-seams: 1 problem/u)
      assert.match(
        result.stderr,
        /Home\.screen\.tsx no longer imports zod/u
      )
    }
  },
  {
    name: 'the gate asks ESLint which files it does not lint',
    run: () => {
      const result = runGate({
        entries: [
          ...BASE_ENTRIES,
          nativewind(['apps/mobile/src/lib/theme/**'])
        ],
        files: MOBILE_FILES
      })
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(
        result.stderr,
        /apps\/mobile\/metro\.config\.js, which ESLint does not lint, imports nativewind/u
      )
    }
  },
  {
    name: 'the gate exits 0 over a clean tree and states what it judged',
    run: () => {
      const result = runGate({})
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        /PASS — 3 registry entries, 2 package\.json file\(s\), 5 file\(s\) under apps\/ and packages\/ with 4 source file\(s\) \(0 that ESLint does not lint\), 0 allowlist entries, 0 file-package pair\(s\) outside their seam/u
      )
    }
  },
  {
    name: 'every case fails against a blinded gate',
    run: () => {
      const failing = CASES.filter(({ expected }) => expected > 0)
      assert.equal(
        runCases({ cases: failing, gate: blindGate({ gate }) }).length,
        failing.length
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
