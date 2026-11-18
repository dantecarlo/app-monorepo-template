'use client'

import { NextIntlClientProvider } from 'next-intl'
import type { JSX } from 'react'

import { I18N_TIME_ZONE } from '@/i18n/i18n.constant'
import type { IAppI18nProviderProps } from '@/lib/i18n/AppI18nProvider.type'

/**
 * The translation context of every client component below it, in the locale
 * and the catalog it is given, formatting in the app's time zone: the one
 * place a client tree meets next-intl's provider.
 */
export const AppI18nProvider = ({
  children,
  locale,
  messages
}: IAppI18nProviderProps): JSX.Element => (
  <NextIntlClientProvider
    locale={locale}
    messages={messages}
    timeZone={I18N_TIME_ZONE}
  >
    {children}
  </NextIntlClientProvider>
)
