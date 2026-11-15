import { colors, fontFamily, fontSize } from '@app/tokens'
import { StyleSheet } from 'react-native'

import type { TextVariantType } from '@/components/ui/Text/Text.type'

// The typography scale of the mobile app: family, size, line height and
// colour per variant, read from the dark palette the screens paint.
export const TEXT_VARIANT_STYLES = StyleSheet.create<
  Record<TextVariantType, object>
>({
  amount: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_700Bold`,
    fontSize: fontSize.amount.size,
    lineHeight: fontSize.amount.lineHeight
  },
  amountHero: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_800ExtraBold`,
    fontSize: fontSize.amountHero.size,
    lineHeight: fontSize.amountHero.lineHeight
  },
  body: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.body}_400Regular`,
    fontSize: fontSize.body.size,
    lineHeight: fontSize.body.lineHeight
  },
  caption: {
    color: colors.text.tertiary,
    fontFamily: `${fontFamily.body}_400Regular`,
    fontSize: fontSize.caption.size,
    lineHeight: fontSize.caption.lineHeight
  },
  heading: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_700Bold`,
    fontSize: fontSize.heading.size,
    lineHeight: fontSize.heading.lineHeight
  },
  label: {
    color: colors.text.secondary,
    fontFamily: `${fontFamily.body}_500Medium`,
    fontSize: fontSize.label.size,
    lineHeight: fontSize.label.lineHeight
  },
  title: {
    color: colors.text.primary,
    fontFamily: `${fontFamily.display}_600SemiBold`,
    fontSize: fontSize.title.size,
    lineHeight: fontSize.title.lineHeight
  }
})
