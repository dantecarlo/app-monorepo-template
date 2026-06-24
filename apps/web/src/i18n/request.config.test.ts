import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getRequestConfig: (
    fn: Parameters<typeof import('next-intl/server').getRequestConfig>[0]
  ) => fn
}))

describe('request.config', () => {
  it('resolves with the default language and its messages', async () => {
    const factory = (await import('./request.config'))
      .default as unknown as () => Promise<{
      locale: string
      messages: Record<string, unknown>
      timeZone: string
    }>

    const config = await factory()

    expect(config.locale).toBe(DEFAULT_LANGUAGE)
    expect(config.messages).toEqual(
      resources[DEFAULT_LANGUAGE].translation
    )
    expect(config.timeZone).toBe('UTC')
  })
})
