// Mirrors apps/web/src/lib/query/useAppMutation.hook.ts.
// 'use client' directive removed — not applicable in RN.

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult
} from '@tanstack/react-query'

import { useToastStore } from '@/stores/toast.store'

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
      const message =
        errorMessage ??
        (error instanceof Error ? error.message : 'An error occurred')
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
