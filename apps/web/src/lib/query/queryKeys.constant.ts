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
 *
 * A key is its QueryKeySegmentEnum segments followed, when it carries a
 * dynamic value (an id, a search text, a filter), by ONE trailing params
 * object holding every such value: ['items', 'detail', { id }]. An error
 * report keeps only the enum's values (STRUCTURAL_QUERY_KEY_SEGMENTS) and
 * redacts every other segment, the params object always, so a typed value
 * never reaches a report, even one that equals a registered word. The
 * feature's `all` key stays the prefix of each of its keys, so invalidating
 * it reaches them all.
 */
export enum QueryKeySegmentEnum {
  DETAIL = 'detail',
  ITEMS = 'items',
  LIST = 'list'
}

export const STRUCTURAL_QUERY_KEY_SEGMENTS: ReadonlySet<string> = new Set(
  Object.values(QueryKeySegmentEnum)
)

export const QueryKeys = {
  items: {
    all: [QueryKeySegmentEnum.ITEMS] as const,
    detail: (id: string) =>
      [
        QueryKeySegmentEnum.ITEMS,
        QueryKeySegmentEnum.DETAIL,
        { id }
      ] as const,
    list: (filter?: string) =>
      filter
        ? ([
            QueryKeySegmentEnum.ITEMS,
            QueryKeySegmentEnum.LIST,
            { filter }
          ] as const)
        : ([QueryKeySegmentEnum.ITEMS, QueryKeySegmentEnum.LIST] as const)
  }
} as const
