/**
 * A query key: QueryKeySegmentEnum segments followed, when the key carries a
 * dynamic value, by one trailing params object (queryKeys.constant.ts).
 */
export type AppQueryKeyType = ReadonlyArray<unknown>

// Every value the items list query reads, so its key holds them all. The
// limit is required: the query library cannot know a screen's default.
export interface IItemsListKeyParams {
  limit: number
  search?: string
}
