import { fontFamily, fontSize, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const LIST_ROW_STYLES = createThemedStyles({
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
    title: {
      color: palette.text.primary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    },
    trailing: {
      flexShrink: 0
    }
  })
})
