'use client'

import { useMutation, UseMutationResult } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'
import type { IAppMutationOptions } from '@/lib/query/useAppMutation.type'
import { GENERIC_ERROR_KEY } from '@/lib/query/useAppQuery.constant'
import { useToastStore } from '@/stores/toast.store'

export const useAppMutation = <
  TData,
  TVariables,
  TError extends Error = Error
>({
  errorMessage,
  mutationOptions,
  successMessage
}: IAppMutationOptions<TData, TVariables, TError>): UseMutationResult<
  TData,
  TError,
  TVariables
> => {
  const addToast = useToastStore((s) => s.add)
  const t = useTranslations()

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    onError(error, variables, onMutateResult, context) {
      const message = resolveErrorMessage({
        error,
        errorMessage,
        fallback: t(GENERIC_ERROR_KEY),
        hasKey: (key) => t.has(key),
        translate: (key) => t(key)
      })
      addToast({ message, variant: 'error' })
      mutationOptions.onError?.(error, variables, onMutateResult, context)
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (successMessage) {
        addToast({ message: successMessage, variant: 'success' })
      }
      mutationOptions.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}
