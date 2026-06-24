import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const LIST_ROW_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  divider: {
    borderTopColor: colors.divider,
    borderTopWidth: 1
  },
  leading: {
    flexShrink: 0
  },
  subtitle: {
    color: colors.text.secondary,
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
    color: colors.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
  },
  trailing: {
    flexShrink: 0
  }
})
