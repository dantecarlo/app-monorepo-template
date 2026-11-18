import { CacheLifeEnum } from '@/lib/cache'

// Cache profile of the summary, set through applyCachePolicy of lib/cache.
// 'minutes' is a built-in Next profile (stale: 300 s, revalidate: 60 s,
// expire: 3600 s). Change to 'hours' or a custom profile once the data
// source is a real API with predictable staleness.
export const CACHE_LIFE_PROFILE = CacheLifeEnum.MINUTES

// Cache tag used with applyCachePolicy and revalidateTag() for on-demand
// purging.
export const CACHE_TAG = 'items-summary' as const
