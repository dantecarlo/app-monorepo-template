import { ThemeEnum } from '@app/tokens'
import { BlurView } from 'expo-blur'
import { Pressable, Text, View } from 'react-native'

import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  NAV_BAR_BLUR_INTENSITY,
  NAV_BAR_ICON_SIZE,
  NAV_BAR_PRESSED_OPACITY
} from '@/components/ui/NavBar/NavBar.constant'
import { NAV_BAR_STYLES } from '@/components/ui/NavBar/NavBar.style'
import type { INavBarProps } from '@/components/ui/NavBar/NavBar.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

/** Floating glass pill navigation bar backed by expo-blur. Navigation-agnostic: caller owns routing. */
export const NavBar = ({
  activeId,
  ariaLabel,
  items,
  onItemPress
}: INavBarProps) => {
  const { colors: palette, theme } = useThemeTokens()
  const styles = useThemedStyles({ styles: NAV_BAR_STYLES })

  return (
    <View
      accessibilityLabel={ariaLabel}
      accessibilityRole="tablist"
      style={styles.root}
    >
      <View style={styles.pill}>
        <BlurView
          intensity={NAV_BAR_BLUR_INTENSITY}
          style={styles.blur}
          tint={theme === ThemeEnum.LIGHT ? 'light' : 'dark'}
        />
        <View style={styles.overlay} />
        {items.map(({ icon, id, label }) => {
          const isActive = id === activeId
          const iconColor = isActive
            ? palette.accent
            : palette.text.tertiary
          const labelColor = isActive
            ? palette.accent
            : palette.text.tertiary

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
}
