import { radius, rnShadows, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

// Layout only — theme-variant fill/stroke/tint come from useGlassCard so the
// surface flips with the active theme. overlay/root carry no static color.
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
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  root: {
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
