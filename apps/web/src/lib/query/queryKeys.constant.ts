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
 * Build every hand-written segment from QueryKeySegmentEnum: an error report
 * keeps only its values (STRUCTURAL_QUERY_KEY_SEGMENTS) and redacts every other
 * segment, so a hand-written segment missing from the enum shows up as
 * [redacted].
 */
export enum QueryKeySegmentEnum {
  Items = 'items',
  List = 'list'
}

export const STRUCTURAL_QUERY_KEY_SEGMENTS: ReadonlySet<string> = new Set(
  Object.values(QueryKeySegmentEnum)
)

export const QueryKeys = {
  items: {
    all: [QueryKeySegmentEnum.Items] as const,
    detail: (id: string) => [QueryKeySegmentEnum.Items, id] as const,
    list: (filter?: string) =>
      filter
        ? ([
            QueryKeySegmentEnum.Items,
            QueryKeySegmentEnum.List,
            filter
          ] as const)
        : ([QueryKeySegmentEnum.Items, QueryKeySegmentEnum.List] as const)
  }
} as const
