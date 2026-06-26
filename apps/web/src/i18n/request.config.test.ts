import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { beforeEach, describe, expect, test, vi } from 'vitest'

let cookieValue: string | undefined

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'NEXT_LOCALE' && cookieValue !== undefined
        ? { value: cookieValue }
        : undefined
  })
}))

vi.mock('next-intl/server', () => ({
  getRequestConfig: (
    fn: Parameters<typeof import('next-intl/server').getRequestConfig>[0]
  ) => fn
}))

interface IResolvedConfig {
  locale: string
  messages: Record<string, unknown>
  timeZone: string
}

type ConfigFactoryType = (args: {
  requestLocale: Promise<string | undefined>
}) => Promise<IResolvedConfig>

const loadFactory = async (): Promise<ConfigFactoryType> =>
  (await import('./request.config'))
    .default as unknown as ConfigFactoryType

describe('request.config', () => {
  beforeEach(() => {
    cookieValue = undefined
  })

  test('falls back to the default language when no cookie is set', async () => {
    const factory = await loadFactory()

    const config = await factory({
      requestLocale: Promise.resolve(undefined)
    })

    expect(config.locale).toBe(DEFAULT_LANGUAGE)
    expect(config.messages).toEqual(
      resources[DEFAULT_LANGUAGE].translation
    )
    expect(config.timeZone).toBe('UTC')
  })

  test('resolves the locale from the NEXT_LOCALE cookie', async () => {
    cookieValue = LanguageEnum.ES
    const factory = await loadFactory()

    const config = await factory({
      requestLocale: Promise.resolve(undefined)
    })

    expect(config.locale).toBe(LanguageEnum.ES)
    expect(config.messages).toEqual(resources[LanguageEnum.ES].translation)
  })

  test('ignores an unsupported cookie value', async () => {
    cookieValue = 'fr'
    const factory = await loadFactory()

    const config = await factory({
      requestLocale: Promise.resolve(undefined)
    })

    expect(config.locale).toBe(DEFAULT_LANGUAGE)
  })
})
