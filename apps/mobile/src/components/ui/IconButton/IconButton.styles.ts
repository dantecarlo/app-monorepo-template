import { colors, radius, rnShadows } from '@app/tokens'
import { StyleSheet } from 'react-native'

import { CONTAINER_SIZE } from '@/components/ui/IconButton/IconButton.constant'

export const ICON_BUTTON_VARIANT = {
  accent: {
    backgroundColor: colors.accent,
    ...rnShadows.accentGlow
  },
  glass: {
    backgroundColor: colors.glass.fill,
    borderColor: colors.glass.stroke,
    borderWidth: 1
  }
} as const

export const ICON_BUTTON_STYLES = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: CONTAINER_SIZE,
    justifyContent: 'center',
    width: CONTAINER_SIZE
  }
})
