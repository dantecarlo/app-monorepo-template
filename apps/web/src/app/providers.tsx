'use client'

import { createSupabaseAuthGateway } from '@app/supabase'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { useState } from 'react'
import type { Messages } from 'use-intl'

import { AuthProvider } from '@/components/AuthProvider'
import { createQueryClient } from '@/lib/query/createQueryClient.helper'
import { supabase } from '@/lib/supabase/client.adapter'

const I18N_TIME_ZONE = 'UTC'

let browserQueryClient: QueryClient | undefined

const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') {
    return createQueryClient()
  }
  browserQueryClient ??= createQueryClient()
  return browserQueryClient
}

const authGateway = createSupabaseAuthGateway(supabase)

export interface IProvidersProps {
  children: React.ReactNode
  messages: Messages
}

export const Providers = ({
  children,
  messages
}: IProvidersProps): React.JSX.Element => {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <NextIntlClientProvider messages={messages} timeZone={I18N_TIME_ZONE}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider gateway={authGateway}>{children}</AuthProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}
