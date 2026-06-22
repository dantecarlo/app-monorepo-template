/**
 * ItemCard Tailwind class constants.
 * Extracted per convention: no magic inline className strings in JSX.
 */

export const ITEM_CARD = {
  // Avatar — 36px circle with accent background tint
  AVATAR: [
    'flex h-9 w-9 shrink-0 items-center justify-center',
    'rounded-full bg-[#241A12] text-accent',
    'font-display text-label font-bold'
  ].join(' '),

  DESCRIPTION:
    'font-body text-caption text-text-tertiary line-clamp-1 mt-0.5',

  DIVIDER: 'border-t border-white/[0.06] first:border-t-0',

  META: 'flex items-center gap-2 mt-1',

  META_TEXT: 'font-body text-caption text-text-tertiary',

  // Middle content
  MIDDLE: 'min-w-0 flex-1',

  // Right content
  RIGHT: 'flex flex-col items-end gap-1 shrink-0 pt-0.5',

  ROW: 'flex items-start gap-3 py-3',

  // Status badge colors
  STATUS_ACTIVE: 'font-body text-caption text-success',

  STATUS_ARCHIVED: 'font-body text-caption text-text-tertiary',

  STATUS_DRAFT: 'font-body text-caption text-warning',
  TIME: 'font-body text-caption text-text-tertiary',
  TITLE: 'font-body text-body font-medium text-text-primary truncate'
} as const
