// @ts-check
import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import checkFile from 'eslint-plugin-check-file'
import expoPlugin from 'eslint-plugin-expo'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import nextPlugin from '@next/eslint-plugin-next'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import sortKeysFix from 'eslint-plugin-sort-keys-fix'
import perfectionist from 'eslint-plugin-perfectionist'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

import localRules from './eslint-local-rules/index.mjs'
import { readAppFrameworks } from './scripts/eslint-config.detect.mjs'

import {
  BASE_RULES,
  FILENAME_RULES,
  CONSTANT_FILE_OVERRIDE,
  DEPENDENCY_SEAM_OVERRIDE,
  DTS_FILE_OVERRIDE,
  HOOK_FILE_OVERRIDE,
  LOGIC_IN_HOOK_OVERRIDE,
  REACT_RULES,
  RSC_ASYNC_SCREEN_OVERRIDE,
  PURE_DOMAIN_ADAPTER_OVERRIDE,
  STYLE_FILE_OVERRIDE,
  STYLE_PILLAR_OVERRIDE,
  SUFFIX_CONTRACT_OVERRIDE,
  TEST_FILE_OVERRIDE,
  TEST_INFRA_OVERRIDE,
  TESTING_LIBRARY_ALLOWED_OVERRIDE,
  TOKENS_SOURCE_OVERRIDE,
  TW4_NAMED_WIDTH_OVERRIDE,
  UI_COMPONENT_OVERRIDE,
  UI_FOLDER_CASING_RULES,
  wrappedImportOverride
} from './eslint.rules.mjs'

// ---------------------------------------------------------------------------
// One rule set for every app and package (decision 52, code-standards §24).
//
// A rule set more than one workspace shares applies by pattern: apps/*/**
// and packages/*/**, or a suffix (`**/*.screen.tsx`). What a framework forces
// applies to the apps whose package.json declares it, read once here
// (scripts/eslint-config.detect.mjs): the React rules to every app that
// declares react, the Next.js block to every app that declares next, the
// Expo block to every app that declares expo. So an app added under apps/,
// plain React for example, is judged with no change to this file; the
// fixture apps of eslint-local-rules/__fixtures__/ prove it. The only blocks
// that name a workspace are that workspace's own (packages/core, tokens,
// supabase, tooling), each saying why.
// ---------------------------------------------------------------------------

// typescript-eslint v8 errors when multiple candidate tsconfig roots exist
// (repo root + apps/*). Pin the root to this config file's directory.
const TSCONFIG_ROOT_DIR = fileURLToPath(new URL('.', import.meta.url))

const IGNORES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/dist-web/**',
  '**/build/**',
  '**/.next/**',
  '**/.expo/**',
  '**/android/**',
  '**/ios/**',
  '**/coverage/**',
  // Vendored third-party skill — pinned upstream, not ours to lint.
  '.claude/skills/archify/**',
  '**/.turbo/**',
  '*.config.{js,cjs,mjs}',
  '**/*.config.{js,cjs,mjs}',
  'commitlint.config.js',
  '**/*.cjs',
  '**/metro.config.js',
  '**/babel.config.js',
  // Supabase generated types — key order is owned by the generator.
  'packages/supabase/src/types.ts',
  // E2E tests run via dlx — Playwright is not a package dep.
  'e2e/**',
  'playwright.config.ts',
  // Inputs of the lint-rule tests, which lint them under the path they stand
  // for (eslint-local-rules/eslint-config.cases.mjs).
  'eslint-local-rules/__fixtures__/**'
]

// ---------------------------------------------------------------------------
// Shared plugin maps. Every workspace registers the TypeScript set, check-file
// included, so the filename suffix contract is enforced everywhere; a React
// app adds the React plugins.
// ---------------------------------------------------------------------------
const TS_PLUGINS = {
  '@typescript-eslint': tseslint.plugin,
  'check-file': checkFile,
  import: importPlugin,
  local: localRules,
  'no-relative-import-paths': noRelativeImportPaths,
  prettier,
  'simple-import-sort': simpleImportSort,
  'sort-destructure-keys': sortDestructureKeys,
  perfectionist,
  'sort-keys-fix': sortKeysFix
}

const REACT_PLUGINS = {
  ...TS_PLUGINS,
  'jsx-a11y': jsxA11y,
  react,
  'react-hooks': reactHooks
}

const SOURCE_FILES = '**/*.{ts,tsx}'
const APP_SOURCES = `apps/*/${SOURCE_FILES}`
const PACKAGE_SOURCES = `packages/*/${SOURCE_FILES}`

const JSX_PARSER_OPTIONS = { ecmaFeatures: { jsx: true } }
const REACT_SETTINGS = { react: { version: 'detect' } }

// The file names a framework router owns: route entries under src/app/
// (page, layout, route, _layout, index) and the Next.js middleware.
const ROUTER_FILE_NAMES = {
  'check-file/filename-naming-convention': 'off'
}

