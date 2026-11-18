import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/i18n/appTranslator.adapter', () => ({
  getAppLocale: async () => LanguageEnum.ES,
  getAppMessages: async () => resources[LanguageEnum.ES].translation
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() })
}))

import { LocaleProviders } from '@/app/LocaleProviders'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { render, screen } from '@/test/test.helper'

const spanish = resources[LanguageEnum.ES].translation

describe('LocaleProviders', () => {
  test("hands the request's locale and messages to the client providers", async () => {
    render(await LocaleProviders({ children: <LanguageSwitcher /> }))

    expect(
      screen.getByRole('button', {
        name: spanish.auth.languageSwitcher.label
      })
    ).toHaveTextContent(LanguageEnum.ES)
  })
})
