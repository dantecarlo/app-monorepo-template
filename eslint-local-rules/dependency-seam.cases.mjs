// ---------------------------------------------------------------------------
// The cases of local/dependency-seam (./dependency-seam.detect.mjs), run by
// ./index.test.mjs through `registerDependencySeamCases`.
//
// The rule cases lint paths of this repository with its real registry,
// `.agents/contracts/dependencies.json`, so each one judges the seams the
// apps live under. Their files do not exist, so no entry of the frozen
// allowlist can silence one. The detection cases build a registry of their
// own, for the parts of the format the real one does not use. The seam
// files of the fixture app are linted through the config eslint.config.mjs
// builds for __fixtures__/, as files of `apps/fixture/`
// (./eslint-config.cases.mjs): they sit under __fixtures__/ on disk, so no
// app is added to the workspace, and nothing in the config names them.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'

import { withScratchTree } from '../scripts/gate/scratch.mjs'
import {
  collectSeamViolations,
  DEPENDENCY_REGISTRY_FILE,
  indexRegistry,
  readSeamInputs,
  SEAM_ALLOWLIST_FILE,
  SEAM_FINDING
} from './dependency-seam.detect.mjs'
import { lintFixtureMessages } from './eslint-config.cases.mjs'
import localRules from './index.mjs'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const RULE_ID = 'local/dependency-seam'
const ERROR_SEVERITY = 2

const { OUTSIDE_SEAM, UNREGISTERED } = SEAM_FINDING

const at = ({ code, name, path }) => ({
  code,
  filename: join(REPO_ROOT, path),
  name
})

const refused = ({ code, kinds, name, path }) => ({
  ...at({ code, name, path }),
  errors: kinds.map((messageId) => ({ messageId }))
})

// The vendor SDKs the old no-restricted-imports patterns refused. They are
// spelled apart from any import text: the prune check of the sentry
// capability (packages/tooling/src/prune-boundary.mjs) reads every
// `from '…'` of the repository, strings included.
const SENTRY_SDK = ['@sentry', 'nextjs'].join('/')
const STRIPE_SDK = ['@stripe', 'stripe-js'].join('/')

// A sentry prune takes the SDK's registry entry, so the kind of its refusal
// follows the registry this repository carries: outside its seam while the
// registry names it, unregistered once a prune has taken it.
const SENTRY_KIND = indexRegistry({
  registry: readSeamInputs({ root: REPO_ROOT }).registry
}).entries.has(SENTRY_SDK)
  ? OUTSIDE_SEAM
  : UNREGISTERED

const WEB_SCREEN = 'apps/web/src/screens/Example/Example.screen.tsx'
const WEB_SCREEN_TEST =
  'apps/web/src/screens/Example/__tests__/Example.screen.test.tsx'

const RULE_CASES = {
  invalid: [
    refused({
      code: "import leftPad from 'left-pad'",
      kinds: [UNREGISTERED],
      name: 'a package the registry does not name is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "import { readFileSync } from 'node:fs'",
      kinds: [OUTSIDE_SEAM],
      name: 'a Node builtin outside its seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "import { z } from 'zod'",
      kinds: [OUTSIDE_SEAM],
      name: 'a registered package outside its seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "import type { QueryClient } from '@tanstack/react-query'",
      kinds: [OUTSIDE_SEAM],
      name: 'a type-only import outside the seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: [
        `import * as Sentry from '${SENTRY_SDK}'`,
        `import { loadStripe } from '${STRIPE_SDK}'`
      ].join('\n'),
      kinds: [SENTRY_KIND, UNREGISTERED],
      name: 'a vendor SDK the old import patterns refused is still refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "export const load = async () => await import('zod')",
      kinds: [OUTSIDE_SEAM],
      name: 'a dynamic import outside the seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: 'export const load = async () => await import(`zod`)',
      kinds: [OUTSIDE_SEAM],
      name: 'a dynamic import with a template literal outside the seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "const zod = require('zod')",
      kinds: [OUTSIDE_SEAM],
      name: 'a require outside the seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "import zod = require('zod')",
      kinds: [OUTSIDE_SEAM],
      name: 'an import-equals require outside the seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "type Schema = import('zod').ZodType",
      kinds: [OUTSIDE_SEAM],
      name: 'an import() type outside the seam is refused',
      path: WEB_SCREEN
    }),
    refused({
      code: "vi.mock('zod')",
      kinds: [OUTSIDE_SEAM],
      name: 'a vi.mock of a package outside its seam is refused',
      path: WEB_SCREEN_TEST
    }),
    refused({
      code: "export { z } from 'zod'",
      kinds: [OUTSIDE_SEAM],
      name: 'a re-export outside the seam is refused',
      path: 'apps/web/src/screens/Example/index.ts'
    }),
    refused({
      code: "export * from 'zod'",
      kinds: [OUTSIDE_SEAM],
      name: 'an export-all re-export outside the seam is refused',
      path: 'apps/web/src/screens/Example/index.ts'
    }),
    refused({
      code: "import { useRouter } from 'next/navigation'",
      kinds: [OUTSIDE_SEAM],
      name: 'a subpath entry wins over its package',
      path: WEB_SCREEN
    }),
    refused({
      code: "import { QueryClient } from '@tanstack/react-query'",
      kinds: [OUTSIDE_SEAM],
      name: 'a test of a unit outside the seam is refused',
      path: WEB_SCREEN_TEST
    }),
    refused({
      code: "import leftPad from 'left-pad'",
      kinds: [UNREGISTERED],
      name: 'an unregistered package is refused in test infrastructure too',
      path: 'apps/web/src/test/example.helper.ts'
    })
  ],
  valid: [
    at({
      code: "import { z } from 'zod'",
      name: 'a registered package inside its seam passes',
      path: 'apps/web/src/validation/example.schema.ts'
    }),
    at({
      code: "import { useState } from 'react'\nimport { AppError } from '@app/core'",
      name: 'a core package passes anywhere',
      path: WEB_SCREEN
    }),
    at({
      code: "import { x } from './x'\nimport { y } from '../y'\nimport { z } from '@/lib/z'\nimport { w } from '#src/w'",
      name: 'a path of the project is never judged as a package',
      path: WEB_SCREEN
    }),
    at({
      code: "import { NextResponse } from 'next/server'",
      name: "a subpath with no entry of its own takes its package's",
      path: 'apps/web/src/app/api/example/route.ts'
    }),
    at({
      code: "import { QueryClient } from '@tanstack/react-query'\nvi.mock('@tanstack/react-query')",
      name: 'a test inherits the seam of the unit it tests',
      path: 'apps/web/src/lib/query/__tests__/useExample.hook.test.ts'
    }),
    at({
      code: "import { create } from 'zustand'",
      name: 'test infrastructure under src/test passes any registered package',
      path: 'apps/web/src/test/example.helper.ts'
    }),
    at({
      code: "import { colorScheme } from 'nativewind'",
      name: 'a file outside apps and packages is not judged',
      path: 'scripts/verify-dependency-seams.mjs'
    })
  ]
}

