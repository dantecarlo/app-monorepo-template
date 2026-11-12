import type { IAuthGateway } from '@app/core'
import type { ReactNode } from 'react'

export interface IAuthProviderProps {
  children: ReactNode
  gateway: IAuthGateway
}

export interface IUseAuthBootstrapParams {
  gateway: IAuthGateway
}
