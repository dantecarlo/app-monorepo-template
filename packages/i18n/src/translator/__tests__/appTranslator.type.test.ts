import { describe, expectTypeOf, test } from 'vitest'

import type {
  IAppTranslator,
  TranslationKeyType,
  TranslationValuesType
} from '@/translator/appTranslator.type'

describe('IAppTranslator', () => {
  test('a key is a dot-separated path to a leaf of the English catalog', () => {
    expectTypeOf<'items.dashboard.title'>().toExtend<TranslationKeyType>()
    expectTypeOf<'components.errorState.byCode.404.title'>().toExtend<TranslationKeyType>()
    expectTypeOf<IAppTranslator['t']>()
      .parameter(0)
      .toEqualTypeOf<TranslationKeyType>()
    expectTypeOf<IAppTranslator['t']>()
      .parameter(1)
      .toEqualTypeOf<TranslationValuesType | undefined>()
    expectTypeOf<IAppTranslator['t']>().returns.toEqualTypeOf<string>()
  })

  test('a namespace or a path the catalog lacks is not a key', () => {
    expectTypeOf<'items.dashboard'>().not.toExtend<TranslationKeyType>()
    expectTypeOf<'items.dashboard.missing'>().not.toExtend<TranslationKeyType>()
    expectTypeOf<'items'>().not.toExtend<TranslationKeyType>()
  })

  test('has narrows a string to a key', () => {
    const translate = ({
      key,
      translator
    }: {
      key: string
      translator: IAppTranslator
    }): string => {
      if (!translator.has(key)) return key
      expectTypeOf(key).toEqualTypeOf<TranslationKeyType>()
      return translator.t(key)
    }

    expectTypeOf(translate).returns.toEqualTypeOf<string>()
    expectTypeOf<IAppTranslator['locale']>().toEqualTypeOf<'en' | 'es'>()
  })
})
