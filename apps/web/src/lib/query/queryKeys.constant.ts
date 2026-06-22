/**
 * Centralized query key registry.
 * Prefix every key with the feature name to avoid collisions.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: QueryKeys.items.all })
 *   useQuery({ queryKey: QueryKeys.items.list() })
 *
 * Extend this file as you add features. Keep keys stable — changing them
 * invalidates cached data for all users.
 */
export const QueryKeys = {
  items: {
    all: ['items'] as const,
    detail: (id: string) => ['items', id] as const,
    list: (filter?: string) =>
      filter
        ? (['items', 'list', filter] as const)
        : (['items', 'list'] as const)
  }
} as const
