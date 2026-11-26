import { useEffect, useState } from 'react'
import { Animated } from 'react-native'

import {
  ANIMATE_DURATION_MS,
  KNOB_ON_X
} from '@/components/ui/Toggle/Toggle.constant'
import type { IUseToggleKnobResult } from '@/components/ui/Toggle/Toggle.type'

// The knob's offset: one animated value for the life of the toggle, made on
// its first render from the value it starts with, and animated on each change.
export const useToggleKnob = (value: boolean): IUseToggleKnobResult => {
  const [translateX] = useState(
    () => new Animated.Value(value ? KNOB_ON_X : 0)
  )

  useEffect(() => {
    Animated.timing(translateX, {
      duration: ANIMATE_DURATION_MS,
      toValue: value ? KNOB_ON_X : 0,
      useNativeDriver: true
    }).start()
  }, [translateX, value])

  return { translateX }
}
