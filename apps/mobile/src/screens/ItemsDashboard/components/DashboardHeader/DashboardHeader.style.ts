import { spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

const BADGE_SIZE = 36
const BADGE_BORDER_RADIUS = 8
const BADGE_FONT_SIZE = 16
const BADGE_FONT_WEIGHT = '800' as const

export const DASHBOARD_HEADER_STYLES = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: BADGE_BORDER_RADIUS,
    height: BADGE_SIZE,
    justifyContent: 'center',
    width: BADGE_SIZE
  },
  badgeText: {
    fontSize: BADGE_FONT_SIZE,
    fontWeight: BADGE_FONT_WEIGHT
  },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  wordmark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  }
})
