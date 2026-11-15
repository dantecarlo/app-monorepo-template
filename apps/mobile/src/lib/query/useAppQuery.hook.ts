import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'
import { GENERIC_ERROR_KEY } from '@/lib/query/useAppQuery.constant'
import type { IAppQueryOptions } from '@/lib/query/useAppQuery.type'
import { useToastStore } from '@/stores/toast.store'

export const useAppQuery = <TData, TError extends Error = Error>({
  adapter,
  errorMessage,
  queryOptions
}: IAppQueryOptions<TData, TError>): UseQueryResult<TData, TError> => {
  const addToast = useToastStore((s) => s.add)
  const { i18n, t } = useTranslation()
  // The errorUpdateCount of the last failure a toast was added for.
  const toastedFailureRef = useRef(0)

  const result = useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter ? { select: (raw: TData) => adapter(raw) } : {})
  } as UseQueryOptions<TData, TError, TData, QueryKey>)

  const { error, errorUpdateCount, isError } = result

  useEffect(() => {
    if (!isError || errorUpdateCount === toastedFailureRef.current) return
    toastedFailureRef.current = errorUpdateCount
    const message = resolveErrorMessage({
      error,
      errorMessage,
      fallback: t(GENERIC_ERROR_KEY),
      hasKey: (key) => i18n.exists(key),
      translate: (key) => t(key)
    })
    addToast({ message, variant: 'error' })
  }, [addToast, error, errorMessage, errorUpdateCount, i18n, isError, t])

  return result
}
