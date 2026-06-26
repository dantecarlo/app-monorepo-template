'use client'

import { useMemo, useState } from 'react'

import { QueryKeys } from '@/lib/query/queryKeys.constant'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'
import { adaptItems, getItems } from '@/services/Items'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ITEMS_LIMIT = 50
const ACTIVE_STATUS = 'active' as const
const EMPTY_ITEMS: IItemViewModel[] = []
const DEFAULT_NAV_ID = 'home'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IUseItemsParams {
  limit?: number
}

export interface IUseItemsResult {
  activeCount: number
  activeNav: string
  isLoading: boolean
  items: IItemViewModel[]
  onNavChange: (id: string) => void
  onSearchChange: (value: string) => void
  search: string
  totalCount: number
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Owns all item-list data + derivation for the dashboard screen.
 *
 * Data-call chain:
 *   useItems → useAppQuery → items.service → Items.adapter → IItemViewModel[]
 *
 * The screen consumes this result directly and stays render-only.
 */
export const useItems = ({
  limit = DEFAULT_ITEMS_LIMIT
}: IUseItemsParams = {}): IUseItemsResult => {
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState(DEFAULT_NAV_ID)

  const { data: items = EMPTY_ITEMS, isLoading } = useAppQuery<
    IItemViewModel[]
  >({
    errorMessage: 'Failed to load items. Please try again.',
    queryOptions: {
      queryFn: async () => {
        const dtos = await getItems({ limit, search })
        return adaptItems(dtos)
      },
      queryKey: QueryKeys.items.list(search)
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
    isLoading,
    items,
    onNavChange: setActiveNav,
    onSearchChange: setSearch,
    search,
    totalCount
  }
}
