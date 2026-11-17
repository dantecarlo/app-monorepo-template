'use client'

import { useMemo, useState } from 'react'

import { QueryKeys } from '@/lib/query/queryKeys.constant'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import {
  ACTIVE_STATUS,
  DEFAULT_ITEMS_LIMIT,
  DEFAULT_NAV_ID,
  EMPTY_ITEMS
} from '@/screens/ItemsDashboard/hooks/useItems.constant'
import type {
  IItemViewModel,
  IUseItemsParams,
  IUseItemsResult
} from '@/screens/ItemsDashboard/models/Item.type'
import { adaptItems, getItems } from '@/services/Items'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Owns all item-list data + derivation for the dashboard screen.
 *
 * Data-call chain:
 *   useItems → useAppQuery → items.service → Items.adapter → IItemViewModel[]
 *
 * A failed load is exposed as `isError` with an `onRetry` that runs the query
 * again; the list shows it in its ErrorState, and no toast is queued.
 *
 * The screen consumes this result directly and stays render-only.
 */
export const useItems = ({
  limit = DEFAULT_ITEMS_LIMIT
}: IUseItemsParams = {}): IUseItemsResult => {
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState(DEFAULT_NAV_ID)

  const {
    data: items = EMPTY_ITEMS,
    isError,
    isLoading,
    refetch
  } = useAppQuery<IItemViewModel[]>({
    queryOptions: {
      queryFn: async () => {
        const dtos = await getItems({ limit, search })
        return adaptItems(dtos)
      },
      queryKey: QueryKeys.items.list({ limit, search })
    }
  })

  const { activeCount, totalCount } = useMemo(
    () => ({
      activeCount: items.filter((i) => i.status === ACTIVE_STATUS).length,
      totalCount: items.length
    }),
    [items]
  )

  return {
    activeCount,
    activeNav,
    isError,
    isLoading,
    items,
    onNavChange: setActiveNav,
    onRetry: () => {
      void refetch()
    },
    onSearchChange: setSearch,
    search,
    totalCount
  }
}
