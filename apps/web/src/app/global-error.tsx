'use client'

import '@/app/globals.css'

import { resources } from '@app/i18n'
import { DEFAULT_THEME } from '@app/tokens'
import { NextIntlClientProvider } from 'next-intl'
import type { ComponentProps } from 'react'

import RouteError from '@/app/error'
import { I18N_TIME_ZONE } from '@/i18n/i18n.constant'
import { useCookieLanguage } from '@/i18n/useCookieLanguage.hook'

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
        <NextIntlClientProvider
          locale={locale}
          messages={resources[locale].translation}
          timeZone={I18N_TIME_ZONE}
        >
          <RouteError error={error} reset={reset} unstable_retry={retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export default GlobalError
