import { Pressable, Text, View } from 'react-native'

import { PRESSED_OPACITY } from '@/components/ui/SegmentedControl/SegmentedControl.constant'
import {
  SEGMENT_COLORS,
  SEGMENTED_CONTROL_STYLES
} from '@/components/ui/SegmentedControl/SegmentedControl.style'
import type { ISegmentedControlProps } from '@/components/ui/SegmentedControl/SegmentedControl.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const SegmentedControl = ({
  activeId,
  onSegmentPress,
  segments
}: ISegmentedControlProps) => {
  const segmentColors = useThemedStyles({ styles: SEGMENT_COLORS })
  const styles = useThemedStyles({ styles: SEGMENTED_CONTROL_STYLES })

  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {segments.map(({ id, label }) => {
        const isActive = id === activeId
        const colors = isActive
          ? segmentColors.active
          : segmentColors.inactive
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={id}
            onPress={() => onSegmentPress(id)}
            style={({ pressed }) => [
              styles.segment,
              { backgroundColor: colors.backgroundColor },
              pressed && { opacity: PRESSED_OPACITY }
            ]}
          >
            <Text
              style={[styles.segmentLabel, { color: colors.textColor }]}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
