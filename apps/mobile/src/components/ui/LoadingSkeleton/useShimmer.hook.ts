import { useEffect } from 'react'
import type { ViewStyle } from 'react-native'
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
  animatedStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>
}

export const useShimmer = (): IUseShimmerResult => {
  const translateX = useSharedValue(SHIMMER_START_VALUE)

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION }),
      SHIMMER_REPEAT_FOREVER
    )
  }, [translateX])

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateX: translateX.value * SHIMMER_TRANSLATE_RANGE }]
  }))

  return { animatedStyle }
}
