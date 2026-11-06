import { Animated } from 'react-native'

export interface IToggleProps {
  accessibilityLabel?: string
  disabled?: boolean
  onValueChange: (value: boolean) => void
  value: boolean
}

export interface IUseToggleKnobResult {
  translateX: Animated.Value
}
