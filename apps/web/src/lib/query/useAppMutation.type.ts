import type { UseMutationOptions } from '@tanstack/react-query'

export interface IAppMutationOptions<TData, TVariables, TError = Error> {
  /** Override the default error toast message */
  errorMessage?: string
  mutationOptions: UseMutationOptions<TData, TError, TVariables>
  /** Optional success toast message */
  successMessage?: string
}
