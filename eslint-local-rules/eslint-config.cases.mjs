// ---------------------------------------------------------------------------
// The cases of the ESLint config itself, run by ./index.test.mjs through
// `registerEslintConfigCases` (SEAM-09, SEAM-10).
//
// The fixture apps under __fixtures__/apps/, and the fixture package under
// __fixtures__/packages/, are linted through the config eslint.config.mjs
// builds, for the __fixtures__/ folder instead of the repository's: the
// config reads the workspaces of that folder, and every file is linted under
// the path it stands for, `apps/<fixture>/…` or `packages/<fixture>/…`.
// Nothing in the config names a fixture, so each one is judged exactly as a
// new app or package would be. The detection and load cases build scratch
// trees; the case of packages/tokens reads the repository's own config.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import { ESLint } from 'eslint'

import { createConfig } from '../eslint.config.mjs'
import { readFrameworks } from '../scripts/eslint-config.detect.mjs'
import { withScratchTree } from '../scripts/gate/scratch.mjs'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const FIXTURE_ROOT = fileURLToPath(
  new URL('__fixtures__/', import.meta.url)
)
const SCRATCH_PREFIX = 'eslint-config-'

const WARNING = 1
const ERROR = 2

const finding = ({ ruleId, severity }) => `${severity} ${ruleId}`

let fixtureLinter = null

const linter = () => {
  fixtureLinter ??= new ESLint({
    cwd: REPO_ROOT,
    overrideConfig: createConfig({ workspaceRoot: FIXTURE_ROOT }),
    overrideConfigFile: true
  })
  return fixtureLinter
}

// `[{ messages, path }]`: every message ESLint reports on each fixture
// path (`apps/<fixture>/…`, the file under __fixtures__/ of that path).
export const lintFixtureMessages = async ({ paths }) =>
  Promise.all(
    paths.map(async (path) => {
      const [result] = await linter().lintText(
        readFileSync(join(FIXTURE_ROOT, path), 'utf8'),
        { filePath: join(REPO_ROOT, path) }
      )
      return { messages: result.messages, path }
    })
  )

// `{ path: ['<severity> <rule>', …] }`, every message of each file, sorted;
// a parse error shows as `2 null`.
const lintFixture = async ({ paths }) =>
  Object.fromEntries(
    (await lintFixtureMessages({ paths })).map(({ messages, path }) => [
      path,
      messages.map(finding).sort()
    ])
  )

const inFixture = (path) => `apps/fixture/src/${path}`

// One case per rule family the fixture app inherits: each file breaks one
// family, and nothing else reports on it.
const FAMILY_CASES = [
  {
    expected: {
      [inFixture('helpers/greeting.helper.ts')]: [
        `${ERROR} @typescript-eslint/naming-convention`
      ]
    },
    name: 'a new app inherits the base rules'
  },
  {
    expected: {
      [inFixture('components/Card/Card.component.tsx')]: [
        `${ERROR} react/jsx-sort-props`
      ]
    },
    name: 'a new app that declares react inherits the React rules'
  },
  {
    expected: {
      [inFixture('components/ui/statusDot/StatusDot.component.tsx')]: [
        `${ERROR} check-file/folder-naming-convention`
      ],
      [inFixture('helpers/format.ts')]: [
        `${ERROR} check-file/filename-naming-convention`
      ]
    },
    name: 'a new app inherits the filename and folder rules'
  },
  {
    expected: {
      [inFixture('screens/Home/Home.style.ts')]: [
        `${ERROR} local/style-positions-only`,
        `${ERROR} local/style-token-values`
      ],
      [inFixture('screens/Home/homeVariants.helper.ts')]: [
        `${ERROR} local/dependency-seam`,
        `${ERROR} local/ui-kit-boundary`
      ]
    },
    name: 'a new app inherits the styling pillar'
  },
  {
    expected: {
      [inFixture('components/Counter/Counter.component.tsx')]: [
        `${ERROR} no-restricted-syntax`
      ]
    },
    name: 'a new app inherits the logic-in-hook rules'
  },
  {
    expected: {
      [inFixture('components/Badge/Badge.component.tsx')]: [
        `${ERROR} local/suffix-contract`
      ]
    },
    name: 'a new app inherits the suffix contract'
  }
]

