import { colors } from '@app/tokens'
import { Pressable } from 'react-native'

import type { IconNameType } from '@/components/ui/Icon/Icon.component'
import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  DEFAULT_ICON_SIZE,
  PRESS_SCALE
} from '@/components/ui/IconButton/IconButton.constant'
import {
  ICON_BUTTON_STYLES as styles,
  ICON_BUTTON_VARIANT
} from '@/components/ui/IconButton/IconButton.styles'

export type IconButtonVariantType = 'glass' | 'accent'

export interface IIconButtonProps {
  accessibilityLabel: string
  name: IconNameType
  onPress: () => void
  variant?: IconButtonVariantType
}

export const IconButton = ({
  accessibilityLabel,
  name,
  onPress,
  variant = 'glass'
}: IIconButtonProps) => {
  const iconColor =
    variant === 'accent' ? colors.accentInk : colors.text.secondary

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        ICON_BUTTON_VARIANT[variant],
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
