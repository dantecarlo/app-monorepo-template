import { useState } from 'react'

import {
  AUTH_FIELD_WRAPPER_CLASS,
  AUTH_FIELD_WRAPPER_ERROR_CLASS
} from '@/components/ui/AuthField/AuthField.constant'
import {
  PASSWORD_TYPE,
  TEXT_TYPE
} from '@/components/ui/AuthField/AuthField.constant'
import type {
  IUseAuthFieldParams,
  IUseAuthFieldResult
} from '@/components/ui/AuthField/AuthField.type'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

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
