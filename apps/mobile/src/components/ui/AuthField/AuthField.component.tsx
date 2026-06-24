import { colors } from '@app/tokens'
import { useState } from 'react'
import type { TextInputProps } from 'react-native'
import { Pressable, Text, TextInput, View } from 'react-native'

import {
  AUTH_FIELD_ICON_SIZE,
  AUTH_FIELD_STYLES as styles
} from '@/components/ui/AuthField/AuthField.styles'
import { Icon } from '@/components/ui/Icon/Icon.component'

export interface IAuthFieldProps extends Omit<TextInputProps, 'style'> {
  helperText?: string
  hidePasswordLabel: string
  isError?: boolean
  isPassword?: boolean
  label?: string
  showPasswordLabel: string
}

/** Glass labeled TextInput. Password reveal toggle is i18n-decoupled via props. */
export const AuthField = ({
  helperText,
  hidePasswordLabel,
  isError = false,
  isPassword = false,
  label,
  showPasswordLabel,
  ...textInputProps
}: IAuthFieldProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const wrapperStyle = [
    styles.wrapper,
    isFocused && !isError ? styles.wrapperFocused : undefined,
    isError ? styles.wrapperError : undefined
  ]

  const secureEntry = isPassword ? !showPassword : false

  return (
    <View style={styles.root}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      <View style={wrapperStyle}>
        <TextInput
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          placeholderTextColor={colors.text.disabled}
          secureTextEntry={secureEntry}
          style={styles.input}
          {...textInputProps}
        />
        {isPassword && (
          <Pressable
            accessibilityLabel={
              showPassword ? hidePasswordLabel : showPasswordLabel
            }
            accessibilityRole="button"
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.revealButton}
          >
            <Icon
              color={colors.text.secondary}
              decorative
              name={showPassword ? 'eye-off' : 'eye'}
              size={AUTH_FIELD_ICON_SIZE}
            />
          </Pressable>
        )}
      </View>
      {helperText !== undefined && (
        <Text style={isError ? styles.errorText : styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  )
}
