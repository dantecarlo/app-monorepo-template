import { LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { render, screen } from '@/test/test.helper'

const spanish = resources[LanguageEnum.ES].translation

const Title = () => {
  const { locale, t } = useAppTranslator()
  return <h1 lang={locale}>{t('items.dashboard.title')}</h1>
}

describe('AppI18nProvider', () => {
  test('gives its children the locale and the catalog it is given', () => {
    render(
      <AppI18nProvider locale={LanguageEnum.ES} messages={spanish}>
        <Title />
      </AppI18nProvider>
    )

    expect(
      screen.getByRole('heading', { name: spanish.items.dashboard.title })
    ).toHaveAttribute('lang', LanguageEnum.ES)
  })
})
