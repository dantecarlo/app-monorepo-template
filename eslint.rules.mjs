// @ts-check
import vitestPlugin from 'eslint-plugin-vitest'

//
// Shared ESLint rule sets for the whole monorepo.
//
// Every workspace block in eslint.config.mjs consumes BASE_RULES (and, for
// React workspaces, REACT_RULES) from this single module so NO workspace can
// escape the binding fractal-architecture guardrails described in
// docs/code-standards.md.
//
// Rule groups:
//   BASE_RULES        — arrow-only, I-prefix naming, alias-only imports,
//                       import/key/prop sorting, prettier, max-lines,
//                       no-magic-numbers (error).
//   REACT_RULES       — jsx-a11y + react + react-hooks for web/mobile/tokens.
//   FILENAME_RULES    — check-file suffix contract (.component/.screen/...).
//   LOGIC_IN_HOOK_*   — bans useEffect/useMemo/useCallback outside *.hook.ts.
//   NO_JSX_LITERAL_*  — discourages magic literals in component/screen JSX.
//
// The override config objects (CONSTANT_FILE_OVERRIDE, STYLES_FILE_OVERRIDE,
// TEST_FILE_OVERRIDE, DTS_FILE_OVERRIDE, CONFIG_FILE_OVERRIDE) relax the
// strict literal rules where they are impractical (constants, Tailwind class
// strings, tests, generated declarations, config files).

// ---------------------------------------------------------------------------
// Magic-number allowlist — keep this minimal on purpose.
// 0/1/2 cover the overwhelming majority of legitimate inline numbers
// (lengths, indexes, first/second element); -1 covers "not found" / last.
// Everything else must live in a *.constant.ts file or an enum.
// ---------------------------------------------------------------------------
const MAGIC_NUMBER_ALLOWLIST = [-1, 0, 1, 2]

// ---------------------------------------------------------------------------
// no-restricted-syntax selectors — arrow-only enforcement (code-standards
// Rule 1). Banning FunctionDeclaration + named FunctionExpression forces
// every reusable function to be an arrow assigned to const. Object/class
// method shorthand stays legal (it is not a named FunctionExpression).
// ---------------------------------------------------------------------------
const ARROW_ONLY_SELECTORS = [
  {
    message:
      'Use an arrow function assigned to const (code-standards Rule 1).',
    selector: 'FunctionDeclaration'
  },
  {
    message:
      'Use an arrow function assigned to const (code-standards Rule 1).',
    selector: 'FunctionExpression[id!=null]'
  }
]

