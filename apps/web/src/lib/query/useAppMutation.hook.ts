'use client';

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useToastStore } from '@/stores/toast.store';

export interface AppMutationOptions<TData, TVariables, TError = Error> {
  mutationOptions: UseMutationOptions<TData, TError, TVariables>;
  /** Override the default error toast message */
  errorMessage?: string;
  /** Optional success toast message */
  successMessage?: string;
}

/**
 * Thin wrapper over useMutation.
 *
 * - Shows a toast on error (and optionally on success).
 * - Merges caller-provided onError/onSuccess with the toast side-effect.
 * - Single-object param convention for future extensibility.
 */
export function useAppMutation<TData, TVariables, TError extends Error = Error>({
  mutationOptions,
  errorMessage,
  successMessage,
}: AppMutationOptions<TData, TVariables, TError>): UseMutationResult<
  TData,
  TError,
  TVariables
> {
  const addToast = useToastStore((s) => s.add);

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    onError(error, variables, onMutateResult, context) {
      const message =
        errorMessage ?? (error instanceof Error ? error.message : 'An error occurred');
      addToast({ variant: 'error', message });
      mutationOptions.onError?.(error, variables, onMutateResult, context);
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (successMessage) {
        addToast({ variant: 'success', message: successMessage });
      }
      mutationOptions.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
