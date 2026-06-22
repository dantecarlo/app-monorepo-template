// ---------------------------------------------------------------------------
// Raw DTO — shape as returned from the API / Supabase
// ---------------------------------------------------------------------------

export interface ItemDto {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'archived' | 'draft';
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
  author_id: string | null;
  author_name: string | null;
}

// ---------------------------------------------------------------------------
// View model — what the UI consumes
// ---------------------------------------------------------------------------

export interface ItemViewModel {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'archived' | 'draft';
  /** Formatted relative time, e.g. "2 hours ago" */
  timeDisplay: string;
  /** Author display, e.g. "Alice B." — empty string if none */
  authorLabel: string;
  /** Initials for the avatar, e.g. "AB" */
  authorInitials: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Dashboard aggregate
// ---------------------------------------------------------------------------

export interface ItemsDashboardSummary {
  totalCount: number;
  activeCount: number;
  recentItems: ItemViewModel[];
}
