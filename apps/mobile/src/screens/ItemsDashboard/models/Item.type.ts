import type { ItemAgeUnitEnum } from '@/services/Items/items.constant'

// ---------------------------------------------------------------------------
// Raw DTO — shape as returned from the API / Supabase
// ---------------------------------------------------------------------------

export interface IItemDto {
  // ISO-8601
  author_id: string | null
  author_name: string | null
  category: string
  created_at: string
  description: string
  id: string
  status: 'active' | 'archived' | 'draft'
  title: string
  // ISO-8601
  updated_at: string
}

// ---------------------------------------------------------------------------
// View model — what the UI consumes
// ---------------------------------------------------------------------------

/** How old an item is: a unit and a whole count of it, 0 for just now. */
export interface IItemAge {
  count: number
  unit: ItemAgeUnitEnum
}

export interface IItemViewModel {
  /** The item's age, which the card tells in the active language */
  age: IItemAge
  /** Initials for the avatar, e.g. "AB" */
  authorInitials: string
  /** Author display, e.g. "Alice B." — empty string if none */
  authorLabel: string
  category: string
  createdAt: Date
  description: string
  id: string
  status: 'active' | 'archived' | 'draft'
  title: string
}

// ---------------------------------------------------------------------------
// Dashboard aggregate
// ---------------------------------------------------------------------------

export interface IItemsDashboardSummary {
  activeCount: number
  recentItems: IItemViewModel[]
  totalCount: number
}

// ---------------------------------------------------------------------------
// useItems hook contract
// ---------------------------------------------------------------------------

export interface IUseItemsParams {
  limit?: number
}

export interface IUseItemsResult {
  activeCount: number
  activeNav: string
  isError: boolean
  isLoading: boolean
  items: IItemViewModel[]
  onNavChange: (id: string) => void
  onRetry: () => void
  onSearchChange: (value: string) => void
  search: string
  totalCount: number
}
