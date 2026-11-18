import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const store = vi.hoisted(() => ({
  cookie: undefined as string | undefined
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'NEXT_LOCALE' && store.cookie !== undefined
        ? { value: store.cookie }
        : undefined
  })
}))

import { I18N_TIME_ZONE } from '@/i18n/i18n.constant'
import { resolveRequestConfig } from '@/i18n/requestConfig.helper'

describe('resolveRequestConfig', () => {
  beforeEach(() => {
    store.cookie = undefined
  })

  test('takes the locale cookie over the routing locale', async () => {
    store.cookie = LanguageEnum.ES

    expect(
      await resolveRequestConfig({
        requestLocale: Promise.resolve(LanguageEnum.EN)
      })
    ).toEqual({
      locale: LanguageEnum.ES,
      messages: resources[LanguageEnum.ES].translation,
      timeZone: I18N_TIME_ZONE
    })
  })

  test('takes the routing locale when no cookie is set, else the default', async () => {
    expect(
      (
        await resolveRequestConfig({
          requestLocale: Promise.resolve(LanguageEnum.ES)
        })
      ).locale
    ).toBe(LanguageEnum.ES)
    expect(
      await resolveRequestConfig({ requestLocale: Promise.resolve('fr') })
    ).toEqual({
      locale: DEFAULT_LANGUAGE,
      messages: resources[DEFAULT_LANGUAGE].translation,
      timeZone: I18N_TIME_ZONE
    })
  })
})
