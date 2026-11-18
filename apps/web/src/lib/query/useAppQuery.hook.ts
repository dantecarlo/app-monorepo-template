'use client'

import { useQuery } from '@tanstack/react-query'

import type {
  IAppQueryOptions,
  IAppQueryResult
} from '@/lib/query/useAppQuery.type'

/**
 * A query with an optional adapter. A failure queues no toast: the screen
 * that runs the query shows it, in its ErrorState or AsyncBoundary
 * (code-standards §19), and the query cache reports it once. It returns
 * only the fields of IAppQueryResult, so no caller reads the library's own.
 */
export const useAppQuery = <TData, TError extends Error = Error>({
  adapter,
  queryOptions
}: IAppQueryOptions<TData>): IAppQueryResult<TData, TError> => {
  const { data, error, isError, isLoading, isSuccess, refetch } = useQuery<
    TData,
    TError
  >({
    queryFn: queryOptions.queryFn,
    queryKey: queryOptions.queryKey,
    ...(adapter
      ? {
          select: (raw: TData) => adapter(raw)
        }
      : {})
  })

  return { data, error, isError, isLoading, isSuccess, refetch }
}
