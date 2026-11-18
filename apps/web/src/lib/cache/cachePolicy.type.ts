import type { CacheLifeEnum } from '@/lib/cache/cachePolicy.constant'

export type CacheLifeType =
  (typeof CacheLifeEnum)[keyof typeof CacheLifeEnum]

/** The life and the tags of a cached function's result. */
export interface ICachePolicy {
  /** How long the result stays fresh, revalidates and expires. */
  life: CacheLifeType
  /** The tags an on-demand revalidation purges the result by. */
  tags: readonly string[]
}
