import { fontFamily, fontSize, radius, spacing } from '@app/tokens'

import { NAV_BAR_BOTTOM_OFFSET } from '@/components/ui/NavBar/NavBar.constant'
import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const NAV_BAR_STYLES = createThemedStyles({
  build: (palette) => ({
    blur: {
      borderRadius: radius.full,
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    item: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    label: {
      fontFamily: fontFamily.body,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    },
    overlay: {
      backgroundColor: palette.glass.fill,
      borderRadius: radius.full,
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    pill: {
      alignItems: 'center',
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: 'row',
      overflow: 'hidden',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    root: {
      alignSelf: 'center',
      bottom: NAV_BAR_BOTTOM_OFFSET,
      position: 'absolute'
    }
  })
})
