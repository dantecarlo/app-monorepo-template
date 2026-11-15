// ItemCard RN style constants — mirrors the web ItemCard.style.ts pattern.
// Plain StyleSheet objects; no inline magic style objects in the component.

import { colors } from '@app/tokens'
import { StyleSheet } from 'react-native'

import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

// ---------------------------------------------------------------------------
// Raw values
// ---------------------------------------------------------------------------

const AVATAR_FONT_SIZE = 12
const AVATAR_FONT_WEIGHT = '700' as const

// ---------------------------------------------------------------------------
// Status → color map (no magic strings in the component)
// ---------------------------------------------------------------------------

export const STATUS_COLOR: Record<IItemViewModel['status'], string> = {
  active: colors.success,
  archived: colors.text.tertiary,
  draft: colors.warning
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const ITEM_CARD = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accentSurface,
    borderRadius: 18,
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  avatarText: {
    color: colors.accent,
    fontSize: AVATAR_FONT_SIZE,
    fontWeight: AVATAR_FONT_WEIGHT
  },
  categoryBadge: {
    backgroundColor: colors.divider,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  description: {
    marginTop: 2
  },
  divider: {
    borderTopColor: colors.divider,
    borderTopWidth: 1
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  middle: {
    flex: 1,
    minWidth: 0
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
    paddingTop: 2
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12
  }
})