// ---------------------------------------------------------------------------
// Base rules — shared by EVERY workspace (apps + packages).
// ---------------------------------------------------------------------------
export const BASE_RULES = {
  '@typescript-eslint/comma-dangle': 'off',
  // I-prefix on interfaces, {Name}Type suffix on type aliases.
  '@typescript-eslint/naming-convention': [
    'error',
    {
      format: ['PascalCase'],
      prefix: ['I'],
      selector: 'interface'
    },
    {
      format: ['PascalCase'],
      selector: 'typeAlias',
      suffix: ['Type']
    }
  ],
  '@typescript-eslint/no-empty-object-type': [
    'error',
    { allowInterfaces: 'with-single-extends' }
  ],

  'arrow-body-style': 'off',

  'comma-dangle': 'off',

  // arrow-only functions (no `function` keyword).
  'func-style': ['error', 'expression', { allowArrowFunctions: true }],

  // import sorting — simple-import-sort owns order; turn off the built-in.
  'import/extensions': 'off',
  'import/order': 'off',
  'import/prefer-default-export': 'off',

  // size cap (code-standards: max 500 lines).
  'max-lines': [
    'error',
    { max: 500, skipBlankLines: true, skipComments: true }
  ],

  // magic values — ERROR, with a minimal allowlist. detectObjects:false keeps
  // object-literal values (incl. RN inline style objects) out of scope;
  // move standalone magic numbers into *.constant.ts or an enum.
  'no-magic-numbers': [
    'error',
    {
      detectObjects: false,
      enforceConst: true,
      ignoreArrayIndexes: true,
      ignoreEnums: true,
      ignoreReadonlyClassProperties: true,
      ignoreTypeIndexes: true,
      ignore: MAGIC_NUMBER_ALLOWLIST
    }
  ],

  // alias-only imports (ban relative `../` paths).
  'no-relative-import-paths/no-relative-import-paths': [
    'error',
    { allowSameFolder: false, prefix: '@', rootDir: 'src' }
  ],

  // arrow-only enforcement.
  'no-restricted-syntax': ['error', ...ARROW_ONLY_SELECTORS],

  'no-trailing-spaces': ['error', { skipBlankLines: true }],

  'prefer-arrow-callback': 'off',
  'prettier/prettier': 'error',

  semi: 'off',
  'simple-import-sort/exports': 'error',
  'simple-import-sort/imports': 'error',

  // key / prop sorting.
  'sort-destructure-keys/sort-destructure-keys': 'error',
  'sort-keys': ['error', 'asc', { caseSensitive: true, natural: true }],
  'sort-keys-fix/sort-keys-fix': [
    'error',
    'asc',
    { caseSensitive: true, natural: true }
  ],
  'perfectionist/sort-enums': 'error',
  'perfectionist/sort-interfaces': 'error'
}

// ---------------------------------------------------------------------------
// React rules — applied to web + mobile + packages/tokens.
// Includes the React Compiler rule set from react-hooks recommended-latest
// (eslint-plugin-react-hooks 7.1.1). The two core rules are pinned after the
// spread so they cannot be silently downgraded by a future update.
// ---------------------------------------------------------------------------
export const REACT_RULES = {
  'jsx-a11y/anchor-ambiguous-text': 'error',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/heading-has-content': 'warn',
  'jsx-a11y/scope': 'warn',
  'react-hooks/config': 'error',
  'react-hooks/error-boundaries': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/gating': 'error',
  'react-hooks/globals': 'error',
  'react-hooks/immutability': 'error',
  'react-hooks/incompatible-library': 'warn',
  'react-hooks/preserve-manual-memoization': 'error',
  'react-hooks/purity': 'error',
  'react-hooks/refs': 'error',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/set-state-in-effect': 'error',
  'react-hooks/set-state-in-render': 'error',
  'react-hooks/static-components': 'error',
  'react-hooks/unsupported-syntax': 'warn',
  'react-hooks/use-memo': 'error',
  'react-hooks/void-use-memo': 'error',
  'react/function-component-definition': 'off',
  'react/jsx-props-no-spreading': 'error',
  'react/jsx-sort-props': 'error',
  'react/react-in-jsx-scope': 'off'
}

// ---------------------------------------------------------------------------
// Filename suffix contract — check-file plugin.
// Every source file under src/ must end with a recognised fractal suffix
// (or be a barrel `index.ts`). The match glob is cwd-independent: `eslint .`
// runs from each workspace root (path seen as `src/...`) while the root
// `eslint . --fix` sees `apps/web/src/...` — `**/src/**` covers both.
// ---------------------------------------------------------------------------
const FILENAME_MATCH_GLOB = '**/src/**/!(index).{ts,tsx}'

// check-file strips the file extension before matching (ignoreMiddleExtensions
// is false, so only the final extension is removed), so the suffix glob is
// matched against e.g. `useItems.hook` / `X.screen` — NO trailing `.{ts,tsx}`.
const FILENAME_SUFFIX_GLOB =
  '*.{component,screen,styles,hook,service,adapter,type,store,constant,helper,config,schema,spec,test}'

