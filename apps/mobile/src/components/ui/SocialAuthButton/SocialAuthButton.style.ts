import { fontFamily, fontSize, radius, spacing } from '@app/tokens'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const SOCIAL_AUTH_GLYPH_SIZE = 18

export const SOCIAL_AUTH_STYLES = createThemedStyles({
  build: (palette) => ({
    button: {
      alignItems: 'center',
      backgroundColor: palette.glass.fill,
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md
    },
    label: {
      color: palette.text.primary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.button.size,
      fontWeight: '500',
      lineHeight: fontSize.button.lineHeight
    }
  })
})
