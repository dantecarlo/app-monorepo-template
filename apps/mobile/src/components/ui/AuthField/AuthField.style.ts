import { fontFamily, fontSize, radius, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const AUTH_FIELD_STYLES = createThemedStyles({
  build: (palette) => ({
    errorText: {
      color: palette.danger,
      fontFamily: fontFamily.body,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    },
    helperText: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    },
    input: {
      color: palette.text.primary,
      flex: 1,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    },
    label: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.label.size,
      lineHeight: fontSize.label.lineHeight
    },
    revealButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs
    },
    root: {
      gap: spacing.xs
    },
    wrapper: {
      alignItems: 'center',
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    wrapperError: {
      borderColor: palette.danger
    },
    wrapperFocused: {
      borderColor: palette.accent
    }
  })
})
