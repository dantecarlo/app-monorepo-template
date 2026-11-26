import ts from 'typescript'
import { describe, expect, expectTypeOf, test } from 'vitest'

import type {
  IAppTranslator,
  ILocaleResources,
  LanguageEnumType,
  SupportedLanguageType,
  TranslationKeyType,
  TranslationValuesType
} from '@/index'
import * as entry from '@/index'

// How the compiler reads the entry: as the package resolves it, with no
// ambient types, since only the names it exports are read.
const ENTRY_COMPILER_OPTIONS: ts.CompilerOptions = {
  lib: ['lib.es2022.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noEmit: true,
  resolveJsonModule: true,
  target: ts.ScriptTarget.ES2022,
  types: []
}

// Every name the entry exports, its types included, which a value import
// such as `entry` does not show.
const exportedNames = ({ path }: { path: string }): string[] => {
  const program = ts.createProgram([path], ENTRY_COMPILER_OPTIONS)
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(path)
  const entrySymbol = source && checker.getSymbolAtLocation(source)
  return entrySymbol
    ? checker
        .getExportsOfModule(entrySymbol)
        .map(({ name }) => name)
        .sort()
    : []
}

describe('@app/i18n', () => {
  test('the entry point exposes the language contract and the translator types', () => {
    expect(Object.keys(entry).sort()).toEqual([
      'APP_NAME',
      'DEFAULT_LANGUAGE',
      'FALLBACK_LANGUAGE',
      'FORMATTING_LOCALE',
      'LanguageEnum',
      'SUPPORTED_LANGUAGES',
      'resources'
    ])
    expectTypeOf<SupportedLanguageType>().toEqualTypeOf<LanguageEnumType>()
    expectTypeOf<ILocaleResources['translation']>().toHaveProperty('app')
    expectTypeOf<IAppTranslator['t']>().parameters.toEqualTypeOf<
      [TranslationKeyType, TranslationValuesType?]
    >()
  })

  test('the entry point exports no catalog shape, only the types above', () => {
    // The entry, src/index.ts, two folders up from this test file.
    const path = ts.sys.resolvePath(
      `${expect.getState().testPath}/../../index.ts`
    )

    expect(exportedNames({ path })).toEqual([
      'APP_NAME',
      'DEFAULT_LANGUAGE',
      'FALLBACK_LANGUAGE',
      'FORMATTING_LOCALE',
      'IAppTranslator',
      'ILocaleResources',
      'LanguageEnum',
      'LanguageEnumType',
      'SUPPORTED_LANGUAGES',
      'SupportedLanguageType',
      'TranslationKeyType',
      'TranslationValuesType',
      'resources'
    ])
  })
})
