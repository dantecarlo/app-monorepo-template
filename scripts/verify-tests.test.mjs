#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-tests. The template's tree holds no misplaced test, so
// these cases are the only evidence the gate can go red: each plants one
// violation of the rule, or one correct placement, in a throwaway tree in the
// OS temp directory and drives the gate's own collector over it, so the walk,
// the workspace and route-tree discovery and the verdict are each part of it.
//
// The checks then read the findings a codemod relies on (the destination of a
// test it can place), run the gate as a process over a planted violation and
// over a clean tree, and re-run every failing case against a blinded gate.
//
// Usage:
//   node --test scripts/verify-tests.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { collectContext, FINDING_KIND, gate } from './verify-tests.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-tests.mjs'
)
const FAILED = 1
const PASSED = 0

const UNIT = 'export const unit = 1\n'
const TEST = "test('a case', () => {})\n"

const WEB_PACKAGE = 'apps/web/package.json'
const MOBILE_PACKAGE = 'apps/mobile/package.json'
const WEB_MANIFEST = JSON.stringify({ name: '@app/web' })
const MOBILE_MANIFEST = JSON.stringify({
  dependencies: { expo: '*', 'expo-router': '*' },
  name: '@app/mobile'
})

const HELPER = 'apps/web/src/lib/query/createQueryClient.helper.ts'
const HELPER_OWN =
  'apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts'
const HELPER_BESIDE =
  'apps/web/src/lib/query/createQueryClient.helper.test.ts'
const HELPER_HIGHER =
  'apps/web/src/lib/__tests__/createQueryClient.helper.test.ts'
const HELPER_NO_UNIT = 'apps/web/src/lib/query/__tests__/parity.test.ts'
const HELPER_NESTED =
  'apps/web/src/lib/query/__tests__/__tests__/createQueryClient.helper.test.ts'

const COMPONENT = 'apps/web/src/components/ui/Chip/Chip.component.tsx'
const COMPONENT_OWN =
  'apps/web/src/components/ui/Chip/__tests__/Chip.component.test.tsx'

const MOBILE_COMPONENT =
  'apps/mobile/src/components/ui/Chip/Chip.component.tsx'
const MOBILE_HOOK = 'apps/mobile/src/hooks/useSession.hook.ts'
const MOBILE_SERVICE = 'apps/mobile/src/services/Items/items.service.ts'

const ROUTE_LAYOUT = 'apps/mobile/src/app/_layout.tsx'
const ROUTE_INDEX = 'apps/mobile/src/app/index.tsx'
const ROUTE_LOGIN = 'apps/mobile/src/app/login.tsx'
const NESTED_LAYOUT = 'apps/mobile/src/app/(auth)/_layout.tsx'

// `manifests` adds or replaces a package.json, by path, beside the two apps.
const tree = ({ files, manifests = {} }) =>
  Object.fromEntries([
    [WEB_PACKAGE, WEB_MANIFEST],
    [MOBILE_PACKAGE, MOBILE_MANIFEST],
    ...Object.entries(manifests),
    ...files.map((path) => [path, path.includes('.test.') ? TEST : UNIT])
  ])

const walk =
  ({ files, frozen = [], manifests }) =>
  () =>
    withScratchTree({
      files: tree({ files, manifests }),
      prefix: 'verify-tests-',
      use: ({ root }) => collectContext({ frozen, root })
    })

const runGate = ({ files, manifests }) =>
  withScratchTree({
    files: tree({ files, manifests }),
    prefix: 'verify-tests-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const frozenEntry = ({ path, reason = 'its unit cannot move yet' }) => ({
  path,
  reason
})

