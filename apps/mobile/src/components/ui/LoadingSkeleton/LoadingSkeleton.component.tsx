import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import {
  LOADING_SKELETON_STYLES,
  ROUNDED_BY_VARIANT,
  SKELETON_SHIMMER_END,
  SKELETON_SHIMMER_MID,
  SKELETON_SHIMMER_START,
  SKELETON_SHIMMER_STYLES
} from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import type { ILoadingSkeletonProps } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.type'
import { useShimmer } from '@/components/ui/LoadingSkeleton/useShimmer.hook'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const LoadingSkeleton = ({
  height,
  rounded = 'md',
  width = '100%'
}: ILoadingSkeletonProps) => {
  const { t } = useAppTranslator()
  const { animatedStyle } = useShimmer()
  const styles = useThemedStyles({ styles: LOADING_SKELETON_STYLES })
  const shimmerMid = useThemedStyles({ styles: SKELETON_SHIMMER_MID })

  return (
    <View
      accessibilityLabel={t('common.loading')}
      accessible
      style={[
        styles.root,
        { borderRadius: ROUNDED_BY_VARIANT[rounded], height, width }
      ]}
    >
      <Animated.View
        style={[SKELETON_SHIMMER_STYLES.shimmer, animatedStyle]}
      >
        <LinearGradient
          colors={[
            SKELETON_SHIMMER_START,
            shimmerMid,
            SKELETON_SHIMMER_END
          ]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={SKELETON_SHIMMER_STYLES.shimmer}
        />
      </Animated.View>
    </View>
  )
}
