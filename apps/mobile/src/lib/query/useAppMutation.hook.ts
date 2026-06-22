// Mirrors apps/web/src/lib/query/useAppMutation.hook.ts.
// 'use client' directive removed — not applicable in RN.

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useToastStore } from '@/stores/toast.store';

export interface AppMutationOptions<TData, TVariables, TError = Error> {
  mutationOptions: UseMutationOptions<TData, TError, TVariables>;
  errorMessage?: string;
  successMessage?: string;
}

export function useAppMutation<TData, TVariables, TError extends Error = Error>({
  mutationOptions,
  errorMessage,
  successMessage,
}: AppMutationOptions<TData, TVariables, TError>): UseMutationResult<TData, TError, TVariables> {
  const addToast = useToastStore((s) => s.add);

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    onError(error, variables, context) {
      const message =
        errorMessage ??
        (error instanceof Error ? error.message : 'An error occurred');
      addToast({ variant: 'error', message });
      mutationOptions.onError?.(error, variables, context);
    },
    onSuccess(data, variables, context) {
      if (successMessage) addToast({ variant: 'success', message: successMessage });
      mutationOptions.onSuccess?.(data, variables, context);
    },
  });
}
