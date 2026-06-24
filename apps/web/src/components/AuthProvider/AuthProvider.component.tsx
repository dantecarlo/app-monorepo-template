'use client'

import type { IAuthGateway } from '@app/core'
import type { JSX, ReactNode } from 'react'

import { useAuthBootstrap } from '@/components/AuthProvider/useAuthBootstrap.hook'

export interface IAuthProviderProps {
  children: ReactNode
  gateway: IAuthGateway
}

export const AuthProvider = ({
  children,
  gateway
}: IAuthProviderProps): JSX.Element => {
  useAuthBootstrap({ gateway })
  return <>{children}</>
}
