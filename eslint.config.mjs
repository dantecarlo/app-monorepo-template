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

const IGNORES = [
  '**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**',
  '**/.expo/**', '**/android/**', '**/ios/**', '**/coverage/**',
  '**/.turbo/**', '*.config.{js,cjs,mjs}', '**/*.config.{js,cjs,mjs}',
  'commitlint.config.js', '**/*.cjs', '**/metro.config.js',
  '**/babel.config.js', 'apps/web/next-env.d.ts'
]

const BASE_RULES = {
  'import/extensions': 'off', 'import/order': 'off',
  'import/prefer-default-export': 'off',
  'simple-import-sort/exports': 'error',
  'simple-import-sort/imports': 'error',
  'sort-destructure-keys/sort-destructure-keys': 'error',
  'sort-keys': ['error', 'asc', { caseSensitive: true, natural: true }],
  'sort-keys-fix/sort-keys-fix': ['error', 'asc', { caseSensitive: true, natural: true }],
  'typescript-sort-keys/interface': 'error',
  'typescript-sort-keys/string-enum': 'error',
  'no-trailing-spaces': ['error', { skipBlankLines: true }],
  'prettier/prettier': 'error', 'semi': 'off',
  'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
  'no-magic-numbers': ['warn', { detectObjects: false, enforceConst: true, ignoreArrayIndexes: true }],
  'func-style': ['error', 'expression', { allowArrowFunctions: true }],
  'no-restricted-syntax': [
    'error',
    { message: 'Use an arrow function assigned to const (code-standards Rule 1).', selector: 'FunctionDeclaration' },
    { message: 'Use an arrow function assigned to const (code-standards Rule 1).', selector: 'FunctionExpression[id!=null]' }
  ],
  '@typescript-eslint/naming-convention': [
    'error',
    { format: ['PascalCase'], prefix: ['I'], selector: 'interface' },
    { format: ['PascalCase'], selector: 'typeAlias', suffix: ['Type'] }
  ],
  'no-relative-import-paths/no-relative-import-paths': ['error', { allowSameFolder: false, prefix: '@', rootDir: 'src' }],
  '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
  '@typescript-eslint/comma-dangle': 'off', 'comma-dangle': 'off',
  'arrow-body-style': 'off', 'prefer-arrow-callback': 'off'
}

const REACT_RULES = {
  'jsx-a11y/anchor-ambiguous-text': 'error',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/heading-has-content': 'warn',
  'jsx-a11y/scope': 'warn',
  'react/function-component-definition': 'off',
  'react/jsx-props-no-spreading': 'error',
  'react/jsx-sort-props': 'error',
  'react/react-in-jsx-scope': 'off',
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/rules-of-hooks': 'error'
}

// UI primitive components intentionally forward all HTML attributes via spread.
const UI_COMPONENT_OVERRIDE = {
  files: ['**/components/ui/**/*.{ts,tsx}'],
  rules: { 'react/jsx-props-no-spreading': 'off' }
}

const CONSTANT_FILE_OVERRIDE = {
  files: ['**/*.constant.ts', '**/*.constant.tsx'],
  rules: { '@typescript-eslint/no-magic-numbers': 'off', 'no-magic-numbers': 'off' }
}

const TEST_FILE_OVERRIDE = {
  files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
  rules: {
    'no-magic-numbers': 'off',
    'no-relative-import-paths/no-relative-import-paths': 'off'
  }
}

const DTS_FILE_OVERRIDE = {
  files: ['**/*.d.ts'],
  rules: { 'no-magic-numbers': 'off', 'sort-keys': 'off', 'sort-keys-fix/sort-keys-fix': 'off' }
}

export default defineConfig([
  { ignores: IGNORES },
  eslint.configs.recommended,
  // @ts-expect-error - Plugin type incompatibility with ESLint 9 defineConfig
  ...tseslint.configs.recommended,
  // packages/core, packages/i18n
  {
    files: ['packages/core/**/*.{ts,tsx}', 'packages/i18n/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 'latest', globals: { ...globals.node, ...globals.es2021 }, parser: tseslint.parser, sourceType: 'module' },
    plugins: { '@typescript-eslint': tseslint.plugin, import: importPlugin, 'no-relative-import-paths': noRelativeImportPaths, prettier, 'simple-import-sort': simpleImportSort, 'sort-destructure-keys': sortDestructureKeys, 'sort-keys-fix': sortKeysFix, 'typescript-sort-keys': typescriptSortKeys },
    rules: { ...BASE_RULES }
  },
  // packages/tokens
  // @ts-expect-error - Plugin type incompatibility
  {
    files: ['packages/tokens/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 'latest', globals: { ...globals.browser, ...globals.es2021 }, parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } }, sourceType: 'module' },
    plugins: { import: importPlugin, 'jsx-a11y': jsxA11y, 'no-relative-import-paths': noRelativeImportPaths, prettier, react, 'react-hooks': reactHooks, 'simple-import-sort': simpleImportSort, 'sort-destructure-keys': sortDestructureKeys, 'sort-keys-fix': sortKeysFix, 'typescript-sort-keys': typescriptSortKeys },
    rules: { ...BASE_RULES, ...REACT_RULES },
    settings: { react: { version: 'detect' } }
  },
  // apps/web
  // @ts-expect-error - Plugin type incompatibility
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 'latest', globals: { ...globals.browser, ...globals.es2021, ...globals.node }, parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } }, sourceType: 'module' },
    plugins: { 'check-file': checkFile, import: importPlugin, 'jsx-a11y': jsxA11y, 'no-relative-import-paths': noRelativeImportPaths, prettier, react, 'react-hooks': reactHooks, 'simple-import-sort': simpleImportSort, 'sort-destructure-keys': sortDestructureKeys, 'sort-keys-fix': sortKeysFix, 'typescript-sort-keys': typescriptSortKeys },
    rules: { ...BASE_RULES, ...REACT_RULES, 'check-file/folder-naming-convention': ['error', { 'apps/web/src/components/ui/**/': 'PASCAL_CASE' }] },
    settings: { react: { version: 'detect' } }
  },
  // apps/mobile
  // @ts-expect-error - Plugin type incompatibility
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 'latest', globals: { ...globals.browser, ...globals.es2021, __DEV__: 'readonly', ErrorUtils: 'readonly', HermesInternal: 'readonly' }, parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } }, sourceType: 'module' },
    plugins: { import: importPlugin, 'jsx-a11y': jsxA11y, 'no-relative-import-paths': noRelativeImportPaths, prettier, react, 'react-hooks': reactHooks, 'simple-import-sort': simpleImportSort, 'sort-destructure-keys': sortDestructureKeys, 'sort-keys-fix': sortKeysFix, 'typescript-sort-keys': typescriptSortKeys },
    rules: { ...BASE_RULES, ...REACT_RULES, 'jsx-a11y/anchor-ambiguous-text': 'off', 'jsx-a11y/control-has-associated-label': 'off', 'jsx-a11y/heading-has-content': 'off', 'jsx-a11y/scope': 'off' },
    settings: { react: { version: 'detect' } }
  },
  // packages/i18n locale source files
  {
    files: ['packages/i18n/src/locales/*.ts'],
    rules: { 'no-relative-import-paths/no-relative-import-paths': 'off' }
  },
  UI_COMPONENT_OVERRIDE,
  CONSTANT_FILE_OVERRIDE,
  TEST_FILE_OVERRIDE,
  DTS_FILE_OVERRIDE,
  // @ts-expect-error - Plugin type incompatibility
  prettierConfig
])
