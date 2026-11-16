import { fontFamily, fontSize, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const OFFLINE_BANNER_ICON_SIZE = 16

export const OFFLINE_BANNER_STYLES = createThemedStyles({
  build: (palette) => ({
    container: {
      alignItems: 'center',
      backgroundColor: palette.warningTint,
      borderBottomColor: palette.warningStroke,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm
    },
    label: {
      color: palette.warning,
      fontFamily: `${fontFamily.body}_500Medium`,
      fontSize: fontSize.label.size,
      lineHeight: fontSize.label.lineHeight
    }
  })
})
