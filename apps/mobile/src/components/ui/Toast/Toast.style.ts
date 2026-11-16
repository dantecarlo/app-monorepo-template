import { fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

import {
  TOAST_BOTTOM_OFFSET,
  TOAST_DOT_SIZE
} from '@/components/ui/Toast/Toast.constant'
import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const TOAST_STYLES = createThemedStyles({
  build: (palette) => ({
    dismissGlyph: {
      color: palette.text.secondary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    },
    dot: {
      borderRadius: radius.full,
      height: TOAST_DOT_SIZE,
      width: TOAST_DOT_SIZE
    },
    message: {
      color: palette.text.primary,
      flex: 1,
      fontFamily: fontFamily.body,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    },
    pill: {
      alignItems: 'center',
      backgroundColor: palette.bg.raised,
      borderColor: palette.glass.stroke,
      borderRadius: radius.full,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md
    },
    viewport: {
      alignItems: 'center',
      bottom: TOAST_BOTTOM_OFFSET,
      gap: spacing.sm,
      left: spacing.lg,
      position: 'absolute',
      right: spacing.lg
    }
  })
})
