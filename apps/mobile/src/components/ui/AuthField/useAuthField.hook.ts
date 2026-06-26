import { useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

import { AUTH_FIELD_STYLES as styles } from '@/components/ui/AuthField/AuthField.styles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Owns the AuthField's focus + password-reveal state and the derived wrapper
 * style + secureTextEntry flag. Keeps the component render-only (code-standards:
 * logic-in-hook).
 */
export const useAuthField = ({
  isError,
  isPassword
}: IUseAuthFieldParams): IUseAuthFieldResult => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const wrapperStyle = [
    styles.wrapper,
    isFocused && !isError ? styles.wrapperFocused : undefined,
    isError ? styles.wrapperError : undefined
  ]

  const secureEntry = isPassword ? !showPassword : false

  const onBlur = () => setIsFocused(false)
  const onFocus = () => setIsFocused(true)
  const onTogglePassword = () => setShowPassword((prev) => !prev)

  return {
    onBlur,
    onFocus,
    onTogglePassword,
    secureEntry,
    showPassword,
    wrapperStyle
  }
}
