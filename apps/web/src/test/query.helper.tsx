import { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import type { AppQueryClientType } from '@/lib/query/appQueryClient.type'
import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'

/**
 * A query client for one test: no query or mutation retries, so a failure
 * settles at once instead of after the app client's retry delay.
 */
export const createTestQueryClient = (): AppQueryClientType =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false }
    }
  })

interface IQueryWrapperProps {
  children: ReactNode
}

export interface ICreateQueryWrapperParams {
  /** The client the tree reads: a fresh test client by default. */
  client?: AppQueryClientType
}

/**
 * The wrapper of a render or a renderHook whose tree runs queries: the
 * app's AppQueryProvider over the client it is given, so a test of a hook
 * or a screen never reaches TanStack Query itself.
 */
export const createQueryWrapper = ({
  client = createTestQueryClient()
}: ICreateQueryWrapperParams = {}) => {
  const QueryWrapper = ({ children }: IQueryWrapperProps) => (
    <AppQueryProvider client={client}>{children}</AppQueryProvider>
  )
  return QueryWrapper
}