const FILENAME_NAMING_MESSAGE =
  'Source files must use a fractal suffix: .component.tsx / .screen.tsx / ' +
  '.styles.ts / .hook.ts / .service.ts / .adapter.ts / .type.ts / ' +
  '.store.ts / .constant.ts / .helper.ts / .config.ts / .schema.ts / ' +
  '.test.{ts,tsx} — or be an index.ts barrel (code-standards Rule 4).'

/**
 * The check-file filename suffix rule. Shared by every workspace; each
 * workspace block already scopes `files:` so this single rule object is safe
 * to reuse everywhere.
 */
export const FILENAME_RULES = {
  'check-file/filename-naming-convention': [
    'error',
    { [FILENAME_MATCH_GLOB]: FILENAME_SUFFIX_GLOB },
    {
      errorMessage: FILENAME_NAMING_MESSAGE,
      ignoreMiddleExtensions: false
    }
  ]
}

// ---------------------------------------------------------------------------
// Logic-in-hook enforcement — bans React hooks that hold derived state /
// side effects (useEffect/useMemo/useCallback) inside *.screen.tsx and
// *.component.tsx. Those belong in *.hook.ts so components stay render-only.
// Applied via LOGIC_IN_HOOK_OVERRIDE below.
// ---------------------------------------------------------------------------
const FORBIDDEN_HOOK_CALLEES = ['useEffect', 'useMemo', 'useCallback']

const LOGIC_IN_HOOK_SELECTORS = FORBIDDEN_HOOK_CALLEES.map((hook) => ({
  message: `Move ${hook} into a *.hook.ts file — screens/components must stay render-only (code-standards: logic-in-hook).`,
  selector: `CallExpression[callee.name='${hook}']`
}))

// ---------------------------------------------------------------------------
// JSX literal enforcement — discourages bare numeric/string literals used as
// logic in component/screen JSX expression containers. Pragmatic scope: only
// flags literals inside JSXExpressionContainer (e.g. {3}, {'magic'}), not
// static text children or HTML/RN attributes (which are design, not logic).
// ---------------------------------------------------------------------------
const JSX_LITERAL_SELECTORS = [
  {
    message:
      'No magic number in JSX logic — extract to a *.constant.ts value (code-standards Rule 8).',
    selector:
      'JSXExpressionContainer > Literal[value=/^[0-9]+$/]:not([raw=/^["\']/])'
  }
]

// ---------------------------------------------------------------------------
// Tailwind 4 named-width utility collision guard.
// In Tailwind 4, width/height/size utilities with named sizes (xs, sm, md,
// lg, xl, 2xl, 3xl) resolve to --spacing token px values instead of the TW3
// fixed-width scale. Shared selectors used in both LOGIC_IN_HOOK_OVERRIDE
// (component/screen files) and TW4_NAMED_WIDTH_OVERRIDE (all tsx/styles).
// ---------------------------------------------------------------------------
const TW4_WIDTH_MESSAGE =
  'In Tailwind 4, w/h/size utilities with named sizes (xs, sm, md, lg, xl) resolve to --spacing token px values, not TW3 widths. Use an arbitrary value like max-w-[28rem] instead.'

const TW4_WIDTH_SELECTORS = [
  {
    message: TW4_WIDTH_MESSAGE,
    selector:
      'Literal[value=/\\b(max-w|min-w|w|h|max-h|min-h|size)-(xs|sm|md|lg|xl|2xl|3xl)\\b/]'
  },
  {
    message: TW4_WIDTH_MESSAGE,
    selector:
      'TemplateLiteral > TemplateElement[value.cooked=/\\b(max-w|min-w|w|h|max-h|min-h|size)-(xs|sm|md|lg|xl|2xl|3xl)\\b/]'
  }
]

// ---------------------------------------------------------------------------
// Override config objects — reused across workspaces in eslint.config.mjs.
// ---------------------------------------------------------------------------

// UI primitive components intentionally forward all HTML attributes via spread.
export const UI_COMPONENT_OVERRIDE = {
  files: ['**/components/ui/**/*.{ts,tsx}'],
  rules: { 'react/jsx-props-no-spreading': 'off' }
}