// The same three files in each fixture app: a route under src/app/, an
// async screen, and a screen with an <img> and a dynamic process.env key.
const ROUTE = 'src/app/page.tsx'
const ASYNC_SCREEN = 'src/screens/Feed/Feed.screen.tsx'
const IMAGE_SCREEN = 'src/screens/Profile/Profile.screen.tsx'

const probes = ({ app, asyncScreen, image, route }) => ({
  [`apps/${app}/${ASYNC_SCREEN}`]: asyncScreen,
  [`apps/${app}/${IMAGE_SCREEN}`]: image,
  [`apps/${app}/${ROUTE}`]: route
})

const FRAMEWORK_CASES = [
  {
    expected: probes({
      app: 'fixture-next',
      asyncScreen: [],
      image: [`${WARNING} @next/next/no-img-element`],
      route: []
    }),
    name: 'an app that declares next gets the Next.js block'
  },
  {
    expected: probes({
      app: 'fixture-expo',
      asyncScreen: [`${ERROR} no-restricted-syntax`],
      image: [`${ERROR} expo/no-dynamic-env-var`],
      route: []
    }),
    name: 'an app that declares expo gets the Expo block'
  },
  {
    expected: probes({
      app: 'fixture',
      asyncScreen: [`${ERROR} no-restricted-syntax`],
      image: [],
      route: [`${ERROR} check-file/filename-naming-convention`]
    }),
    name: 'an app that declares neither next nor expo gets no framework block'
  }
]

// A package that declares react gets the React set, as an app does.
const PACKAGE_CASES = [
  {
    expected: {
      'packages/fixture-react/src/components/Card/Card.component.tsx': [
        `${ERROR} react/jsx-sort-props`
      ]
    },
    name: 'a package that declares react gets the React rules'
  }
]

const registerFixtureCases = () =>
  [...FAMILY_CASES, ...FRAMEWORK_CASES, ...PACKAGE_CASES].forEach(
    ({ expected, name }) =>
      test(name, async () => {
        assert.deepEqual(
          await lintFixture({ paths: Object.keys(expected) }),
          expected
        )
      })
  )

// The plugins of the React rule set, and whether a rule is one of theirs and
// on: eslint-config-prettier turns the React formatting rules off in every
// file, which reports nothing.
const REACT_PLUGIN_NAMES = ['jsx-a11y', 'react', 'react-hooks']
const OFF = new Set([0, 'off'])
const isReactRuleOn = ([rule, entry]) =>
  REACT_PLUGIN_NAMES.some((plugin) => rule.startsWith(`${plugin}/`)) &&
  !OFF.has(Array.isArray(entry) ? entry[0] : entry)

const registerTokensCase = () =>
  test('a package that declares no react, packages/tokens among them, gets the Node globals and no React rule', async () => {
    const config = await new ESLint({
      cwd: REPO_ROOT
    }).calculateConfigForFile(
      join(REPO_ROOT, 'packages/tokens/src/tokens.constant.ts')
    )
    const { globals, parserOptions } = config.languageOptions
    assert.deepEqual(
      {
        browser: Object.hasOwn(globals, 'window'),
        jsx: parserOptions?.ecmaFeatures?.jsx === true,
        node: Object.hasOwn(globals, 'process'),
        plugins: Object.keys(config.plugins).filter((name) =>
          REACT_PLUGIN_NAMES.includes(name)
        ),
        rules: Object.entries(config.rules)
          .filter(isReactRuleOn)
          .map(([rule]) => rule)
      },
      { browser: false, jsx: false, node: true, plugins: [], rules: [] }
    )
  })

const manifest = (fields) => JSON.stringify({ private: true, ...fields })

