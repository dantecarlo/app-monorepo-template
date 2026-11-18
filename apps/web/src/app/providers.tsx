'use client'

import type { IAuthGateway } from '@app/core'
import type { SupportedLanguageType } from '@app/i18n'
import { useState } from 'react'

import { AuthProvider } from '@/components/AuthProvider'
import { Toast } from '@/components/ui/Toast'
import { useDocumentLanguage } from '@/i18n/useDocumentLanguage.hook'
import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import type { AppMessagesType } from '@/lib/i18n/AppI18nProvider.type'
import { observability } from '@/lib/observability/observability.adapter'
import { toCaptureError } from '@/lib/observability/toCaptureError.helper'
import type { AppQueryClientType } from '@/lib/query/appQueryClient.type'
import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'

let browserQueryClient: AppQueryClientType | undefined

const getQueryClient = (): AppQueryClientType => {
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
  /** The catalog of that locale. */
  messages: AppMessagesType
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
    <AppI18nProvider locale={locale} messages={messages}>
      <AppQueryProvider client={queryClient}>
        <AuthProvider gateway={gateway}>{children}</AuthProvider>
        <Toast />
      </AppQueryProvider>
    </AppI18nProvider>
  )
}
