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

export interface IItemViewModel {
  /** Initials for the avatar, e.g. "AB" */
  authorInitials: string
  /** Author display, e.g. "Alice B." — empty string if none */
  authorLabel: string
  category: string
  createdAt: Date
  description: string
  id: string
  status: 'active' | 'archived' | 'draft'
  /** Formatted relative time, e.g. "2 hours ago" */
  timeDisplay: string
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
