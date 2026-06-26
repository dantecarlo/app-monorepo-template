import type { HTMLInputTypeAttribute } from 'react'
import { useState } from 'react'

import {
  AUTH_FIELD_WRAPPER_CLASS,
  AUTH_FIELD_WRAPPER_ERROR_CLASS
} from '@/components/ui/AuthField/AuthField.constant'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IUseAuthFieldParams {
  isError: boolean
  isPassword: boolean
  type?: HTMLInputTypeAttribute
}

export interface IUseAuthFieldResult {
  inputType: HTMLInputTypeAttribute
  onTogglePassword: () => void
  showPassword: boolean
  wrapperClass: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const TEXT_TYPE = 'text'
const PASSWORD_TYPE = 'password'

/**
 * Owns the AuthField's password-reveal state and the derived wrapper class +
 * resolved input type. Keeps the component render-only (code-standards:
 * logic-in-hook).
 */
export const useAuthField = ({
  isError,
  isPassword,
  type
}: IUseAuthFieldParams): IUseAuthFieldResult => {
  const [showPassword, setShowPassword] = useState(false)

  const wrapperClass = [
    AUTH_FIELD_WRAPPER_CLASS,
    isError ? AUTH_FIELD_WRAPPER_ERROR_CLASS : ''
  ]
    .join(' ')
    .trim()

  const inputType = isPassword
    ? showPassword
      ? TEXT_TYPE
      : PASSWORD_TYPE
    : (type ?? TEXT_TYPE)

  const onTogglePassword = () => setShowPassword((prev) => !prev)

  return { inputType, onTogglePassword, showPassword, wrapperClass }
}