// A registry and a file of the detection's own, for what the real
// registry does not use.
const SCREEN = 'apps/web/src/screens/X/X.screen.tsx'

const parse = ({ code }) =>
  tseslint.parser.parseForESLint(code, {
    ecmaVersion: 'latest',
    filePath: SCREEN,
    loc: true,
    range: true,
    sourceType: 'module'
  }).ast

const findingsOf = ({ allowlist, code, registry }) =>
  collectSeamViolations({
    allowlist,
    index: indexRegistry({ registry }),
    path: SCREEN,
    program: parse({ code })
  }).map(({ kind, package: name }) => `${kind} ${name}`)

const detect = ({ allowlist = [], code, entries }) =>
  findingsOf({
    allowlist,
    code,
    registry: { packages: entries, testInfrastructure: [] }
  })

const VALIDATION_SEAM = ['apps/*/src/validation/**']

const registerDetectionCases = () =>
  describe('dependency seam detection', () => {
    test('an allowlisted file and package pair is not reported', () => {
      assert.deepEqual(
        detect({
          allowlist: [{ package: 'zod', path: SCREEN, reason: 'r' }],
          code: "import { z } from 'zod'\nimport { create } from 'zustand'",
          entries: [
            { category: 'infra', name: 'zod', seam: VALIDATION_SEAM },
            { category: 'infra', name: 'zustand', seam: [] }
          ]
        }),
        [`${OUTSIDE_SEAM} zustand`]
      )
    })

    test('an entry whose types are anywhere admits a type-only import outside its seam', () => {
      assert.deepEqual(
        detect({
          code: "import type { ZodType } from 'zod'\nimport { type ZodSchema } from 'zod'\nimport { z } from 'zod'",
          entries: [
            {
              category: 'infra',
              name: 'zod',
              seam: VALIDATION_SEAM,
              types: 'anywhere'
            }
          ]
        }),
        [`${OUTSIDE_SEAM} zod`]
      )
    })

    test('a registry the rule cannot read leaves every package unregistered', () => {
      withScratchTree({
        files: {
          [DEPENDENCY_REGISTRY_FILE]: '{ "packages": [',
          [SEAM_ALLOWLIST_FILE]: '{'
        },
        prefix: 'dependency-seam-inputs-',
        use: ({ root }) => {
          const inputs = readSeamInputs({ root })
          assert.deepEqual(inputs, { allowlist: [], registry: null })
          assert.deepEqual(
            findingsOf({
              ...inputs,
              code: "import { useState } from 'react'"
            }),
            [`${UNREGISTERED} react`]
          )
        }
      })
    })
  })

// The seam files of the fixture app, linted as the paths they stand for.
const SEAM_FIXTURE = [
  'apps/fixture/src/helpers/outside.helper.ts',
  'apps/fixture/src/lib/query/createQueryClient.helper.ts',
  'apps/fixture/src/validation/example.schema.ts'
]

const lintFixture = async () =>
  (await lintFixtureMessages({ paths: SEAM_FIXTURE })).map(
    ({ messages, path }) => ({
      fatal: messages.filter(({ fatal }) => fatal).length,
      path,
      seam: messages
        .filter(({ ruleId }) => ruleId === RULE_ID)
        .map(({ messageId, severity }) => `${severity} ${messageId}`)
    })
  )

const registerFixtureCase = () =>
  test('a new app under apps/ inherits the rule with no config change', async () => {
    assert.deepEqual(await lintFixture(), [
      {
        fatal: 0,
        path: 'apps/fixture/src/helpers/outside.helper.ts',
        seam: [
          `${ERROR_SEVERITY} ${UNREGISTERED}`,
          `${ERROR_SEVERITY} ${OUTSIDE_SEAM}`
        ]
      },
      {
        fatal: 0,
        path: 'apps/fixture/src/lib/query/createQueryClient.helper.ts',
        seam: []
      },
      {
        fatal: 0,
        path: 'apps/fixture/src/validation/example.schema.ts',
        seam: []
      }
    ])
  })

export const registerDependencySeamCases = () => {
  RuleTester.describe = describe
  RuleTester.it = test
  new RuleTester({
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tseslint.parser,
      sourceType: 'module'
    }
  }).run(
    'dependency-seam',
    localRules.rules['dependency-seam'],
    RULE_CASES
  )
  registerDetectionCases()
  registerFixtureCase()
}
