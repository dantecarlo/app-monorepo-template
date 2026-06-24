import { useEffect } from 'react'
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'

import {
  SHIMMER_DURATION,
  SHIMMER_REPEAT_FOREVER,
  SHIMMER_START_VALUE,
  SHIMMER_TRANSLATE_RANGE
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'

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
