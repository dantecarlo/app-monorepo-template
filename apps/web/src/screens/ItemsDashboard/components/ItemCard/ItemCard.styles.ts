import { GLASS } from '@/helpers/style.constant'

export const ITEM_CARD = {
  // Avatar — 36px circle with accent background tint
  AVATAR: [
    'flex h-9 w-9 shrink-0 items-center justify-center',
    'rounded-full bg-accent-surface text-accent',
    'font-display text-label font-bold'
  ].join(' '),

  DESCRIPTION:
    'font-body text-caption text-text-tertiary line-clamp-1 mt-0.5',

  DIVIDER: `${GLASS.DIVIDER} first:border-t-0`,

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
