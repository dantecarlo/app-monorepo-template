import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { createTranslator } from 'next-intl'
import { beforeEach, describe, expect, test, vi } from 'vitest'

// The request config's result, as next-intl's server functions read it.
const request = vi.hoisted(() => ({
  locale: 'es',
  messages: {} as Record<string, unknown>
}))

vi.mock('next-intl/server', () => ({
  getLocale: async () => request.locale,
  getMessages: async () => request.messages,
  getTranslations: async () =>
    createTranslator({
      locale: request.locale,
      messages: request.messages
    })
}))

import {
  getAppLocale,
  getAppMessages,
  getAppTranslator
} from '@/lib/i18n/appTranslator.adapter'

const spanish = resources[LanguageEnum.ES].translation

describe('appTranslator adapter', () => {
  beforeEach(() => {
    request.locale = LanguageEnum.ES
    request.messages = spanish
  })

  test("gives a server component the translator of the request's locale", async () => {
    const translator = await getAppTranslator()

    expect(translator.t('items.summary.title')).toBe(
      spanish.items.summary.title
    )
    expect(translator.t('auth.logo.label', { name: 'Acme' })).toBe(
      spanish.auth.logo.label.replace('{name}', 'Acme')
    )
    expect(translator.has('items.summary.total')).toBe(true)
    expect(translator.has('items.summary')).toBe(false)
    expect(translator.has('items.missing')).toBe(false)
    expect(translator.locale).toBe(LanguageEnum.ES)
  })

  test("reduces the request's locale to a supported language", async () => {
    request.locale = 'fr'

    expect(await getAppLocale()).toBe(DEFAULT_LANGUAGE)
  })

  test("hands the request's catalog over", async () => {
    expect(await getAppMessages()).toBe(spanish)
  })
})
