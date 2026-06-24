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
  const translateXRef = useRef(new Animated.Value(value ? KNOB_ON_X : 0))

  useEffect(() => {
    Animated.timing(translateXRef.current, {
      duration: ANIMATE_DURATION_MS,
      toValue: value ? KNOB_ON_X : 0,
      useNativeDriver: true
    }).start()
  }, [value])

  // eslint-disable-next-line react-hooks/refs -- stable Animated.Value ref; callers need it for RN style wiring
  return { translateX: translateXRef.current }
}