// ---------------------------------------------------------------------------
// What each framework adds to an app that declares it. `files` and `ignores`
// are relative to the app's folder; `forApps` roots them at each app.
// ---------------------------------------------------------------------------

// React: the JSX parser, the browser globals, the React plugins and rules.
const REACT_BLOCKS = [
  {
    files: [SOURCE_FILES],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: JSX_PARSER_OPTIONS
    },
    plugins: REACT_PLUGINS,
    rules: REACT_RULES,
    settings: REACT_SETTINGS
  }
]

// Next.js: the Node globals of its server runtime, the core-web-vitals
// rules, and the file names the App Router owns. Registers ONLY @next/next:
// eslint-config-next re-bundles react, react-hooks, import, jsx-a11y and
// typescript-eslint, which the shared maps above already declare.
const NEXT_BLOCKS = [
  { ignores: ['next-env.d.ts'] },
  {
    files: [SOURCE_FILES],
    languageOptions: { globals: globals.node },
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      // no-html-link-for-pages is Pages Router only; the App Router has no
      // pages dir, so the rule only reports that it cannot find one.
      '@next/next/no-html-link-for-pages': 'off'
    }
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/middleware.ts'],
    rules: ROUTER_FILE_NAMES
  }
]

// Expo: the React Native globals, the expo rules, the jsx-a11y rules that
// read the web DOM relaxed, and the file names Expo Router owns under
// src/app/ (_layout.tsx, index.tsx). Registers ONLY eslint-plugin-expo.
const EXPO_BLOCKS = [
  {
    files: [SOURCE_FILES],
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
        ErrorUtils: 'readonly',
        HermesInternal: 'readonly'
      }
    },
    plugins: { expo: expoPlugin },
    rules: {
      'expo/no-dynamic-env-var': 'error',
      'expo/no-env-var-destructuring': 'error',
      'expo/use-dom-exports': 'error',
      // jsx-a11y rules are web-DOM-only; relax them for React Native.
      'jsx-a11y/anchor-ambiguous-text': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'jsx-a11y/heading-has-content': 'off',
      'jsx-a11y/scope': 'off'
    }
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: ROUTER_FILE_NAMES
  }
]

// Next.js App Router screens may be async server components: placed after
// LOGIC_IN_HOOK_OVERRIDE below, so its relaxed selector set wins.
const NEXT_LATE_BLOCKS = [RSC_ASYNC_SCREEN_OVERRIDE]

const rootAt = ({ dir, patterns }) =>
  patterns.map((pattern) => `${dir}/${pattern}`)

// Each block rooted at every app of `dirs`; none when no app declares the
// framework. A block with `ignores` alone stays a global ignore.
const forApps = ({ blocks, dirs }) =>
  dirs.length === 0
    ? []
    : blocks.map((block) => ({
        ...block,
        ...(block.files && {
          files: dirs.flatMap((dir) =>
            rootAt({ dir, patterns: block.files })
          )
        }),
        ...(block.ignores && {
          ignores: dirs.flatMap((dir) =>
            rootAt({ dir, patterns: block.ignores })
          )
        })
      }))

