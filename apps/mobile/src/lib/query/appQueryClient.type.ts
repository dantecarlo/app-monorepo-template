import type { QueryClient } from '@tanstack/react-query'

/**
 * The query cache of one React tree: createQueryClient builds it and
 * AppQueryProvider hands it to the tree. Code outside lib/query passes it
 * on and never calls it; only lib/query and the tests that read the cache
 * do.
 */
export type AppQueryClientType = QueryClient
