import type { InputHTMLAttributes, JSX } from 'react'
import { useState } from 'react'

import {
  AUTH_FIELD_ERROR_CLASS,
  AUTH_FIELD_HELPER_CLASS,
  AUTH_FIELD_ICON_SIZE,
  AUTH_FIELD_INPUT_CLASS,
  AUTH_FIELD_LABEL_CLASS,
  AUTH_FIELD_ROOT_CLASS,
  AUTH_FIELD_WRAPPER_CLASS,
  AUTH_FIELD_WRAPPER_ERROR_CLASS
} from '@/components/ui/AuthField/AuthField.constant'
import { Icon } from '@/components/ui/Icon/Icon.component'

export interface IAuthFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> {
  helperText?: string
  hidePasswordLabel: string
  isError?: boolean
  isPassword?: boolean
  label?: string
  showPasswordLabel: string
}

/** Glass labeled text field. Password reveal toggle is i18n-decoupled via props. */
export const AuthField = ({
  helperText,
  hidePasswordLabel,
  id,
  isError = false,
  isPassword = false,
  label,
  showPasswordLabel,
  ...inputProps
}: IAuthFieldProps): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false)

  const wrapperClass = [
    AUTH_FIELD_WRAPPER_CLASS,
    isError ? AUTH_FIELD_WRAPPER_ERROR_CLASS : ''
  ]
    .join(' ')
    .trim()

  const inputType = isPassword
    ? showPassword
      ? 'text'
      : 'password'
    : (inputProps.type ?? 'text')

  return (
    <div className={AUTH_FIELD_ROOT_CLASS}>
      {label !== undefined && (
        <label className={AUTH_FIELD_LABEL_CLASS} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={wrapperClass}>
        <input
          className={AUTH_FIELD_INPUT_CLASS}
          id={id}
          type={inputType}
          {...inputProps}
        />
        {isPassword === true && (
          <button
            aria-label={
              showPassword ? hidePasswordLabel : showPasswordLabel
            }
            className="ml-2 flex-none text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setShowPassword((prev) => !prev)}
            type="button"
          >
            <Icon
              decorative
              name={showPassword ? 'eye-off' : 'eye'}
              size={AUTH_FIELD_ICON_SIZE}
            />
          </button>
        )}
      </div>
      {helperText !== undefined && (
        <p
          className={
            isError ? AUTH_FIELD_ERROR_CLASS : AUTH_FIELD_HELPER_CLASS
          }
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
