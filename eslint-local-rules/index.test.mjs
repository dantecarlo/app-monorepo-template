// ---------------------------------------------------------------------------
// RuleTester suite for the boundary and contract rules in ./index.mjs.
//
// Each rule gets planted violations (must report) and legitimate shapes (must
// stay silent). The rules are scoped by globs in eslint.config.mjs, so these
// cases judge only the detection; the glob wiring is proven by `pnpm lint`.
//
// Run: pnpm verify:lint-rules:test
// ---------------------------------------------------------------------------

import { join } from 'node:path'
import { describe, test } from 'node:test'

import { RuleTester } from 'eslint'
import checkFile from 'eslint-plugin-check-file'
import tseslint from 'typescript-eslint'

import { FILENAME_RULES } from '../eslint.rules.mjs'
import localRules from './index.mjs'

RuleTester.describe = describe
RuleTester.it = test
RuleTester.itOnly = test.only

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    sourceType: 'module'
  }
})

const { rules } = localRules

const invalid = ({ code, errors }) => ({
  code,
  errors: errors.map((messageId) => ({ messageId }))
})

ruleTester.run('core-import-boundary', rules['core-import-boundary'], {
  invalid: [
    invalid({
      code: "import { AppError } from '@/errors/AppError.helper'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "import { readFileSync } from 'node:fs'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "import { useState } from 'react'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "import { createClient } from '@supabase/supabase-js'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "export { z } from 'zod'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "export * from '@/errors/AppError.helper'",
      errors: ['vendorInCore']
    })
  ],
  valid: [
    "import { scrubPII } from './scrubPII.helper'",
    "import type { IHostConsole } from '../../utils/hostConsole.helper'",
    "export { AppError } from './errors/AppError.helper'",
    "export * from './ports/observability/observabilityLevel.type'",
    'export const local = 1'
  ]
})

ruleTester.run('suffix-contract', rules['suffix-contract'], {
  invalid: [
    invalid({
      code: 'export interface IButtonProps { label: string }',
      errors: ['typeInView']
    }),
    invalid({
      code: 'type StateType = "idle" | "busy"',
      errors: ['typeInView']
    }),
    invalid({
      code: 'export enum ToneEnum { Calm = "calm" }',
      errors: ['typeInView']
    }),
    invalid({
      code: 'export const MAX_RETRY = 3',
      errors: ['constInView']
    }),
    invalid({
      code: 'const DEFAULT_LIMIT = 50, _PRIVATE_KEY = "k"',
      errors: ['constInView', 'constInView']
    })
  ],
  valid: [
    'export const useItems = () => ({ items: [] })',
    'export const Button = () => null',
    'const helperValue = 3',
    'let MUTABLE_FLAG = false',
    'const useLocal = () => { const LIMIT = 2; return LIMIT }',
    'const build = () => { interface ILocal { id: string }; return {} as ILocal }'
  ]
})

ruleTester.run('pure-domain-adapter', rules['pure-domain-adapter'], {
  invalid: [
    invalid({
      code: 'export const adaptItem = async (dto) => dto',
      errors: ['asyncAdapter']
    }),
    invalid({
      code: 'export const adaptItem = async (load) => { const dto = await load(); return dto }',
      errors: ['asyncAdapter', 'awaitInAdapter']
    }),
    invalid({
      code: 'export async function adaptItem(dto) { return dto }',
      errors: ['asyncAdapter']
    }),
    invalid({
      code: 'export const adaptItem = async function (dto) { return dto }',
      errors: ['asyncAdapter']
    }),
    invalid({
      code: "export const adaptItem = () => fetch('/items')",
      errors: ['ioInAdapter']
    }),
    invalid({
      code: "export const adaptItem = (client) => client.fetch('/items')",
      errors: ['ioInAdapter']
    })
  ],
  valid: [
    'export const adaptItem = (dto) => ({ id: dto.id, title: dto.title })',
    'export const adaptItems = (dtos) => dtos.map((dto) => ({ id: dto.id }))',
    'export const toDate = (iso) => new Date(iso)'
  ]
})

ruleTester.run('no-justifying-comment', rules['no-justifying-comment'], {
  invalid: [
    invalid({
      code: '// Kept here not because it is faster.\nconst a = 1',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '/* This helper exists because the SDK leaks. */\nconst b = 2',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// The seam exists to keep tests honest.\nconst c = 3',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// A shortcut here trains everyone to skip the port.\nconst d = 4',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// The old doc says the opposite.\nconst e = 5',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// Memoizing buys nothing here.\nconst f = 6',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// Measured 2026-07-27 at 40ms.\nconst g = 7',
      errors: ['justifyingComment']
    })
  ],
  valid: [
    '// Loads the module under test. Dynamic so vi.mock applies first.\nconst a = 1',
    '// Returns the fallback key instead of an empty string.\nconst b = 2',
    '// measured 2026-07-27 in a lowercase prose mention.\nconst c = 3',
    "const d = 'this string is not because of anything'"
  ]
})

// The filename suffix contract (code-standards §3) is a check-file rule, not a
// local one. These cases run it with the options eslint.rules.mjs configures,
// so they pin the suffix glob itself: the style-constant suffix is the
// singular `.style.ts`, like every other binding suffix.
const [, suffixPatterns, suffixOptions] =
  FILENAME_RULES['check-file/filename-naming-convention']

const sourceFile = ({ path }) => ({
  code: 'export const A = 1',
  filename: join(process.cwd(), path),
  options: [suffixPatterns, suffixOptions]
})

ruleTester.run(
  'check-file/filename-naming-convention',
  checkFile.rules['filename-naming-convention'],
  {
    invalid: [
      {
        ...sourceFile({
          path: 'apps/web/src/components/ui/Chip/Chip.styles.ts'
        }),
        errors: [{ message: suffixOptions.errorMessage }]
      },
      {
        ...sourceFile({ path: 'apps/web/src/screens/Login/Login.css.ts' }),
        errors: [{ message: suffixOptions.errorMessage }]
      }
    ],
    valid: [
      sourceFile({
        path: 'apps/web/src/components/ui/Chip/Chip.style.ts'
      }),
      sourceFile({ path: 'apps/mobile/src/screens/Login/Login.style.ts' }),
      sourceFile({
        path: 'apps/web/src/components/ui/Chip/Chip.constant.ts'
      }),
      sourceFile({ path: 'apps/web/src/components/ui/Chip/index.ts' })
    ]
  }
)
