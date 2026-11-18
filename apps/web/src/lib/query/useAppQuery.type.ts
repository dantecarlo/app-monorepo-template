import type { AppQueryKeyType } from '@/lib/query/queryKeys.type'

/** What a query reads, and the key its result is cached under. */
export interface IAppQueryConfig<TData> {
  queryFn: () => Promise<TData>
  queryKey: AppQueryKeyType
}

export interface IAppQueryOptions<TData> {
  /** Maps the raw result before a component reads it. */
  adapter?: (raw: TData) => TData
  queryOptions: IAppQueryConfig<TData>
}

/** What a component reads from a query, and nothing of the library under it. */
export interface IAppQueryResult<TData, TError = Error> {
  data: TData | undefined
  error: TError | null
  isError: boolean
  /** The first load is in flight: there is no data yet. */
  isLoading: boolean
  isSuccess: boolean
  /** Runs the query again; resolves once it settled. */
  refetch: () => Promise<unknown>
}
