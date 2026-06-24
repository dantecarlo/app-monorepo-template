import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'

import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'
import { useToastStore } from '@/stores/toast.store'

const ERROR_FALLBACK = 'An error occurred'

export interface IAppQueryOptions<TData, TError = Error> {
  adapter?: (raw: TData) => TData
  errorMessage?: string
  queryOptions: UseQueryOptions<TData, TError>
}

export const useAppQuery = <TData, TError extends Error = Error>({
  adapter,
  errorMessage,
  queryOptions
}: IAppQueryOptions<TData, TError>): UseQueryResult<TData, TError> => {
  const addToast = useToastStore((s) => s.add)

  const result = useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter ? { select: (raw: TData) => adapter(raw) } : {})
  } as UseQueryOptions<TData, TError, TData, QueryKey>)

  if (result.isError && result.error) {
    const message = resolveErrorMessage({
      error: result.error,
      errorMessage,
      fallback: ERROR_FALLBACK,
      hasKey: () => false,
      translate: (k) => k
    })
    setTimeout(() => addToast({ message, variant: 'error' }), 0)
  }

  return result
}
