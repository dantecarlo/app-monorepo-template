import { describe, expect, expectTypeOf, test } from 'vitest'

import type {
  IAppTranslator,
  ILocaleResources,
  LanguageEnumType,
  SupportedLanguageType,
  TranslationKeyType,
  TranslationValuesType
} from '@/index'
// @ts-expect-error the catalog shape stays inside the package
import type { TranslationKeysType } from '@/index'
import * as entry from '@/index'

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
    expectTypeOf<TranslationKeysType>().toBeAny()
  })
})
