import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const LOGIN_STYLES = StyleSheet.create({
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg
  },
  dividerLine: {
    backgroundColor: colors.divider,
    flex: 1,
    height: StyleSheet.hairlineWidth
  },
  dividerText: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  form: {
    gap: spacing.lg
  },
  submitSpacing: {
    marginTop: spacing.xs
  }
})
