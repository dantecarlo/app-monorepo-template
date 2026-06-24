import { sanitizeQueryKey } from '@app/core'
import {
  MutationCache,
  QueryCache,
  QueryClient
} from '@tanstack/react-query'

const STALE_TIME_MS = 30_000

export interface ICreateQueryClientParams {
  onCaptureError?: (
    error: unknown,
    ctx: { queryKey?: string[]; source: string }
  ) => void
}

export const createQueryClient = ({
  onCaptureError = () => undefined
}: ICreateQueryClientParams = {}): QueryClient =>
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
      onError: (error, query) => {
        void onCaptureError(error, {
          queryKey: sanitizeQueryKey({ queryKey: query.queryKey }),
          source: 'queryCache'
        })
      }
    })
  })
