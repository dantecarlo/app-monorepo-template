// @ts-check
import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import checkFile from 'eslint-plugin-check-file'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import sortKeysFix from 'eslint-plugin-sort-keys-fix'
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import {
  BASE_RULES,
  FILENAME_RULES,
  CONSTANT_FILE_OVERRIDE,
  DTS_FILE_OVERRIDE,
  HOOK_FILE_OVERRIDE,
  LOGIC_IN_HOOK_OVERRIDE,
  REACT_RULES,
  STYLES_FILE_OVERRIDE,
  TEST_FILE_OVERRIDE,
  TOKENS_SOURCE_OVERRIDE,
  UI_COMPONENT_OVERRIDE
} from './eslint.rules.mjs'

const IGNORES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.expo/**',
  '**/android/**',
  '**/ios/**',
  '**/coverage/**',
  '**/.turbo/**',
  '*.config.{js,cjs,mjs}',
  '**/*.config.{js,cjs,mjs}',
  'commitlint.config.js',
  '**/*.cjs',
  '**/metro.config.js',
  '**/babel.config.js',
  'apps/web/next-env.d.ts',
  // Supabase generated types — key order is owned by the generator.
  'packages/supabase/src/types.ts'
]

// ---------------------------------------------------------------------------
// Shared plugin maps. The non-React workspaces (core/i18n/supabase) do not
// need the React plugins, but every workspace registers check-file so the
// filename suffix contract is enforced EVERYWHERE.
// ---------------------------------------------------------------------------
const TS_PLUGINS = {
  '@typescript-eslint': tseslint.plugin,
  'check-file': checkFile,
  import: importPlugin,
  'no-relative-import-paths': noRelativeImportPaths,
  prettier,
  'simple-import-sort': simpleImportSort,
  'sort-destructure-keys': sortDestructureKeys,
  'sort-keys-fix': sortKeysFix,
  'typescript-sort-keys': typescriptSortKeys
}

const REACT_PLUGINS = {
  ...TS_PLUGINS,
  'jsx-a11y': jsxA11y,
  react,
  'react-hooks': reactHooks
}

export default defineConfig([
  { ignores: IGNORES },
  eslint.configs.recommended,
  // @ts-expect-error - Plugin type incompatibility with ESLint 9 defineConfig
  ...tseslint.configs.recommended,

  // -------------------------------------------------------------------------
  // packages/core — framework-agnostic TS
  // -------------------------------------------------------------------------
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node, ...globals.es2021 },
      parser: tseslint.parser,
      sourceType: 'module'
    },
    plugins: TS_PLUGINS,
    rules: { ...BASE_RULES, ...FILENAME_RULES }
  },

  // -------------------------------------------------------------------------
  // packages/i18n — framework-agnostic TS (ICU catalogs)
  // -------------------------------------------------------------------------
  {
    files: ['packages/i18n/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node, ...globals.es2021 },
      parser: tseslint.parser,
      sourceType: 'module'
    },
    plugins: TS_PLUGINS,
    rules: { ...BASE_RULES, ...FILENAME_RULES }
  },

  // -------------------------------------------------------------------------
  // packages/supabase — typed client factory (was escaping all rules)
  // -------------------------------------------------------------------------
  {
    files: ['packages/supabase/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node, ...globals.es2021 },
      parser: tseslint.parser,
      sourceType: 'module'
    },
    plugins: TS_PLUGINS,
    rules: { ...BASE_RULES, ...FILENAME_RULES }
  },

  // -------------------------------------------------------------------------
  // packages/tokens — design tokens (plain TS objects, no JSX)
  // -------------------------------------------------------------------------
  // @ts-expect-error - Plugin type incompatibility
  {
    files: ['packages/tokens/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.es2021 },
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: 'module'
    },
    plugins: REACT_PLUGINS,
    rules: {
      ...BASE_RULES,
      ...REACT_RULES,
      ...FILENAME_RULES
    },
    settings: { react: { version: 'detect' } }
  },

  // -------------------------------------------------------------------------
  // apps/web — Next.js 15
  // -------------------------------------------------------------------------
  // @ts-expect-error - Plugin type incompatibility
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node
      },
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: 'module'
    },
    plugins: REACT_PLUGINS,
    rules: {
      ...BASE_RULES,
      ...REACT_RULES,
      ...FILENAME_RULES,
      // PascalCase on component subfolders inside components/ui (shadcn keeps
      // ui/ itself lowercase by convention; this matches its CONTENTS only).
      'check-file/folder-naming-convention': [
        'error',
        { 'apps/web/src/components/ui/**/': 'PASCAL_CASE' }
      ]
    },
    settings: { react: { version: 'detect' } }
  },

  // -------------------------------------------------------------------------
  // apps/mobile — Expo React Native (now registers check-file too)
  // -------------------------------------------------------------------------
  // @ts-expect-error - Plugin type incompatibility
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        __DEV__: 'readonly',
        ErrorUtils: 'readonly',
        HermesInternal: 'readonly'
      },
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: 'module'
    },
    plugins: REACT_PLUGINS,
    rules: {
      ...BASE_RULES,
      ...REACT_RULES,
      ...FILENAME_RULES,
      // jsx-a11y rules are web-DOM-only; relax them for RN.
      'jsx-a11y/anchor-ambiguous-text': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'jsx-a11y/heading-has-content': 'off',
      'jsx-a11y/scope': 'off'
    },
    settings: { react: { version: 'detect' } }
  },

  // -------------------------------------------------------------------------
  // Expo Router entry files (src/app/**) own framework-shaped names like
  // _layout.tsx and index.tsx and run side-effectful hooks (useEffect for
  // splash/font loading). Relax the suffix + logic-in-hook rules there.
  // -------------------------------------------------------------------------
  {
    files: ['apps/mobile/src/app/**/*.{ts,tsx}'],
    rules: {
      'check-file/filename-naming-convention': 'off'
    }
  },

  // -------------------------------------------------------------------------
  // Next.js App Router special files (page/layout/providers/route) own
  // framework-shaped names and live under src/app/. Relax suffix there.
  // -------------------------------------------------------------------------
  {
    files: ['apps/web/src/app/**/*.{ts,tsx}'],
    rules: {
      'check-file/filename-naming-convention': 'off'
    }
  },

  // -------------------------------------------------------------------------
  // packages/i18n locale source files — same-directory JSON imports.
  // -------------------------------------------------------------------------
  {
    files: ['packages/i18n/src/locales/*.ts'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off'
    }
  },

  // -------------------------------------------------------------------------
  // packages/supabase factory files import the generated `./types` sibling.
  // The @/ alias maps to src/, but consuming apps resolve @/ to their OWN
  // src/, so a relative import is the only form that resolves cross-package
  // (same reasoning as the i18n locales override above).
  // -------------------------------------------------------------------------
  {
    files: ['packages/supabase/src/*.adapter.ts'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off'
    }
  },

  // -------------------------------------------------------------------------
  // Cross-package overrides (order matters — later wins).
  // -------------------------------------------------------------------------
  UI_COMPONENT_OVERRIDE,
  LOGIC_IN_HOOK_OVERRIDE,
  HOOK_FILE_OVERRIDE,
  CONSTANT_FILE_OVERRIDE,
  STYLES_FILE_OVERRIDE,
  TOKENS_SOURCE_OVERRIDE,
  TEST_FILE_OVERRIDE,
  DTS_FILE_OVERRIDE,

  // Prettier must be last to disable conflicting rules.
  // @ts-expect-error - Plugin type incompatibility
  prettierConfig
])
