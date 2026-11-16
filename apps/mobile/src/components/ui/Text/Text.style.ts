import { fontFamily, fontSize } from '@app/tokens'
import type { TextStyle } from 'react-native'

import type { TextVariantType } from '@/components/ui/Text/Text.type'
import { createThemedStyles } from '@/lib/theme/createThemedStyles.helper'

// The typography scale of the mobile app: family, size, line height and
// colour per variant, one sheet per theme so the text follows the active one.
export const TEXT_VARIANT_STYLES = createThemedStyles({
  build: (palette): Record<TextVariantType, TextStyle> => ({
    amount: {
      color: palette.text.primary,
      fontFamily: `${fontFamily.display}_700Bold`,
      fontSize: fontSize.amount.size,
      lineHeight: fontSize.amount.lineHeight
    },
    amountHero: {
      color: palette.text.primary,
      fontFamily: `${fontFamily.display}_800ExtraBold`,
      fontSize: fontSize.amountHero.size,
      lineHeight: fontSize.amountHero.lineHeight
    },
    body: {
      color: palette.text.primary,
      fontFamily: `${fontFamily.body}_400Regular`,
      fontSize: fontSize.body.size,
      lineHeight: fontSize.body.lineHeight
    },
    caption: {
      color: palette.text.tertiary,
      fontFamily: `${fontFamily.body}_400Regular`,
      fontSize: fontSize.caption.size,
      lineHeight: fontSize.caption.lineHeight
    },
    heading: {
      color: palette.text.primary,
      fontFamily: `${fontFamily.display}_700Bold`,
      fontSize: fontSize.heading.size,
      lineHeight: fontSize.heading.lineHeight
    },
    label: {
      color: palette.text.secondary,
      fontFamily: `${fontFamily.body}_500Medium`,
      fontSize: fontSize.label.size,
      lineHeight: fontSize.label.lineHeight
    },
    title: {
      color: palette.text.primary,
      fontFamily: `${fontFamily.display}_600SemiBold`,
      fontSize: fontSize.title.size,
      lineHeight: fontSize.title.lineHeight
    }
  })
})
