// ---------------------------------------------------------------------------
// Time units — used by the relative-time adapter.
// ---------------------------------------------------------------------------

export const HOURS_PER_DAY = 24
export const MINUTES_PER_HOUR = 60
export const MS_PER_HOUR = 3_600_000
export const MS_PER_MINUTE = 60_000

// ---------------------------------------------------------------------------
// Mock service tuning — replace with real API/Supabase calls.
// ---------------------------------------------------------------------------

export const DEFAULT_ITEMS_LIMIT = 50
export const ITEM_FETCH_DELAY_MS = 100
export const LIST_FETCH_DELAY_MS = 250

// Relative "hours ago" offsets used to build deterministic mock timestamps.
// Keys are sorted ascending to satisfy the sort-keys rule.
export const MOCK_HOURS_AGO = {
  EIGHT: 8,
  HALF: 0.5,
  ONE: 1,
  ONE_DAY: 24,
  SIX: 6,
  THREE: 3,
  THREE_DAYS: 72,
  TWO: 2,
  TWO_DAYS: 48
} as const