// The config for the workspace at `workspaceRoot`: the repository itself by
// default, the fixture folder in eslint-local-rules/eslint-config.cases.mjs.
export const createConfig = ({
  workspaceRoot = TSCONFIG_ROOT_DIR
} = {}) => {
  const apps = readAppFrameworks({ root: workspaceRoot })

  return defineConfig([
    { ignores: IGNORES },
    eslint.configs.recommended,
    // @ts-expect-error - Plugin type incompatibility with ESLint 9 defineConfig
    ...tseslint.configs.recommended,

    // Pin the TSConfig root so typescript-eslint's parser doesn't error on
    // multiple candidate roots (merged into every block's parserOptions).
    {
      languageOptions: {
        parserOptions: { tsconfigRootDir: TSCONFIG_ROOT_DIR }
      }
    },

    // -----------------------------------------------------------------------
    // Every app and package: the base rules and the filename suffix contract.
    // -----------------------------------------------------------------------
    {
      files: [APP_SOURCES, PACKAGE_SOURCES],
      languageOptions: {
        ecmaVersion: 'latest',
        parser: tseslint.parser,
        sourceType: 'module'
      },
      plugins: TS_PLUGINS,
      rules: { ...BASE_RULES, ...FILENAME_RULES }
    },

    // Every package runs on Node: core, i18n, supabase and cloudflare, and
    // any package added later. packages/tokens sets its own globals below.
    {
      files: [PACKAGE_SOURCES],
      ignores: ['packages/tokens/**'],
      languageOptions: { globals: { ...globals.node, ...globals.es2021 } }
    },

    // packages/tokens — its own: the design tokens carry the browser globals,
    // the JSX parser and the React rule set, though the package declares no
    // react (code-standards §24 names it as an open question).
    // @ts-expect-error - Plugin type incompatibility
    {
      files: ['packages/tokens/**/*.{ts,tsx}'],
      languageOptions: {
        globals: { ...globals.browser, ...globals.es2021 },
        parserOptions: JSX_PARSER_OPTIONS
      },
      plugins: REACT_PLUGINS,
      rules: REACT_RULES,
      settings: REACT_SETTINGS
    },

    // -----------------------------------------------------------------------
    // packages/core/src — its own: the domain layer proper. Production files
    // import only their own modules, through the `#src/` key of core's
    // package.json "imports" (core-import-boundary). The package's build
    // config (vitest.config.ts) and its tests stay outside this rule: they
    // are tooling, not domain code, and tests may use the `@/` alias.
    // -----------------------------------------------------------------------
    {
      files: ['packages/core/src/**/*.{ts,tsx}'],
      ignores: ['packages/core/src/**/*.test.{ts,tsx}'],
      rules: { 'local/core-import-boundary': 'error' }
    },

    // -----------------------------------------------------------------------
    // packages/*/src — production files reach their own modules through
    // `#src/` (package-src-alias): imports, re-exports and `import()`, fixed
    // to the `#src/` form from the file's own path. no-relative-import-paths
    // is off here: it reads import declarations only, and its fix writes
    // `@/`, which the apps do not resolve. Placed after every package block
    // so it wins.
    // -----------------------------------------------------------------------
    {
      files: ['packages/*/src/**/*.{ts,tsx}'],
      ignores: ['packages/*/src/**/*.{test,spec}.{ts,tsx}'],
      rules: {
        'local/package-src-alias': 'error',
        'no-relative-import-paths/no-relative-import-paths': 'off'
      }
    },

    // -----------------------------------------------------------------------
    // Every app: the casing of its components/ui blocks.
    // -----------------------------------------------------------------------
    {
      files: [APP_SOURCES],
      rules: UI_FOLDER_CASING_RULES
    },

    // -----------------------------------------------------------------------
    // What each app's framework forces, by what its package.json declares.
    // React first: the Expo block relaxes jsx-a11y rules it sets.
    // -----------------------------------------------------------------------
    // @ts-expect-error - Plugin type incompatibility
    ...forApps({ blocks: REACT_BLOCKS, dirs: apps.react }),
    ...forApps({ blocks: NEXT_BLOCKS, dirs: apps.next }),
    ...forApps({ blocks: EXPO_BLOCKS, dirs: apps.expo }),

    // -----------------------------------------------------------------------
    // Node tooling scripts (scripts/**/*.mjs, root *.mjs, .claude/skills/**,
    // eslint-local-rules/**, and packages/tooling's own .mjs modules).
    // Plain ESM executed by Node, not app source — they rely on the Node
    // global set (process, console, fetch, URL, setTimeout, …), so they need
    // globals.node for no-undef to pass. eslint.config.mjs stays ignored via
    // IGNORES; eslint.rules.mjs and skill validators (e.g. general-plan) are
    // covered.
    // -----------------------------------------------------------------------
    {
      files: [
        'scripts/**/*.mjs',
        '*.mjs',
        '.claude/skills/**/*.mjs',
        'eslint-local-rules/**/*.mjs',
        'packages/tooling/**/*.mjs'
      ],
      languageOptions: {
        ecmaVersion: 'latest',
        globals: { ...globals.node },
        sourceType: 'module'
      }
    },

    // -----------------------------------------------------------------------
    // Cross-package overrides, by suffix or by pattern (order matters —
    // later wins).
    // -----------------------------------------------------------------------
    UI_COMPONENT_OVERRIDE,
    LOGIC_IN_HOOK_OVERRIDE,
    SUFFIX_CONTRACT_OVERRIDE,
    PURE_DOMAIN_ADAPTER_OVERRIDE,
    STYLE_PILLAR_OVERRIDE,
    // The async server screens of every Next.js app: after
    // LOGIC_IN_HOOK_OVERRIDE, so they win by later-wins.
    ...forApps({ blocks: NEXT_LATE_BLOCKS, dirs: apps.next }),
    HOOK_FILE_OVERRIDE,
    CONSTANT_FILE_OVERRIDE,
    STYLE_FILE_OVERRIDE,
    TOKENS_SOURCE_OVERRIDE,
    TW4_NAMED_WIDTH_OVERRIDE,
    TEST_FILE_OVERRIDE,
    TEST_INFRA_OVERRIDE,
    // The render seam: re-enables @testing-library/react in the test helper
    // and the tests. Must come AFTER the workspace blocks (and TEST_* blocks)
    // so the relaxed no-restricted-imports config wins by later-wins.
    TESTING_LIBRARY_ALLOWED_OVERRIDE,
    // Every package inside its seam, over apps/* and packages/* by pattern.
    DEPENDENCY_SEAM_OVERRIDE,
    // Every name a wrapper owns inside that wrapper, judged by the ui blocks
    // of the workspace this config is built for.
    wrappedImportOverride({ workspaceRoot }),
    DTS_FILE_OVERRIDE,

    // Prettier must be last to disable conflicting rules.
    // @ts-expect-error - Plugin type incompatibility
    prettierConfig
  ])
}

export default createConfig()
