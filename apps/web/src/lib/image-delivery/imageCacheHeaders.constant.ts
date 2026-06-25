export const IMAGE_EDGE_MAX_AGE_SECONDS = 31536000

export const IMAGE_STALE_WHILE_REVALIDATE_SECONDS = 86400

export const CACHE_CONTROL_HEADER = 'Cache-Control'

export const IMAGE_CACHE_CONTROL_VALUE = `public, max-age=${IMAGE_EDGE_MAX_AGE_SECONDS}, immutable, stale-while-revalidate=${IMAGE_STALE_WHILE_REVALIDATE_SECONDS}`
