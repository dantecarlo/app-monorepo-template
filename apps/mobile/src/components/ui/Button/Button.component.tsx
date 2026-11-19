import { ActivityIndicator, Pressable } from 'react-native'

import { PRESS_OPACITY } from '@/components/ui/Button/Button.constant'
import {
  BUTTON_BASE_CLASS,
  BUTTON_FULL_WIDTH_CLASS,
  BUTTON_SIZE_CLASS,
  BUTTON_TEXT_BASE_CLASS,
  BUTTON_TEXT_SIZE_CLASS,
  BUTTON_TEXT_VARIANT_CLASS,
  BUTTON_VARIANT_CLASS
} from '@/components/ui/Button/Button.style'
import type { IButtonProps } from '@/components/ui/Button/Button.type'
import { Text } from '@/components/ui/Text/Text.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

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
  const { t } = useAppTranslator()
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
          accessibilityLabel={t('common.loading')}
          color="currentColor"
        />
      ) : (
        <Text className={textClass}>{children}</Text>
      )}
    </Pressable>
  )
}
