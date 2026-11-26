import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { toMutationCallbacks } from '@/lib/query/mutationCallbacks.adapter'
import { omitUndefined } from '@/lib/query/omitUndefined.helper'
import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'
import type {
  IAppMutationOptions,
  IAppMutationResult
} from '@/lib/query/useAppMutation.type'
import { GENERIC_ERROR_KEY } from '@/lib/query/useAppQuery.constant'
import { useToastStore } from '@/stores/toast.store'

/**
 * A mutation whose failure is an error toast with the resolved message, and
 * whose success message, when given, is a success toast. It returns only
 * the fields of IAppMutationResult, so no caller reads the library's own,
 * and the same object while none of them changed.
 */
export const useAppMutation = <
  TData,
  TVariables,
  TError extends Error = Error
>({
  errorMessage,
  mutationOptions,
  successMessage
}: IAppMutationOptions<TData, TVariables, TError>): IAppMutationResult<
  TData,
  TVariables,
  TError
> => {
  const addToast = useToastStore((s) => s.add)
  const { has, t } = useAppTranslator()
  const {
    gcTime,
    mutationFn,
    mutationKey,
    onError,
    onMutate,
    onSettled,
    onSuccess
  } = mutationOptions

  const { data, error, isError, isPending, isSuccess, mutate, reset } =
    useMutation<TData, TError, TVariables>({
      ...omitUndefined({ gcTime, mutationKey }),
      mutationFn,
      ...toMutationCallbacks<TData, TError, TVariables>({
        onError: ({ error: failure, variables }) => {
          const message = resolveErrorMessage({
            error: failure,
            errorMessage,
            fallback: t(GENERIC_ERROR_KEY),
            hasKey: has,
            translate: (key) => (has(key) ? t(key) : key)
          })
          addToast({ message, variant: 'error' })
          onError?.({ error: failure, variables })
        },
        onMutate,
        onSettled: (outcome) => onSettled?.(outcome),
        onSuccess: (outcome) => {
          if (successMessage) {
            addToast({ message: successMessage, variant: 'success' })
          }
          onSuccess?.(outcome)
        }
      })
    })

  return useMemo(
    () => ({ data, error, isError, isPending, isSuccess, mutate, reset }),
    [data, error, isError, isPending, isSuccess, mutate, reset]
  )
}
