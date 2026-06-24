import { GLASS } from '@/helpers/style.constant'

export const SKELETON_ROW_COUNT = 3

export const ITEMS_LIST_CARD = {
  COUNT_LABEL: 'font-body text-caption text-text-tertiary',
  HEADER: 'flex items-center justify-between',
  SKELETON_LINES: 'flex-1 space-y-2',
  SKELETON_ROW: `flex items-center gap-3 py-3 ${GLASS.DIVIDER} first:border-t-0`
} as const
