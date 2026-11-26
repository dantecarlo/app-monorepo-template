// ---------------------------------------------------------------------------
// The cases of local/wrapped-import (./wrapped-import.detect.mjs), run by
// ./index.test.mjs through `registerWrappedImportCases`.
//
// The rule cases lint paths of this repository's mobile app, each judged by
// the ui blocks of a scratch tree of their own (Text, Modal, Button,
// StatusBar), passed as the rule's workspaceRoot, and by the
// test-infrastructure globs of the real registry, so a mobile-expo prune
// leaves them nothing to read. Their files do not exist; only the folders
// they would sit in are read. The detection case
// builds a scratch tree for blocks the app does not have, and the fixture
// case lints the fixture app `__fixtures__/apps/fixture-expo/` through the
// config eslint.config.mjs builds for __fixtures__/ (./eslint-config.cases.mjs).
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, describe, test } from 'node:test'

import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'

import { withScratchTree } from '../scripts/gate/scratch.mjs'
import { lintFixtureMessages } from './eslint-config.cases.mjs'
import localRules from './index.mjs'
import {
  collectWrappedViolations,
  createUiBlockReader,
  WRAPPED_FINDING
} from './wrapped-import.detect.mjs'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const RULE_ID = 'local/wrapped-import'
const ERROR_SEVERITY = 2

const { HOOK_OUTSIDE_ROUTING, PRIMITIVE_OUTSIDE_BLOCK, WHOLE_MODULE } =
  WRAPPED_FINDING

// The ui blocks the rule cases are judged by, under the app the cases lint.
const RULE_CASE_BLOCKS = ['Button', 'Modal', 'StatusBar', 'Text']
const MOBILE = 'apps/mobile/src'
const BLOCKS_ROOT = mkdtempSync(join(tmpdir(), 'wrapped-import-blocks-'))
RULE_CASE_BLOCKS.forEach((block) =>
  mkdirSync(join(BLOCKS_ROOT, MOBILE, 'components/ui', block), {
    recursive: true
  })
)
after(() => rmSync(BLOCKS_ROOT, { recursive: true }))

const at = ({ code, name, path }) => ({
  code,
  filename: join(REPO_ROOT, path),
  name,
  options: [{ workspaceRoot: BLOCKS_ROOT }]
})

const refused = ({ code, kinds, name, path }) => ({
  ...at({ code, name, path }),
  errors: kinds.map((messageId) => ({ messageId }))
})

const SCREEN = `${MOBILE}/screens/Example/Example.screen.tsx`
const SCREEN_HOOK = `${MOBILE}/screens/Example/hooks/useExample.hook.ts`
const SCREEN_TEST = `${MOBILE}/screens/Example/__tests__/Example.screen.test.tsx`
const ROUTING_HOOK = `${MOBILE}/lib/routing/useAppRouter.hook.ts`

const RULE_CASES = {
  invalid: [
    refused({
      code: "import { Text } from 'react-native'",
      kinds: [PRIMITIVE_OUTSIDE_BLOCK],
      name: 'a primitive a ui block is named after is refused outside that block',
      path: `${MOBILE}/components/ui/Button/Button.component.tsx`
    }),
    refused({
      code: "import { Button, Modal, StatusBar } from 'react-native'",
      kinds: [
        PRIMITIVE_OUTSIDE_BLOCK,
        PRIMITIVE_OUTSIDE_BLOCK,
        PRIMITIVE_OUTSIDE_BLOCK
      ],
      name: 'every primitive a ui block is named after is wrapped, the blocks that stand in for one included',
      path: SCREEN
    }),
    refused({
      code: "import { type Text } from 'react-native'",
      kinds: [PRIMITIVE_OUTSIDE_BLOCK],
      name: 'a type-only import of a wrapped primitive is refused outside its block',
      path: SCREEN
    }),
    refused({
      code: "import { Text as Label } from 'react-native'",
      kinds: [PRIMITIVE_OUTSIDE_BLOCK],
      name: 'a wrapped primitive is judged by the name it is exported under',
      path: SCREEN
    }),
    refused({
      code: "import { useRouter } from 'expo-router'",
      kinds: [HOOK_OUTSIDE_ROUTING],
      name: 'an expo-router hook is refused outside lib/routing',
      path: SCREEN_HOOK
    }),
    refused({
      code: "import { router } from 'expo-router'",
      kinds: [HOOK_OUTSIDE_ROUTING],
      name: 'the router object of expo-router is refused outside lib/routing',
      path: SCREEN_HOOK
    }),
    refused({
      code: "export { Text } from 'react-native'",
      kinds: [PRIMITIVE_OUTSIDE_BLOCK],
      name: 'a re-export of a wrapped name is refused outside its seam',
      path: `${MOBILE}/components/index.ts`
    }),
    refused({
      code: [
        "vi.mock('react-native', () => ({ Text: () => null }))",
        "vi.mock('expo-router', async (importOriginal) => ({ ...(await importOriginal()), useRouter: () => ({}) }))"
      ].join('\n'),
      kinds: [PRIMITIVE_OUTSIDE_BLOCK, HOOK_OUTSIDE_ROUTING],
      name: 'a vi.mock that replaces a wrapped name is refused outside its seam',
      path: SCREEN_TEST
    }),
    refused({
      code: [
        "import * as Native from 'react-native'",
        "export * from 'expo-router'",
        "vi.mock('expo-router')",
        "const router = require('expo-router')",
        "const load = () => import('react-native')"
      ].join('\n'),
      kinds: [
        WHOLE_MODULE,
        WHOLE_MODULE,
        WHOLE_MODULE,
        WHOLE_MODULE,
        WHOLE_MODULE
      ],
      name: 'a reach of the whole module is refused',
      path: SCREEN_TEST
    }),
    refused({
      code: [
        "const { Text } = await import('react-native')",
        "const { useRouter } = require('expo-router')",
        "const back = (await import('expo-router')).router"
      ].join('\n'),
      kinds: [
        PRIMITIVE_OUTSIDE_BLOCK,
        HOOK_OUTSIDE_ROUTING,
        HOOK_OUTSIDE_ROUTING
      ],
      name: 'a dynamic import or a require read by name is judged by those names',
      path: SCREEN_TEST
    }),
    refused({
      code: "import { Text } from 'react-native'",
      kinds: [PRIMITIVE_OUTSIDE_BLOCK],
      name: 'a test outside the block is refused like the unit it tests',
      path: `${MOBILE}/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx`
    })
  ],
  valid: [
    at({
      code: "import { Text as NativeText } from 'react-native'",
      name: 'a primitive passes inside the block named after it',
      path: `${MOBILE}/components/ui/Text/Text.component.tsx`
    }),
    at({
      code: "import { Pressable, ScrollView, View } from 'react-native'",
      name: 'a primitive no ui block is named after passes anywhere',
      path: SCREEN
    }),
    at({
      code: "import { useLocalSearchParams, useRouter } from 'expo-router'",
      name: 'an expo-router hook passes inside lib/routing',
      path: ROUTING_HOOK
    }),
    at({
      code: "import { Link, Redirect, Slot, Stack, Tabs } from 'expo-router'\nimport type { ErrorBoundaryProps } from 'expo-router'",
      name: 'an expo-router layout component or type passes anywhere',
      path: `${MOBILE}/app/_layout.tsx`
    }),
    at({
      code: "const { Appearance } = await import('react-native')",
      name: 'a dynamic import read only for names no wrapper owns passes',
      path: `${MOBILE}/lib/theme/__tests__/theme.config.test.ts`
    }),
    at({
      code: "vi.mock('expo-router', () => ({ Stack: () => 'routes' }))",
      name: 'a vi.mock that replaces only names no wrapper owns passes',
      path: `${MOBILE}/app/__tests__/layout.route.test.tsx`
    }),
    at({
      code: "import { Text } from 'react-native'\nimport { useRouter } from 'expo-router'",
      name: 'test infrastructure under src/test passes any wrapped name',
      path: `${MOBILE}/test/example.helper.tsx`
    }),
    at({
      code: "import { Text } from 'react-native'",
      name: 'a file outside apps and packages is not judged',
      path: 'scripts/example.mjs'
    })
  ]
}

