import type { StyleProp, ViewStyle } from 'react-native'

export interface IDividerProps {
  /** Text shown between the two halves of the rule. */
  label?: string
  /** Positioning only, such as the margin around the rule. */
  style?: StyleProp<ViewStyle>
}
