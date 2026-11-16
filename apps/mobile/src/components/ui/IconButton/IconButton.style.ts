import { radius, rnShadows } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { CONTAINER_SIZE } from '@/components/ui/IconButton/IconButton.constant'
import { createThemedValues } from '@/lib/theme/createThemedStyles.helper'

export const ICON_BUTTON_VARIANT = createThemedValues({
  build: (palette) =>
    ({
      accent: {
        backgroundColor: palette.accent,
        ...rnShadows.accentGlow
      },
      glass: {
        backgroundColor: palette.glass.fill,
        borderColor: palette.glass.stroke,
        borderWidth: 1
      }
    }) as const
})

export const ICON_BUTTON_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: CONTAINER_SIZE,
    justifyContent: 'center',
    width: CONTAINER_SIZE
  }
})
