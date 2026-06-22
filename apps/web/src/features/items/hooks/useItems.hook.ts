'use client'

import type { IItemViewModel } from '@/features/items/models/Item.type'
import { adaptItems } from '@/features/items/services/Items.adapter'
import { getItems } from '@/features/items/services/items.service'
import { QueryKeys } from '@/lib/query/queryKeys.constant'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IUseItemsParams {
  limit?: number
  search?: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches and adapts the item list.
 *
 * Data-call chain:
 *   useItems → useAppQuery → items.service → Items.adapter → IItemViewModel[]
 */
export const useItems = ({ limit = 50, search }: IUseItemsParams = {}) => {
  return useAppQuery<IItemViewModel[]>({
    errorMessage: 'Failed to load items. Please try again.',
    queryOptions: {
      queryFn: async () => {
        const dtos = await getItems({ limit, search })
        return adaptItems(dtos)
      },
      queryKey: QueryKeys.items.list(search)
    }
  })
}
