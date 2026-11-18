'use client'

import {
  keepPreviousData as keepPreviousDataPlaceholder,
  useQuery
} from '@tanstack/react-query'
import { useMemo } from 'react'

import { omitUndefined } from '@/lib/query/omitUndefined.helper'
import type {
  IAppQueryOptions,
  IAppQueryResult
} from '@/lib/query/useAppQuery.type'

/**
 * A query with an optional adapter. A failure queues no toast: the screen
 * that runs the query shows it, in its ErrorState or AsyncBoundary
 * (code-standards §19), and the query cache reports it once. It returns
 * only the fields of IAppQueryResult, so no caller reads the library's own,
 * and the same object while none of them changed.
 */
export const useAppQuery = <TData, TError extends Error = Error>({
  adapter,
  queryOptions
}: IAppQueryOptions<TData>): IAppQueryResult<TData, TError> => {
  const {
    enabled,
    keepPreviousData,
    networkMode,
    queryFn,
    queryKey,
    retry,
    staleTime
  } = queryOptions

  const { data, error, isError, isLoading, isSuccess, refetch } = useQuery<
    TData,
    TError
  >({
    ...omitUndefined({ enabled, networkMode, retry, staleTime }),
    ...(keepPreviousData
      ? { placeholderData: keepPreviousDataPlaceholder }
      : {}),
    queryFn,
    queryKey,
    ...(adapter
      ? {
          select: (raw: TData) => adapter(raw)
        }
      : {})
  })

  return useMemo(
    () => ({ data, error, isError, isLoading, isSuccess, refetch }),
    [data, error, isError, isLoading, isSuccess, refetch]
  )
}
