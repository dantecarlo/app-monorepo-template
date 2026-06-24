import { Pressable, Text, View } from 'react-native'

import { PRESSED_OPACITY } from '@/components/ui/SegmentedControl/SegmentedControl.constant'
import {
  SEGMENT_COLORS,
  SEGMENTED_CONTROL_STYLES as styles
} from '@/components/ui/SegmentedControl/SegmentedControl.styles'

export interface ISegment {
  id: string
  label: string
}

export interface ISegmentedControlProps {
  activeId: string
  onSegmentPress: (id: string) => void
  segments: ReadonlyArray<ISegment>
}

export const SegmentedControl = ({
  activeId,
  onSegmentPress,
  segments
}: ISegmentedControlProps) => (
  <View accessibilityRole="tablist" style={styles.track}>
    {segments.map(({ id, label }) => {
      const isActive = id === activeId
      const colors = isActive
        ? SEGMENT_COLORS.active
        : SEGMENT_COLORS.inactive
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
          <Text style={[styles.segmentLabel, { color: colors.textColor }]}>
            {label}
          </Text>
        </Pressable>
      )
    })}
  </View>
)
