import { fontFamily, fontSize, radius, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const ERROR_STATE_ICON_CONTAINER_SIZE = 64

export const ERROR_STATE_STYLES = createThemedStyles({
  build: (palette) => ({
    container: {
      alignItems: 'center',
      gap: spacing.lg,
      padding: spacing['2xl']
    },
    iconContainer: {
      alignItems: 'center',
      backgroundColor: palette.dangerTint,
      borderRadius: radius.full,
      height: ERROR_STATE_ICON_CONTAINER_SIZE,
      justifyContent: 'center',
      width: ERROR_STATE_ICON_CONTAINER_SIZE
    },
    iconGlyph: {
      color: palette.danger,
      fontFamily: fontFamily.body,
      fontSize: fontSize.heading.size,
      lineHeight: fontSize.heading.lineHeight
    },
    message: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight,
      textAlign: 'center'
    },
    retryButton: {
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: 1,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    retryLabel: {
      color: palette.text.primary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.button.size,
      lineHeight: fontSize.button.lineHeight
    },
    title: {
      color: palette.text.primary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.heading.size,
      lineHeight: fontSize.heading.lineHeight,
      textAlign: 'center'
    }
  })
})
