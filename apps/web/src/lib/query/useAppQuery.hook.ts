'use client'

import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'

import { useToastStore } from '@/stores/toast.store'

export interface IAppQueryOptions<TData, TError = Error> {
  /**
   * Optional adapter: maps the raw service result to a view model.
   * Runs inside `select` so TanStack caches the adapted result.
   */
  adapter?: (raw: TData) => TData
  /** Override the default error toast message */
  errorMessage?: string
  /** TanStack Query options (queryKey and queryFn are required) */
  queryOptions: UseQueryOptions<TData, TError>
}

/**
 * Thin wrapper over useQuery.
 *
 * - Injects a global error toast on failure.
 * - Accepts an optional adapter for DTO → ViewModel transformation.
 * - Forwards the full UseQueryResult so callers get data, isLoading, etc.
 *
 * Data-call chain:
 *   useXxx.hook → useAppQuery → xxx.service → Xxx.adapter
 */
export const useAppQuery = <TData, TError extends Error = Error>({
  adapter,
  errorMessage,
  queryOptions
}: IAppQueryOptions<TData, TError>): UseQueryResult<TData, TError> => {
  const addToast = useToastStore((s) => s.add)

  const result = useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter
      ? {
          select: (raw: TData) => adapter(raw)
        }
      : {})
  } as UseQueryOptions<TData, TError, TData, QueryKey>)

  // Fire a toast when the query transitions into error state.
  // setTimeout defers the state update so it doesn't fire during render.
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
