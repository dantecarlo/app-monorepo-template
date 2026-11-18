import type { AppQueryKeyType } from '@/lib/query/queryKeys.type'

export interface IInvalidateAppQueryParams {
  /** A QueryKeys prefix, such as QueryKeys.items.all. */
  queryKey: AppQueryKeyType
}

/**
 * Marks every query whose key starts with the prefix stale and runs the
 * observed ones again; resolves once they settled.
 */
export type InvalidateAppQueryType = (
  params: IInvalidateAppQueryParams
) => Promise<void>
