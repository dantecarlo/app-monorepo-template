import { fontFamily, fontSize, radius, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const CONFIRM_PRESSED_OPACITY = 0.85

export const CONFIRM_DIALOG_STYLES = createThemedStyles({
  build: (palette) => ({
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'flex-end',
      marginTop: spacing.lg
    },
    cancelButton: {
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    cancelLabel: {
      color: palette.text.secondary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.button.size,
      lineHeight: fontSize.button.lineHeight
    },
    confirmButton: {
      backgroundColor: palette.danger,
      borderRadius: radius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    confirmLabel: {
      color: palette.text.primary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.button.size,
      lineHeight: fontSize.button.lineHeight
    },
    message: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight,
      marginBottom: spacing.md
    }
  })
})
