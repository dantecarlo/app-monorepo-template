// Every value the items list query reads, so its key holds them all. The
// limit is required: the query library cannot know a screen's default.
export interface IItemsListKeyParams {
  limit: number
  search?: string
}
