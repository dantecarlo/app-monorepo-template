import { fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

export const LOGO_STYLES = StyleSheet.create({
  wordmark: {
    alignItems: 'center',
    borderRadius: radius.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg
  },
  wordmarkText: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.display.size,
    fontWeight: '700',
    lineHeight: fontSize.display.lineHeight
  }
})
