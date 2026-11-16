import { getLocale, getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

import { SupabaseProviders } from '@/app/SupabaseProviders'
import { toSupportedLanguage } from '@/i18n/locale.helper'

interface ILocaleProvidersProps {
  children: ReactNode
}

// Reads the request's locale and its catalog through the request config,
// which reads the NEXT_LOCALE cookie, and hands both to the client
// providers. Reading the request makes this subtree render per request, so
// the root layout renders it inside <Suspense> and keeps its shell static.
export const LocaleProviders = async ({
  children
}: ILocaleProvidersProps): Promise<React.JSX.Element> => {
  const locale = toSupportedLanguage({ value: await getLocale() })
  const messages = await getMessages()

  return (
    <SupabaseProviders locale={locale} messages={messages}>
      {children}
    </SupabaseProviders>
  )
}
