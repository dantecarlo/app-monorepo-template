import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IUseItemsParams {
  limit?: number
}

export interface IUseItemsResult {
  activeCount: number
  isLoading: boolean
  items: IItemViewModel[]
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
  const { t } = useTranslation()

  const { data: items = EMPTY_ITEMS, isLoading } = useAppQuery<
    IItemViewModel[]
  >({
    errorMessage: t('items.errorMessage'),
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
    isLoading,
    items,
    onSearchChange: setSearch,
    search,
    totalCount
  }
}
