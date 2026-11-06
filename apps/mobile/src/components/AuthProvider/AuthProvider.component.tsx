import React, { Fragment } from 'react'

import type { IAuthProviderProps } from '@/components/AuthProvider/AuthProvider.type'
import { useAuthBootstrap } from '@/components/AuthProvider/useAuthBootstrap.hook'

export const AuthProvider = ({
  children,
  gateway
}: IAuthProviderProps) => {
  useAuthBootstrap({ gateway })
  return <Fragment>{children}</Fragment>
}
