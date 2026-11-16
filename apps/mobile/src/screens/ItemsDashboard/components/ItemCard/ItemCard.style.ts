// ItemCard RN style constants — mirrors the web ItemCard.style.ts pattern.
// Plain StyleSheet objects; no inline magic style objects in the component.

import {
  createThemedStyles,
  createThemedValues
} from '@/lib/theme/createThemedStyles.helper'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

// ---------------------------------------------------------------------------
// Raw values
// ---------------------------------------------------------------------------

const AVATAR_FONT_SIZE = 12
const AVATAR_FONT_WEIGHT = '700' as const

// ---------------------------------------------------------------------------
// Status → color map (no magic strings in the component)
// ---------------------------------------------------------------------------

export const STATUS_COLOR = createThemedValues({
  build: (palette): Record<IItemViewModel['status'], string> => ({
    active: palette.success,
    archived: palette.text.tertiary,
    draft: palette.warning
  })
})

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const ITEM_CARD = createThemedStyles({
  build: (palette) => ({
    avatar: {
      alignItems: 'center',
      backgroundColor: palette.accentSurface,
      borderRadius: 18,
      flexShrink: 0,
      height: 36,
      justifyContent: 'center',
      width: 36
    },
    avatarText: {
      color: palette.accent,
      fontSize: AVATAR_FONT_SIZE,
      fontWeight: AVATAR_FONT_WEIGHT
    },
    categoryBadge: {
      backgroundColor: palette.divider,
      borderRadius: 9999,
      paddingHorizontal: 8,
      paddingVertical: 2
    },
    description: {
      marginTop: 2
    },
    divider: {
      borderTopColor: palette.divider,
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
})
