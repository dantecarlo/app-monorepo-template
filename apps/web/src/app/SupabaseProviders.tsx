'use client'

import type { IAuthGateway } from '@app/core'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { Providers } from '@/app/providers'
import { getAuthGateway } from '@/lib/supabase/authGateway.adapter'

type ISupabaseProvidersPropsType = Omit<
  ComponentProps<typeof Providers>,
  'gateway'
>

// The browser's auth gateway, the one the auth service signs in through: a
// no-op during server rendering and without the Supabase settings.
export const SupabaseProviders = ({
  children,
  messages
}: ISupabaseProvidersPropsType): React.JSX.Element => {
  const [gateway] = useState<IAuthGateway>(getAuthGateway)

  return (
    <Providers gateway={gateway} messages={messages}>
      {children}
    </Providers>
  )
}
