'use client'

import type { IAuthGateway } from '@app/core'
import { DEFAULT_LANGUAGE } from '@app/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { AuthProvider } from '@/components/AuthProvider'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'

const I18N_TIME_ZONE = 'UTC'

let browserQueryClient: QueryClient | undefined

const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') {
    return createQueryClient()
  }
  browserQueryClient ??= createQueryClient()
  return browserQueryClient
}

export interface IProvidersProps {
  children: React.ReactNode
  gateway: IAuthGateway
  messages: ComponentProps<typeof NextIntlClientProvider>['messages']
}

export const Providers = ({
  children,
  gateway,
  messages
}: IProvidersProps): React.JSX.Element => {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <NextIntlClientProvider
      locale={DEFAULT_LANGUAGE}
      messages={messages}
      timeZone={I18N_TIME_ZONE}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider gateway={gateway}>{children}</AuthProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}
