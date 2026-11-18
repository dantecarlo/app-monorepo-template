import { cacheLife, cacheTag } from 'next/cache'

import { CacheLifeEnum } from '@/lib/cache/cachePolicy.constant'
import type {
  CacheLifeType,
  ICachePolicy
} from '@/lib/cache/cachePolicy.type'

// Each profile of the app, set through the overload of cacheLife that Next
// declares for that one profile name.
const SET_CACHE_LIFE: Record<CacheLifeType, () => void> = {
  [CacheLifeEnum.DAYS]: () => cacheLife(CacheLifeEnum.DAYS),
  [CacheLifeEnum.DEFAULT]: () => cacheLife(CacheLifeEnum.DEFAULT),
  [CacheLifeEnum.HOURS]: () => cacheLife(CacheLifeEnum.HOURS),
  [CacheLifeEnum.MAX]: () => cacheLife(CacheLifeEnum.MAX),
  [CacheLifeEnum.MINUTES]: () => cacheLife(CacheLifeEnum.MINUTES),
  [CacheLifeEnum.SECONDS]: () => cacheLife(CacheLifeEnum.SECONDS),
  [CacheLifeEnum.WEEKS]: () => cacheLife(CacheLifeEnum.WEEKS)
}

/**
 * Sets the life profile and the tags of the result of the function under
 * 'use cache' that calls it, once while that function runs. Next throws
 * when it runs outside such a function.
 */
export const applyCachePolicy = ({ life, tags }: ICachePolicy): void => {
  SET_CACHE_LIFE[life]()
  cacheTag(...tags)
}
