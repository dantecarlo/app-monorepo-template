// Mirrors apps/web/src/lib/query/queryKeys.constant.ts — identical shape.
// TanStack Query is framework-agnostic; this file is copy-safe.
//
// Build every hand-written segment from QueryKeySegmentEnum: an error report
// keeps only its values (STRUCTURAL_QUERY_KEY_SEGMENTS) and redacts every other
// segment, so a segment written as a bare string shows up as [redacted].

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
