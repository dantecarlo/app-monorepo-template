import { colors, radius, rnShadows, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const GLASS_CARD_STYLES = StyleSheet.create({
  blur: {
    borderRadius: radius.xl,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  content: {
    flex: 1
  },
  overlay: {
    backgroundColor: colors.glass.fill,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  root: {
    borderColor: colors.glass.stroke,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...rnShadows.card
  }
})

export const GLASS_CARD_PADDING = {
  lg: spacing.xl,
  md: spacing.lg,
  none: 0
} as const

export const GLASS_CARD_BORDER_RADIUS = {
  lg: radius.lg,
  xl: radius.xl
} as const
