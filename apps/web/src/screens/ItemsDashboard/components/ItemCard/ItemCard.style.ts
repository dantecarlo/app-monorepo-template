import { GLASS } from '@/helpers/style.constant'

export const ITEM_CARD = {
  AVATAR: [
    'flex h-9 w-9 shrink-0 items-center justify-center',
    'rounded-full bg-accent-surface text-accent-text',
    'font-display text-label font-bold'
  ].join(' '),

  CATEGORY_BADGE:
    'inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-caption text-text-tertiary',

  DESCRIPTION:
    'font-body text-caption text-text-tertiary line-clamp-1 mt-0.5',

  DIVIDER: `${GLASS.DIVIDER} first:border-t-0`,

  META: 'flex items-center gap-2 mt-1',

  META_TEXT: 'font-body text-caption text-text-tertiary',

  MIDDLE: 'min-w-0 flex-1',

  RIGHT: 'flex flex-col items-end gap-1 shrink-0 pt-0.5',

  ROW: 'flex items-start gap-3 py-3',

  STATUS_ACTIVE: 'font-body text-caption text-success-text',

  STATUS_ARCHIVED: 'font-body text-caption text-text-tertiary',

  STATUS_DRAFT: 'font-body text-caption text-warning-text',

  TIME: 'font-body text-caption text-text-tertiary',

  TITLE: 'font-body text-body font-medium text-text-primary truncate'
} as const
