import { fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

export const DIVIDER_STYLES = createThemedStyles({
  build: (palette) => ({
    label: {
      color: palette.text.tertiary,
      fontFamily: fontFamily.body,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    },
    root: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md
    },
    rule: {
      backgroundColor: palette.divider,
      flex: 1,
      height: StyleSheet.hairlineWidth
    }
  })
})
