import { colors } from '@app/tokens'
import { BlurView } from 'expo-blur'
import { Pressable, Text, View } from 'react-native'

import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  NAV_BAR_BLUR_INTENSITY,
  NAV_BAR_ICON_SIZE,
  NAV_BAR_PRESSED_OPACITY
} from '@/components/ui/NavBar/NavBar.constant'
import { NAV_BAR_STYLES as styles } from '@/components/ui/NavBar/NavBar.style'
import type { INavBarProps } from '@/components/ui/NavBar/NavBar.type'

/** Floating glass pill navigation bar backed by expo-blur. Navigation-agnostic: caller owns routing. */
export const NavBar = ({
  activeId,
  ariaLabel,
  items,
  onItemPress
}: INavBarProps) => (
  <View
    accessibilityLabel={ariaLabel}
    accessibilityRole="tablist"
    style={styles.root}
  >
    <View style={styles.pill}>
      <BlurView
        intensity={NAV_BAR_BLUR_INTENSITY}
        style={styles.blur}
        tint="dark"
      />
      <View style={styles.overlay} />
      {items.map(({ icon, id, label }) => {
        const isActive = id === activeId
        const iconColor = isActive ? colors.accent : colors.text.tertiary
        const labelColor = isActive ? colors.accent : colors.text.tertiary

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={id}
            onPress={() => onItemPress(id)}
            style={({ pressed }) => [
              styles.item,
              pressed && { opacity: NAV_BAR_PRESSED_OPACITY }
            ]}
          >
            <Icon
              color={iconColor}
              decorative
              name={icon}
              size={NAV_BAR_ICON_SIZE}
            />
            <Text style={[styles.label, { color: labelColor }]}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  </View>
)
