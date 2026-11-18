import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { InvalidateAppQueryType } from '@/lib/query/useInvalidateAppQuery.type'

/**
 * The invalidation of a QueryKeys prefix: a mutation that changes a
 * feature's data calls it with the feature's `all` key, which every key of
 * the feature starts with.
 */
export const useInvalidateAppQuery = (): InvalidateAppQueryType => {
  const queryClient = useQueryClient()

  return useCallback<InvalidateAppQueryType>(
    ({ queryKey }) => queryClient.invalidateQueries({ queryKey }),
    [queryClient]
  )
}
