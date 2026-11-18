import type { ReactNode } from 'react'

import type { AppQueryClientType } from '@/lib/query/appQueryClient.type'

export interface IAppQueryProviderProps {
  children: ReactNode
  /** The client the tree's queries and mutations are cached in. */
  client: AppQueryClientType
}
