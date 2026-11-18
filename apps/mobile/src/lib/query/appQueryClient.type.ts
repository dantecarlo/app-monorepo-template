import type { QueryClient } from '@tanstack/react-query'

/**
 * The query cache of one React tree: createQueryClient builds it and
 * AppQueryProvider hands it to the tree. It is TanStack's QueryClient under
 * a project name, so its methods stay reachable: that code outside lib/query
 * only passes it on, and only lib/query and the tests that read the cache
 * call it, is a convention review holds, not a rule a gate enforces.
 */
export type AppQueryClientType = QueryClient
