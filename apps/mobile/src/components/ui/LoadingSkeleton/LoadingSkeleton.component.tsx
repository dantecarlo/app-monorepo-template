import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import {
  LOADING_SKELETON_STYLES as styles,
  ROUNDED_BY_VARIANT,
  SKELETON_SHIMMER_END,
  SKELETON_SHIMMER_MID,
  SKELETON_SHIMMER_START
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.styles'
import type { ILoadingSkeletonProps } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.type'
import { useShimmer } from '@/components/ui/LoadingSkeleton/useShimmer.hook'

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
