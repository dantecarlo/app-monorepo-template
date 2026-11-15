import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export interface IScreenProps {
  children: ReactNode
  /** Positioning only, such as centring the content. */
  style?: StyleProp<ViewStyle>
  /** Paint the active theme's base instead of the dark base. */
  themed?: boolean
}
