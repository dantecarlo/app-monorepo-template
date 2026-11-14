import type { DimensionValue } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useAnimatedStyle } from 'react-native-reanimated'

import type { SkeletonRoundedType } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'

export interface ILoadingSkeletonProps {
  height?: DimensionValue
  rounded?: SkeletonRoundedType
  width?: DimensionValue
}

export interface IUseShimmerResult {
  animatedStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>
}
