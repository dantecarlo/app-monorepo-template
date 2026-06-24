import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

import {
  ANIMATE_DURATION_MS,
  KNOB_ON_X
} from '@/components/ui/Toggle/Toggle.constant'

export interface IUseToggleKnobResult {
  translateX: Animated.Value
}

export const useToggleKnob = (value: boolean): IUseToggleKnobResult => {
  const translateX = useRef(
    new Animated.Value(value ? KNOB_ON_X : 0)
  ).current

  useEffect(() => {
    Animated.timing(translateX, {
      duration: ANIMATE_DURATION_MS,
      toValue: value ? KNOB_ON_X : 0,
      useNativeDriver: true
    }).start()
  }, [value, translateX])

  return { translateX }
}
