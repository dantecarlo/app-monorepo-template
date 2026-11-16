'use client'

import type { IAuthGateway } from '@app/core'
import type { SupportedLanguageType } from '@app/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { AuthProvider } from '@/components/AuthProvider'
import { Toast } from '@/components/ui/Toast'
import { I18N_TIME_ZONE } from '@/i18n/i18n.constant'
import { useDocumentLanguage } from '@/i18n/useDocumentLanguage.hook'
import { observability } from '@/lib/observability/observability.adapter'
import { toCaptureError } from '@/lib/observability/toCaptureError.helper'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'

let browserQueryClient: QueryClient | undefined

const getQueryClient = (): QueryClient => {
  const onCaptureError = toCaptureError({ observability })
  if (typeof window === 'undefined') {
    return createQueryClient({ onCaptureError })
  }
  browserQueryClient ??= createQueryClient({ onCaptureError })
  return browserQueryClient
}

export interface IProvidersProps {
  children: React.ReactNode
  gateway: IAuthGateway
  /** The active locale, which the request config resolved on the server. */
  locale: SupportedLanguageType
  messages: ComponentProps<typeof NextIntlClientProvider>['messages']
}

export const Providers = ({
  children,
  gateway,
  locale,
  messages
}: IProvidersProps): React.JSX.Element => {
  const [queryClient] = useState(() => getQueryClient())
  useDocumentLanguage({ locale })

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={I18N_TIME_ZONE}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider gateway={gateway}>{children}</AuthProvider>
        <Toast />
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}
