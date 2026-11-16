import { fontFamily, fontSize, radius, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const EMPTY_STATE_ICON_CONTAINER_SIZE = 64

export const EMPTY_STATE_STYLES = createThemedStyles({
  build: (palette) => ({
    container: {
      alignItems: 'center',
      gap: spacing.lg,
      padding: spacing['2xl']
    },
    cta: {
      marginTop: spacing.sm
    },
    iconContainer: {
      alignItems: 'center',
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: 1,
      height: EMPTY_STATE_ICON_CONTAINER_SIZE,
      justifyContent: 'center',
      width: EMPTY_STATE_ICON_CONTAINER_SIZE
    },
    iconGlyph: {
      color: palette.text.secondary,
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
    title: {
      color: palette.text.primary,
      fontFamily: fontFamily.display,
      fontSize: fontSize.heading.size,
      lineHeight: fontSize.heading.lineHeight,
      textAlign: 'center'
    }
  })
})