const parse = ({ code, path }) =>
  tseslint.parser.parseForESLint(code, {
    ecmaVersion: 'latest',
    filePath: path,
    loc: true,
    range: true,
    sourceType: 'module'
  }).ast

const registerDetectionCases = () =>
  describe('wrapped import detection', () => {
    test("a block added to an app's ui folder wraps its primitive in that app only", () => {
      const code = "import { Switch } from 'react-native'"
      withScratchTree({
        files: {
          'apps/a/src/components/ui/Switch/Switch.component.tsx': '',
          'apps/b/src/screens/X/X.screen.tsx': ''
        },
        prefix: 'wrapped-import-',
        use: ({ root }) => {
          const blocksOf = createUiBlockReader({ root })
          const judge = (path) =>
            collectWrappedViolations({
              blocksOf,
              path,
              program: parse({ code, path })
            }).map(({ kind, name, owner }) => `${kind} ${name} ${owner}`)
          assert.deepEqual(judge('apps/a/src/screens/X/X.screen.tsx'), [
            `${PRIMITIVE_OUTSIDE_BLOCK} Switch Switch`
          ])
          assert.deepEqual(judge('apps/b/src/screens/X/X.screen.tsx'), [])
        }
      })
    })
  })

// The files of the fixture app, linted as the paths they stand for.
const FIXTURE = 'apps/fixture-expo/src'
const WRAPPED_FIXTURE = [
  `${FIXTURE}/components/ui/Text/Text.component.tsx`,
  `${FIXTURE}/lib/routing/useBack.hook.ts`,
  `${FIXTURE}/screens/Inbox/Inbox.screen.tsx`
]

const registerFixtureCase = () =>
  test('a new app under apps/ inherits the rule with its own ui blocks and lib/routing', async () => {
    const linted = await lintFixtureMessages({ paths: WRAPPED_FIXTURE })
    assert.deepEqual(
      linted.map(({ messages, path }) => ({
        fatal: messages.filter(({ fatal }) => fatal).length,
        path,
        wrapped: messages
          .filter(({ ruleId }) => ruleId === RULE_ID)
          .map(({ messageId, severity }) => `${severity} ${messageId}`)
      })),
      [
        { fatal: 0, path: WRAPPED_FIXTURE[0], wrapped: [] },
        { fatal: 0, path: WRAPPED_FIXTURE[1], wrapped: [] },
        {
          fatal: 0,
          path: WRAPPED_FIXTURE[2],
          wrapped: [
            `${ERROR_SEVERITY} ${HOOK_OUTSIDE_ROUTING}`,
            `${ERROR_SEVERITY} ${PRIMITIVE_OUTSIDE_BLOCK}`
          ]
        }
      ]
    )
  })

export const registerWrappedImportCases = () => {
  RuleTester.describe = describe
  RuleTester.it = test
  new RuleTester({
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tseslint.parser,
      sourceType: 'module'
    }
  }).run('wrapped-import', localRules.rules['wrapped-import'], RULE_CASES)
  registerDetectionCases()
  registerFixtureCase()
}