const registerDetectionCases = () => {
  test('a framework declared in any dependency field counts, and a folder with no package.json is no app', () => {
    assert.deepEqual(
      withScratchTree({
        files: {
          'apps/admin/package.json': manifest({
            devDependencies: { next: '1' },
            peerDependencies: { react: '1' }
          }),
          'apps/kiosk/package.json': manifest({
            optionalDependencies: { expo: '1' }
          }),
          'apps/notes/README.md': 'A folder with no package.json.',
          'apps/plain/package.json': manifest({
            dependencies: { zod: '1' }
          })
        },
        prefix: SCRATCH_PREFIX,
        use: ({ root }) => readFrameworks({ root })
      }),
      { expo: ['apps/kiosk'], next: ['apps/admin'], react: ['apps/admin'] }
    )
  })

  test('a package that declares react is listed under react, and never under next or expo', () => {
    assert.deepEqual(
      withScratchTree({
        files: {
          'apps/web/package.json': manifest({
            dependencies: { next: '1', react: '1' }
          }),
          'packages/plain/package.json': manifest({
            dependencies: { zod: '1' }
          }),
          'packages/ui/package.json': manifest({
            dependencies: { expo: '1', next: '1' },
            peerDependencies: { react: '1' }
          })
        },
        prefix: SCRATCH_PREFIX,
        use: ({ root }) => readFrameworks({ root })
      }),
      { expo: [], next: ['apps/web'], react: ['apps/web', 'packages/ui'] }
    )
  })

  test('an app package.json that cannot be parsed fails the config load, naming it', () => {
    withScratchTree({
      files: { 'apps/broken/package.json': '{' },
      prefix: SCRATCH_PREFIX,
      use: ({ root }) =>
        assert.throws(
          () => createConfig({ workspaceRoot: root }),
          /apps\/broken\/package\.json cannot be parsed/u
        )
    })
  })

  test('a package package.json that cannot be parsed fails the config load, naming it', () => {
    withScratchTree({
      files: { 'packages/broken/package.json': '{' },
      prefix: SCRATCH_PREFIX,
      use: ({ root }) =>
        assert.throws(
          () => createConfig({ workspaceRoot: root }),
          /packages\/broken\/package\.json cannot be parsed/u
        )
    })
  })

  test('an app package.json that is not a JSON object fails the config load, naming it', () => {
    withScratchTree({
      files: { 'apps/list/package.json': '[]' },
      prefix: SCRATCH_PREFIX,
      use: ({ root }) =>
        assert.throws(
          () => createConfig({ workspaceRoot: root }),
          /apps\/list\/package\.json is not a JSON object/u
        )
    })
  })
}

// The config and the rules it wires: a path under apps/ written with a
// name, a glob or a regular expression (`apps/web`, `apps\/(?:web|…)`).
const CONFIG_SOURCES = [
  'eslint.config.mjs',
  'eslint.rules.mjs',
  'scripts/eslint-config.detect.mjs',
  'eslint-local-rules/index.mjs',
  'eslint-local-rules/dependency-seam.detect.mjs',
  'eslint-local-rules/justifying-comment.detect.mjs',
  'eslint-local-rules/package-src-alias.detect.mjs',
  'eslint-local-rules/style-positioning.detect.mjs',
  'eslint-local-rules/suffix-contract.detect.mjs',
  'eslint-local-rules/ui-kit.detect.mjs'
]
const NAMED_APP_RE = /apps(?:\/|\\\/)(?:\(\?:)?[a-z]/u

const registerNamingCase = () =>
  test('no ESLint config or rule names an app', () => {
    const named = CONFIG_SOURCES.flatMap((path) =>
      readFileSync(join(REPO_ROOT, path), 'utf8')
        .split(/\r?\n/u)
        .flatMap((line, index) =>
          NAMED_APP_RE.test(line) ? [`${path}:${index + 1}`] : []
        )
    )
    assert.deepEqual(named, [])
  })

export const registerEslintConfigCases = () => {
  registerDetectionCases()
  registerFixtureCases()
  registerTokensCase()
  registerNamingCase()
}
