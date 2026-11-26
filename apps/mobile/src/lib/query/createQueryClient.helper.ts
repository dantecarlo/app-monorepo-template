import { sanitizeQueryKey } from '@app/core'
import {
  MutationCache,
  QueryCache,
  QueryClient
} from '@tanstack/react-query'

import type { AppQueryClientType } from '@/lib/query/appQueryClient.type'
import { STRUCTURAL_QUERY_KEY_SEGMENTS } from '@/lib/query/queryKeys.constant'

const STALE_TIME_MS = 30_000

export interface ICreateQueryClientParams {
  onCaptureError?: (
    error: unknown,
    ctx: { queryKey?: string[]; source: string }
  ) => void
}

export const createQueryClient = ({
  onCaptureError = () => undefined
}: ICreateQueryClientParams = {}): AppQueryClientType =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { retry: 1, staleTime: STALE_TIME_MS }
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        void onCaptureError(error, { source: 'mutationCache' })
      }
    }),
    queryCache: new QueryCache({
      // The cache calls onError with the error and the query as two
      // arguments: they arrive here as one list.
      onError: (...[error, query]) => {
        void onCaptureError(error, {
          queryKey: sanitizeQueryKey({
            queryKey: query.queryKey,
            structuralSegments: STRUCTURAL_QUERY_KEY_SEGMENTS
          }),
          source: 'queryCache'
        })
      }
    })
  })
