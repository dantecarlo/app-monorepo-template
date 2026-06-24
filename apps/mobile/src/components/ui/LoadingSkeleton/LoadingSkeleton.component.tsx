import { LinearGradient } from 'expo-linear-gradient'
import type { DimensionValue } from 'react-native'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import type { SkeletonRoundedType } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'
import {
  LOADING_SKELETON_STYLES as styles,
  ROUNDED_BY_VARIANT,
  SKELETON_SHIMMER_END,
  SKELETON_SHIMMER_MID,
  SKELETON_SHIMMER_START
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'
import { useShimmer } from '@/components/ui/LoadingSkeleton/useShimmer.hook'

export interface ILoadingSkeletonProps {
  height?: DimensionValue
  rounded?: SkeletonRoundedType
  width?: DimensionValue
}

export const LoadingSkeleton = ({
  height,
  rounded = 'md',
  width = '100%'
}: ILoadingSkeletonProps) => {
  const { animatedStyle } = useShimmer()

  return (
    <View
      accessibilityLabel="Loading"
      accessible
      style={[
        styles.root,
        { borderRadius: ROUNDED_BY_VARIANT[rounded], height, width }
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            SKELETON_SHIMMER_START,
            SKELETON_SHIMMER_MID,
            SKELETON_SHIMMER_END
          ]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  )
}
