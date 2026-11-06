import type { TextInputProps } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

export interface IAuthFieldProps extends Omit<TextInputProps, 'style'> {
  helperText?: string
  hidePasswordLabel: string
  isError?: boolean
  isPassword?: boolean
  label?: string
  showPasswordLabel: string
}

export interface IUseAuthFieldParams {
  isError: boolean
  isPassword: boolean
}

export interface IUseAuthFieldResult {
  onBlur: () => void
  onFocus: () => void
  onTogglePassword: () => void
  secureEntry: boolean
  showPassword: boolean
  wrapperStyle: StyleProp<ViewStyle>
}
