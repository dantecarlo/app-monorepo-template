import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

const WARNING_TINT = 'rgba(224,160,17,0.16)'
const WARNING_BORDER = 'rgba(224,160,17,0.30)'

export const OFFLINE_BANNER_ICON_SIZE = 16

export const OFFLINE_BANNER_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: WARNING_TINT,
    borderBottomColor: WARNING_BORDER,
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
