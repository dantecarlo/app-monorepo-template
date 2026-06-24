// ItemCard RN style constants — mirrors the web ItemCard.styles.ts pattern.
// Plain StyleSheet objects; no inline magic style objects in the component.

import { colors } from '@app/tokens'
import { StyleSheet } from 'react-native'

import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

// ---------------------------------------------------------------------------
// Raw values
// ---------------------------------------------------------------------------

// Brand gradient used by the screen header and CTA button. Kept here so the
// .screen.tsx file stays hex-free (check C in scripts/verify-maps.mjs).
export const GRADIENT_BRAND_COLORS = ['#FF8A3D', '#FF6A1A'] as const

const AVATAR_BG = '#241A12'
const CATEGORY_BG = 'rgba(255,255,255,0.06)'
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
    backgroundColor: AVATAR_BG,
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
    backgroundColor: CATEGORY_BG,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  description: {
    marginTop: 2
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
