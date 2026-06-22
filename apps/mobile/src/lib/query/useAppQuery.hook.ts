// Mirrors apps/web/src/lib/query/useAppQuery.hook.ts.
// TanStack Query v5 works identically in React Native.
// 'use client' directive removed — not applicable in RN.

import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'

import { useToastStore } from '@/stores/toast.store'

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
    const message =
      errorMessage ??
      (result.error instanceof Error
        ? result.error.message
        : 'An error occurred')
    setTimeout(() => addToast({ message, variant: 'error' }), 0)
  }

  return result
}