// Logic-in-hook: applied to screens + components only.
export const LOGIC_IN_HOOK_OVERRIDE = {
  files: ['**/*.screen.tsx', '**/*.component.tsx'],
  rules: {
    'no-restricted-syntax': [
      'error',
      ...ARROW_ONLY_SELECTORS,
      ...LOGIC_IN_HOOK_SELECTORS,
      ...JSX_LITERAL_SELECTORS,
      ...TW4_WIDTH_SELECTORS
    ]
  }
}

// Hook files: explicitly allow the hooks banned in components/screens.
export const HOOK_FILE_OVERRIDE = {
  files: ['**/*.hook.ts', '**/*.hook.tsx'],
  rules: {
    'no-restricted-syntax': ['error', ...ARROW_ONLY_SELECTORS]
  }
}

// Constant files: magic numbers ARE the point — relax there.
export const CONSTANT_FILE_OVERRIDE = {
  files: ['**/*.constant.ts', '**/*.constant.tsx'],
  rules: {
    '@typescript-eslint/no-magic-numbers': 'off',
    'no-magic-numbers': 'off'
  }
}

// Styles files: Tailwind class strings + RN style numbers are design tokens.
export const STYLES_FILE_OVERRIDE = {
  files: ['**/*.styles.ts', '**/*.styles.tsx'],
  rules: {
    '@typescript-eslint/no-magic-numbers': 'off',
    'no-magic-numbers': 'off'
  }
}

// Design-token package: tokens.ts is the source of literal design values.
export const TOKENS_SOURCE_OVERRIDE = {
  files: ['packages/tokens/src/**/*.ts'],
  rules: {
    '@typescript-eslint/no-magic-numbers': 'off',
    'no-magic-numbers': 'off'
  }
}

// Test files: literals + relative helper imports are allowed.
export const TEST_FILE_OVERRIDE = {
  files: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx'
  ],
  plugins: { vitest: vitestPlugin },
  rules: {
    'no-magic-numbers': 'off',
    'no-relative-import-paths/no-relative-import-paths': 'off',
    'vitest/consistent-test-it': ['error', { fn: 'test' }]
  }
}

// Test infrastructure: setup files, the test helper re-export, MSW server +
// handlers, and mock data fixtures live under src/test/ (or __mocks__/) and do
// NOT carry a fractal suffix — they are harness plumbing, not feature units.
// The tests-per-unit presence check (scripts/verify-tests.mjs) already exempts
// the same paths, so this keeps the two enforcers consistent.
export const TEST_INFRA_OVERRIDE = {
  files: ['**/src/test/**/*.{ts,tsx}', '**/__mocks__/**/*.{ts,tsx}'],
  rules: {
    'check-file/filename-naming-convention': 'off',
    'no-magic-numbers': 'off'
  }
}

export const TW4_NAMED_WIDTH_OVERRIDE = {
  files: ['**/*.tsx', '**/*.styles.ts', '**/*.styles.tsx'],
  ignores: ['**/*.component.tsx', '**/*.screen.tsx'],
  rules: {
    'no-restricted-syntax': ['error', ...TW4_WIDTH_SELECTORS]
  }
}

// Generated + augmentation declaration files. Interface augmentations target
// third-party interface names (e.g. Vitest's Assertion) that cannot carry the
// I-prefix, so the naming-convention and empty-object-type rules are relaxed.
export const DTS_FILE_OVERRIDE = {
  files: ['**/*.d.ts'],
  rules: {
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    // Interface augmentations must mirror upstream generic signatures (e.g.
    // Assertion<T>) even when the param is unused locally.
    '@typescript-eslint/no-unused-vars': 'off',
    'no-magic-numbers': 'off',
    'no-unused-vars': 'off',
    'sort-keys': 'off',
    'sort-keys-fix/sort-keys-fix': 'off'
  }
}
