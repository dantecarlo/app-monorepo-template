'use client'

import type { JSX } from 'react'

import type { IAuthProviderProps } from '@/components/AuthProvider/AuthProvider.type'
import { useAuthBootstrap } from '@/components/AuthProvider/useAuthBootstrap.hook'

export const AuthProvider = ({
  children,
  gateway
}: IAuthProviderProps): JSX.Element => {
  useAuthBootstrap({ gateway })
  return <>{children}</>
}
