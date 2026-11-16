import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'

import type { IAppQueryOptions } from '@/lib/query/useAppQuery.type'

/**
 * A query with an optional adapter. A failure adds no toast: the screen that
 * runs the query shows it, in its ErrorState or AsyncBoundary
 * (code-standards §19), and the query cache reports it once.
 */
export const useAppQuery = <TData, TError extends Error = Error>({
  adapter,
  queryOptions
}: IAppQueryOptions<TData, TError>): UseQueryResult<TData, TError> =>
  useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter ? { select: (raw: TData) => adapter(raw) } : {})
  } as UseQueryOptions<TData, TError, TData, QueryKey>)
