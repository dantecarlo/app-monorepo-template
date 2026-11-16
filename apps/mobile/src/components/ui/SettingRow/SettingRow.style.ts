import { fontFamily, fontSize, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const SETTING_ROW_CHEVRON_SIZE = 16

export const SETTING_ROW_STYLES = createThemedStyles({
  build: (palette) => ({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    divider: {
      borderTopColor: palette.divider,
      borderTopWidth: 1
    },
    label: {
      color: palette.text.primary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    },
    leading: {
      flexShrink: 0
    },
    subtitle: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight,
      marginTop: 2
    },
    textBlock: {
      flex: 1,
      minWidth: 0
    },
    trailing: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 0
    },
    value: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    }
  })
})
