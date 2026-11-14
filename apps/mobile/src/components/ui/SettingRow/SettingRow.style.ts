import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const SETTING_ROW_CHEVRON_SIZE = 16

export const SETTING_ROW_STYLES = StyleSheet.create({
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
  label: {
    color: colors.text.primary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
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
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0
  },
  value: {
    color: colors.text.secondary,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
  }
})
