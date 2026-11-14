import { LinearGradient } from 'expo-linear-gradient'
import { Animated, Pressable } from 'react-native'

import {
  GRADIENT_COLORS,
  TOGGLE_STYLES as styles
} from '@/components/ui/Toggle/Toggle.style'
import type { IToggleProps } from '@/components/ui/Toggle/Toggle.type'
import { useToggleKnob } from '@/components/ui/Toggle/useToggleKnob.hook'

export const Toggle = ({
  accessibilityLabel,
  disabled,
  onValueChange,
  value
}: IToggleProps) => {
  const { translateX } = useToggleKnob(value)

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
    >
      {value ? (
        <LinearGradient
          colors={GRADIENT_COLORS}
          end={{ x: 0, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.track}
        >
          <Animated.View
            style={[
              styles.knob,
              styles.knobOn,
              { transform: [{ translateX }] }
            ]}
          />
        </LinearGradient>
      ) : (
        <Animated.View style={[styles.track, styles.trackOff]}>
          <Animated.View
            style={[styles.knob, { transform: [{ translateX }] }]}
          />
        </Animated.View>
      )}
    </Pressable>
  )
}
