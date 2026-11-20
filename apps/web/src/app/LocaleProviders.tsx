import type { ReactNode } from 'react'

import { AuthProviders } from '@/app/AuthProviders'
import {
  getAppLocale,
  getAppMessages
} from '@/lib/i18n/appTranslator.adapter'

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
  const [locale, messages] = await Promise.all([
    getAppLocale(),
    getAppMessages()
  ])

  return (
    <AuthProviders locale={locale} messages={messages}>
      {children}
    </AuthProviders>
  )
}
