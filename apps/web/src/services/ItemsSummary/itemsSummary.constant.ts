// Cache profile for 'use cache' + cacheLife(). 'minutes' is a built-in Next
// profile (fresh: 60 s, stale: 300 s). Change to 'hours' or a custom profile
// once the data source is a real API with predictable staleness.
export const CACHE_LIFE_PROFILE = 'minutes' as const

// Cache tag used with cacheTag() and revalidateTag() for on-demand purging.
export const CACHE_TAG = 'items-summary' as const
