import { fontFamily, fontSize, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const SCREEN_HEADER_SLOT_SIZE = 40

export const SCREEN_HEADER_STYLES = createThemedStyles({
  build: (palette) => ({
    root: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    slot: {
      alignItems: 'center',
      height: SCREEN_HEADER_SLOT_SIZE,
      justifyContent: 'center',
      width: SCREEN_HEADER_SLOT_SIZE
    },
    title: {
      color: palette.text.primary,
      flex: 1,
      fontFamily: fontFamily.display,
      fontSize: fontSize.heading.size,
      fontWeight: '600',
      lineHeight: fontSize.heading.lineHeight,
      textAlign: 'center'
    }
  })
})
