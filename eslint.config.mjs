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
  TEST_INFRA_OVERRIDE,
  TESTING_LIBRARY_ALLOWED_OVERRIDE,
  TOKENS_SOURCE_OVERRIDE,
  TW4_NAMED_WIDTH_OVERRIDE,
  UI_COMPONENT_OVERRIDE,
  VENDOR_SDK_ALLOWED_OVERRIDE
} from './eslint.rules.mjs'

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
  '**/.turbo/**',
  '*.config.{js,cjs,mjs}',
  '**/*.config.{js,cjs,mjs}',
  'commitlint.config.js',
  '**/*.cjs',
  '**/metro.config.js',
  '**/babel.config.js',
  'apps/web/next-env.d.ts',
  // Supabase generated types — key order is owned by the generator.
  'packages/supabase/src/types.ts',
  // E2E tests run via dlx — Playwright is not a package dep.
  'e2e/**',
  'playwright.config.ts'
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

export default defineConfig([
  { ignores: IGNORES },
  eslint.configs.recommended,
  // @ts-expect-error - Plugin type incompatibility with ESLint 9 defineConfig
  ...tseslint.configs.recommended,

  // Pin the TSConfig root so typescript-eslint's parser doesn't error on
  // multiple candidate roots (merged into every workspace block's parserOptions).
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: TSCONFIG_ROOT_DIR }
    }
  },

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
  // packages/cloudflare — edge adapters (Turnstile siteverify, origin-lock).
  // Vendor-free TS: plain fetch + header comparison behind @app/core ports.
  // -------------------------------------------------------------------------
  {
    files: ['packages/cloudflare/**/*.{ts,tsx}'],
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
  // apps/web — Next.js core-web-vitals rules (scoped, no plugin duplication).
  // Registers ONLY @next/next rules via the plugin's own flat-config object.
  // We intentionally do NOT spread eslint-config-next because that package
  // re-bundles react / react-hooks / import / jsx-a11y / typescript-eslint
  // (double-registering plugins already declared above).
  // -------------------------------------------------------------------------
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      // no-html-link-for-pages is Pages Router only; this project uses App
      // Router exclusively, so disable to silence the "pages dir not found"
      // noise (the rule has no effect in App Router mode).
      '@next/next/no-html-link-for-pages': 'off'
    }
  },

  // -------------------------------------------------------------------------
  // apps/mobile — Expo plugin rules (scoped block, expo namespace only).
  // Registers ONLY eslint-plugin-expo so there is no double-registration of
  // react / react-hooks / import / @typescript-eslint that are already
  // declared in the shared plugin maps above. Fractal rules win by later-wins.
  // -------------------------------------------------------------------------
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: { expo: expoPlugin },
    rules: {
      'expo/no-dynamic-env-var': 'error',
      'expo/no-env-var-destructuring': 'error',
      'expo/use-dom-exports': 'error'
    }
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
  // Next.js middleware owns the framework-reserved name `middleware.ts` and
  // must live at the src root. Relax the fractal suffix rule for it.
  // -------------------------------------------------------------------------
  {
    files: ['apps/web/src/middleware.ts'],
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
  // packages/cloudflare adapters import their sibling `./cloudflare.constant`.
  // The @/ alias maps to src/, but consuming apps resolve @/ to their OWN src/,
  // so a relative sibling import is the only form that resolves cross-package
  // (same reasoning as the supabase adapter override above).
  // -------------------------------------------------------------------------
  {
    files: ['packages/cloudflare/src/*.adapter.ts'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off'
    }
  },

  // -------------------------------------------------------------------------
  // Node tooling scripts (scripts/**/*.mjs, root *.mjs, .claude/skills/**/*.mjs).
  // Plain ESM executed by Node, not app source — they rely on the Node global set
  // (process, console, fetch, URL, setTimeout, …), so they need globals.node for
  // no-undef to pass. eslint.config.mjs stays ignored via IGNORES; eslint.rules.mjs
  // and skill validators (e.g. general-plan) are covered.
  // -------------------------------------------------------------------------
  {
    files: [
      'scripts/**/*.mjs',
      '*.mjs',
      '.claude/skills/**/*.mjs',
      'eslint-local-rules/**/*.mjs'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node },
      sourceType: 'module'
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
  TW4_NAMED_WIDTH_OVERRIDE,
  TEST_FILE_OVERRIDE,
  TEST_INFRA_OVERRIDE,
  // Import-seam allow-lists: re-enable vendor SDKs at the adapter/lib seam and
  // @testing-library/react in the test render seam. Must come AFTER the
  // workspace blocks (and TEST_* blocks) so the relaxed no-restricted-imports
  // config wins by later-wins.
  VENDOR_SDK_ALLOWED_OVERRIDE,
  TESTING_LIBRARY_ALLOWED_OVERRIDE,
  DTS_FILE_OVERRIDE,

  // Prettier must be last to disable conflicting rules.
  // @ts-expect-error - Plugin type incompatibility
  prettierConfig
])
