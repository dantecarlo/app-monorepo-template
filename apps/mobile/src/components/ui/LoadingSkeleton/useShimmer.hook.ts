import { useEffect } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'

const SHIMMER_DURATION = 1200
const SHIMMER_TRANSLATE_RANGE = 200
const SHIMMER_START_VALUE = -1
const SHIMMER_REPEAT_FOREVER = -1

export interface IUseShimmerResult {
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

export const useShimmer = (): IUseShimmerResult => {
  const translateX = useSharedValue(SHIMMER_START_VALUE)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION }),
      SHIMMER_REPEAT_FOREVER
    )
  }, [translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * SHIMMER_TRANSLATE_RANGE }]
  }))

  return { animatedStyle }
}
