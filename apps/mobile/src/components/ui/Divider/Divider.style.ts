import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const DIVIDER_STYLES = StyleSheet.create({
  label: {
    color: colors.text.tertiary,
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
    backgroundColor: colors.divider,
    flex: 1,
    height: StyleSheet.hairlineWidth
  }
})
