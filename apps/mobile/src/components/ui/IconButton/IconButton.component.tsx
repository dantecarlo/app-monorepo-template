import { Pressable } from 'react-native'

import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  DEFAULT_ICON_SIZE,
  PRESS_SCALE
} from '@/components/ui/IconButton/IconButton.constant'
import {
  ICON_BUTTON_STYLES as styles,
  ICON_BUTTON_VARIANT
} from '@/components/ui/IconButton/IconButton.style'
import type { IIconButtonProps } from '@/components/ui/IconButton/IconButton.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

export const IconButton = ({
  accessibilityLabel,
  name,
  onPress,
  variant = 'glass'
}: IIconButtonProps) => {
  const { colors: palette } = useThemeTokens()
  const variantStyles = useThemedStyles({ styles: ICON_BUTTON_VARIANT })

  const iconColor =
    variant === 'accent' ? palette.accentInk : palette.text.secondary

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        variantStyles[variant],
        pressed && { transform: [{ scale: PRESS_SCALE }] }
      ]}
    >
      <Icon
        color={iconColor}
        decorative
        name={name}
        size={DEFAULT_ICON_SIZE}
      />
    </Pressable>
  )
}
