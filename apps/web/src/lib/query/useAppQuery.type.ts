import type { UseQueryOptions } from '@tanstack/react-query'

export interface IAppQueryOptions<TData, TError = Error> {
  adapter?: (raw: TData) => TData
  errorMessage?: string
  queryOptions: UseQueryOptions<TData, TError>
}