export const CASES = [
  {
    context: walk({ files: [HELPER, HELPER_OWN] }),
    expected: 0,
    name: "a test in its own unit's __tests__/, named after the unit, passes"
  },
  {
    context: walk({ files: [HELPER, HELPER_BESIDE] }),
    expected: 1,
    name: 'a test beside its unit is misplaced'
  },
  {
    context: walk({ files: [HELPER, HELPER_HIGHER] }),
    expected: 2,
    name: 'a test in a higher __tests__/ is misplaced, and its unit has no test'
  },
  {
    context: walk({ files: [HELPER, HELPER_OWN, HELPER_NO_UNIT] }),
    expected: 1,
    name: 'a test whose stem names no unit of its folder is misplaced'
  },
  {
    context: walk({ files: [HELPER, HELPER_OWN, HELPER_NESTED] }),
    expected: 1,
    name: 'a __tests__/ inside another __tests__/ is refused'
  },
  {
    context: walk({
      files: [
        'packages/core/src/index.ts',
        'packages/core/src/__tests__/index.test.ts',
        'apps/web/src/app/layout.tsx',
        'apps/web/src/app/__tests__/layout.test.tsx'
      ]
    }),
    expected: 0,
    name: 'an index file and a web route file count as units'
  },
  {
    context: walk({
      files: [
        ROUTE_LAYOUT,
        ROUTE_INDEX,
        ROUTE_LOGIN,
        NESTED_LAYOUT,
        'apps/mobile/src/app/__tests__/layout.route.test.tsx',
        'apps/mobile/src/app/__tests__/index.route.test.tsx',
        'apps/mobile/src/app/__tests__/login.route.test.tsx',
        'apps/mobile/src/app/(auth)/__tests__/layout.route.test.tsx'
      ]
    }),
    expected: 0,
    name: 'an Expo Router route test is named <route>.route after its route file'
  },
  {
    context: walk({
      files: [
        ROUTE_LAYOUT,
        'apps/mobile/src/app/__tests__/_layout.test.tsx'
      ]
    }),
    expected: 1,
    name: 'an Expo Router route test named after its file, without .route, is misplaced'
  },
  {
    context: walk({
      files: [
        ROUTE_INDEX,
        'apps/mobile/src/app/__tests__/home.route.test.tsx'
      ]
    }),
    expected: 1,
    name: 'a route test that names no route file is misplaced'
  },
  {
    context: walk({
      files: [
        HELPER,
        HELPER_OWN,
        'apps/web/src/test/test.helper.ts',
        'apps/web/src/test/server.test.ts',
        'apps/web/src/lib/query/__mocks__/createQueryClient.test.ts'
      ]
    }),
    expected: 0,
    name: 'shared test infrastructure and __mocks__/ are not judged'
  },
  {
    context: walk({
      files: [
        'apps/web/next.config.ts',
        'apps/web/__tests__/next.config.test.ts'
      ]
    }),
    expected: 0,
    name: 'a unit outside src is tested from the __tests__/ of its own folder'
  },
  {
    context: walk({
      files: ['apps/web/next.config.ts', 'apps/web/next.config.test.ts']
    }),
    expected: 1,
    name: 'a test beside a unit outside src is misplaced'
  },
  {
    context: walk({
      files: [
        'packages/tooling/src/process-tree.mjs',
        'packages/tooling/src/process-tree.test.mjs'
      ]
    }),
    expected: 1,
    name: 'a .test.mjs beside its unit in a package is misplaced'
  },
  {
    context: walk({
      files: [
        HELPER,
        HELPER_OWN,
        'apps/web/.next/server/chunk.test.ts',
        'apps/web/node_modules/pkg/index.test.ts'
      ]
    }),
    expected: 0,
    name: 'build output and node_modules are not walked'
  },
  {
    context: walk({ files: [HELPER] }),
    expected: 1,
    name: 'a unit with no test is reported'
  },
  {
    context: walk({ files: [COMPONENT, COMPONENT_OWN] }),
    expected: 0,
    name: "a web component is satisfied by its own __tests__/'s test"
  },
  {
    context: walk({ files: [MOBILE_COMPONENT, MOBILE_HOOK] }),
    expected: 0,
    name: 'a mobile component and hook stay exempt from the presence check'
  },
  {
    context: walk({ files: [MOBILE_SERVICE] }),
    expected: 1,
    name: 'a mobile service still needs a test'
  },
  {
    context: walk({
      files: [
        'apps/kiosk/src/components/ui/Chip/Chip.component.tsx',
        'apps/kiosk/src/hooks/useScan.hook.ts'
      ],
      manifests: {
        'apps/kiosk/package.json': JSON.stringify({
          dependencies: { expo: '*' },
          name: '@app/kiosk'
        })
      }
    }),
    expected: 0,
    name: 'the components and hooks of any app that declares expo stay exempt'
  },
  {
    context: walk({
      files: ['packages/core/src/utils/scrubPII.helper.ts']
    }),
    expected: 0,
    name: 'the presence check judges the apps only'
  },
  {
    context: walk({
      files: [HELPER, HELPER_BESIDE],
      frozen: [frozenEntry({ path: HELPER_BESIDE })]
    }),
    expected: 0,
    name: 'a frozen entry exempts the misplaced test it names'
  },
  {
    context: walk({
      files: [HELPER, HELPER_OWN],
      frozen: [frozenEntry({ path: HELPER_OWN })]
    }),
    expected: 1,
    name: 'a frozen entry whose test sits correctly is stale'
  },
  {
    context: walk({
      files: [HELPER, HELPER_OWN],
      frozen: [frozenEntry({ path: HELPER_BESIDE })]
    }),
    expected: 1,
    name: 'a frozen entry whose test is gone is stale'
  },
  {
    context: walk({
      files: [HELPER, HELPER_BESIDE],
      frozen: [frozenEntry({ path: HELPER_BESIDE, reason: ' ' })]
    }),
    expected: 2,
    name: 'a frozen entry without a reason is refused and exempts nothing'
  }
]

