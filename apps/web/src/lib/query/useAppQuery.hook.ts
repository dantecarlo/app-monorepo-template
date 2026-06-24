'use client'

import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'
import { useToastStore } from '@/stores/toast.store'

const GENERIC_ERROR_KEY = 'helper.error.generic'

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
  const t = useTranslations()

  const result = useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter
      ? {
          select: (raw: TData) => adapter(raw)
        }
      : {})
  } as UseQueryOptions<TData, TError, TData, QueryKey>)

  if (result.isError && result.error) {
    const message = resolveErrorMessage({
      error: result.error,
      errorMessage,
      fallback: t(GENERIC_ERROR_KEY),
      hasKey: (key) => t.has(key),
      translate: (key) => t(key)
    })
    setTimeout(() => addToast({ message, variant: 'error' }), 0)
  }

  return result
}
