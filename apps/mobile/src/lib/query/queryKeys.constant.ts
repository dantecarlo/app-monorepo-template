// Mirrors apps/web/src/lib/query/queryKeys.constant.ts — identical shape.
// TanStack Query is framework-agnostic; this file is copy-safe.
//
// Build every hand-written segment from QueryKeySegmentEnum: an error report
// keeps only its values (STRUCTURAL_QUERY_KEY_SEGMENTS) and redacts every other
// segment, so a hand-written segment missing from the enum shows up as
// [redacted].

export enum QueryKeySegmentEnum {
  ITEMS = 'items',
  LIST = 'list'
}

export const STRUCTURAL_QUERY_KEY_SEGMENTS: ReadonlySet<string> = new Set(
  Object.values(QueryKeySegmentEnum)
)

export const QueryKeys = {
  items: {
    all: [QueryKeySegmentEnum.ITEMS] as const,
    detail: (id: string) => [QueryKeySegmentEnum.ITEMS, id] as const,
    list: (filter?: string) =>
      filter
        ? ([
            QueryKeySegmentEnum.ITEMS,
            QueryKeySegmentEnum.LIST,
            filter
          ] as const)
        : ([QueryKeySegmentEnum.ITEMS, QueryKeySegmentEnum.LIST] as const)
  }
} as const
