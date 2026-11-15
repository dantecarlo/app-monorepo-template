import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const OFFLINE_BANNER_ICON_SIZE = 16

export const OFFLINE_BANNER_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.warningTint,
    borderBottomColor: colors.warningStroke,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  label: {
    color: colors.warning,
    fontFamily: `${fontFamily.body}_500Medium`,
    fontSize: fontSize.label.size,
    lineHeight: fontSize.label.lineHeight
  }
})
