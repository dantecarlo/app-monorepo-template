import { colors, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const SEGMENT_COLORS = {
  active: {
    backgroundColor: colors.accentTint,
    textColor: colors.accent
  },
  inactive: {
    backgroundColor: 'transparent',
    textColor: colors.text.secondary
  }
} as const

export const SEGMENTED_CONTROL_STYLES = StyleSheet.create({
  segment: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  segmentLabel: {
    fontSize: fontSize.label.size,
    lineHeight: fontSize.label.lineHeight
  },
  track: {
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs
  }
})
