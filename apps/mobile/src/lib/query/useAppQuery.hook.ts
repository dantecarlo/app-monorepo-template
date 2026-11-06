import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
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

  const result = useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter ? { select: (raw: TData) => adapter(raw) } : {})
  } as UseQueryOptions<TData, TError, TData, QueryKey>)

  if (result.isError && result.error) {
    const message = resolveErrorMessage({
      error: result.error,
      errorMessage,
      fallback: t(GENERIC_ERROR_KEY),
      hasKey: (key) => i18n.exists(key),
      translate: (key) => t(key)
    })
    setTimeout(() => addToast({ message, variant: 'error' }), 0)
  }

  return result
}
