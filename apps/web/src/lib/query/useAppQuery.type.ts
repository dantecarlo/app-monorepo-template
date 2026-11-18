import type { AppQueryKeyType } from '@/lib/query/queryKeys.type'

/**
 * When a query may run against the network: `online` (the default) only
 * while the device is online, `always` regardless, `offlineFirst` once, and
 * then only online.
 */
export type AppNetworkModeType = 'always' | 'offlineFirst' | 'online'

/**
 * What a query reads, the key its result is cached under, and how it runs.
 * An option left out keeps the query client's default.
 */
export interface IAppQueryConfig<TData> {
  /** false holds the query: its queryFn does not run until it is true. */
  enabled?: boolean
  /** While a new key loads, the result keeps the previous key's data. */
  keepPreviousData?: boolean
  networkMode?: AppNetworkModeType
  queryFn: () => Promise<TData>
  queryKey: AppQueryKeyType
  /** false never retries, true retries without end, a number that many times. */
  retry?: boolean | number
  /** How long a result stays fresh, in ms. */
  staleTime?: number
}

export interface IAppQueryOptions<TData> {
  /** Maps the raw result before a component reads it. */
  adapter?: (raw: TData) => TData
  queryOptions: IAppQueryConfig<TData>
}

/**
 * What a component reads from a query, and nothing of the library under it.
 * It is the same object across renders while none of its fields changed.
 */
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
