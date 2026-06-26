import { fontFamily, fontSize, radius, spacing } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { LANGUAGE_SWITCHER_MIN_WIDTH } from '@/components/ui/LanguageSwitcher/languageSwitcher.constant'

export const LANGUAGE_SWITCHER_STYLES = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.full,
    justifyContent: 'center',
    minWidth: LANGUAGE_SWITCHER_MIN_WIDTH,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption.size,
    fontWeight: '600',
    lineHeight: fontSize.caption.lineHeight,
    textTransform: 'uppercase'
  }
})
