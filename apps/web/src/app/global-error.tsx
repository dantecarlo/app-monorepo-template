'use client'

import '@/app/globals.css'

import { resources } from '@app/i18n'
import { DEFAULT_THEME } from '@app/tokens'
import type { ComponentProps } from 'react'

import RouteError from '@/app/error'
import { useCookieLanguage } from '@/i18n/useCookieLanguage.hook'
import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'

type GlobalErrorPropsType = ComponentProps<typeof RouteError>

// Replaces the root layout when it crashes, so it renders its own document
// and translation provider, in the language the NEXT_LOCALE cookie names:
// no request config runs above it.
const GlobalError = ({
  error,
  reset,
  unstable_retry: retry
}: GlobalErrorPropsType) => {
  const locale = useCookieLanguage()

  return (
    <html data-theme={DEFAULT_THEME} lang={locale}>
      <body className="min-h-screen">
        <AppI18nProvider
          locale={locale}
          messages={resources[locale].translation}
        >
          <RouteError error={error} reset={reset} unstable_retry={retry} />
        </AppI18nProvider>
      </body>
    </html>
  )
}

export default GlobalError
