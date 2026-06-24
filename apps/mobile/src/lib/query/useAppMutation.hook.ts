import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult
} from '@tanstack/react-query'

import { resolveErrorMessage } from '@/lib/query/resolveErrorMessage.helper'
import { useToastStore } from '@/stores/toast.store'

const ERROR_FALLBACK = 'An error occurred'

export interface IAppMutationOptions<TData, TVariables, TError = Error> {
  errorMessage?: string
  mutationOptions: UseMutationOptions<TData, TError, TVariables>
  successMessage?: string
}

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

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    onError(error, variables, onMutateResult, context) {
      const message = resolveErrorMessage({
        error,
        errorMessage,
        fallback: ERROR_FALLBACK,
        hasKey: () => false,
        translate: (k) => k
      })
      addToast({ message, variant: 'error' })
      mutationOptions.onError?.(error, variables, onMutateResult, context)
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (successMessage)
        addToast({ message: successMessage, variant: 'success' })
      mutationOptions.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}
