import type { IAuthGateway } from '@app/core'
import type { ReactNode } from 'react'
import { Fragment } from 'react'

import { useAuthBootstrap } from '@/components/AuthProvider/useAuthBootstrap.hook'

export interface IAuthProviderProps {
  children: ReactNode
  gateway: IAuthGateway
}

export const AuthProvider = ({
  children,
  gateway
}: IAuthProviderProps) => {
  useAuthBootstrap({ gateway })
  return <Fragment>{children}</Fragment>
}
