'use client'

import type { IAuthGateway } from '@app/core'
import { createSupabaseAuthGateway } from '@app/supabase'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { Providers } from '@/app/providers'
import { getSupabaseClient } from '@/lib/supabase/client.adapter'

type ISupabaseProvidersPropsType = Omit<
  ComponentProps<typeof Providers>,
  'gateway'
>

const noopGateway: IAuthGateway = {
  getSession: () => Promise.resolve(null),
  onAuthStateChange: () => ({ unsubscribe: () => undefined }),
  signIn: () => Promise.reject(new Error('auth not ready')),
  signOut: () => Promise.resolve()
}

let browserGateway: IAuthGateway | undefined

const getBrowserGateway = (): IAuthGateway => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return noopGateway
  }
  browserGateway ??= createSupabaseAuthGateway(getSupabaseClient())
  return browserGateway
}

export const SupabaseProviders = ({
  children,
  messages
}: ISupabaseProvidersPropsType): React.JSX.Element => {
  const [gateway] = useState<IAuthGateway>(() =>
    typeof window === 'undefined' ? noopGateway : getBrowserGateway()
  )

  return (
    <Providers gateway={gateway} messages={messages}>
      {children}
    </Providers>
  )
}
