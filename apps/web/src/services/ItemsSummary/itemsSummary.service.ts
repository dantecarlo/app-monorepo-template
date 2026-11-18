'use cache'

import { applyCachePolicy } from '@/lib/cache'
import { getItems } from '@/services/Items/items.service'
import { adaptItemsSummary } from '@/services/ItemsSummary/ItemsSummary.adapter'
import {
  CACHE_LIFE_PROFILE,
  CACHE_TAG
} from '@/services/ItemsSummary/itemsSummary.constant'
import type { IItemsSummaryViewModel } from '@/services/ItemsSummary/itemsSummary.type'

// ---------------------------------------------------------------------------
// Cached server-side service for the ItemsSummary domain.
//
// The 'use cache' directive (enabled by cacheComponents: true in next.config)
// makes this function's return value automatically cached and reused across
// requests until the profile expires or revalidateTag(CACHE_TAG) is called.
// applyCachePolicy of lib/cache sets that profile and tag while it runs.
//
// Consumers: wrap the Server Component that calls this in <Suspense> so the
// streaming shell is sent immediately while the cache warms up.
// ---------------------------------------------------------------------------

export const getItemsSummary =
  async (): Promise<IItemsSummaryViewModel> => {
    applyCachePolicy({ life: CACHE_LIFE_PROFILE, tags: [CACHE_TAG] })

    const dtos = await getItems({})
    return adaptItemsSummary(dtos)
  }
