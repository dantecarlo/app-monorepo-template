'use client'

import type { IAuthGateway } from '@app/core'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { Providers } from '@/app/providers'
import { getAuthGateway } from '@/lib/auth/authGateway.adapter'

type IAuthProvidersPropsType = Omit<
  ComponentProps<typeof Providers>,
  'gateway'
>

// The browser's auth gateway, the one the auth service signs in through:
// the backend's (src/lib/auth/), a no-op during server rendering.
export const AuthProviders = ({
  children,
  locale,
  messages
}: IAuthProvidersPropsType): React.JSX.Element => {
  const [gateway] = useState<IAuthGateway>(getAuthGateway)

  return (
    <Providers gateway={gateway} locale={locale} messages={messages}>
      {children}
    </Providers>
  )
}
