'use client'

import '@/app/globals.css'

import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { DEFAULT_THEME } from '@app/tokens'
import { NextIntlClientProvider } from 'next-intl'
import type { ComponentProps } from 'react'

import RouteError from '@/app/error'

const I18N_TIME_ZONE = 'UTC'

type GlobalErrorPropsType = ComponentProps<typeof RouteError>

// Replaces the root layout when it crashes, so it renders its own document
// and translation provider.
const GlobalError = ({
  error,
  reset,
  unstable_retry: retry
}: GlobalErrorPropsType) => (
  <html data-theme={DEFAULT_THEME} lang={DEFAULT_LANGUAGE}>
    <body className="min-h-screen">
      <NextIntlClientProvider
        locale={DEFAULT_LANGUAGE}
        messages={resources[DEFAULT_LANGUAGE].translation}
        timeZone={I18N_TIME_ZONE}
      >
        <RouteError error={error} reset={reset} unstable_retry={retry} />
      </NextIntlClientProvider>
    </body>
  </html>
)

export default GlobalError
