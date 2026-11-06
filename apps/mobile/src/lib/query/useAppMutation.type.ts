import type { UseMutationOptions } from '@tanstack/react-query'

export interface IAppMutationOptions<TData, TVariables, TError = Error> {
  errorMessage?: string
  mutationOptions: UseMutationOptions<TData, TError, TVariables>
  successMessage?: string
}
