import { colors, fontFamily, fontSize, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const SCREEN_HEADER_SLOT_SIZE = 40

export const SCREEN_HEADER_STYLES = StyleSheet.create({
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  slot: {
    alignItems: 'center',
    height: SCREEN_HEADER_SLOT_SIZE,
    justifyContent: 'center',
    width: SCREEN_HEADER_SLOT_SIZE
  },
  title: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fontFamily.display,
    fontSize: fontSize.heading.size,
    fontWeight: '600',
    lineHeight: fontSize.heading.lineHeight,
    textAlign: 'center'
  }
})
