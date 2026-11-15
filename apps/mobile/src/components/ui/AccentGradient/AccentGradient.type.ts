import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export interface IAccentGradientProps {
  accessibilityLabel?: string
  children?: ReactNode
  /** The shape of the surface: size and radius. */
  style?: StyleProp<ViewStyle>
}
