import { useAppQuery } from '@/lib/query/useAppQuery.hook';
import { QueryKeys } from '@/lib/query/queryKeys.constant';
import { getItems } from '@/features/items/services/items.service';
import { adaptItems } from '@/features/items/services/Items.adapter';
import type { ItemViewModel } from '@/features/items/models/Item.type';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseItemsParams {
  limit?: number;
  search?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches and adapts the item list.
 *
 * Data-call chain:
 *   useItems → useAppQuery → items.service → Items.adapter → ItemViewModel[]
 */
export function useItems({ limit = 50, search }: UseItemsParams = {}) {
  return useAppQuery<ItemViewModel[]>({
    queryOptions: {
      queryKey: QueryKeys.items.list(search),
      queryFn: async () => {
        const dtos = await getItems({ limit, search });
        return adaptItems(dtos);
      },
    },
    errorMessage: 'Failed to load items. Please try again.',
  });
}
