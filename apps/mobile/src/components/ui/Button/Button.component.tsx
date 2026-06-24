import { ActivityIndicator, Pressable, Text } from 'react-native'

import type {
  ButtonSizeType,
  ButtonVariantType
} from '@/components/ui/Button/Button.constant'
import { PRESS_OPACITY } from '@/components/ui/Button/Button.constant'
import {
  BUTTON_BASE_CLASS,
  BUTTON_FULL_WIDTH_CLASS,
  BUTTON_SIZE_CLASS,
  BUTTON_TEXT_BASE_CLASS,
  BUTTON_TEXT_SIZE_CLASS,
  BUTTON_TEXT_VARIANT_CLASS,
  BUTTON_VARIANT_CLASS
} from '@/components/ui/Button/Button.styles'

export interface IButtonProps {
  accessibilityLabel?: string
  children?: React.ReactNode
  disabled?: boolean
  fullWidth?: boolean
  isLoading?: boolean
  onPress?: () => void
  size?: ButtonSizeType
  variant?: ButtonVariantType
}

export const Button = ({
  accessibilityLabel,
  children,
  disabled,
  fullWidth = false,
  isLoading = false,
  onPress,
  size = 'md',
  variant = 'primary'
}: IButtonProps) => {
  const isDisabled = disabled ?? isLoading

  const containerClass = [
    BUTTON_BASE_CLASS,
    BUTTON_SIZE_CLASS[size],
    BUTTON_VARIANT_CLASS[variant],
    fullWidth ? BUTTON_FULL_WIDTH_CLASS : ''
  ]
    .filter(Boolean)
    .join(' ')

  const textClass = [
    BUTTON_TEXT_BASE_CLASS,
    BUTTON_TEXT_SIZE_CLASS[size],
    BUTTON_TEXT_VARIANT_CLASS[variant]
  ].join(' ')

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      className={containerClass}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) =>
        pressed && !isDisabled ? [{ opacity: PRESS_OPACITY }] : []
      }
    >
      {isLoading ? (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color="currentColor"
        />
      ) : (
        <Text className={textClass}>{children}</Text>
      )}
    </Pressable>
  )
}