const findingsOf = ({ files, frozen }) =>
  gate.run(walk({ files, frozen })())

const checks = [
  {
    name: 'a test beside its unit is told the __tests__/ path it moves to',
    run: () => {
      const [finding] = findingsOf({ files: [HELPER, HELPER_BESIDE] })
      assert.equal(finding.kind, FINDING_KIND.beside)
      assert.equal(finding.path, HELPER_BESIDE)
      assert.equal(finding.target, HELPER_OWN)
      assert.match(finding.detail, /sits beside its unit/u)
    }
  },
  {
    name: 'a test in a higher __tests__/ is told the folder that holds its unit',
    run: () => {
      const [finding] = findingsOf({
        files: [HELPER, HELPER_HIGHER]
      }).filter(({ kind }) => kind === FINDING_KIND.higher)
      assert.equal(finding.path, HELPER_HIGHER)
      assert.equal(finding.target, HELPER_OWN)
      assert.match(finding.detail, /apps\/web\/src\/lib\/query/u)
    }
  },
  {
    name: 'an Expo Router route test without .route is told its route name',
    run: () => {
      const [finding] = findingsOf({
        files: [
          ROUTE_LAYOUT,
          'apps/mobile/src/app/__tests__/_layout.test.tsx'
        ]
      })
      assert.equal(finding.kind, FINDING_KIND.noUnit)
      assert.equal(
        finding.target,
        'apps/mobile/src/app/__tests__/layout.route.test.tsx'
      )
    }
  },
  {
    name: 'a route test beside its route file moves under its .route name',
    run: () => {
      const [finding] = findingsOf({
        files: [ROUTE_LOGIN, 'apps/mobile/src/app/login.test.tsx']
      })
      assert.equal(finding.kind, FINDING_KIND.beside)
      assert.equal(
        finding.target,
        'apps/mobile/src/app/__tests__/login.route.test.tsx'
      )
    }
  },
  {
    name: 'a test that names no unit has no destination',
    run: () => {
      const [finding] = findingsOf({
        files: [HELPER, HELPER_OWN, HELPER_NO_UNIT]
      })
      assert.equal(finding.kind, FINDING_KIND.noUnit)
      assert.equal(finding.target, null)
      assert.match(finding.detail, /names no unit/u)
    }
  },
  {
    name: 'a unit with no test names the test path it needs',
    run: () => {
      const [finding] = findingsOf({ files: [HELPER] })
      assert.equal(finding.kind, FINDING_KIND.missing)
      assert.match(
        finding.detail,
        /lib\/query\/__tests__\/createQueryClient\.helper\.test\.\*/u
      )
    }
  },
  {
    name: 'the gate exits 1 and prints the misplaced test',
    run: () => {
      const result = runGate({ files: [HELPER, HELPER_BESIDE] })
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(result.stderr, /verify-tests: 1 problem/u)
      assert.match(
        result.stderr,
        /createQueryClient\.helper\.test\.ts sits beside its unit/u
      )
    }
  },
  {
    name: 'an app package.json that cannot be parsed fails the gate, naming it',
    run: () => {
      const result = runGate({
        files: [HELPER, HELPER_OWN],
        manifests: { 'apps/broken/package.json': '{' }
      })
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(
        result.stderr,
        /^verify-tests: apps\/broken\/package\.json cannot be parsed: /u
      )
    }
  },
  {
    name: 'the gate exits 0 over a clean tree and states what it judged',
    run: () => {
      const result = runGate({ files: [HELPER, HELPER_OWN] })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        /PASS — 1 test file\(s\) and 1 unit\(s\) that need one, across 2 workspace\(s\), 0 frozen exception\(s\)/u
      )
    }
  },
  {
    name: 'every failing case fails against a blinded gate',
    run: () => {
      const failing = CASES.filter(({ expected }) => expected > 0)
      const failures = runCases({
        cases: failing,
        gate: blindGate({ gate })
      })
      assert.equal(failures.length, failing.length)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
